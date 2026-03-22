import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';
import { searchPrices } from '@/lib/price-search';
import { extrairGasto, detectarIntencao, extrairCompromisso, extrairBoleto } from '@/lib/nlp';

interface UserRow {
  id: number;
  modo_bot: string;
  humor_bot: string;
  nome: string;
}

function gerarResposta(mensagem: string, modo: string, humor: string, nome: string): string {
  const msgLower = mensagem.toLowerCase();
  const saudacao = humor === 'direto' ? `${nome},` :
    humor === 'tecnico' ? `Olá, ${nome}.` :
    `Oi, ${nome}!`;

  const respostasNormal: Record<string, string> = {
    gasto: `${saudacao} Sobre seus gastos: acompanhe de perto. A regra 50-30-20 é um bom começo: 50% necessidades, 30% desejos e 20% para investimentos.`,
    investir: `${saudacao} Para investir, monte primeiro sua reserva de emergência (3 a 6 meses de gastos). Depois explore Tesouro Direto e CDBs.`,
    cartao: `${saudacao} Use a calculadora de pontos do Dimdim para saber qual cartão usar em cada compra. Pague sempre o total da fatura!`,
    ponto: `${saudacao} Seus pontos são dinheiro parado! Verifique a seção de pontos para ver milhas e cashback.`,
    meta: `${saudacao} Metas financeiras são essenciais. Defina valores realistas e acompanhe semanalmente.`,
    economia: `${saudacao} Para economizar, revise assinaturas, compare preços e cozinhe mais em casa.`,
    salario: `${saudacao} Ao receber, separe primeiro investimentos e reserva. O que sobrar é para gastar.`,
  };

  const respostasEconomia: Record<string, string> = {
    gasto: `${saudacao} Vamos cortar gastos! Cozinhar em casa economiza 40%. Cancele assinaturas que não usa.`,
    investir: `${saudacao} Foque em eliminar dívidas e construir reserva de emergência. Tesouro Selic é o melhor começo.`,
    cartao: `${saudacao} Evite parcelamentos longos e nunca pague o mínimo da fatura. Juros do rotativo passam de 400%/ano.`,
    ponto: `${saudacao} Concentre gastos em poucos cartões. Nunca compre algo só para acumular pontos.`,
    meta: `${saudacao} Comece com 10% da renda e aumente. Use o método dos envelopes para separar por categoria.`,
    economia: `${saudacao} Top dicas: lista no supermercado, dia sem gastar por semana, regra das 48h para compras acima de R$100.`,
    salario: `${saudacao} 50% contas fixas, 20% reserva, 15% variáveis, 15% lazer. Mantenha a disciplina!`,
  };

  const respostasInvestidor: Record<string, string> = {
    gasto: `${saudacao} Cada real economizado rende. R$500/mês a 12%/ano vira R$115k em 10 anos. Pense no custo de oportunidade.`,
    investir: `${saudacao} Diversifique: 40% renda fixa, 30% FIIs, 20% ações/ETFs, 10% alternativos. Revise trimestralmente.`,
    cartao: `${saudacao} Maximize pontos! Concentre gastos no cartão com mais retorno. BTG Black e Amex Platinum são tops.`,
    ponto: `${saudacao} Melhor uso de pontos: passagens em executiva (valor até 5x o custo). Fique atento a bônus de transferência.`,
    meta: `${saudacao} Curto prazo: Tesouro Selic. Médio: CDBs e FIIs. Longo: ações e ETFs. Tempo é seu aliado.`,
    economia: `${saudacao} Reduza custos fixos (maior impacto), automatize investimentos e busque renda extra.`,
    salario: `${saudacao} Invista primeiro (mínimo 20%), pague essenciais, mantenha fundo de oportunidade, gaste o resto.`,
  };

  const respostas = modo === 'economia' ? respostasEconomia :
    modo === 'investidor' ? respostasInvestidor : respostasNormal;

  for (const [key, resp] of Object.entries(respostas)) {
    if (msgLower.includes(key)) return resp;
  }

  if (modo === 'economia') return `${saudacao} Estou aqui para ajudar a economizar! Pergunte sobre gastos, economia, cartões ou metas.`;
  if (modo === 'investidor') return `${saudacao} Vamos falar de investimentos! Pergunte sobre onde investir, pontos ou como otimizar seu salário.`;
  return `${saudacao} Sou o DimdimBot! Posso registrar gastos, buscar preços, mostrar resumo financeiro e dar dicas. O que precisa?`;
}

