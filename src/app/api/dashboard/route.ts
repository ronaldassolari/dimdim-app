import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

interface SomaRow { total: number | null }
interface MetaRow { id: number; titulo: string; valor_alvo: number; valor_atual: number; categoria: string | null; prazo: string | null }
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
    SELECT id, titulo, valor_alvo, valor_atual, categoria, prazo FROM metas
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
  // Average point value ~0.02 (weighted across programs: Livelo, Esfera, etc.)
  const pontosValor = Math.round((Number(pontosTotal.saldo) || 0) * 0.02 * 100) / 100;
  const economiaMes = Math.round((saldo.receitas - saldo.gastos) * 100) / 100;

  // Personalized insights based on actual data
  const insights: string[] = [];

  // Spending percentage (fix: ensure single multiplication by 100)
  if (saldo.gastos > 0 && saldo.receitas > 0) {
    const percentGasto = (saldo.gastos / saldo.receitas) * 100;
    const percentFormatted = percentGasto.toFixed(2).replace('.', ',');
    if (saldo.gastos > saldo.receitas) {
      insights.push(`🔴 Atenção: você está gastando mais do que ganha este mês (${percentFormatted}% da receita)`);
    } else if (percentGasto > 80) {
      insights.push(`⚠️ Você gastou ${percentFormatted}% da sua receita. Cuidado para não ultrapassar!`);
    } else {
      insights.push(`💚 Parabéns! Você gastou apenas ${percentFormatted}% da receita. Está sobrando R$ ${(saldo.receitas - saldo.gastos).toFixed(2)}`);
    }
  } else if (saldo.gastos > 0 && saldo.receitas === 0) {
    insights.push('🔴 Atenção: você está gastando mais do que ganha este mês');
  }

  // Food spending > 40% of total
  const { rows: categoriasRows } = await sql`
    SELECT categoria, COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'GASTO' AND data LIKE ${mesLike}
    GROUP BY categoria ORDER BY total DESC
  `;
  const totalGastosCat = (categoriasRows as { categoria: string; total: number }[]).reduce((s, c) => s + Number(c.total), 0);
  if (totalGastosCat > 0) {
    const alimentacao = (categoriasRows as { categoria: string; total: number }[]).find(c => c.categoria === 'Alimentação');
    if (alimentacao) {
      const pctAlim = (Number(alimentacao.total) / totalGastosCat) * 100;
      if (pctAlim > 40) {
        insights.push(`🍽️ Você gastou ${pctAlim.toFixed(0)}% com alimentação. Meta recomendada: 30%`);
      }
    }
  }

  // Spending increase vs last month
  const mesAnterior = (() => {
    const [a, m] = mes.split('-').map(Number);
    const prev = new Date(a, m - 2, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  })();
  const mesAnteriorLike = mesAnterior + '%';
  const { rows: gastosMesAnteriorRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'GASTO' AND status = 'PAGO' AND data LIKE ${mesAnteriorLike}
  `;
  const gastosMesAnterior = Number((gastosMesAnteriorRows[0] as SomaRow).total) || 0;
  if (gastosMesAnterior > 0 && saldo.gastos > gastosMesAnterior) {
    const aumento = ((saldo.gastos - gastosMesAnterior) / gastosMesAnterior) * 100;
    insights.push(`📈 Seus gastos aumentaram ${aumento.toFixed(0)}% em relação ao mês passado`);
  }

  // Growing balance
  const { rows: receitasMesAnteriorRows } = await sql`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes
    WHERE user_id = ${session.id} AND tipo = 'RECEITA' AND status = 'RECEBIDO' AND data LIKE ${mesAnteriorLike}
  `;
  const receitasMesAnterior = Number((receitasMesAnteriorRows[0] as SomaRow).total) || 0;
  const saldoAnterior = receitasMesAnterior - gastosMesAnterior;
  if (saldo.saldo > 0 && saldoAnterior > 0 && saldo.saldo > saldoAnterior) {
    const crescimento = ((saldo.saldo - saldoAnterior) / saldoAnterior) * 100;
    insights.push(`💚 Parabéns! Seu saldo cresceu ${crescimento.toFixed(0)}% este mês`);
  }

  // Goal near deadline
  if (metasComProgresso.length > 0) {
    for (const meta of metasComProgresso) {
      const metaOriginal = (metas as MetaRow[]).find(m => m.id === meta.id);
      // Check if the meta has prazo field via the original rows
      const prazo = (metaOriginal as any)?.prazo;
      if (prazo) {
        const diasRestantes = Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const faltam = Number(meta.valor_alvo) - Number(meta.valor_atual);
        if (diasRestantes > 0 && diasRestantes <= 30 && faltam > 0) {
          insights.push(`🎯 Sua meta "${meta.titulo}" vence em ${diasRestantes} dias. Faltam R$ ${faltam.toFixed(2)}`);
        }
      } else {
        insights.push(`🎯 Meta "${meta.titulo}" está ${meta.progresso}% completa. Faltam R$ ${(Number(meta.valor_alvo) - Number(meta.valor_atual)).toFixed(2)}`);
      }
    }
  }

  if (saldo.aPagar > 0) {
    insights.push(`⏰ Ainda tem R$ ${saldo.aPagar.toFixed(2)} a pagar neste mês`);
  }
  if (saldo.aReceber > 0) {
    insights.push(`💰 R$ ${saldo.aReceber.toFixed(2)} a receber vai melhorar seu saldo`);
  }
  if (insights.length < 3) {
    insights.push('💡 Categorize todas as transações para insights mais precisos');
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
    economiaMes,
    insights: insights.slice(0, 4),
    alertas: Number(alertas.total),
  });
});
