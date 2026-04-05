import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { seed } from '@/lib/seed';
import { extrairGasto, detectarIntencao, extrairCompromisso, extrairBoleto } from '@/lib/nlp';
import { searchPrices } from '@/lib/price-search';

const EVO_URL = process.env.EVOLUTION_API_URL!;       // ex: https://dimdim-evo.up.railway.app
const EVO_KEY = process.env.EVOLUTION_API_KEY!;       // apikey da Evolution
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE!; // nome da instância

// ── ENVIAR mensagem via Evolution API ───────────────────────────
async function sendEvolution(to: string, text: string) {
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) {
    console.error('❌ EVOLUTION_API_URL, EVOLUTION_API_KEY ou EVOLUTION_INSTANCE não configurados');
    return;
  }
  // Remove @s.whatsapp.net se vier no número
  const number = to.replace(/@s\.whatsapp\.net$/, '').replace(/[^\d]/g, '');
  const url = `${EVO_URL}/message/sendText/${EVO_INSTANCE}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': EVO_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ number, text }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Erro Evolution API:', err);
  }
}

// ── PROCESSAR mensagem e gerar resposta ──────────────────────────
async function processarMensagem(telefone: string, texto: string): Promise<string> {
  const wa = telefone.replace(/[^\d]/g, '');

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

  // 2. Receita
  if (msg.toLowerCase().match(/recebi|salário|salario|entrada\s+\d/)) {
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

  // 3. Resumo
  if (intencao === 'resumo') {
    const mes = new Date().toISOString().slice(0, 7) + '%';
    const { rows: recR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`;
    const { rows: gasR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`;
    const { rows: gasR2 } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='A_PAGAR' AND data LIKE ${mes}`;
    const rec = Number((recR[0] as any).t);
    const gas = Number((gasR[0] as any).t);
    const pagar = Number((gasR2[0] as any).t);
    const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    return `📊 *Resumo de ${mesNome}*\n\n✅ Entradas: R$ ${rec.toFixed(2)}\n❌ Saídas: R$ ${gas.toFixed(2)}\n⏳ A pagar: R$ ${pagar.toFixed(2)}\n💰 Saldo: R$ ${(rec - gas).toFixed(2)}\n\n🔗 dimdim-snowy.vercel.app`;
  }

  // 4. Busca de preços
  if (intencao === 'busca') {
    const produto = msg.replace(/(?:buscar?|procurar?|preco|preço|quanto custa|achar?|encontrar?)\s*/i, '').trim();
    if (produto.length > 1) {
      const search = await searchPrices(produto);
      const top = search.resultados.filter((r: any) => r.disponivel).slice(0, 3);
      if (top.length === 0) return `🔍 *${produto}*\n\nNenhum resultado encontrado agora.`;
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
    if (pontosRows.length === 0) return `💎 Sem pontos cadastrados ainda.\n\nAdicione em dimdim-snowy.vercel.app/pontos`;
    let txt = `⭐ *Seus pontos:*\n\n`;
    pontosRows.forEach((p: any) => { txt += `• ${p.nome}: ${Number(p.saldo).toLocaleString('pt-BR')} pts\n`; });
    return txt;
  }

  // 6. Extrato
  if (msg.toLowerCase().match(/extrato|últimos|ultimos/)) {
    const { rows: txRows } = await sql`
      SELECT descricao, valor, tipo, data FROM transacoes
      WHERE user_id = ${user.id}
      ORDER BY data DESC, id DESC LIMIT 5
    `;
    if (txRows.length === 0) return `📋 Nenhuma transação ainda.\nRegistre: *30 farmácia*`;
    let txt = `📋 *Últimas transações:*\n\n`;
    txRows.forEach((t: any) => {
      txt += `${t.tipo === 'RECEITA' ? '✅' : '❌'} R$ ${Number(t.valor).toFixed(2)} — ${t.descricao} (${t.data})\n`;
    });
    return txt;
  }

  // 7. Ajuda
  if (msg.toLowerCase().match(/ajuda|help|\?/)) {
    return `💰 *DimdimBot — Comandos:*\n\n📝 *Gastos:*\n30 farmácia\ngastei 50 ifood\npaguei 150 luz\n\n💰 *Receitas:*\nrecebi 3000 salário\n\n📊 *Consultas:*\nresumo\nextrato\npontos\n\n🔍 *Busca de preços:*\nbuscar iPhone 15\n\n🌐 dimdim-snowy.vercel.app`;
  }

  return `${saudacao} 💬 Não entendi.\n\nTente:\n• *30 farmácia* (registrar gasto)\n• *resumo* (ver saldo)\n• *extrato* (últimas transações)\n• *ajuda* (ver todos os comandos)`;
}

// ── POST — recebe mensagens da Evolution API ─────────────────────
export async function POST(request: NextRequest) {
  try {
    // Validar apikey se configurada
    if (EVO_KEY) {
      const apikey = request.headers.get('apikey');
      if (apikey && apikey !== EVO_KEY) {
        return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
      }
    }

    await seed();
    const body = await request.json();

    // Evolution API envia vários eventos — só processar messages.upsert
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ status: 'ignored' });
    }

    const data = body.data;
    // Ignorar mensagens enviadas pelo próprio bot
    if (data?.key?.fromMe) {
      return NextResponse.json({ status: 'ignored' });
    }

    const telefone: string = data?.key?.remoteJid || '';
    if (!telefone) return NextResponse.json({ status: 'no_phone' });

    // Extrai texto (mensagem comum ou extended text)
    const texto: string =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      '';

    if (!texto.trim()) {
      await sendEvolution(telefone, '👋 No momento só processo mensagens de texto!\n\nDigite *ajuda* para ver os comandos.');
      return NextResponse.json({ status: 'ok' });
    }

    console.log(`📱 Evolution de ${telefone}: ${texto}`);

    const resposta = await processarMensagem(telefone, texto);
    await sendEvolution(telefone, resposta);

    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    console.error('❌ Evolution webhook erro:', err);
    return NextResponse.json({ status: 'error' });
  }
}
