import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET() {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const programas = db.prepare(`
      SELECT
        pp.*,
        ap.saldo,
        ap.validade,
        ap.alerta_dias,
        ap.interesse,
        ap.id as analise_id
      FROM programas_pontos pp
      LEFT JOIN analise_pontos ap ON ap.programa_id = pp.id AND ap.user_id = ?
      WHERE pp.ativo = 1
      ORDER BY ap.interesse DESC, pp.nome ASC
    `).all(session.id);

    return NextResponse.json(programas);
  } catch (error) {
    console.error('Erro ao listar programas de pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { programa_id, saldo, validade, alerta_dias, interesse } = body;

    if (!programa_id) {
      return NextResponse.json({ error: 'Campo obrigatório: programa_id' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT * FROM analise_pontos WHERE user_id = ? AND programa_id = ?').get(session.id, programa_id);

    if (existing) {
      db.prepare(`
        UPDATE analise_pontos SET
          saldo = COALESCE(?, saldo),
          validade = COALESCE(?, validade),
          alerta_dias = COALESCE(?, alerta_dias),
          interesse = COALESCE(?, interesse)
        WHERE user_id = ? AND programa_id = ?
      `).run(saldo ?? null, validade || null, alerta_dias ?? null, interesse ?? null, session.id, programa_id);
    } else {
      db.prepare(`
        INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, alerta_dias, interesse)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(session.id, programa_id, saldo || 0, validade || null, alerta_dias || 30, interesse ?? 0);
    }

    const updated = db.prepare(`
      SELECT pp.*, ap.saldo, ap.validade, ap.alerta_dias, ap.interesse
      FROM programas_pontos pp
      LEFT JOIN analise_pontos ap ON ap.programa_id = pp.id AND ap.user_id = ?
      WHERE pp.id = ?
    `).get(session.id, programa_id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
