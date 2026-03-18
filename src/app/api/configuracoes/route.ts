import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

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

export async function GET() {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, horario_lembrete, horario_relatorio, avatar_url, created_at FROM users WHERE id = ?'
    ).get(session.id) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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

    const db = getDb();

    db.prepare(`
      UPDATE users SET
        nome = COALESCE(?, nome),
        email = COALESCE(?, email),
        whatsapp = COALESCE(?, whatsapp),
        modo_bot = COALESCE(?, modo_bot),
        humor_bot = COALESCE(?, humor_bot),
        horario_lembrete = COALESCE(?, horario_lembrete),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      nome || null, email || null, whatsapp || null,
      modo_bot || null, humor_bot || null, horario_lembrete || null,
      session.id
    );

    const updated = db.prepare(
      'SELECT id, username, nome, email, whatsapp, plano, plano_expira, modo_bot, humor_bot, horario_lembrete, horario_relatorio, avatar_url, created_at FROM users WHERE id = ?'
    ).get(session.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
