import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface AulaRow {
  id: number;
  trilha: string;
  numero: number;
  titulo: string;
  badge_nome: string | null;
  ordem: number;
  concluida: number | null;
  quiz_score: number | null;
  data_conclusao: string | null;
}

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Determine accessible tracks based on plan
    const plano = session.plano;
    const trilhasAcessiveis = ['LITE', 'LITE_ANUAL'].includes(plano)
      ? ['iniciante']
      : ['iniciante', 'moderado', 'avancado'];

    const { rows } = await sql`
      SELECT
        a.id, a.trilha, a.numero, a.titulo, a.badge_nome, a.ordem,
        pa.concluida, pa.quiz_score, pa.data_conclusao
      FROM aulas a
      LEFT JOIN progresso_aulas pa ON pa.aula_id = a.id AND pa.user_id = ${session.id}
      ORDER BY a.ordem ASC
    `;
    const aulas = rows as AulaRow[];

    // Group by track
    const trilhas: Record<string, {
      trilha: string;
      acessivel: boolean;
      aulas: {
        id: number;
        trilha: string;
        numero: number;
        titulo: string;
        concluida: boolean;
        quiz_score: number;
        acessivel: boolean;
        badge_nome: string | null;
        data_conclusao: string | null;
      }[];
    }> = {};

    for (const trilha of ['iniciante', 'moderado', 'avancado']) {
      const aulasDoTrilha = aulas.filter(a => a.trilha === trilha);
      const trilhaAcessivel = trilhasAcessiveis.includes(trilha);

      let primeiraIncompletaEncontrada = false;

      const aulasProcessadas = aulasDoTrilha.map((aula) => {
        const concluida = aula.concluida === 1;
        let aulaAcessivel = false;

        if (trilhaAcessivel) {
          if (concluida) {
            aulaAcessivel = true;
          } else if (!primeiraIncompletaEncontrada) {
            aulaAcessivel = true;
            primeiraIncompletaEncontrada = true;
          }
        }

        return {
          id: aula.id,
          trilha: aula.trilha,
          numero: aula.numero,
          titulo: aula.titulo,
          concluida,
          quiz_score: aula.quiz_score || 0,
          acessivel: aulaAcessivel,
          badge_nome: aula.badge_nome,
          data_conclusao: concluida ? (aula.data_conclusao || null) : null,
        };
      });

      trilhas[trilha] = {
        trilha,
        acessivel: trilhaAcessivel,
        aulas: aulasProcessadas,
      };
    }

    return NextResponse.json(trilhas);
  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
