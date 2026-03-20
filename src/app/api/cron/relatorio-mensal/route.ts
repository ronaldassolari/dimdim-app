import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { initDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const auth = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await initDb();

    // Previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mes = prevMonth.toISOString().slice(0, 7);
    const mesLike = mes + '%';
    const mesNome = prevMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Get all active users
    const { rows: users } = await sql`
      SELECT id, nome, whatsapp, plano FROM users
      WHERE plano != 'FREE' AND whatsapp IS NOT NULL AND whatsapp != ''
    `;

    const relatorios: any[] = [];

    for (const user of users as any[]) {
      // Revenue
      const { rows: recR } = await sql`
        SELECT COALESCE(SUM(valor),0) as t FROM transacoes
        WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mesLike}
      `;
      const receitas = Number((recR[0] as any).t) || 0;

      // Expenses
      const { rows: gasR } = await sql`
        SELECT COALESCE(SUM(valor),0) as t FROM transacoes
        WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mesLike}
      `;
      const gastos = Number((gasR[0] as any).t) || 0;

      // Top 3 categories
      const { rows: catR } = await sql`
        SELECT categoria, SUM(valor) as total FROM transacoes
        WHERE user_id=${user.id} AND tipo='GASTO' AND data LIKE ${mesLike}
        GROUP BY categoria ORDER BY total DESC LIMIT 3
      `;

      // Previous month comparison
      const prevPrev = new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1);
      const mesPrevLike = prevPrev.toISOString().slice(0, 7) + '%';
      const { rows: gasPrevR } = await sql`
        SELECT COALESCE(SUM(valor),0) as t FROM transacoes
        WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mesPrevLike}
      `;
      const gastosPrev = Number((gasPrevR[0] as any).t) || 0;
      const variacao = gastosPrev > 0 ? Math.round(((gastos - gastosPrev) / gastosPrev) * 100) : 0;

      // Points value
      const { rows: ptR } = await sql`
        SELECT COALESCE(SUM(saldo),0) as t FROM analise_pontos WHERE user_id=${user.id}
      `;
      const pontosValor = (Number((ptR[0] as any).t) * 0.01).toFixed(2);

      // Best goal
      const { rows: metR } = await sql`
        SELECT titulo, valor_alvo, valor_atual FROM metas
        WHERE user_id=${user.id} AND ativa=1
        ORDER BY (CAST(valor_atual AS FLOAT) / NULLIF(CAST(valor_alvo AS FLOAT), 0)) DESC LIMIT 1
      `;

      const saldo = receitas - gastos;

      let texto = `📊 *Relatório de ${mesNome}*\n`;
      texto += `Olá, ${user.nome}!\n\n`;
      texto += `✅ Entradas: R$ ${receitas.toFixed(2)}\n`;
      texto += `❌ Saídas: R$ ${gastos.toFixed(2)}\n`;
      texto += `💰 Saldo: R$ ${saldo.toFixed(2)}\n\n`;

      if (variacao !== 0) {
        const emoji = variacao > 0 ? '📈' : '📉';
        texto += `${emoji} Gastos ${variacao > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(variacao)}% vs mês anterior\n\n`;
      }

      if (catR.length > 0) {
        texto += `📂 *Top gastos:*\n`;
        catR.forEach((c: any) => {
          texto += `  • ${c.categoria}: R$ ${Number(c.total).toFixed(2)}\n`;
        });
        texto += '\n';
      }

      if (metR.length > 0) {
        const m = metR[0] as any;
        const pct = Math.round((Number(m.valor_atual) / Number(m.valor_alvo)) * 100);
        texto += `🎯 Meta "${m.titulo}": ${pct}% completa\n`;
      }

      texto += `💎 Pontos valem: R$ ${pontosValor}\n\n`;

      if (saldo > 0) {
        texto += `🎉 Mês positivo! Continue assim.`;
      } else {
        texto += `⚠️ Gastos superaram entradas. Revise suas despesas.`;
      }

      relatorios.push({
        user_id: user.id,
        nome: user.nome,
        whatsapp: user.whatsapp,
        texto,
        dados: { receitas, gastos, saldo, variacao },
      });

      // Try to send via OpenClaw (non-blocking)
      if (user.whatsapp) {
        try {
          const { execSync } = require('child_process');
          execSync(
            `openclaw message send --channel whatsapp --to "${user.whatsapp}" --message "${texto.replace(/"/g, '\\"')}"`,
            { timeout: 10000, stdio: 'pipe' }
          );
        } catch {
          // OpenClaw not available or failed — report still generated
        }
      }
    }

    return NextResponse.json({
      message: `Relatórios gerados para ${relatorios.length} usuários`,
      mes: mesNome,
      relatorios,
    });
  } catch (error) {
    console.error('Erro no relatório mensal:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Vercel Cron calls GET
export async function GET(request: NextRequest) {
  return POST(request);
}
