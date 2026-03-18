import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const existing = db.prepare('SELECT * FROM buscas_preco WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
    }

    db.prepare('DELETE FROM buscas_preco WHERE id = ? AND user_id = ?').run(Number(id), session.id);

    return NextResponse.json({ message: 'Busca excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir busca:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
