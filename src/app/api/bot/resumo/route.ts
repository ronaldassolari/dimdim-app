import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    await seed();
    const whatsapp = request.nextUrl.searchParams.get('whatsapp');

    if (!whatsapp) {
      return NextResponse.json({ error: 'Informe o whatsapp' }, { status: 400 });
    }

    const { rows: userRows } = await sql`SELECT id, nome FROM users WHERE whatsapp = ${whatsapp}`;
    const user = userRows[0] as any;
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const mes = new Date().toISOString().slice(0, 7);
    const mesLike = mes + '%';
    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });

    // Receitas
    const { rows: recRows } = await sql`
      SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
      WHERE user_id = ${user.id} AND tipo = 'RECEITA' AND status = 'RECEBIDO' AND data LIKE ${mesLike}
    `;
    const receitas = Number((recRows[0] as any).total) || 0;

    // Gastos
    const { rows: gasRows } = await sql`
      SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
      WHERE user_id = ${user.id} AND tipo = 'GASTO' AND status = 'PAGO' AND data LIKE ${mesLike}
    `;
    const gastos = Number((gasRows[0] as any).total) || 0;

    const saldo = receitas - gastos;

    // Pontos
    const { rows: ptRows } = await sql`
      SELECT COALESCE(SUM(saldo), 0) as total FROM analise_pontos WHERE user_id = ${user.id}
    `;
    const pontosValor = Math.round(Number((ptRows[0] as any).total) * 0.01 * 100) / 100;

    // Top 3 categorias de gasto
    const { rows: catRows } = await sql`
      SELECT categoria, COALESCE(SUM(valor), 0) as total FROM transacoes
      WHERE user_id = ${user.id} AND tipo = 'GASTO' AND data LIKE ${mesLike}
      GROUP BY categoria ORDER BY total DESC LIMIT 3
    `;

    let texto = `📊 *Resumo de ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}*\n`;
    texto += `Olá, ${user.nome}!\n\n`;
    texto += `✅ Entradas: R$ ${receitas.toFixed(2)}\n`;
    texto += `❌ Saídas: R$ ${gastos.toFixed(2)}\n`;
    texto += `💰 Saldo: R$ ${saldo.toFixed(2)}\n`;

    if (pontosValor > 0) {
      texto += `📈 Pontos equivalem a: R$ ${pontosValor.toFixed(2)}\n`;
    }

    if (catRows.length > 0) {
      texto += `\n📂 *Maiores gastos:*\n`;
      catRows.forEach((c: any) => {
        texto += `  • ${c.categoria}: R$ ${Number(c.total).toFixed(2)}\n`;
      });
    }

    if (saldo > 0) {
      texto += `\n🎉 Parabéns! Você está no positivo este mês.`;
    } else if (saldo < 0) {
      texto += `\n⚠️ Atenção: gastos superaram as entradas.`;
    }

    return NextResponse.json({
      texto,
      dados: { receitas, gastos, saldo, pontosValor, categorias: catRows },
    });
  } catch (error) {
    console.error('Erro no resumo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
