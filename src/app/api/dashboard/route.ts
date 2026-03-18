import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface SomaRow { total: number | null }
interface MetaRow { id: number; titulo: string; valor_alvo: number; valor_atual: number; categoria: string | null }
interface SaldoRow { saldo: number | null }
interface AlertaRow { total: number }
interface TransacaoRow { data: string; valor: number; tipo: string; status: string }

export async function GET(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().toISOString().slice(0, 7);

    const db = getDb();

    // Saldo calculations
    const receitas = db.prepare(
      "SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = ? AND tipo = 'RECEITA' AND status = 'RECEBIDO' AND data LIKE ?"
    ).get(session.id, `${mes}%`) as SomaRow;

    const gastos = db.prepare(
      "SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = ? AND tipo = 'GASTO' AND status = 'PAGO' AND data LIKE ?"
    ).get(session.id, `${mes}%`) as SomaRow;

    const aReceber = db.prepare(
      "SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = ? AND tipo = 'RECEITA' AND status = 'A_RECEBER' AND data LIKE ?"
    ).get(session.id, `${mes}%`) as SomaRow;

    const aPagar = db.prepare(
      "SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE user_id = ? AND tipo = 'GASTO' AND status = 'A_PAGAR' AND data LIKE ?"
    ).get(session.id, `${mes}%`) as SomaRow;

    const saldo = {
      receitas: receitas.total || 0,
      gastos: gastos.total || 0,
      aReceber: aReceber.total || 0,
      aPagar: aPagar.total || 0,
      saldo: (receitas.total || 0) - (gastos.total || 0),
    };

    // Daily chart data
    const [ano, mesNum] = mes.split('-').map(Number);
    const diasNoMes = new Date(ano, mesNum, 0).getDate();
    const hoje = new Date();
    const diaAtual = hoje.getFullYear() === ano && (hoje.getMonth() + 1) === mesNum ? hoje.getDate() : diasNoMes;

    const transacoesMes = db.prepare(
      "SELECT data, valor, tipo, status FROM transacoes WHERE user_id = ? AND data LIKE ? ORDER BY data ASC"
    ).all(session.id, `${mes}%`) as TransacaoRow[];

    const grafico = [];
    let acumuladoRealizado = 0;
    const mediaGastoDiario = (saldo.gastos + saldo.aPagar) / diasNoMes;

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataStr = `${mes}-${String(dia).padStart(2, '0')}`;
      const txDia = transacoesMes.filter(t => t.data === dataStr);

      for (const tx of txDia) {
        if (tx.tipo === 'RECEITA' && tx.status === 'RECEBIDO') acumuladoRealizado += tx.valor;
        if (tx.tipo === 'GASTO' && tx.status === 'PAGO') acumuladoRealizado -= tx.valor;
      }

      grafico.push({
        dia,
        realizado: dia <= diaAtual ? Math.round(acumuladoRealizado * 100) / 100 : null,
        projetado: Math.round(((saldo.receitas + saldo.aReceber) - (mediaGastoDiario * dia)) * 100) / 100,
      });
    }

    // Top 2 goals
    const metas = db.prepare(
      'SELECT id, titulo, valor_alvo, valor_atual, categoria FROM metas WHERE user_id = ? AND ativa = 1 ORDER BY created_at DESC LIMIT 2'
    ).all(session.id) as MetaRow[];

    const metasComProgresso = metas.map(m => ({
      ...m,
      progresso: Math.round((m.valor_atual / m.valor_alvo) * 100),
    }));

    // Points total value
    const pontosTotal = db.prepare(
      'SELECT COALESCE(SUM(saldo), 0) as saldo FROM analise_pontos WHERE user_id = ?'
    ).get(session.id) as SaldoRow;
    const pontosValor = Math.round((pontosTotal.saldo || 0) * 0.01 * 100) / 100;

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
    const alertas = db.prepare(
      'SELECT COUNT(*) as total FROM alertas WHERE user_id = ? AND lido = 0'
    ).get(session.id) as AlertaRow;

    return NextResponse.json({
      saldo,
      grafico,
      metas: metasComProgresso,
      pontos: { total: pontosTotal.saldo || 0, valorReais: pontosValor },
      insights: insights.slice(0, 4),
      alertas: alertas.total,
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
