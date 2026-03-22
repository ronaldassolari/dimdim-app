import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await seed();
    const { nome, whatsapp, email, senha } = await req.json();

    if (!nome || !senha || senha.length < 6) {
      return NextResponse.json({ error: 'Nome e senha (mín. 6 chars) obrigatórios' }, { status: 400 });
    }

    // Generate username from nome
    const username = nome.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20) || 'user' + Date.now();

    // Check if username or email exists
    const { rows: existing } = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      // User exists — try login
      const { rows: loginRows } = await sql`SELECT * FROM users WHERE username = ${username}`;
      const user = loginRows[0] as any;
      if (user && bcryptjs.compareSync(senha, user.password)) {
        const token = createToken({ id: user.id, username: user.username, nome: user.nome, plano: user.plano, modo_bot: user.modo_bot });
        const response = NextResponse.json({ success: true, user: { id: user.id, nome: user.nome, plano: user.plano } });
        response.cookies.set('dimdim_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
        return response;
      }
      return NextResponse.json({ error: 'Usuário já existe. Tente fazer login.' }, { status: 409 });
    }

    const hashedPassword = bcryptjs.hashSync(senha, 10);
    const { rows: newUser } = await sql`
      INSERT INTO users (username, password, nome, email, whatsapp, plano, plano_expira, modo_bot, horario_lembrete, horario_relatorio)
      VALUES (${username}, ${hashedPassword}, ${nome}, ${email || null}, ${whatsapp || null}, 'PRO', ${new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}, 'normal', '08:00', 1)
      RETURNING *
    `;

    const user = newUser[0] as any;
    const token = createToken({ id: user.id, username: user.username, nome: user.nome, plano: user.plano, modo_bot: user.modo_bot });
    const response = NextResponse.json({ success: true, user: { id: user.id, nome: user.nome, username: user.username, plano: user.plano }, message: `Conta criada! Seu login: ${username}` });
    response.cookies.set('dimdim_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/' });
    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
