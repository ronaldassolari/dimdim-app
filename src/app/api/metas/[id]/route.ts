import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const existing = db.prepare('SELECT * FROM metas WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { titulo, valor_alvo, valor_atual, categoria, prazo, ativa } = body;

    db.prepare(`
      UPDATE metas SET
        titulo = COALESCE(?, titulo),
        valor_alvo = COALESCE(?, valor_alvo),
        valor_atual = COALESCE(?, valor_atual),
        categoria = COALESCE(?, categoria),
        prazo = COALESCE(?, prazo),
        ativa = COALESCE(?, ativa)
      WHERE id = ? AND user_id = ?
    `).run(
      titulo || null, valor_alvo ?? null, valor_atual ?? null,
      categoria || null, prazo || null, ativa ?? null,
      Number(id), session.id
    );

    const updated = db.prepare('SELECT * FROM metas WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const existing = db.prepare('SELECT * FROM metas WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    db.prepare('DELETE FROM metas WHERE id = ? AND user_id = ?').run(Number(id), session.id);

    return NextResponse.json({ message: 'Meta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
