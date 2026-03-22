import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

export const GET = withAuth(async (_request, session) => {
  const { rows } = await sql`
    SELECT * FROM boletos WHERE user_id = ${session.id}
    ORDER BY vencimento ASC
  `;
  const parsed = rows.map(b => ({ ...b, valor: Number((b as any).valor) }));
  return NextResponse.json(parsed);
});

export const POST = withAuth(async (request, session) => {
  const { tipo, descricao, valor, vencimento, lembrete_dias, recorrente } = await request.json();

  if (!tipo || !valor || !vencimento) {
    return NextResponse.json({ error: 'Tipo, valor e vencimento obrigatórios' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO boletos (user_id, tipo, descricao, valor, vencimento, lembrete_dias, recorrente)
    VALUES (${session.id}, ${tipo}, ${descricao || null}, ${valor}, ${vencimento}, ${lembrete_dias || 1}, ${recorrente || null})
    RETURNING *
  `;

  return NextResponse.json({ ...rows[0], valor: Number((rows[0] as any).valor) }, { status: 201 });
});
