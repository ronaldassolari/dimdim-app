import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

function gerarCodigoConvite(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DIMDIM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { rows: membros } = await sql`SELECT * FROM contas_familia WHERE dono_id = ${session.id} ORDER BY created_at DESC`;

    return NextResponse.json(membros);
  } catch (error) {
    console.error('Erro ao listar família:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { nome_membro, email_membro, permissao } = body;

    if (!nome_membro || !email_membro) {
      return NextResponse.json({ error: 'Campos obrigatórios: nome_membro, email_membro' }, { status: 400 });
    }

    const permissoesValidas = ['admin', 'ver_tudo', 'proprio'];
    if (permissao && !permissoesValidas.includes(permissao)) {
      return NextResponse.json({ error: `Permissão inválida. Use: ${permissoesValidas.join(', ')}` }, { status: 400 });
    }

    const codigo_convite = gerarCodigoConvite();

    const { rows } = await sql`
      INSERT INTO contas_familia (dono_id, nome_membro, email_membro, codigo_convite, permissao, status)
      VALUES (${session.id}, ${nome_membro}, ${email_membro}, ${codigo_convite}, ${permissao || 'proprio'}, 'PENDENTE')
      RETURNING *
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao convidar membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
