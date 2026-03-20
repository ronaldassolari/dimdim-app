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

    const { rows } = await sql`SELECT * FROM buscas_preco WHERE id = ${Number(params.id)} AND user_id = ${session.id}`;
    if (!rows[0]) {
      return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar:', error);
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

    const { rows: existingRows } = await sql`SELECT * FROM buscas_preco WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
    }

    await sql`DELETE FROM buscas_preco WHERE id = ${Number(id)} AND user_id = ${session.id}`;

    return NextResponse.json({ message: 'Busca excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir busca:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
