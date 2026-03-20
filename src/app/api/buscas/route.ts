import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { searchPrices } from '@/lib/price-search';

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { rows: buscas } = await sql`SELECT * FROM buscas_preco WHERE user_id = ${session.id} ORDER BY created_at DESC`;

    return NextResponse.json(buscas);
  } catch (error) {
    console.error('Erro ao listar buscas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { produto } = body;

    if (!produto) {
      return NextResponse.json({ error: 'Campo obrigatório: produto' }, { status: 400 });
    }

    // Busca real de preços
    const search = await searchPrices(produto);

    const menorPreco = search.menor_preco?.preco || 0;
    const lojaMenor = search.menor_preco?.loja || '';

    // Busca análise de cartões do usuário
    const { rows: cartoes } = await sql`
      SELECT id, apelido, banco, bandeira, nivel, cor, pontos_por_real
      FROM cartoes WHERE user_id = ${session.id} AND ativo = 1
    `;

    const analise_cartoes = (cartoes as any[]).map(c => {
      const pontosGanhos = Math.round(menorPreco * Number(c.pontos_por_real));
      return {
        cartao_id: c.id,
        apelido: c.apelido,
        banco: c.banco,
        pontos_ganhos: pontosGanhos,
        valor_equivalente: Math.round(pontosGanhos * 0.01 * 100) / 100,
        melhor: false,
      };
    }).sort((a, b) => b.pontos_ganhos - a.pontos_ganhos);

    if (analise_cartoes.length > 0) analise_cartoes[0].melhor = true;

    const { rows } = await sql`
      INSERT INTO buscas_preco (user_id, produto, resultados, menor_preco, loja_menor, monitorar)
      VALUES (${session.id}, ${produto}, ${JSON.stringify(search.resultados)}, ${menorPreco}, ${lojaMenor}, 1)
      RETURNING *
    `;

    return NextResponse.json({
      ...rows[0],
      status: search.status,
      fonte: search.fonte,
      analise_cartoes,
      atualizado_em: search.atualizado_em,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar busca:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
