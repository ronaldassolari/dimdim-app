import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

// GET /api/conta/export — Export all user data (LGPD Art. 18 - portabilidade)
export async function GET() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.id;

    const [
      { rows: userData },
      { rows: transacoes },
      { rows: cartoes },
      { rows: metas },
      { rows: pontos },
      { rows: buscas },
      { rows: familia },
      { rows: progresso },
    ] = await Promise.all([
      sql`SELECT id, username, nome, email, whatsapp, plano, created_at FROM users WHERE id = ${userId}`,
      sql`SELECT * FROM transacoes WHERE user_id = ${userId} ORDER BY data DESC`,
      sql`SELECT * FROM cartoes WHERE user_id = ${userId}`,
      sql`SELECT * FROM metas WHERE user_id = ${userId}`,
      sql`SELECT * FROM analise_pontos WHERE user_id = ${userId}`,
      sql`SELECT * FROM buscas_preco WHERE user_id = ${userId}`,
      sql`SELECT * FROM contas_familia WHERE dono_id = ${userId}`,
      sql`SELECT pa.*, a.titulo as aula_titulo FROM progresso_aulas pa JOIN aulas a ON pa.aula_id = a.id WHERE pa.user_id = ${userId}`,
    ]);

    return NextResponse.json({
      exportado_em: new Date().toISOString(),
      usuario: userData[0] || null,
      transacoes,
      cartoes,
      metas,
      pontos,
      buscas,
      familia,
      progresso_aulas: progresso,
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({ error: 'Erro ao exportar dados' }, { status: 500 });
  }
}
