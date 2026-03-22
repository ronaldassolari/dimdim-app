import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

export const PUT = withAuth(async (request, session, { params }: any) => {
  const id = (await params).id;
  const body = await request.json();
  const { titulo, data, hora, descricao, lembrete_minutos } = body;

  await sql`
    UPDATE compromissos SET titulo = COALESCE(${titulo}, titulo), data = COALESCE(${data}, data),
    hora = COALESCE(${hora}, hora), descricao = COALESCE(${descricao}, descricao),
    lembrete_minutos = COALESCE(${lembrete_minutos}, lembrete_minutos)
    WHERE id = ${Number(id)} AND user_id = ${session.id}
  `;
  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (_request, session, { params }: any) => {
  const id = (await params).id;
  await sql`DELETE FROM compromissos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
});
