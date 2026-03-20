import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { rows } = await sql`SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, avatar_url FROM users WHERE id = ${session.id}`;
    const user = rows[0];
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
}
