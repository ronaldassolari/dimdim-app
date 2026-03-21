import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { rows } = await sql`
      SELECT id, tipo, titulo, mensagem, lido, data
      FROM alertas
      WHERE user_id = ${session.id}
      ORDER BY data DESC
      LIMIT 20
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching alertas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
