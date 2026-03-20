import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { rows } = await sql`SELECT * FROM transacoes WHERE id = ${Number(params.id)} AND user_id = ${session.id}`;
    if (!rows[0]) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: existingRows } = await sql`SELECT * FROM transacoes WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    const existing = existingRows[0] as Record<string, unknown> | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { descricao, valor, tipo, categoria, status, data, cartao_id, recorrente, frequencia, observacoes } = body;

    await sql`
      UPDATE transacoes SET
        descricao = COALESCE(${descricao || null}, descricao),
        valor = COALESCE(${valor || null}, valor),
        tipo = COALESCE(${tipo || null}, tipo),
        categoria = COALESCE(${categoria || null}, categoria),
        status = COALESCE(${status || null}, status),
        data = COALESCE(${data || null}, data),
        cartao_id = ${cartao_id !== undefined ? cartao_id : (existing.cartao_id as any)},
        recorrente = COALESCE(${recorrente !== undefined ? (recorrente ? 1 : 0) : null}, recorrente),
        frequencia = ${frequencia !== undefined ? frequencia : (existing.frequencia as any)},
        observacoes = ${observacoes !== undefined ? observacoes : (existing.observacoes as any)}
      WHERE id = ${Number(id)} AND user_id = ${session.id}
    `;

    const { rows: updatedRows } = await sql`SELECT * FROM transacoes WHERE id = ${Number(id)}`;
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: existingRows } = await sql`SELECT * FROM transacoes WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    await sql`DELETE FROM transacoes WHERE id = ${Number(id)} AND user_id = ${session.id}`;

    return NextResponse.json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
