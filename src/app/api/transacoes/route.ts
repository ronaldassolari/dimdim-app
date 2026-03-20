import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;
    const search = searchParams.get('search') || null;
    const mes = searchParams.get('mes') || null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    // Optimization: filter by status and mes (date prefix) in SQL when possible
    // to reduce data transferred from the database.
    // Note: 'search' (LIKE on descricao) is still done in JS because building
    // dynamic SQL with @vercel/postgres template literals is complex for optional params.
    let rows: Record<string, any>[];

    if (status && mes) {
      const mesPrefix = `${mes}%`;
      ({ rows } = await sql`
        SELECT * FROM transacoes
        WHERE user_id = ${session.id} AND status = ${status} AND data::text LIKE ${mesPrefix}
        ORDER BY data DESC
      `);
    } else if (status) {
      ({ rows } = await sql`
        SELECT * FROM transacoes
        WHERE user_id = ${session.id} AND status = ${status}
        ORDER BY data DESC
      `);
    } else if (mes) {
      const mesPrefix = `${mes}%`;
      ({ rows } = await sql`
        SELECT * FROM transacoes
        WHERE user_id = ${session.id} AND data::text LIKE ${mesPrefix}
        ORDER BY data DESC
      `);
    } else {
      ({ rows } = await sql`
        SELECT * FROM transacoes
        WHERE user_id = ${session.id}
        ORDER BY data DESC
      `);
    }

    let transacoes = rows as Record<string, any>[];
    if (search) transacoes = transacoes.filter(t => (t.descricao as string || '').toLowerCase().includes(search.toLowerCase()));

    const total = transacoes.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    transacoes = transacoes.slice(offset, offset + limit);

    return NextResponse.json({
      transacoes,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Erro ao listar transações:', error);
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
    const { descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes } = body;

    if (!descricao || typeof descricao !== 'string' || descricao.length > 500) {
      return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
    }
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }
    if (!['GASTO', 'RECEITA'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo deve ser GASTO ou RECEITA' }, { status: 400 });
    }
    if (!categoria || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: descricao, valor, tipo, categoria, data' }, { status: 400 });
    }

    const { rows } = await sql`
      INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes)
      VALUES (${session.id}, ${descricao}, ${valor}, ${tipo}, ${categoria},
        ${status || 'PAGO'}, ${data}, ${cartao_id || null},
        ${recorrente ? 1 : 0}, ${frequencia || null}, ${observacoes || null})
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
