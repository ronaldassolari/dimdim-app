import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: existingRows } = await sql`SELECT * FROM metas WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { titulo, valor_alvo, valor_atual, categoria, prazo, ativa } = body;

    await sql`
      UPDATE metas SET
        titulo = COALESCE(${titulo || null}, titulo),
        valor_alvo = COALESCE(${valor_alvo ?? null}, valor_alvo),
        valor_atual = COALESCE(${valor_atual ?? null}, valor_atual),
        categoria = COALESCE(${categoria || null}, categoria),
        prazo = COALESCE(${prazo || null}, prazo),
        ativa = COALESCE(${ativa ?? null}, ativa)
      WHERE id = ${Number(id)} AND user_id = ${session.id}
    `;

    const { rows: updatedRows } = await sql`SELECT * FROM metas WHERE id = ${Number(id)}`;
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
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

    const { rows: existingRows } = await sql`SELECT * FROM metas WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 });
    }

    await sql`DELETE FROM metas WHERE id = ${Number(id)} AND user_id = ${session.id}`;

    return NextResponse.json({ message: 'Meta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
