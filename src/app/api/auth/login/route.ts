import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import bcryptjs from 'bcryptjs';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await seed();

    const { username, password } = await req.json();

    if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
    }
    if (username.length > 100 || password.length > 200) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
    }

    const { rows } = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = rows[0] as any;
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const valid = bcryptjs.compareSync(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      nome: user.nome,
      plano: user.plano,
      modo_bot: user.modo_bot,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, nome: user.nome, plano: user.plano, modo_bot: user.modo_bot }
    });

    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('dimdim_session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
