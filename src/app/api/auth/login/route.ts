import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import getDb from '@/lib/db';
import { seed } from '@/lib/seed';
import { createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    seed();

    const { username, password } = await req.json();

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
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

    response.cookies.set('dimdim_session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
