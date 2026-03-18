import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
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

export async function POST(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { valor, categoria } = body;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Informe um valor válido' }, { status: 400 });
    }

    const db = getDb();
    const cartoes = db.prepare('SELECT * FROM cartoes WHERE user_id = ? AND ativo = 1').all(session.id) as Cartao[];

    const ranking = cartoes.map((cartao) => {
      const pontosGanhos = Math.round(valor * cartao.pontos_por_real);
      const valorEquivalente = Number((pontosGanhos * 0.01).toFixed(2));

      return {
        cartao_id: cartao.id,
        apelido: cartao.apelido,
        banco: cartao.banco,
        bandeira: cartao.bandeira,
        nivel: cartao.nivel,
        cor: cartao.cor,
        pontos_por_real: cartao.pontos_por_real,
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
