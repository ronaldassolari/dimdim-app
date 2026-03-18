import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const metas = db.prepare('SELECT * FROM metas WHERE user_id = ? AND ativa = 1 ORDER BY created_at DESC').all(session.id);

    return NextResponse.json(metas);
  } catch (error) {
    console.error('Erro ao listar metas:', error);
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
    const { titulo, valor_alvo, valor_atual, categoria, prazo } = body;

    if (!titulo || !valor_alvo) {
      return NextResponse.json({ error: 'Campos obrigatórios: titulo, valor_alvo' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(session.id, titulo, valor_alvo, valor_atual || 0, categoria || null, prazo || null);

    const meta = db.prepare('SELECT * FROM metas WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json(meta, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
