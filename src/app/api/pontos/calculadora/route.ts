import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { calcularValor, melhorOpcao, PROGRAMAS } from '@/lib/pontos-config';

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

// Retorna a taxa de conversão correta por programa/banco
// Usa pontos-config.ts como fonte única de verdade
function getValorPonto(banco: string, programas: string[]): number {
  // Tenta match pelo programa associado ao cartão
  for (const prog of programas) {
    if (PROGRAMAS[prog]) {
      return PROGRAMAS[prog].taxa_viagem; // usa taxa viagem (maior valor)
    }
  }
  // Fallback: tenta match pelo nome do banco
  const b = (banco || '').toLowerCase();
  const map: Record<string, string> = {
    'livelo': 'Livelo',
    'smiles': 'Smiles',
    'latam': 'Latam Pass',
    'azul': 'TudoAzul',
    'esfera': 'Esfera',
    'bradesco': 'Bradesco',
    'itau': 'Itaucard',
    'nubank': 'Nubank',
    'c6': 'C6 Bank',
    'dotz': 'Dotz',
    'stix': 'Stix',
    'membership': 'Membership Rewards',
    'amex': 'Membership Rewards',
  };
  for (const [key, prog] of Object.entries(map)) {
    if (b.includes(key) && PROGRAMAS[prog]) {
      return PROGRAMAS[prog].taxa_viagem;
    }
  }
  return 0.01; // fallback mínimo
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
      const programas: string[] = JSON.parse(cartao.programas_pontos || '[]');
      const pontosGanhos = Math.round(valor * Number(cartao.pontos_por_real));
      const valorPorPonto = getValorPonto(cartao.banco || cartao.apelido || '', programas);
      const valorEquivalente = Number((pontosGanhos * valorPorPonto).toFixed(2));
      const precoFinal = Number((valor - valorEquivalente).toFixed(2));

      // Melhor opção por programa
      const melhor = programas[0] && PROGRAMAS[programas[0]]
        ? melhorOpcao(pontosGanhos, programas[0])
        : null;

      return {
        cartao_id: cartao.id,
        apelido: cartao.apelido,
        banco: cartao.banco,
        pontos_por_real: Number(cartao.pontos_por_real),
        pontosGanhos,
        valorEquivalente,
        precoFinal,
        valorPorPonto,
        melhor_opcao: melhor,
      };
    }).sort((a, b) => a.precoFinal - b.precoFinal);

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
      const programas: string[] = JSON.parse(cartao.programas_pontos || '[]');
      const pontosGanhos = Math.round(valor * Number(cartao.pontos_por_real));
      const valorPorPonto = getValorPonto(cartao.banco || cartao.apelido || '', programas);
      const valorEquivalente = Number((pontosGanhos * valorPorPonto).toFixed(2));
      const precoFinal = Number((valor - valorEquivalente).toFixed(2));

      const melhor = programas[0] && PROGRAMAS[programas[0]]
        ? melhorOpcao(pontosGanhos, programas[0])
        : null;

      return {
        cartao_id: cartao.id,
        apelido: cartao.apelido,
        banco: cartao.banco,
        bandeira: cartao.bandeira,
        nivel: cartao.nivel,
        cor: cartao.cor,
        pontos_por_real: Number(cartao.pontos_por_real),
        programas_pontos: programas,
        pontosGanhos,
        valorEquivalente,
        valorPorPonto,
        precoFinal,
        melhor_opcao: melhor,
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
