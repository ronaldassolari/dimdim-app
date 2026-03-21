import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    await sql`
      UPDATE alertas SET lido = 1
      WHERE user_id = ${session.id} AND lido = 0
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error marking all alertas read:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
