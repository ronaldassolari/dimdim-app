import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const existing = db.prepare('SELECT * FROM cartoes WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos, ativo } = body;

    db.prepare(`
      UPDATE cartoes SET
        apelido = COALESCE(?, apelido),
        banco = COALESCE(?, banco),
        bandeira = COALESCE(?, bandeira),
        nivel = COALESCE(?, nivel),
        limite = COALESCE(?, limite),
        gasto_mes = COALESCE(?, gasto_mes),
        vencimento = COALESCE(?, vencimento),
        cor = COALESCE(?, cor),
        pontos_por_real = COALESCE(?, pontos_por_real),
        programas_pontos = COALESCE(?, programas_pontos),
        ativo = COALESCE(?, ativo)
      WHERE id = ? AND user_id = ?
    `).run(
      apelido || null, banco || null, bandeira || null, nivel || null,
      limite ?? null, gasto_mes ?? null, vencimento ?? null, cor || null,
      pontos_por_real ?? null,
      programas_pontos ? JSON.stringify(programas_pontos) : null,
      ativo ?? null,
      Number(id), session.id
    );

    const updated = db.prepare('SELECT * FROM cartoes WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const existing = db.prepare('SELECT * FROM cartoes WHERE id = ? AND user_id = ?').get(Number(id), session.id);
    if (!existing) {
      return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 });
    }

    db.prepare('UPDATE cartoes SET ativo = 0 WHERE id = ? AND user_id = ?').run(Number(id), session.id);

    return NextResponse.json({ message: 'Cartão excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cartão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
