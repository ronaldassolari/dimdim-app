// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { processarMensagemIA } from '@/lib/ai';

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimdim2026';

export const maxDuration = 60;

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
      await enviarMensagem(wa, 'Ola! Seu numero nao esta cadastrado. Acesse o DimdimApp em dimdim-snowy.vercel.app para se registrar!');
      return NextResponse.json({ ok: true });
    }

    const user = userRows[0];

    // Todos os fluxos passam pelo assessor IA
    const { resposta } = await processarMensagemIA(msg, {
      id: user.id,
      nome: user.nome || 'voce',
      modo_bot: user.modo_bot || 'normal',
      humor_bot: user.humor_bot || 'amigavel',
    });

    await enviarMensagem(wa, resposta);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ ok: true });
  }
}
