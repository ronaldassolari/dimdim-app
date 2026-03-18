import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

function gerarPrecoAleatorio(base: number): number {
  const variacao = base * 0.2;
  const preco = base - variacao + Math.random() * variacao * 2;
  return Math.round(preco * 100) / 100;
}

function gerarResultadosBusca(produto: string) {
  const lojas = ['Magalu', 'Amazon', 'Kabum', 'Casas Bahia', 'Shopee', 'Americanas', 'Submarino', 'Fast Shop'];

  // Base price estimation from product name keywords
  let basePrice = 500;
  const produtoLower = produto.toLowerCase();
  if (produtoLower.includes('iphone') || produtoLower.includes('macbook')) basePrice = 7000;
  else if (produtoLower.includes('notebook') || produtoLower.includes('laptop')) basePrice = 4500;
  else if (produtoLower.includes('tv') || produtoLower.includes('televisão')) basePrice = 2500;
  else if (produtoLower.includes('airpods') || produtoLower.includes('fone')) basePrice = 1200;
  else if (produtoLower.includes('cadeira')) basePrice = 1300;
  else if (produtoLower.includes('monitor')) basePrice = 1800;
  else if (produtoLower.includes('teclado') || produtoLower.includes('mouse')) basePrice = 350;
  else if (produtoLower.includes('playstation') || produtoLower.includes('xbox')) basePrice = 4000;
  else if (produtoLower.includes('galaxy') || produtoLower.includes('samsung')) basePrice = 3500;
  else if (produtoLower.includes('tablet') || produtoLower.includes('ipad')) basePrice = 3000;

  const resultados = lojas.map((loja) => ({
    loja,
    preco: gerarPrecoAleatorio(basePrice),
    link: `https://www.${loja.toLowerCase().replace(/\s/g, '')}.com.br/busca/${encodeURIComponent(produto)}`,
    disponivel: Math.random() > 0.1,
  }));

  resultados.sort((a, b) => a.preco - b.preco);
  return resultados;
}

export async function GET() {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const db = getDb();
    const buscas = db.prepare('SELECT * FROM buscas_preco WHERE user_id = ? ORDER BY created_at DESC').all(session.id);

    return NextResponse.json(buscas);
  } catch (error) {
    console.error('Erro ao listar buscas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { produto } = body;

    if (!produto) {
      return NextResponse.json({ error: 'Campo obrigatório: produto' }, { status: 400 });
    }

    const resultados = gerarResultadosBusca(produto);
    const menorPreco = Math.min(...resultados.filter(r => r.disponivel).map(r => r.preco));
    const lojaMenor = resultados.find(r => r.preco === menorPreco)?.loja || '';

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO buscas_preco (user_id, produto, resultados, menor_preco, loja_menor, monitorar)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(session.id, produto, JSON.stringify(resultados), menorPreco, lojaMenor);

    const busca = db.prepare('SELECT * FROM buscas_preco WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json(busca, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar busca:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
