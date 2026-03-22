import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

export const PUT = withAuth(async (request, session, { params }: any) => {
  const id = (await params).id;
  const { pago } = await request.json();
  await sql`UPDATE boletos SET pago = ${pago ? 1 : 0} WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (_request, session, { params }: any) => {
  const id = (await params).id;
  await sql`DELETE FROM boletos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
  return NextResponse.json({ success: true });
});
