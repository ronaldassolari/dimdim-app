import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

interface SomaRow { total: number | null }

// PATCH: Adjust saldo by creating an adjustment transaction
export const PATCH = withAuth(async (request, session) => {
  const body = await request.json();
  const { saldo: novoSaldo, mes } = body;

  if (typeof novoSaldo !== 'number' || isNaN(novoSaldo)) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  }

  const mesAtual = mes || new Date().toISOString().slice(0, 7);
  const mesLike = mesAtual + '%';

  // Calculate current saldo
  const { rows: receitasRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'RECEITA' AND status = 'RECEBIDO' AND data LIKE ${mesLike}
  `;
  const { rows: gastosRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'GASTO' AND status = 'PAGO' AND data LIKE ${mesLike}
  `;

  const receitasAtual = Number((receitasRows[0] as SomaRow).total) || 0;
  const gastosAtual = Number((gastosRows[0] as SomaRow).total) || 0;
  const saldoAtual = receitasAtual - gastosAtual;

  const diferenca = novoSaldo - saldoAtual;

  if (Math.abs(diferenca) < 0.01) {
    return NextResponse.json({ success: true, saldo: saldoAtual });
  }

  const hoje = new Date().toISOString().slice(0, 10);

  if (diferenca > 0) {
    // Need to add income to increase saldo
    await sql`
      INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
      VALUES (${session.id}, 'Ajuste manual de saldo', ${diferenca}, 'RECEITA', 'Outros', 'RECEBIDO', ${hoje})
    `;
  } else {
    // Need to add expense to decrease saldo
    await sql`
      INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
      VALUES (${session.id}, 'Ajuste manual de saldo', ${Math.abs(diferenca)}, 'GASTO', 'Outros', 'PAGO', ${hoje})
    `;
  }

  return NextResponse.json({ success: true, saldo: novoSaldo });
});
