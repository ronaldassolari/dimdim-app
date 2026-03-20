import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { rows } = await sql`SELECT * FROM cartoes WHERE id = ${Number(params.id)} AND user_id = ${session.id} AND ativo = 1`;
    if (!rows[0]) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cartão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: existingRows } = await sql`SELECT * FROM cartoes WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos, ativo } = body;

    await sql`
      UPDATE cartoes SET
        apelido = COALESCE(${apelido || null}, apelido),
        banco = COALESCE(${banco || null}, banco),
        bandeira = COALESCE(${bandeira || null}, bandeira),
        nivel = COALESCE(${nivel || null}, nivel),
        limite = COALESCE(${limite ?? null}, limite),
        gasto_mes = COALESCE(${gasto_mes ?? null}, gasto_mes),
        vencimento = COALESCE(${vencimento ?? null}, vencimento),
        cor = COALESCE(${cor || null}, cor),
        pontos_por_real = COALESCE(${pontos_por_real ?? null}, pontos_por_real),
        programas_pontos = COALESCE(${programas_pontos ? JSON.stringify(programas_pontos) : null}, programas_pontos),
        ativo = COALESCE(${ativo ?? null}, ativo)
      WHERE id = ${Number(id)} AND user_id = ${session.id}
    `;

    const { rows: updatedRows } = await sql`SELECT * FROM cartoes WHERE id = ${Number(id)}`;
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
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

    const { rows: existingRows } = await sql`SELECT * FROM cartoes WHERE id = ${Number(id)} AND user_id = ${session.id}`;
    if (!existingRows[0]) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    await sql`UPDATE cartoes SET ativo = 0 WHERE id = ${Number(id)} AND user_id = ${session.id}`;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir cartão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
