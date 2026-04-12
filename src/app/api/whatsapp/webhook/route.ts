// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import {
  extrairGasto,
  extrairMultiplosGastos,
  detectarIntencaoComConfianca,
} from '@/lib/nlp';
import { processarMensagemIA } from '@/lib/ai';

const WA_TOKEN = process.env.WHATSAPP_TOKEN!;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimdim2026';

function normalizeBRNumber(num: string): string {
  const digits = num.replace(/[^\d]/g, '');
  if (digits.startsWith('55') && digits.length === 12) {
    return digits.slice(0, 4) + '9' + digits.slice(4);
  }
  return digits;
}

async function enviarMensagem(to: string, body: string) {
  try {
    await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (params.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(params.get('hub.challenge'));
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== 'text') return NextResponse.json({ ok: true });

    const from = normalizeBRNumber(message.from as string);
    const msg = (message.text.body as string).trim();

    await seed();
    const users = await sql`SELECT * FROM users WHERE whatsapp_number = ${from} LIMIT 1`;
    if (users.length === 0) {
      await enviarMensagem(from, '👋 Olá! Seu número não está cadastrado.\nAcesse o DimdimApp para se registrar! 🚀');
      return NextResponse.json({ ok: true });
    }

    const user = users[0];
    const userId = user.id as number;
    const nome = (user.nome as string) || 'você';

    // FAST PATH 1: Múltiplos gastos
    const multiplos = extrairMultiplosGastos(msg);
    if (multiplos.length >= 2) {
      let total = 0;
      const linhas: string[] = [];
      for (const g of multiplos) {
        const cats = await sql`SELECT id FROM categorias WHERE user_id = ${userId} AND nome ILIKE ${g.categoria} LIMIT 1`;
        await sql`INSERT INTO gastos (user_id, descricao, valor, categoria_id, data) VALUES (${userId}, ${g.descricao}, ${g.valor}, ${cats[0]?.id ?? null}, NOW())`;
        total += g.valor;
        linhas.push(`• ${g.descricao}: R$ ${g.valor.toFixed(2)}`);
      }
      await enviarMensagem(from, `✅ ${multiplos.length} gastos registrados!\n\n${linhas.join('\n')}\n\n💰 Total: R$ ${total.toFixed(2)}`);
      return NextResponse.json({ ok: true });
    }

    // FAST PATH 2: Gasto simples (NLP confiante)
    const { intencao, confianca } = detectarIntencaoComConfianca(msg);
    if (intencao === 'gasto' && confianca >= 0.7) {
      const g = extrairGasto(msg);
      if (g && g.valor > 0) {
        const cats = await sql`SELECT id FROM categorias WHERE user_id = ${userId} AND nome ILIKE ${g.categoria} LIMIT 1`;
        await sql`INSERT INTO gastos (user_id, descricao, valor, categoria_id, data) VALUES (${userId}, ${g.descricao}, ${g.valor}, ${cats[0]?.id ?? null}, NOW())`;
        await enviarMensagem(from, `✅ Gasto registrado!\n💸 ${g.descricao}: R$ ${g.valor.toFixed(2)}\n📂 ${g.categoria}`);
        return NextResponse.json({ ok: true });
      }
    }

    // FAST PATH 3: Resumo mensal
    if (intencao === 'resumo' && confianca >= 0.8) {
      const [row] = await sql`SELECT COALESCE(SUM(valor),0)::numeric AS total, COUNT(*)::int AS qtd FROM gastos WHERE user_id = ${userId} AND data >= date_trunc('month', NOW())`;
      await enviarMensagem(from, `📊 Resumo de ${nome} este mês:\n💸 Total: R$ ${Number(row?.total ?? 0).toFixed(2)}\n🧾 Transações: ${row?.qtd ?? 0}`);
      return NextResponse.json({ ok: true });
    }

    // AI ASSESSOR: agenda, boletos, busca, conselhos
    const { resposta } = await processarMensagemIA(msg, {
      id: userId,
      nome,
      modo_bot: (user.modo_bot as string) || 'assistente',
      humor_bot: (user.humor_bot as string) || 'amigavel',
    });
    await enviarMensagem(from, resposta);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
