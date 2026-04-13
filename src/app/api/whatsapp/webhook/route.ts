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

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimdim2026';

function normalizeBRNumber(num) {
  const digits = num.replace(/[^\d]/g, '');
  if (digits.startsWith('55') && digits.length === 12) {
    return digits.slice(0, 4) + '9' + digits.slice(4);
  }
  return digits;
}

async function enviarMensagem(to, body) {
  try {
    await fetch('https://graph.facebook.com/v21.0/' + WA_PHONE_ID + '/messages', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + WA_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
  }
}

export async function GET(req) {
  const params = req.nextUrl.searchParams;
  if (params.get('hub.verify_token') === VERIFY_TOKEN) {
    return new NextResponse(params.get('hub.challenge'));
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== 'text') return NextResponse.json({ ok: true });

    const wa = normalizeBRNumber(message.from);
    const msg = message.text.body.trim();

    await seed();

    const { rows: userRows } = await sql`
      SELECT * FROM users
      WHERE whatsapp = ${wa}
         OR whatsapp = ${'55' + wa}
         OR whatsapp = ${'+' + wa}
         OR whatsapp = ${'+55' + wa.slice(2)}
      LIMIT 1
    `;

    if (userRows.length === 0) {
      await enviarMensagem(wa, 'Ola! Seu numero nao esta cadastrado. Acesse o DimdimApp para se registrar!');
      return NextResponse.json({ ok: true });
    }

    const user = userRows[0];
    const userId = user.id;
    const nome = user.nome || 'voce';
    const hoje = new Date().toISOString().slice(0, 10);

    // FAST PATH 1: Multiplos gastos
    const multiplos = extrairMultiplosGastos(msg);
    if (multiplos.length >= 2) {
      let total = 0;
      const linhas = [];
      for (const g of multiplos) {
        await sql`INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
                  VALUES (${userId}, ${g.descricao}, ${g.valor}, 'GASTO', ${g.categoria}, 'PAGO', ${hoje})`;
        total += g.valor;
        linhas.push('* ' + g.descricao + ': R$ ' + g.valor.toFixed(2));
      }
      const msgMulti = 'Gastos registrados! (' + multiplos.length + ')\n\n' + linhas.join('\n') + '\n\nTotal: R$ ' + total.toFixed(2);
      await enviarMensagem(wa, msgMulti);
      return NextResponse.json({ ok: true });
    }

    // FAST PATH 2: Gasto simples (NLP confiante)
    const { intencao, confianca } = detectarIntencaoComConfianca(msg);
    if (intencao === 'gasto' && confianca >= 0.7) {
      const g = extrairGasto(msg);
      if (g && g.valor > 0) {
        await sql`INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
                  VALUES (${userId}, ${g.descricao}, ${g.valor}, 'GASTO', ${g.categoria}, 'PAGO', ${hoje})`;
        await enviarMensagem(wa, 'Gasto registrado! ' + g.descricao + ': R$ ' + g.valor.toFixed(2) + ' [' + g.categoria + ']');
        return NextResponse.json({ ok: true });
      }
    }

    // FAST PATH 3: Resumo mensal
    if (intencao === 'resumo' && confianca >= 0.8) {
      const mes = new Date().toISOString().slice(0, 7) + '%';
      const { rows: gastoRows } = await sql`
        SELECT COALESCE(SUM(valor),0)::numeric AS total, COUNT(*)::int AS qtd
        FROM transacoes WHERE user_id = ${userId} AND tipo = 'GASTO' AND data LIKE ${mes}
      `;
      const { rows: receitaRows } = await sql`
        SELECT COALESCE(SUM(valor),0)::numeric AS total
        FROM transacoes WHERE user_id = ${userId} AND tipo = 'RECEITA' AND data LIKE ${mes}
      `;
      const totalGasto = Number(gastoRows[0]?.total ?? 0);
      const totalReceita = Number(receitaRows[0]?.total ?? 0);
      const saldo = totalReceita - totalGasto;
      const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });
      const msgResumo = 'Resumo de ' + nome + ' - ' + mesNome + '\n\n' +
        'Gastos: R$ ' + totalGasto.toFixed(2) + '\n' +
        'Receitas: R$ ' + totalReceita.toFixed(2) + '\n' +
        'Saldo: R$ ' + saldo.toFixed(2) + '\n' +
        'Transacoes: ' + (gastoRows[0]?.qtd ?? 0);
      await enviarMensagem(wa, msgResumo);
      return NextResponse.json({ ok: true });
    }

    // AI ASSESSOR
    const { resposta } = await processarMensagemIA(msg, {
      id: userId,
      nome,
      modo_bot: user.modo_bot || 'assistente',
      humor_bot: user.humor_bot || 'amigavel',
    });
    await enviarMensagem(wa, resposta);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
