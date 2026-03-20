import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

// DELETE /api/conta — Delete user account and all data (LGPD Art. 18)
export async function DELETE() {
  try {
    await seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = session.id;

    // Delete all user data in order (foreign key dependencies)
    await sql`DELETE FROM progresso_aulas WHERE user_id = ${userId}`;
    await sql`DELETE FROM alertas WHERE user_id = ${userId}`;
    await sql`DELETE FROM analise_pontos WHERE user_id = ${userId}`;
    await sql`DELETE FROM contas_familia WHERE dono_id = ${userId} OR membro_id = ${userId}`;
    await sql`DELETE FROM buscas_preco WHERE user_id = ${userId}`;
    await sql`DELETE FROM assinaturas WHERE user_id = ${userId}`;
    await sql`DELETE FROM metas WHERE user_id = ${userId}`;
    await sql`DELETE FROM cartoes WHERE user_id = ${userId}`;
    await sql`DELETE FROM transacoes WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;

    return NextResponse.json({ message: 'Conta e todos os dados excluídos com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
  }
}
