import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await seed();
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  await sql`UPDATE compromissos SET titulo = COALESCE(${body.titulo || null}, titulo), data = COALESCE(${body.data || null}, data), hora = COALESCE(${body.hora || null}, hora), lembrete_minutos = COALESCE(${body.lembrete_minutos || null}, lembrete_minutos) WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await seed();
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM compromissos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
}
