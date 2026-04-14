// @ts-nocheck
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { processarMensagemIA } from '@/lib/ai';

const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimdim2026';
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export const maxDuration = 60;

function normalizeBRNumber(num) {
  const digits = num.replace(/[^0-9]/g, '');
  if (digits.startsWith('55') && digits.length === 12) {
    return digits.slice(0, 4) + '9' + digits.slice(4);
  }
  return digits;
}

async function enviarMensagem(to, body) {
  try {
    await fetch('https://graph.facebook.com/v21.0/' + WA_PHONE_ID + '/messages', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + WA_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
  } catch (err) { console.error('Erro ao enviar mensagem:', err); }
}

async function transcreverAudio(mediaId) {
  const mediaRes = await fetch('https://graph.facebook.com/v21.0/' + mediaId, {
    headers: { Authorization: 'Bearer ' + WA_TOKEN },
  });
  const mediaData = await mediaRes.json();
  if (!mediaData.url) throw new Error('URL de midia nao retornada');

  const audioRes = await fetch(mediaData.url, {
    headers: { Authorization: 'Bearer ' + WA_TOKEN },
  });
  const audioBuffer = await audioRes.arrayBuffer();

  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  });
  const uploadData = await uploadRes.json();
  if (!uploadData.upload_url) throw new Error('AssemblyAI upload falhou');

  const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      Authorization: ASSEMBLYAI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadData.upload_url,
      language_code: 'pt',
      speech_model: 'nano',
    }),
  });
  const transcriptData = await transcriptRes.json();
  if (!transcriptData.id) throw new Error('AssemblyAI falhou ao iniciar');

  const transcriptId = transcriptData.id;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const pollRes = await fetch('https://api.assemblyai.com/v2/transcript/' + transcriptId, {
      headers: { Authorization: ASSEMBLYAI_API_KEY },
    });
    const pollData = await pollRes.json();
    if (pollData.status === 'completed') return pollData.text.trim();
    if (pollData.status === 'error') throw new Error('AssemblyAI erro: ' + pollData.error);
  }
  throw new Error('AssemblyAI timeout');
}

export async function GET(req) {
  const params = req.nextUrl.searchParams;
  if (params.get('hub.verify_token') === VERIFY_TOKEN) return new NextResponse(params.get('hub.challenge'));
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return NextResponse.json({ ok: true });

    const tipo = message.type;
    if (tipo !== 'text' && tipo !== 'audio') return NextResponse.json({ ok: true });

    const wa = normalizeBRNumber(message.from);
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
      await enviarMensagem(wa, 'Ola! Seu numero nao esta cadastrado. Acesse dimdim-snowy.vercel.app para se registrar!');
      return NextResponse.json({ ok: true });
    }

    const user = userRows[0];
    let msg;

    if (tipo === 'text') {
      msg = message.text.body.trim();
    } else {
      if (!ASSEMBLYAI_API_KEY) {
        await enviarMensagem(wa, 'Reconhecimento de voz nao configurado.');
        return NextResponse.json({ ok: true });
      }
      try {
        msg = await transcreverAudio(message.audio.id);
        console.log('[Audio transcrito]', msg);
      } catch (err) {
        console.error('Erro ao transcrever audio:', err);
        await enviarMensagem(wa, 'Nao consegui entender o audio. Pode mandar em texto?');
        return NextResponse.json({ ok: true });
      }
    }

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
