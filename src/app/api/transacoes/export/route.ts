import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || null;

    const { rows } = await sql`
      SELECT * FROM transacoes
      WHERE user_id = ${session.id}
      ORDER BY data DESC
    `;

    const transacoes = mes
      ? (rows as Record<string, any>[]).filter(t => (t.data as string || '').startsWith(mes))
      : rows;

    const header = 'ID,Data,Descrição,Valor,Tipo,Categoria,Status,Cartão ID,Recorrente,Frequência,Observações\n';
    const csvRows = (transacoes as Record<string, unknown>[]).map((t) =>
      `${t.id},"${t.data}","${t.descricao}",${t.valor},${t.tipo},"${t.categoria}",${t.status},${t.cartao_id || ''},${t.recorrente ? 'Sim' : 'Não'},"${t.frequencia || ''}","${t.observacoes || ''}"`
    ).join('\n');

    const csv = header + csvRows;

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