export async function POST(request: NextRequest) {
  try {
    await seed();

    const body = await request.json();
    const { mensagem, whatsapp, tipo } = body;

    if (!mensagem || typeof mensagem !== 'string') {
      return NextResponse.json({ error: 'Envie uma mensagem' }, { status: 400 });
    }
    if (mensagem.length > 1000) {
      return NextResponse.json({ error: 'Mensagem muito longa (máximo 1000 caracteres)' }, { status: 400 });
    }

    // Find user: by session (web) or by whatsapp (bot)
    let user: UserRow | null = null;

    if (whatsapp) {
      const { rows } = await sql`SELECT id, modo_bot, humor_bot, nome FROM users WHERE whatsapp = ${whatsapp}`;
      if (rows[0]) user = rows[0] as UserRow;
    }

    if (!user) {
      const session = getSession();
      if (session) {
        const { rows } = await sql`SELECT id, modo_bot, humor_bot, nome FROM users WHERE id = ${session.id}`;
        if (rows[0]) user = rows[0] as UserRow;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const intencao = detectarIntencao(mensagem);

    // 1. Registrar gasto
    if (intencao === 'gasto') {
      const gasto = extrairGasto(mensagem);
      if (gasto) {
        const hoje = new Date().toISOString().slice(0, 10);
        const { rows: txRows } = await sql`
          INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data)
          VALUES (${user.id}, ${gasto.descricao}, ${gasto.valor}, 'GASTO', ${gasto.categoria}, 'PAGO', ${hoje})
          RETURNING *
        `;
        const tx = txRows[0] as any;
        return NextResponse.json({
          resposta: `✅ Registrado! R$ ${gasto.valor.toFixed(2)} em ${gasto.categoria} (${gasto.descricao}). ID: #${tx.id}`,
          intencao: 'gasto',
          transacao: tx,
        });
      }
    }

    // 2. Buscar preço
    if (intencao === 'busca') {
      const produto = mensagem.replace(/(?:buscar?|procurar?|preco|preço|quanto custa|achar?|encontrar?)\s*/i, '').trim();
      if (produto.length > 1) {
        const search = await searchPrices(produto);
        const top = search.resultados.filter(r => r.disponivel).slice(0, 5);

        if (top.length === 0) {
          return NextResponse.json({
            resposta: `🔍 *${produto}*\n\nNão encontrei preços agora. Tente novamente em instantes.`,
            intencao: 'busca',
            resultados: [],
          });
        }

        let texto = `🔍 *${produto}* — melhores preços:\n\n`;
        top.forEach((r, i) => {
          const num = i + 1;
          const titulo = r.titulo.length > 50 ? r.titulo.substring(0, 47) + '...' : r.titulo;
          texto += `${num}. ${titulo} - R$ ${r.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
          texto += `   🏪 ${r.loja} → ${r.url}\n\n`;
        });

        if (search.menor_preco) {
          texto += `💰 Menor: R$ ${search.menor_preco.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${search.menor_preco.loja})`;
        }
        texto += `\n📡 Fonte: ${search.fonte}`;

        return NextResponse.json({ resposta: texto, intencao: 'busca', resultados: top });
      }
    }

    // 3. Resumo
    if (intencao === 'resumo') {
      const mes = new Date().toISOString().slice(0, 7) + '%';
      const { rows: recR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes}`;
      const { rows: gasR } = await sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${user.id} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes}`;
      const rec = Number((recR[0] as any).t);
      const gas = Number((gasR[0] as any).t);
      const saldo = rec - gas;
      const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });

      return NextResponse.json({
        resposta: `📊 *Resumo de ${mesNome}*\n✅ Entradas: R$ ${rec.toFixed(2)}\n❌ Saídas: R$ ${gas.toFixed(2)}\n💰 Saldo: R$ ${saldo.toFixed(2)}`,
        intencao: 'resumo',
        dados: { receitas: rec, gastos: gas, saldo },
      });
    }

    // 4. Pontos
    if (intencao === 'pontos') {
      const { rows: pontosRows } = await sql`
        SELECT pp.nome, ap.saldo, ap.validade
        FROM analise_pontos ap
        JOIN programas_pontos pp ON pp.id = ap.programa_id
        WHERE ap.user_id = ${user.id} AND ap.saldo > 0
        ORDER BY ap.saldo DESC
      `;

      if (pontosRows.length === 0) {
        return NextResponse.json({
          resposta: '💎 Você ainda não tem pontos cadastrados. Acesse /pontos no dashboard para adicionar seus programas de fidelidade.',
          intencao: 'pontos',
        });
      }

      // Import dynamically to avoid circular deps
      const { melhorOpcao } = await import('@/lib/pontos-config');

      let texto = '💎 *Sua carteira de pontos:*\n\n';
      let totalValor = 0;
      const alertas: string[] = [];

      for (const row of pontosRows) {
        const r = row as any;
        const best = melhorOpcao(r.saldo, r.nome);
        totalValor += best.valor;
        texto += `• ${r.nome}: ${Number(r.saldo).toLocaleString('pt-BR')} pts → R$ ${best.valor.toFixed(2)}\n`;

        if (r.validade) {
          const dias = Math.ceil((new Date(r.validade).getTime() - Date.now()) / 86400000);
          if (dias < 90) alertas.push(`${r.nome} vence em ${dias} dias!`);
        }
      }

      texto += `\n💰 Total estimado: R$ ${totalValor.toFixed(2)}`;
      if (alertas.length > 0) {
        texto += '\n\n⚠️ ' + alertas.join('\n⚠️ ');
      }

      return NextResponse.json({ resposta: texto, intencao: 'pontos' });
    }

    // 5. Agenda/Compromissos
    if (intencao === 'agenda') {
      const comp = extrairCompromisso(mensagem);
      if (comp) {
        const { rows: saved } = await sql`
          INSERT INTO compromissos (user_id, titulo, data, hora, lembrete_minutos, lembrete_canal)
          VALUES (${user.id}, ${comp.titulo}, ${comp.data}, ${comp.hora}, 15, 'whatsapp')
          RETURNING *
        `;
        const ev = saved[0] as any;
        const dataFmt = new Date(comp.data + 'T12:00:00').toLocaleDateString('pt-BR');
        let resp = `📅 Compromisso salvo!\n\n*${comp.titulo}*\n📆 ${dataFmt}`;
        if (comp.hora) resp += ` às ${comp.hora}`;
        resp += `\n⏰ Lembrete: 15 min antes (WhatsApp)`;
        resp += `\n\nQuer alterar o horário do lembrete? (5min, 30min, 1h)`;
        return NextResponse.json({ resposta: resp, intencao: 'agenda', compromisso: ev });
      }
      // Listar compromissos
      const { rows: comps } = await sql`
        SELECT * FROM compromissos WHERE user_id = ${user.id} AND data >= CURRENT_DATE ORDER BY data, hora LIMIT 5
      `;
      if (comps.length > 0) {
        let texto = '📅 *Seus próximos compromissos:*\n\n';
        for (const c of comps) {
          const r = c as any;
          const d = new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR');
          texto += `• ${r.titulo} — ${d}${r.hora ? ' às ' + r.hora : ''}\n`;
        }
        return NextResponse.json({ resposta: texto, intencao: 'agenda' });
      }
      return NextResponse.json({ resposta: '📅 Nenhum compromisso agendado. Diga algo como: "Reunião amanhã às 9h"', intencao: 'agenda' });
    }

    // 6. Boletos
    if (intencao === 'boleto') {
      const bol = extrairBoleto(mensagem);
      if (bol && bol.tipo) {
        if (bol.valor && bol.vencimento) {
          const { rows: saved } = await sql`
            INSERT INTO boletos (user_id, tipo, valor, vencimento, lembrete_dias)
            VALUES (${user.id}, ${bol.tipo}, ${bol.valor}, ${bol.vencimento}, 1)
            RETURNING *
          `;
          const b = saved[0] as any;
          const vencFmt = new Date(bol.vencimento + 'T12:00:00').toLocaleDateString('pt-BR');
          return NextResponse.json({
            resposta: `💰 Boleto salvo!\n\n*${bol.tipo}*\n💵 R$ ${bol.valor.toFixed(2)}\n📆 Vence: ${vencFmt}\n⏰ Lembrete: 1 dia antes\n\nVou te avisar antes do vencimento!`,
            intencao: 'boleto', boleto: b,
          });
        }
        // Falta info — perguntar
        let pergunta = `💰 Entendi que é sobre *${bol.tipo}*.`;
        if (!bol.valor) pergunta += '\nQual o valor?';
        if (!bol.vencimento) pergunta += '\nQuando vence?';
        return NextResponse.json({ resposta: pergunta, intencao: 'boleto' });
      }
      // Listar boletos pendentes
      const { rows: bols } = await sql`
        SELECT * FROM boletos WHERE user_id = ${user.id} AND pago = 0 AND vencimento >= CURRENT_DATE ORDER BY vencimento LIMIT 5
      `;
      if (bols.length > 0) {
        let texto = '💰 *Boletos pendentes:*\n\n';
        for (const b of bols) {
          const r = b as any;
          const d = new Date(r.vencimento + 'T12:00:00').toLocaleDateString('pt-BR');
          const diasRestantes = Math.ceil((new Date(r.vencimento).getTime() - Date.now()) / 86400000);
          const urgente = diasRestantes <= 3 ? ' ⚠️ URGENTE' : '';
          texto += `• ${r.tipo}: R$ ${Number(r.valor).toFixed(2)} — vence ${d}${urgente}\n`;
        }
        return NextResponse.json({ resposta: texto, intencao: 'boleto' });
      }
      return NextResponse.json({ resposta: '💰 Nenhum boleto pendente! Para adicionar: "Conta de luz R$150 vence dia 15"', intencao: 'boleto' });
    }

    // 7. Resposta geral
    const resposta = gerarResposta(mensagem, user.modo_bot, user.humor_bot, user.nome);
    return NextResponse.json({ resposta, intencao: 'geral' });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Erro no bot:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
