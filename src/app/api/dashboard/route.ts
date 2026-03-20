import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

interface SomaRow { total: number | null }
interface MetaRow { id: number; titulo: string; valor_alvo: number; valor_atual: number; categoria: string | null }
interface SaldoRow { saldo: number | null }
interface AlertaRow { total: number }
interface TransacaoRow { data: string; valor: number; tipo: string; status: string }

export const GET = withAuth(async (request, session) => {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes') || new Date().toISOString().slice(0, 7);
  const mesLike = mes + '%';

  // Saldo calculations
  const { rows: receitasRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'RECEITA' AND status = 'RECEBIDO' AND data LIKE ${mesLike}
  `;
  const receitas = receitasRows[0] as SomaRow;

  const { rows: gastosRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'GASTO' AND status = 'PAGO' AND data LIKE ${mesLike}
  `;
  const gastos = gastosRows[0] as SomaRow;

  const { rows: aReceberRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'RECEITA' AND status = 'A_RECEBER' AND data LIKE ${mesLike}
  `;
  const aReceber = aReceberRows[0] as SomaRow;

  const { rows: aPagarRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'GASTO' AND status = 'A_PAGAR' AND data LIKE ${mesLike}
  `;
  const aPagar = aPagarRows[0] as SomaRow;

  const saldo = {
    receitas: Number(receitas.total) || 0,
    gastos: Number(gastos.total) || 0,
    aReceber: Number(aReceber.total) || 0,
    aPagar: Number(aPagar.total) || 0,
    saldo: (Number(receitas.total) || 0) - (Number(gastos.total) || 0),
  };

  // Daily chart data
  const [ano, mesNum] = mes.split('-').map(Number);
  const diasNoMes = new Date(ano, mesNum, 0).getDate();
  const hoje = new Date();
  const diaAtual = hoje.getFullYear() === ano && (hoje.getMonth() + 1) === mesNum ? hoje.getDate() : diasNoMes;

  const { rows: transacoesMes } = await sql`
    SELECT data, valor, tipo, status FROM transacoes
    WHERE user_id = ${session.id} AND data LIKE ${mesLike} ORDER BY data ASC
  `;

  const grafico = [];
  let acumuladoRealizado = 0;
  const mediaGastoDiario = (saldo.gastos + saldo.aPagar) / diasNoMes;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataStr = `${mes}-${String(dia).padStart(2, '0')}`;
    const txDia = (transacoesMes as TransacaoRow[]).filter(t => t.data === dataStr);

    for (const tx of txDia) {
      if (tx.tipo === 'RECEITA' && tx.status === 'RECEBIDO') acumuladoRealizado += Number(tx.valor);
      if (tx.tipo === 'GASTO' && tx.status === 'PAGO') acumuladoRealizado -= Number(tx.valor);
    }

    grafico.push({
      dia,
      realizado: dia <= diaAtual ? Math.round(acumuladoRealizado * 100) / 100 : null,
      projetado: Math.round(((saldo.receitas + saldo.aReceber) - (mediaGastoDiario * dia)) * 100) / 100,
    });
  }

  // Top 2 goals
  const { rows: metas } = await sql`
    SELECT id, titulo, valor_alvo, valor_atual, categoria FROM metas
    WHERE user_id = ${session.id} AND ativa = 1 ORDER BY created_at DESC LIMIT 2
  `;

  const metasComProgresso = (metas as MetaRow[]).map(m => ({
    ...m,
    progresso: Math.round((Number(m.valor_atual) / Number(m.valor_alvo)) * 100),
  }));

  // Points total value
  const { rows: pontosRows } = await sql`
    SELECT COALESCE(SUM(saldo), 0) as saldo FROM analise_pontos WHERE user_id = ${session.id}
  `;
  const pontosTotal = pontosRows[0] as SaldoRow;
  const pontosValor = Math.round((Number(pontosTotal.saldo) || 0) * 0.01 * 100) / 100;

  // Insights based on actual data
  const insights: string[] = [];
  if (saldo.gastos > 0) {
    const percentGasto = Math.round((saldo.gastos / (saldo.receitas || 1)) * 100);
    insights.push(`Você gastou ${percentGasto}% da sua receita recebida este mês`);
  }
  if (saldo.aPagar > 0) {
    insights.push(`Ainda tem R$ ${saldo.aPagar.toFixed(2)} a pagar neste mês`);
  }
  if (saldo.aReceber > 0) {
    insights.push(`R$ ${saldo.aReceber.toFixed(2)} a receber vai melhorar seu saldo`);
  }
  if (metasComProgresso.length > 0) {
    const meta = metasComProgresso[0];
    insights.push(`Meta "${meta.titulo}" está ${meta.progresso}% completa`);
  }
  if (pontosValor > 0) {
    insights.push(`Seus pontos valem aproximadamente R$ ${pontosValor.toFixed(2)}`);
  }
  if (insights.length < 3) {
    insights.push('Categorize todas as transações para insights mais precisos');
  }

  // Unread alerts
  const { rows: alertasRows } = await sql`
    SELECT COUNT(*) as total FROM alertas WHERE user_id = ${session.id} AND lido = 0
  `;
  const alertas = alertasRows[0] as AlertaRow;

  return NextResponse.json({
    saldo,
    grafico,
    metas: metasComProgresso,
    pontos: { total: Number(pontosTotal.saldo) || 0, valorReais: pontosValor },
    insights: insights.slice(0, 4),
    alertas: Number(alertas.total),
  });
});
