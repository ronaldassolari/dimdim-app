import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface Cartao {
  id: number;
  apelido: string;
  banco: string;
  bandeira: string;
  nivel: string;
  pontos_por_real: number;
  cor: string;
  programas_pontos: string;
}

export async function GET(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const valor = Number(request.nextUrl.searchParams.get('valor') || 0);
    const categoria = request.nextUrl.searchParams.get('categoria');
    const cartaoId = request.nextUrl.searchParams.get('cartao_id');

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Informe um valor válido' }, { status: 400 });
    }

    let cartoes: Cartao[];
    if (cartaoId) {
      const { rows } = await sql`SELECT * FROM cartoes WHERE id = ${Number(cartaoId)} AND user_id = ${session.id} AND ativo = 1`;
      cartoes = rows as Cartao[];
    } else {
      const { rows } = await sql`SELECT * FROM cartoes WHERE user_id = ${session.id} AND ativo = 1`;
      cartoes = rows as Cartao[];
    }

    const ranking = cartoes.map((cartao) => {
      const pontosGanhos = Math.round(valor * Number(cartao.pontos_por_real));
      const valorEquivalente = Number((pontosGanhos * 0.01).toFixed(2));
      return {
        cartao_id: cartao.id, apelido: cartao.apelido, banco: cartao.banco,
        pontos_por_real: Number(cartao.pontos_por_real), pontosGanhos, valorEquivalente,
      };
    }).sort((a, b) => b.pontosGanhos - a.pontosGanhos);

    return NextResponse.json({ valor, categoria, ranking, melhorCartao: ranking[0] || null });
  } catch (error) {
    console.error('Erro na calculadora:', error);
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
    const { valor, categoria } = body;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Informe um valor válido' }, { status: 400 });
    }

    const { rows } = await sql`SELECT * FROM cartoes WHERE user_id = ${session.id} AND ativo = 1`;
    const cartoes = rows as Cartao[];

    const ranking = cartoes.map((cartao) => {
      const pontosGanhos = Math.round(valor * Number(cartao.pontos_por_real));
      const valorEquivalente = Number((pontosGanhos * 0.01).toFixed(2));

      return {
        cartao_id: cartao.id,
        apelido: cartao.apelido,
        banco: cartao.banco,
        bandeira: cartao.bandeira,
        nivel: cartao.nivel,
        cor: cartao.cor,
        pontos_por_real: Number(cartao.pontos_por_real),
        programas_pontos: JSON.parse(cartao.programas_pontos || '[]'),
        pontosGanhos,
        valorEquivalente,
        categoria: categoria || null,
      };
    }).sort((a, b) => b.pontosGanhos - a.pontosGanhos);

    return NextResponse.json({
      valor,
      categoria: categoria || null,
      ranking,
      melhorCartao: ranking[0] || null,
    });
  } catch (error) {
    console.error('Erro na calculadora de pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
