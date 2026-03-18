import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');

    const db = getDb();
    let query = 'SELECT * FROM transacoes WHERE user_id = ?';
    const params: (string | number)[] = [session.id];

    if (mes) {
      query += ' AND data LIKE ?';
      params.push(`${mes}%`);
    }

    query += ' ORDER BY data DESC';

    const transacoes = db.prepare(query).all(...params) as Record<string, unknown>[];

    const header = 'ID,Data,Descrição,Valor,Tipo,Categoria,Status,Cartão ID,Recorrente,Frequência,Observações\n';
    const rows = transacoes.map((t) =>
      `${t.id},"${t.data}","${t.descricao}",${t.valor},${t.tipo},"${t.categoria}",${t.status},${t.cartao_id || ''},${t.recorrente ? 'Sim' : 'Não'},"${t.frequencia || ''}","${t.observacoes || ''}"`
    ).join('\n');

    const csv = header + rows;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="transacoes${mes ? `-${mes}` : ''}.csv"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar transações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
