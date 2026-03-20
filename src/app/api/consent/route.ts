import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await seed();
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    await sql`
      CREATE TABLE IF NOT EXISTS consent_log (
        id SERIAL PRIMARY KEY,
        ip VARCHAR(100),
        accepted BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`INSERT INTO consent_log (ip, accepted) VALUES (${ip}, ${body.accepted ?? true})`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao registrar consentimento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
