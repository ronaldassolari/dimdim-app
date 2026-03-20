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

    const { rows: existingRows } = await sql`SELECT * FROM contas_familia WHERE id = ${Number(id)} AND dono_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { permissao, status } = body;

    await sql`
      UPDATE contas_familia SET
        permissao = COALESCE(${permissao || null}, permissao),
        status = COALESCE(${status || null}, status)
      WHERE id = ${Number(id)} AND dono_id = ${session.id}
    `;

    const { rows: updatedRows } = await sql`SELECT * FROM contas_familia WHERE id = ${Number(id)}`;
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
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

    const { rows: existingRows } = await sql`SELECT * FROM contas_familia WHERE id = ${Number(id)} AND dono_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
    }

    await sql`DELETE FROM contas_familia WHERE id = ${Number(id)} AND dono_id = ${session.id}`;

    return NextResponse.json({ message: 'Membro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
