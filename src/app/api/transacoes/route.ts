import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const mes = searchParams.get('mes');

    const db = getDb();
    let query = 'SELECT * FROM transacoes WHERE user_id = ?';
    const params: (string | number)[] = [session.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND descricao LIKE ?';
      params.push(`%${search}%`);
    }

    if (mes) {
      query += ' AND data LIKE ?';
      params.push(`${mes}%`);
    }

    query += ' ORDER BY data DESC';

    const transacoes = db.prepare(query).all(...params);

    return NextResponse.json(transacoes);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes } = body;

    if (!descricao || !valor || !tipo || !categoria || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: descricao, valor, tipo, categoria, data' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, descricao, valor, tipo, categoria,
      status || 'PAGO', data, cartao_id || null,
      recorrente ? 1 : 0, frequencia || null, observacoes || null
    );

    const transacao = db.prepare('SELECT * FROM transacoes WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json(transacao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
