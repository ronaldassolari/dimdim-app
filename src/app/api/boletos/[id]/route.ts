import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await seed();
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const { pago } = await request.json();
  await sql`UPDATE boletos SET pago = ${pago ? 1 : 0} WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await seed();
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM boletos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
}
