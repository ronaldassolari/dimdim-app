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

    const existing = db.prepare('SELECT * FROM contas_familia WHERE id = ? AND dono_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { permissao, status } = body;

    db.prepare(`
      UPDATE contas_familia SET
        permissao = COALESCE(?, permissao),
        status = COALESCE(?, status)
      WHERE id = ? AND dono_id = ?
    `).run(permissao || null, status || null, Number(id), session.id);

    const updated = db.prepare('SELECT * FROM contas_familia WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
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

    const existing = db.prepare('SELECT * FROM contas_familia WHERE id = ? AND dono_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    db.prepare('DELETE FROM contas_familia WHERE id = ? AND dono_id = ?').run(Number(id), session.id);

    return NextResponse.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
