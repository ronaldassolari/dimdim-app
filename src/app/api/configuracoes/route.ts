import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withAuth } from '@/lib/api-handler';

interface UserRow {
  id: number;
  username: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  plano: string;
  plano_expira: string | null;
  modo_bot: string;
  humor_bot: string;
  horario_lembrete: string;
  horario_relatorio: number;
  avatar_url: string | null;
  created_at: string;
}

export const GET = withAuth(async (_request, session) => {
  const { rows } = await sql`
    SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, horario_lembrete, horario_relatorio, avatar_url, created_at
    FROM users WHERE id = ${session.id}
  `;
  const user = rows[0] as UserRow | undefined;

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json(user);
});

export const PUT = withAuth(async (request, session) => {
  const body = await request.json();
  const { nome, email, whatsapp, modo_bot, humor_bot, horario_lembrete } = body;

  const modosValidos = ['normal', 'economia', 'investidor'];
  if (modo_bot && !modosValidos.includes(modo_bot)) {
    return NextResponse.json({ error: `modo_bot inválido. Use: ${modosValidos.join(', ')}` }, { status: 400 });
  }

  const humoresValidos = ['amigavel', 'direto', 'tecnico'];
  if (humor_bot && !humoresValidos.includes(humor_bot)) {
    return NextResponse.json({ error: `humor_bot inválido. Use: ${humoresValidos.join(', ')}` }, { status: 400 });
  }

  await sql`
    UPDATE users SET
      nome = COALESCE(${nome || null}, nome),
      email = COALESCE(${email || null}, email),
      whatsapp = COALESCE(${whatsapp || null}, whatsapp),
      modo_bot = COALESCE(${modo_bot || null}, modo_bot),
      humor_bot = COALESCE(${humor_bot || null}, humor_bot),
      horario_lembrete = COALESCE(${horario_lembrete || null}, horario_lembrete),
      updated_at = NOW()
    WHERE id = ${session.id}
  `;

  const { rows: updatedRows } = await sql`
    SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, horario_lembrete, horario_relatorio, avatar_url, created_at
    FROM users WHERE id = ${session.id}
  `;

  return NextResponse.json(updatedRows[0]);
});
