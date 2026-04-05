import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { extrairGasto, detectarIntencao, extrairCompromisso, extrairBoleto } from '@/lib/nlp';
import { searchPrices } from '@/lib/price-search';

const WA_TOKEN = process.env.WHATSAPP_TOKEN!;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'dimdim2026';

// ── Normaliza número BR: 554196444719 → 5541996444719 (adiciona 9 dígito) ──
function normalizeBRNumber(num: string): string {
  const digits = num.replace(/[^\d]/g, '');
  // Número BR com 12 dígitos (55 + DDD 2 + número 8): adiciona 9 antes do número
  if (digits.startsWith('55') && digits.length === 12) {
    return digits.slice(0, 4) + '9' + digits.slice(4);
  }
  return digits;
}

// ── ENVIAR mensagem via Meta API ─────────────────────────────────
async function sendWhatsApp(to: string, text: string) {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.error('❌ WHATSAPP_TOKEN ou WHATSAPP_PHONE_ID não configurados');
    return;
  }
  // Usa o número exato que a Meta entrega (sem normalizar)
  const toNormalized = to.replace(/[^\d]/g, '');
  const url = `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toNormalized,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Erro Meta API:', err);
  }
}

// ── PROCESSAR mensagem e gerar resposta ──────────────────────────
async function processarMensagem(telefone: string, texto: string): Promise<string> {
  // Normaliza telefone: remove +, espaços, dashes
  const wa = telefone.replace(/[^\d]/g, '');

  // Busca usuário pelo número WhatsApp (tenta com e sem 55)
  const { rows } = await sql`
    SELECT id, modo_bot, humor_bot, nome
    FROM users
    WHERE whatsapp = ${wa}
       OR whatsapp = ${'55' + wa}
       OR whatsapp = ${'+' + wa}
       OR whatsapp = ${'+55' + wa.slice(2)}
    LIMIT 1
  `;

  if (!rows[0]) {
    return `👋 Olá! Não encontrei sua conta no Dimdim.\n\nAcesse *dimdim-snowy.vercel.app*, cadastre seu WhatsApp em Configurações e volte aqui!\n\nSeu número: ${wa}`;
  }

  const user = rows[0] as { id: number; modo_bot: string; humor_bot: string; nome: string };
  const msg = texto.trim();
  const intencao = detectarIntencao(msg);
  const nome = user.nome.split(' ')[0];
  const saudacao = `Oi, ${nome}!`;

  // 1. Registrar gasto
  if (intencao === 'gasto') {
    const gasto = extrairGasto(msg);
    if (gasto) {
      const hoje = new Date().toISOString().slice(0, 10);
      const { rows: txRows } = await sql`
        INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
        VALUES (${user.id}, ${gasto.descricao}, ${gasto.valor}, 'GASTO', ${gasto.categoria}, 'PAGO', ${hoje})
        RETURNING id
      `;
      const id = (txRows[0] as any).id;
      return `✅ Registrado!\n💸 R$ ${gasto.valor.toFixed(2)} — ${gasto.descricao}\n🏷️ ${gasto.categoria}\n🆔 #${id}\n\nDigite *resumo* para ver seu saldo.`;
    }
    return `${saudacao} Não entendi o valor. Tente: *30 farmácia* ou *gastei 50 no ifood*`;
  }

  // 2. Registrar receita
  if (msg.toLowerCase().includes('recebi') || msg.toLowerCase().includes('salário') || msg.toLowerCase().includes('salario') || msg.toLowerCase().includes('entrada')) {
    const match = msg.match(/(\d+[,.]?\d*)/);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const descricao = msg.replace(/recebi|entrada|salário|salario|renda/gi, '').replace(match[1], '').trim() || 'Receita';
      const hoje = new Date().toISOString().slice(0, 10);
      await sql`
        INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
        VALUES (${user.id}, ${descricao}, ${valor}, 'RECEITA', 'Receitas', 'RECEBIDO', ${hoje})
      `;
      return `✅ Receita registrada!\n💰 R$ ${valor.toFixed(2)} — ${descricao}`;
    }
  }

  // 3. Resumo do mês
  if (intencao === 'resumo') {
    const mes = new Date().toISOString().slice(0, 7) + '%';
    const { rows: recR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`;
    const { rows: gasR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`;
    const { rows: gasR2 } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='A_PAGAR' AND data LIKE ${mes}`;
    const rec = Number((recR[0] as any).t);
    const gas = Number((gasR[0] as any).t);
    const pagar = Number((gasR2[0] as any).t);
    const saldo = rec - gas;
    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    return `📊 *Resumo de ${mesNome}*\n\n✅ Entradas: R$ ${rec.toFixed(2)}\n❌ Saídas: R$ ${gas.toFixed(2)}\n⏳ A pagar: R$ ${pagar.toFixed(2)}\n💰 Saldo: R$ ${saldo.toFixed(2)}\n\n🔗 dimdim-snowy.vercel.app`;
  }

  // 4. Busca de preços
  if (intencao === 'busca') {
    const produto = msg.replace(/(?:buscar?|procurar?|preco|preço|quanto custa|achar?|encontrar?)\s*/i, '').trim();
    if (produto.length > 1) {
      const search = await searchPrices(produto);
      const top = search.resultados.filter((r: any) => r.disponivel).slice(0, 3);
      if (top.length === 0) return `🔍 *${produto}*\n\nNenhum resultado encontrado agora. Tente em instantes.`;
      let texto = `🔍 *${produto}*\n\n`;
      top.forEach((r: any, i: number) => {
        const titulo = r.titulo.length > 45 ? r.titulo.substring(0, 42) + '...' : r.titulo;
        texto += `${i + 1}. ${titulo}\n   💰 R$ ${r.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} — ${r.loja}\n\n`;
      });
      if (search.menor_preco) texto += `🏆 Melhor: R$ ${search.menor_preco.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${search.menor_preco.loja})`;
      return texto;
    }
  }

  // 5. Pontos
  if (intencao === 'pontos') {
    const { rows: pontosRows } = await sql`
      SELECT pp.nome, ap.saldo
      FROM analise_pontos ap
      JOIN programas_pontos pp ON pp.id = ap.programa_id
      WHERE ap.user_id = ${user.id} AND ap.saldo > 0
      ORDER BY ap.saldo DESC LIMIT 5
    `;
    if (pontosRows.length === 0) return `💎 Sem pontos cadastrados ainda.\n\nAdicione seus cartões em dimdim-snowy.vercel.app/pontos`;
    let txt = `⭐ *Seus pontos:*\n\n`;
    pontosRows.forEach((p: any) => { txt += `• ${p.nome}: ${Number(p.saldo).toLocaleString('pt-BR')} pts\n`; });
    return txt;
  }

  // 6. Extrato (últimas transações)
  if (msg.toLowerCase().includes('extrato') || msg.toLowerCase().includes('últimos') || msg.toLowerCase().includes('ultimos')) {
    const { rows: txRows } = await sql`
      SELECT descricao, valor, tipo, data FROM transacoes
      WHERE user_id = ${user.id}
      ORDER BY data DESC, id DESC LIMIT 5
    `;
    if (txRows.length === 0) return `📋 Nenhuma transação ainda.\nRegistre seu primeiro gasto: *30 farmácia*`;
    let txt = `📋 *Últimas transações:*\n\n`;
    txRows.forEach((t: any) => {
      const sinal = t.tipo === 'RECEITA' ? '✅' : '❌';
      txt += `${sinal} R$ ${Number(t.valor).toFixed(2)} — ${t.descricao} (${t.data})\n`;
    });
    return txt;
  }

  // 7. Ajuda
  if (msg.toLowerCase().includes('ajuda') || msg.toLowerCase().includes('help') || msg === '?') {
    return `💰 *DimdimBot — Comandos:*\n\n📝 *Gastos:*\n30 farmácia\ngastei 50 ifood\npaguei 150 luz\n\n💰 *Receitas:*\nrecebi 3000 salário\n\n📊 *Consultas:*\nresumo\nextrato\npontos\n\n🔍 *Busca de preços:*\nbuscar iPhone 15\nquanto custa airfryer\n\n🌐 App: dimdim-snowy.vercel.app`;
  }

  // Resposta padrão
  return `${saudacao} 💬 Não entendi.\n\nTente:\n• *30 farmácia* (registrar gasto)\n• *resumo* (ver saldo)\n• *extrato* (últimas transações)\n• *ajuda* (ver todos os comandos)`;
}

// ── GET — verificação do webhook pela Meta ───────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook Meta verificado');
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ── POST — recebe mensagens da Meta ─────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await seed();
    const body = await request.json();

    // Meta envia status updates além de mensagens — ignorar silenciosamente
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' });
    }

    const changes = body.entry?.[0]?.changes?.[0]?.value;
    if (!changes?.messages?.[0]) {
      return NextResponse.json({ status: 'no_message' });
    }

    const message = changes.messages[0];
    const telefone: string = message.from; // e.g. "5541999999999"

    // Só processa mensagens de texto
    if (message.type !== 'text') {
      await sendWhatsApp(telefone, '👋 No momento só processo mensagens de texto!\n\nDigite *ajuda* para ver os comandos.');
      return NextResponse.json({ status: 'ok' });
    }

    const texto: string = message.text?.body || '';
    if (!texto.trim()) return NextResponse.json({ status: 'empty' });

    console.log(`📱 WA de ${telefone}: ${texto}`);

    const resposta = await processarMensagem(telefone, texto);
    await sendWhatsApp(telefone, resposta);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Webhook erro:', err);
    // Retorna 200 para Meta não reenviar
    return NextResponse.json({ status: 'error' });
  }
}
