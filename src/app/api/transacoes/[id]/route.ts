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

    const existing = db.prepare('SELECT * FROM transacoes WHERE id = ? AND user_id = ?').get(Number(id), session.id) as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes } = body;

    db.prepare(`
      UPDATE transacoes SET
        descricao = COALESCE(?, descricao),
        valor = COALESCE(?, valor),
        tipo = COALESCE(?, tipo),
        categoria = COALESCE(?, categoria),
        status = COALESCE(?, status),
        data = COALESCE(?, data),
        cartao_id = ?,
        recorrente = COALESCE(?, recorrente),
        frequencia = ?,
        observacoes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      descricao || null, valor || null, tipo || null, categoria || null,
      status || null, data || null, cartao_id !== undefined ? cartao_id : (existing as Record<string, unknown>).cartao_id,
      recorrente !== undefined ? (recorrente ? 1 : 0) : null,
      frequencia !== undefined ? frequencia : (existing as Record<string, unknown>).frequencia,
      observacoes !== undefined ? observacoes : (existing as Record<string, unknown>).observacoes,
      Number(id), session.id
    );

    const updated = db.prepare('SELECT * FROM transacoes WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
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

    const existing = db.prepare('SELECT * FROM transacoes WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    db.prepare('DELETE FROM transacoes WHERE id = ? AND user_id = ?').run(Number(id), session.id);

    return NextResponse.json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
