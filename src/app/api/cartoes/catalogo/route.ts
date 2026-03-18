import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { seedCartoesCatalogo } from '@/lib/seed-cartoes';

export async function GET(request: NextRequest) {
  try {
    seedCartoesCatalogo();
    const db = getDb();

    const banco = request.nextUrl.searchParams.get('banco');
    const bandeira = request.nextUrl.searchParams.get('bandeira');
    const nivel = request.nextUrl.searchParams.get('nivel');
    const programa = request.nextUrl.searchParams.get('programa');
    const sem_anuidade = request.nextUrl.searchParams.get('sem_anuidade');
    const sala_vip = request.nextUrl.searchParams.get('sala_vip');
    const search = request.nextUrl.searchParams.get('search')?.substring(0, 100);

    let query = 'SELECT * FROM cartoes_catalogo WHERE ativo = 1';
    const params: (string | number)[] = [];

    if (banco) { query += ' AND banco = ?'; params.push(banco); }
    if (bandeira) { query += ' AND bandeira = ?'; params.push(bandeira); }
    if (nivel) { query += ' AND nivel = ?'; params.push(nivel); }
    if (programa) { query += ' AND programas_compativeis LIKE ?'; params.push(`%${programa}%`); }
    if (sem_anuidade === '1' || sem_anuidade === 'true') { query += ' AND anuidade = 0'; }
    if (sala_vip === '1' || sala_vip === 'true') { query += ' AND sala_vip = 1'; }
    if (search) {
      query += ' AND (nome LIKE ? OR banco LIKE ? OR bandeira LIKE ? OR nivel LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY pontos_nacional DESC, banco ASC';

    const cartoes = db.prepare(query).all(...params);

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
