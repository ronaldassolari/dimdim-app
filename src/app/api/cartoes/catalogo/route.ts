import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seedCartoesCatalogo } from '@/lib/seed-cartoes';

export async function GET(request: NextRequest) {
  try {
    await seedCartoesCatalogo();

    const banco = request.nextUrl.searchParams.get('banco') || null;
    const bandeira = request.nextUrl.searchParams.get('bandeira') || null;
    const nivel = request.nextUrl.searchParams.get('nivel') || null;
    const programa = request.nextUrl.searchParams.get('programa') || null;
    const sem_anuidade = request.nextUrl.searchParams.get('sem_anuidade');
    const sala_vip = request.nextUrl.searchParams.get('sala_vip');
    const search = request.nextUrl.searchParams.get('search')?.substring(0, 100) || null;

    const semAnuidade = sem_anuidade === '1' || sem_anuidade === 'true';
    const salaVip = sala_vip === '1' || sala_vip === 'true';

    const { rows } = await sql`
      SELECT * FROM cartoes_catalogo
      WHERE ativo = 1
      ORDER BY pontos_nacional DESC, banco ASC
    `;

    let cartoes = rows as Record<string, any>[];
    if (banco) cartoes = cartoes.filter(c => c.banco === banco);
    if (bandeira) cartoes = cartoes.filter(c => c.bandeira === bandeira);
    if (nivel) cartoes = cartoes.filter(c => c.nivel === nivel);
    if (programa) cartoes = cartoes.filter(c => ((c.programas_compativeis as string) || '').includes(programa));
    if (semAnuidade) cartoes = cartoes.filter(c => Number(c.anuidade) === 0);
    if (salaVip) cartoes = cartoes.filter(c => Number(c.sala_vip) === 1);
    if (search) {
      const s = search.toLowerCase();
      cartoes = cartoes.filter(c =>
        ((c.nome as string) || '').toLowerCase().includes(s) ||
        ((c.banco as string) || '').toLowerCase().includes(s) ||
        ((c.bandeira as string) || '').toLowerCase().includes(s) ||
        ((c.nivel as string) || '').toLowerCase().includes(s)
      );
    }

    // Parse JSON fields
    const parsed = cartoes.map((c: any) => ({
      ...c,
      programas_compativeis: (() => { try { return JSON.parse(c.programas_compativeis); } catch { return []; } })(),
      sala_vip: !!c.sala_vip,
    }));

    return NextResponse.json({ cartoes: parsed, total: parsed.length });
  } catch (error) {
    console.error('Erro ao listar catálogo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
