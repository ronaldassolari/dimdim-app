import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface Insight {
  tipo: string;
  mensagem: string;
  acao_sugerida: string;
  urgencia: 'baixa' | 'media' | 'alta';
}

// Cache: userId -> { insights, timestamp }
const cache = new Map<number, { insights: Insight[]; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function gerarInsightsEstaticos(dados: any): Insight[] {
  const insights: Insight[] = [];
  const { receitas, gastos, aPagar, metas, pontos, topCategorias } = dados;

  if (gastos > 0 && receitas > 0) {
    const pct = Math.round((gastos / receitas) * 100);
    if (pct > 80) {
      insights.push({
        tipo: 'gasto_alto',
        mensagem: `Você gastou ${pct}% da sua receita este mês. Cuidado para não ultrapassar.`,
        acao_sugerida: 'Revise gastos variáveis e corte o que não é essencial.',
        urgencia: pct > 95 ? 'alta' : 'media',
      });
    } else {
      insights.push({
        tipo: 'economia',
        mensagem: `Parabéns! Você gastou apenas ${pct}% da receita. Está sobrando R$ ${(receitas - gastos).toFixed(2)}.`,
        acao_sugerida: 'Invista o excedente em Tesouro Selic ou aporte na sua meta.',
        urgencia: 'baixa',
      });
    }
  }

  if (aPagar > 0) {
    insights.push({
      tipo: 'pendencia',
      mensagem: `Ainda tem R$ ${aPagar.toFixed(2)} a pagar neste mês.`,
      acao_sugerida: 'Programe os pagamentos para evitar juros e multas.',
      urgencia: aPagar > receitas * 0.3 ? 'alta' : 'media',
    });
  }

  if (metas.length > 0) {
    const meta = metas[0];
    const pct = Math.round((Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100);
    insights.push({
      tipo: 'meta_progresso',
      mensagem: `Meta "${meta.titulo}" está ${pct}% completa. Faltam R$ ${(Number(meta.valor_alvo) - Number(meta.valor_atual)).toFixed(2)}.`,
      acao_sugerida: pct < 50 ? 'Aumente o aporte mensal para alcançar a meta no prazo.' : 'Está no caminho certo! Mantenha a disciplina.',
      urgencia: pct < 25 ? 'media' : 'baixa',
    });
  }

  if (pontos > 0) {
    const valorReais = (pontos * 0.01).toFixed(2);
    insights.push({
      tipo: 'pontos',
      mensagem: `Seus ${pontos.toLocaleString()} pontos valem R$ ${valorReais}. Não deixe expirar!`,
      acao_sugerida: 'Verifique a validade e considere transferir para programas de viagem com bônus.',
      urgencia: 'baixa',
    });
  }

  if (topCategorias.length > 0) {
    const top = topCategorias[0];
    insights.push({
      tipo: 'categoria',
      mensagem: `Sua maior despesa é ${top.categoria}: R$ ${Number(top.total).toFixed(2)} este mês.`,
      acao_sugerida: `Compare preços e busque alternativas para reduzir gastos com ${top.categoria}.`,
      urgencia: 'baixa',
    });
  }

  return insights.slice(0, 5);
}

async function gerarInsightsIA(dados: any): Promise<Insight[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return gerarInsightsEstaticos(dados);

  try {
    const prompt = `Analise os dados financeiros abaixo e gere exatamente 4 insights financeiros personalizados em português brasileiro.

Dados do mês:
- Receitas: R$ ${dados.receitas.toFixed(2)}
- Gastos: R$ ${dados.gastos.toFixed(2)}
- A pagar: R$ ${dados.aPagar.toFixed(2)}
- Saldo: R$ ${(dados.receitas - dados.gastos).toFixed(2)}
- Pontos acumulados: ${dados.pontos}
- Top categorias de gasto: ${dados.topCategorias.map((c: any) => `${c.categoria}: R$ ${Number(c.total).toFixed(2)}`).join(', ')}
- Metas: ${dados.metas.map((m: any) => `${m.titulo}: ${Math.round(Number(m.valor_atual) / Number(m.valor_alvo) * 100)}% (R$ ${Number(m.valor_atual).toFixed(2)} de R$ ${Number(m.valor_alvo).toFixed(2)})`).join(', ') || 'nenhuma'}

Responda APENAS com JSON válido, sem markdown:
{"insights":[{"tipo":"string","mensagem":"string","acao_sugerida":"string","urgencia":"baixa|media|alta"}]}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
      return parsed.insights.slice(0, 5);
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.warn('Anthropic API falhou, usando insights estáticos:', err);
    return gerarInsightsEstaticos(dados);
  }
}

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Check cache
    const cached = cache.get(session.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ insights: cached.insights, cached: true });
    }

    const mes = new Date().toISOString().slice(0, 7) + '%';

    const [recR, gasR, apR, metR, ptR, catR] = await Promise.all([
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${session.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`,
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${session.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`,
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${session.id} AND tipo='GASTO' AND status='A_PAGAR' AND data LIKE ${mes}`,
      sql`SELECT id,titulo,valor_alvo,valor_atual FROM metas WHERE user_id=${session.id} AND ativa=1 ORDER BY created_at DESC LIMIT 3`,
      sql`SELECT COALESCE(SUM(saldo),0) as t FROM analise_pontos WHERE user_id=${session.id}`,
      sql`SELECT categoria, SUM(valor) as total FROM transacoes WHERE user_id=${session.id} AND tipo='GASTO' AND data LIKE ${mes} GROUP BY categoria ORDER BY total DESC LIMIT 5`,
    ]);

    const dados = {
      receitas: Number((recR.rows[0] as any).t) || 0,
      gastos: Number((gasR.rows[0] as any).t) || 0,
      aPagar: Number((apR.rows[0] as any).t) || 0,
      metas: metR.rows,
      pontos: Number((ptR.rows[0] as any).t) || 0,
      topCategorias: catR.rows,
    };

    const insights = await gerarInsightsIA(dados);

    // Cache
    cache.set(session.id, { insights, timestamp: Date.now() });

    return NextResponse.json({ insights, cached: false });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
