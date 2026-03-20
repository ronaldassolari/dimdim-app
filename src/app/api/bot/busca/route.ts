import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { searchPrices } from '@/lib/price-search';

export async function GET(request: NextRequest) {
  try {
    await seed();
    const produto = request.nextUrl.searchParams.get('produto');
    const whatsapp = request.nextUrl.searchParams.get('whatsapp');

    if (!produto) {
      return NextResponse.json({ error: 'Informe o produto' }, { status: 400 });
    }

    // Find user by whatsapp
    let userId: number | null = null;
    if (whatsapp) {
      const { rows } = await sql`SELECT id FROM users WHERE whatsapp = ${whatsapp}`;
      if (rows[0]) userId = (rows[0] as any).id;
    }

    const search = await searchPrices(produto);

    // Format for WhatsApp
    const top3 = search.resultados.filter(r => r.disponivel).slice(0, 3);
    let texto = `🔍 *${produto}*\n\n`;

    if (search.status === 'real') {
      texto += `📊 Preços reais do Mercado Livre:\n\n`;
    } else {
      texto += `📊 Preços aproximados:\n\n`;
    }

    top3.forEach((r, i) => {
      const medal = i === 0 ? '🏆' : i === 1 ? '🥈' : '🥉';
      texto += `${medal} R$ ${r.preco.toFixed(2)} - ${r.loja}\n`;
      if (r.desconto_percent > 0) texto += `   🏷️ ${r.desconto_percent}% OFF\n`;
      texto += `   🔗 ${r.url}\n\n`;
    });

    if (search.menor_preco) {
      texto += `💰 *Menor preço: R$ ${search.menor_preco.preco.toFixed(2)}*\n`;
    }

    // Card analysis if user found
    if (userId) {
      const { rows: cartoes } = await sql`
        SELECT apelido, banco, pontos_por_real FROM cartoes
        WHERE user_id = ${userId} AND ativo = 1 ORDER BY pontos_por_real DESC LIMIT 1
      `;
      if (cartoes[0] && search.menor_preco) {
        const c = cartoes[0] as any;
        const pontos = Math.round(search.menor_preco.preco * Number(c.pontos_por_real));
        const valor = (pontos * 0.01).toFixed(2);
        texto += `\n💳 Com seu ${c.apelido} (${c.banco}): ${pontos} pts = R$ ${valor}`;
      }
    }

    return NextResponse.json({
      texto,
      resultados: search.resultados.slice(0, 5),
      menor_preco: search.menor_preco,
      status: search.status,
    });
  } catch (error) {
    console.error('Erro na busca bot:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
