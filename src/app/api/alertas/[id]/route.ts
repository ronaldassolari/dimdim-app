import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const id = Number(params.id);
    await sql`
      UPDATE alertas SET lido = 1
      WHERE id = ${id} AND user_id = ${session.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating alerta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
