import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

export const GET = withAuth(async (_request, session) => {
  const { rows } = await sql`
    SELECT * FROM compromissos WHERE user_id = ${session.id}
    ORDER BY data ASC, hora ASC
  `;
  return NextResponse.json(rows);
});

export const POST = withAuth(async (request, session) => {
  const { titulo, data, hora, descricao, lembrete_minutos, lembrete_canal, recorrente } = await request.json();

  if (!titulo || !data) {
    return NextResponse.json({ error: 'Título e data obrigatórios' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO compromissos (user_id, titulo, data, hora, descricao, lembrete_minutos, lembrete_canal, recorrente)
    VALUES (${session.id}, ${titulo}, ${data}, ${hora || null}, ${descricao || null}, ${lembrete_minutos || 15}, ${lembrete_canal || 'whatsapp'}, ${recorrente || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
});
