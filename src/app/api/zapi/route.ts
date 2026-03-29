import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { extrairGasto, detectarIntencao } from '@/lib/nlp';
import { searchPrices } from '@/lib/price-search';

const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID!;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN!;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN!;

async function sendZapi(phone: string, message: string) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) return;
  await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': ZAPI_CLIENT_TOKEN },
    body: JSON.stringify({ phone, message }),
  });
}

async function processar(telefone: string, texto: string): Promise<string> {
  const wa = telefone.replace(/[^\d]/g, '');
  const { rows } = await sql`
    SELECT id, modo_bot, humor_bot, nome FROM users
    WHERE whatsapp = ${wa} OR whatsapp = ${'55' + wa} OR whatsapp = ${'+' + wa} OR whatsapp = ${'+55' + wa.slice(2)}
    LIMIT 1
  `;

  if (!rows[0]) {
    return `👋 Olá! Não encontrei sua conta no Dimdim.\n\nAcesse *dimdim-snowy.vercel.app*, faça login e cadastre seu WhatsApp em ⚙️ Configurações.\n\nSeu número: ${wa}`;
  }

  const user = rows[0] as { id: number; modo_bot: string; humor_bot: string; nome: string };
  const msg = texto.trim();
  const intencao = detectarIntencao(msg);
  const nome = user.nome.split(' ')[0];

  // Registrar gasto
  if (intencao === 'gasto') {
    const gasto = extrairGasto(msg);
    if (gasto) {
      const hoje = new Date().toISOString().slice(0, 10);
      const { rows: tx } = await sql`
        INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
        VALUES (${user.id}, ${gasto.descricao}, ${gasto.valor}, 'GASTO', ${gasto.categoria}, 'PAGO', ${hoje})
        RETURNING id
      `;
      return `✅ Registrado!\n💸 R$ ${gasto.valor.toFixed(2)} — ${gasto.descricao}\n🏷️ ${gasto.categoria}\n🆔 #${(tx[0] as any).id}\n\nDigite *resumo* para ver o saldo.`;
    }
    return `Não entendi o valor. Tente: *30 farmácia* ou *gastei 50 ifood*`;
  }

  // Receita
  if (msg.toLowerCase().match(/recebi|salário|salario|entrada\s+\d/)) {
    const match = msg.match(/(\d+[,.]?\d*)/);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const descricao = msg.replace(/recebi|entrada|salário|salario|renda/gi, '').replace(match[1], '').trim() || 'Receita';
      const hoje = new Date().toISOString().slice(0, 10);
      await sql`INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data) VALUES (${user.id}, ${descricao}, ${valor}, 'RECEITA', 'Receitas', 'RECEBIDO', ${hoje})`;
      return `✅ Receita registrada!\n💰 R$ ${valor.toFixed(2)} — ${descricao}`;
    }
  }

  // Resumo
  if (intencao === 'resumo') {
    const mes = new Date().toISOString().slice(0, 7) + '%';
    const { rows: r1 } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`;
    const { rows: r2 } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`;
    const { rows: r3 } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='A_PAGAR' AND data LIKE ${mes}`;
    const rec = Number((r1[0] as any).t), gas = Number((r2[0] as any).t), pagar = Number((r3[0] as any).t);
    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    return `📊 *Resumo de ${mesNome}*\n\n✅ Entradas: R$ ${rec.toFixed(2)}\n❌ Saídas: R$ ${gas.toFixed(2)}\n⏳ A pagar: R$ ${pagar.toFixed(2)}\n💰 Saldo: R$ ${(rec - gas).toFixed(2)}`;
  }

  // Busca
  if (intencao === 'busca') {
    const produto = msg.replace(/buscar?|procurar?|preco|preço|quanto custa/gi, '').trim();
    if (produto.length > 1) {
      const search = await searchPrices(produto);
      const top = search.resultados.filter((r: any) => r.disponivel).slice(0, 3);
      if (!top.length) return `🔍 Nenhum resultado para *${produto}*. Tente outro termo.`;
      let txt = `🔍 *${produto}*\n\n`;
      top.forEach((r: any, i: number) => {
        txt += `${i + 1}. ${r.titulo.slice(0, 45)}\n   💰 R$ ${r.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — ${r.loja}\n\n`;
      });
      return txt;
    }
  }

  // Extrato
  if (msg.toLowerCase().match(/extrato|últimos|ultimos/)) {
    const { rows: tx } = await sql`SELECT descricao, valor, tipo, data FROM transacoes WHERE user_id=${user.id} ORDER BY data DESC, id DESC LIMIT 5`;
    if (!tx.length) return `Nenhuma transação ainda.\nRegistre: *30 farmácia*`;
    let txt = `📋 *Últimas transações:*\n\n`;
    tx.forEach((t: any) => { txt += `${t.tipo === 'RECEITA' ? '✅' : '❌'} R$ ${Number(t.valor).toFixed(2)} — ${t.descricao} (${t.data})\n`; });
    return txt;
  }

  // Ajuda
  if (msg.toLowerCase().match(/ajuda|help|\?/)) {
    return `💰 *DimdimBot*\n\n📝 *Gastos:*\n• 30 farmácia\n• gastei 50 ifood\n• paguei 150 luz\n\n💰 *Receitas:*\n• recebi 3000 salário\n\n📊 *Consultas:*\n• resumo\n• extrato\n\n🔍 *Preços:*\n• buscar iPhone 15\n• quanto custa airfryer`;
  }

  return `Oi, ${nome}! 💬 Não entendi.\n\nTente: *30 farmácia*, *resumo*, *extrato* ou *ajuda*`;
}

export async function POST(request: NextRequest) {
  try {
    // Valida client token se configurado
    if (ZAPI_CLIENT_TOKEN) {
      const ct = request.headers.get('client-token');
      if (ct && ct !== ZAPI_CLIENT_TOKEN) return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
    }

    await seed();
    const body = await request.json();

    // Z-API só manda mensagens recebidas quando type = "ReceivedCallback"
    // Ignora mensagens enviadas pelo próprio bot (fromMe = true)
    if (body.fromMe || body.type !== 'ReceivedCallback') {
      return NextResponse.json({ status: 'ignored' });
    }

    const telefone: string = body.phone || '';
    const texto: string = body.text?.message || body.body || '';

    if (!telefone || !texto.trim()) return NextResponse.json({ status: 'empty' });

    console.log(`📱 Z-API de ${telefone}: ${texto}`);
    const resposta = await processar(telefone, texto);
    await sendZapi(telefone, resposta);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('Z-API erro:', err);
    return NextResponse.json({ status: 'error' });
  }
}
