import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { calcularValor, melhorOpcao, alertaVencimento, PROGRAMAS } from '@/lib/pontos-config';

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { rows: programas } = await sql`
      SELECT
        pp.*,
        ap.saldo,
        ap.validade,
        ap.alerta_dias,
        ap.interesse,
        ap.id as analise_id
      FROM programas_pontos pp
      LEFT JOIN analise_pontos ap ON ap.programa_id = pp.id AND ap.user_id = ${session.id}
      WHERE pp.ativo = 1
      ORDER BY ap.interesse DESC, pp.nome ASC
    `;

    const enriched = programas.map((row: any) => {
      const saldo = Number(row.saldo || 0);
      const nome = row.nome as string;
      const config = PROGRAMAS[nome];

      if (saldo > 0 && config) {
        const valor_produto = calcularValor(saldo, nome, 'produto');
        const valor_viagem = calcularValor(saldo, nome, 'viagem');
        const valor_cashback = calcularValor(saldo, nome, 'cashback');
        const best = melhorOpcao(saldo, nome);

        let alerta: 'verde' | 'amarelo' | 'vermelho' | null = null;
        if (row.validade) {
          const dias = Math.ceil((new Date(row.validade).getTime() - Date.now()) / 86400000);
          alerta = alertaVencimento(dias);
        }

        return {
          ...row,
          valor_produto,
          valor_viagem,
          valor_cashback,
          melhor_opcao: best,
          alerta,
        };
      }

      return row;
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Erro ao listar programas de pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { programa_id, saldo, validade, alerta_dias, interesse } = body;

    if (!programa_id) {
      return NextResponse.json({ error: 'Campo obrigatório: programa_id' }, { status: 400 });
    }

    const { rows: existingRows } = await sql`SELECT * FROM analise_pontos WHERE user_id = ${session.id} AND programa_id = ${programa_id}`;

    if (existingRows[0]) {
      await sql`
        UPDATE analise_pontos SET
          saldo = COALESCE(${saldo ?? null}, saldo),
          validade = COALESCE(${validade || null}, validade),
          alerta_dias = COALESCE(${alerta_dias ?? null}, alerta_dias),
          interesse = COALESCE(${interesse ?? null}, interesse)
        WHERE user_id = ${session.id} AND programa_id = ${programa_id}
      `;
    } else {
      await sql`
        INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, alerta_dias, interesse)
        VALUES (${session.id}, ${programa_id}, ${saldo || 0}, ${validade || null}, ${alerta_dias || 30}, ${interesse ?? 0})
      `;
    }

    const { rows: updatedRows } = await sql`
      SELECT pp.*, ap.saldo, ap.validade, ap.alerta_dias, ap.interesse
      FROM programas_pontos pp
      LEFT JOIN analise_pontos ap ON ap.programa_id = pp.id AND ap.user_id = ${session.id}
      WHERE pp.id = ${programa_id}
    `;

    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pontos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
