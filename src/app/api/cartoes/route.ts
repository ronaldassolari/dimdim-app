import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { seedCartoesCatalogo } from '@/lib/seed-cartoes';

function calcularPontosPorReal(banco: string, nivel: string, apelido: string): number {
  // Specific card overrides
  const apelidoLower = apelido.toLowerCase();
  const bancoLower = banco.toLowerCase();

  if (bancoLower.includes('nubank') && nivel.toLowerCase() === 'ultravioleta') return 1; // cashback
  if (bancoLower.includes('c6') && apelidoLower.includes('carbon')) return 2.5;
  if (bancoLower.includes('btg') && nivel.toLowerCase() === 'black') return 4;
  if (bancoLower.includes('xp') && nivel.toLowerCase().includes('infinite')) return 3.5;
  if (bancoLower.includes('itaú') && apelidoLower.includes('personnalité') && nivel.toLowerCase() === 'black') return 3.5;
  if (bancoLower.includes('bradesco') && apelidoLower.includes('prime') && nivel.toLowerCase().includes('infinite')) return 3;
  if (bancoLower.includes('santander') && nivel.toLowerCase().includes('infinite')) return 3;
  if (bancoLower.includes('amex') || bancoLower.includes('american express')) {
    if (nivel.toLowerCase() === 'platinum') return 5;
  }

  // Generic level-based calculation
  const nivelLower = nivel.toLowerCase();
  if (nivelLower === 'standard' || nivelLower === 'classic') return 1;
  if (nivelLower === 'gold') return 1.5;
  if (nivelLower === 'platinum') return 2;
  if (['black', 'infinite', 'signature', 'centurion', 'nanquim'].includes(nivelLower)) return 2.5;

  return 1;
}

export async function GET() {
  try {
    seed();
    seedCartoesCatalogo();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const cartoes = db.prepare('SELECT * FROM cartoes WHERE user_id = ? AND ativo = 1').all(session.id);

    return NextResponse.json(cartoes);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seed();
    seedCartoesCatalogo();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { apelido, banco, bandeira, nivel, limite, vencimento, cor, programas_pontos } = body;

    if (!apelido || !banco || !bandeira || !nivel) {
      return NextResponse.json({ error: 'Campos obrigatórios: apelido, banco, bandeira, nivel' }, { status: 400 });
    }

    const pontos_por_real = calcularPontosPorReal(banco, nivel, apelido);

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO cartoes (user_id, apelido, banco, bandeira, nivel, limite, vencimento, cor, pontos_por_real, programas_pontos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id, apelido, banco, bandeira, nivel,
      limite || 0, vencimento || 10, cor || '#1a1a2e',
      pontos_por_real, JSON.stringify(programas_pontos || [])
    );

    const cartao = db.prepare('SELECT * FROM cartoes WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json(cartao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
