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

    const body = await request.json();
    const { mensagem, whatsapp } = body;

    if (!mensagem || typeof mensagem !== 'string') {
      return NextResponse.json({ error: 'Envie uma mensagem' }, { status: 400 });
    }
    if (mensagem.length > 2000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máximo 2000 caracteres)' }, { status: 400 });
    }

    // Encontra o usuário: por sessão web ou por whatsapp
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

    // Processa com IA
    const { resposta, acoes } = await processarMensagemIA(mensagem, user);

    return NextResponse.json({
      resposta,
      acoes,
      intencao: acoes.length > 0 ? (acoes[0] as any).ferramenta : 'geral',
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Erro no bot:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
