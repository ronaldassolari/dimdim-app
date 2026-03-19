import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    const db = getDb();
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = db.prepare('SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, avatar_url FROM users WHERE id = ?').get(session.id);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
}
