import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
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
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: aulaRows } = await sql`SELECT * FROM aulas WHERE id = ${Number(id)}`;
    const aula = aulaRows[0] as AulaRow | undefined;
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
      const { rows: previousAulas } = await sql`
        SELECT id FROM aulas WHERE trilha = ${aula.trilha} AND numero < ${aula.numero} ORDER BY numero ASC
      `;

      for (const prev of previousAulas as { id: number }[]) {
        const { rows: progressRows } = await sql`
          SELECT concluida FROM progresso_aulas WHERE user_id = ${session.id} AND aula_id = ${prev.id}
        `;
        const progress = progressRows[0] as ProgressoRow | undefined;

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
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const { rows: aulaRows } = await sql`SELECT * FROM aulas WHERE id = ${Number(id)}`;
    const aula = aulaRows[0] as AulaRow | undefined;
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
    const { rows: existingRows } = await sql`SELECT * FROM progresso_aulas WHERE user_id = ${session.id} AND aula_id = ${Number(id)}`;

    if (existingRows[0]) {
      await sql`
        UPDATE progresso_aulas SET
          concluida = ${passed ? 1 : 0},
          quiz_score = ${score},
          data_conclusao = ${passed ? new Date().toISOString().split('T')[0] : null}
        WHERE user_id = ${session.id} AND aula_id = ${Number(id)}
      `;
    } else {
      await sql`
        INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao)
        VALUES (${session.id}, ${Number(id)}, ${passed ? 1 : 0}, ${score}, ${passed ? new Date().toISOString().split('T')[0] : null})
      `;
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
