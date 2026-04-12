import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { processarMensagemIA } from '@/lib/ai';

interface UserRow {
  id: number;
  modo_bot: string;
  humor_bot: string;
  nome: string;
}

export async function POST(request: NextRequest) {
  try {
    await seed();

    const contentType = request.headers.get('content-type') ?? '';
    let texto: string | null = null;
    let audioBase64: string | null = null;
    let audioMime = 'audio/webm';
    let whatsapp: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      texto = body.texto ?? null;
      audioBase64 = body.audio ?? null;
      audioMime = body.mime ?? 'audio/webm';
      whatsapp = body.whatsapp ?? null;
    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('audio') as File | null;
      whatsapp = form.get('whatsapp') as string | null;
      if (file) {
        const buf = await file.arrayBuffer();
        audioBase64 = Buffer.from(buf).toString('base64');
        audioMime = file.type || 'audio/webm';
      }
      texto = form.get('texto') as string | null;
    }

    if (!texto && !audioBase64) {
      return NextResponse.json({ error: 'Envie áudio ou texto transcrito' }, { status: 400 });
    }

    // Encontra o usuário
    let user: UserRow | null = null;
    if (whatsapp) {
      const { rows } = await sql`SELECT id, modo_bot, humor_bot, nome FROM users WHERE whatsapp = ${whatsapp}`;
      if (rows[0]) user = rows[0] as UserRow;
    }
    if (!user) {
      const session = getSession();
      if (session) {
        const { rows } = await sql`SELECT id, modo_bot, humor_bot, nome FROM users WHERE id = ${session.id}`;
        if (rows[0]) user = rows[0] as UserRow;
      }
    }
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    // Se chegou áudio em base64, transcreve com Whisper/Claude
    if (audioBase64 && !texto) {
      // Tenta transcrever com Whisper via fetch (OpenAI)
      if (process.env.OPENAI_API_KEY) {
        try {
          const audioBuffer = Buffer.from(audioBase64, 'base64');
          const formData = new FormData();
          formData.append('file', new Blob([audioBuffer], { type: audioMime }), 'audio.webm');
          formData.append('model', 'whisper-1');
          formData.append('language', 'pt');

          const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: formData,
            signal: AbortSignal.timeout(15000),
          });

          if (whisperRes.ok) {
            const data = await whisperRes.json();
            texto = data.text;
          }
        } catch { /* fallback abaixo */ }
      }

    }

    if (!texto) {
      return NextResponse.json({ error: 'Não foi possível transcrever o áudio' }, { status: 422 });
    }

    // Processa com o assessor IA
    const { resposta, acoes } = await processarMensagemIA(texto, user);

    return NextResponse.json({
      transcricao: texto,
      resposta,
      acoes,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Erro no bot de áudio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
