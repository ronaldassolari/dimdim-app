import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

export const GET = withAuth(async (_request, session) => {
  const { rows: metas } = await sql`SELECT * FROM metas WHERE user_id = ${session.id} AND ativa = 1 ORDER BY created_at DESC`;

  return NextResponse.json(metas);
});

export const POST = withAuth(async (request, session) => {
  const body = await request.json();
  const { titulo, valor_alvo, valor_atual, categoria, prazo } = body;

  if (!titulo || typeof titulo !== 'string' || titulo.length > 300) {
    return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
  }
  if (!valor_alvo || isNaN(Number(valor_alvo)) || Number(valor_alvo) <= 0) {
    return NextResponse.json({ error: 'Valor alvo inválido' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo)
    VALUES (${session.id}, ${titulo}, ${valor_alvo}, ${valor_atual || 0}, ${categoria || null}, ${prazo || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
});
