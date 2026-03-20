import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const { rows: existingRows } = await sql`SELECT * FROM analise_pontos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { saldo, validade, alerta_dias, interesse } = body;

    await sql`
      UPDATE analise_pontos SET
        saldo = COALESCE(${saldo ?? null}, saldo),
        validade = COALESCE(${validade || null}, validade),
        alerta_dias = COALESCE(${alerta_dias ?? null}, alerta_dias),
        interesse = COALESCE(${interesse ?? null}, interesse)
      WHERE id = ${Number(id)} AND user_id = ${session.id}
    `;

    // Return enriched data
    const { rows: updatedRows } = await sql`
      SELECT pp.*, ap.saldo, ap.validade, ap.alerta_dias, ap.interesse, ap.id as analise_id
      FROM programas_pontos pp
      JOIN analise_pontos ap ON ap.programa_id = pp.id
      WHERE ap.id = ${Number(id)}
    `;
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: existingRows } = await sql`SELECT * FROM analise_pontos WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    await sql`DELETE FROM analise_pontos WHERE id = ${Number(id)} AND user_id = ${session.id}`;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
