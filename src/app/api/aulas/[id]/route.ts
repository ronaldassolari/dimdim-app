import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface AulaRow {
  id: number;
  trilha: string;
  numero: number;
  titulo: string;
  conteudo: string;
  quiz: string;
  badge_nome: string | null;
  ordem: number;
}

interface ProgressoRow {
  concluida: number;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const aula = db.prepare('SELECT * FROM aulas WHERE id = ?').get(Number(id)) as AulaRow | undefined;
    if (!aula) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    // Check plan access
    const plano = session.plano;
    const trilhasAcessiveis = ['LITE', 'LITE_ANUAL'].includes(plano)
      ? ['iniciante']
      : ['iniciante', 'moderado', 'avancado'];

    if (!trilhasAcessiveis.includes(aula.trilha)) {
      return NextResponse.json({ error: 'Seu plano não inclui esta trilha. Faça upgrade para PRO!' }, { status: 403 });
    }

    // Check if previous lessons are completed
    if (aula.numero > 1) {
      const previousAulas = db.prepare(
        'SELECT id FROM aulas WHERE trilha = ? AND numero < ? ORDER BY numero ASC'
      ).all(aula.trilha, aula.numero) as { id: number }[];

      for (const prev of previousAulas) {
        const progress = db.prepare(
          'SELECT concluida FROM progresso_aulas WHERE user_id = ? AND aula_id = ?'
        ).get(session.id, prev.id) as ProgressoRow | undefined;

        if (!progress || progress.concluida !== 1) {
          return NextResponse.json({ error: 'Complete as aulas anteriores primeiro' }, { status: 403 });
        }
      }
    }

    return NextResponse.json({
      ...aula,
      quiz: JSON.parse(aula.quiz || '[]'),
    });
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const { id } = params;

    const aula = db.prepare('SELECT * FROM aulas WHERE id = ?').get(Number(id)) as AulaRow | undefined;
    if (!aula) {
      return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { respostas } = body;

    if (!respostas || !Array.isArray(respostas)) {
      return NextResponse.json({ error: 'Envie as respostas do quiz' }, { status: 400 });
    }

    const quiz = JSON.parse(aula.quiz || '[]') as { correta: number }[];

    // Calculate score
    let score = 0;
    for (let i = 0; i < quiz.length; i++) {
      if (respostas[i] === quiz[i].correta) {
        score++;
      }
    }

    const passed = score >= 2; // >= 2 out of 3

    // Save/update progress
    const existing = db.prepare('SELECT * FROM progresso_aulas WHERE user_id = ? AND aula_id = ?').get(session.id, Number(id));

    if (existing) {
      db.prepare(`
        UPDATE progresso_aulas SET
          concluida = ?,
          quiz_score = ?,
          data_conclusao = ?
        WHERE user_id = ? AND aula_id = ?
      `).run(passed ? 1 : 0, score, passed ? new Date().toISOString().split('T')[0] : null, session.id, Number(id));
    } else {
      db.prepare(`
        INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao)
        VALUES (?, ?, ?, ?, ?)
      `).run(session.id, Number(id), passed ? 1 : 0, score, passed ? new Date().toISOString().split('T')[0] : null);
    }

    return NextResponse.json({
      score,
      total: quiz.length,
      passed,
      message: passed
        ? `Parabéns! Você acertou ${score} de ${quiz.length} e passou!`
        : `Você acertou ${score} de ${quiz.length}. Precisa de pelo menos 2 para passar. Tente novamente!`,
    });
  } catch (error) {
    console.error('Erro ao enviar quiz:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
