import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

interface UserRow {
  modo_bot: string;
  humor_bot: string;
  nome: string;
}

function gerarResposta(mensagem: string, modo: string, humor: string, nome: string): string {
  const msgLower = mensagem.toLowerCase();
  const saudacao = humor === 'formal' ? `Olá, ${nome}.` :
    humor === 'humorado' ? `E aí, ${nome}! 😄` :
    `Oi, ${nome}!`;

  // Normal mode responses
  const respostasNormal: Record<string, string> = {
    gasto: `${saudacao} Sobre seus gastos: é sempre bom acompanhar de perto. Tente categorizar tudo e definir limites por categoria. A regra 50-30-20 é um bom começo: 50% necessidades, 30% desejos e 20% para investimentos e poupança.`,
    investir: `${saudacao} Para começar a investir, monte primeiro sua reserva de emergência (3 a 6 meses de gastos). Depois, explore Tesouro Direto e CDBs para perfil conservador, ou fundos imobiliários e ações se quiser diversificar.`,
    cartao: `${saudacao} Cartão de crédito pode ser seu aliado! Use a calculadora de pontos do Dimdim para saber qual cartão usar em cada compra. Pague sempre o total da fatura e aproveite os pontos.`,
    ponto: `${saudacao} Seus pontos são dinheiro parado! Verifique a seção de pontos para ver suas milhas e cashback. Fique de olho nas promoções de transferência com bônus.`,
    meta: `${saudacao} Metas financeiras são essenciais. Defina valores realistas, prazos e acompanhe o progresso semanalmente. Automatizar transferências para poupança ajuda muito!`,
    economia: `${saudacao} Para economizar, comece revisando assinaturas que não usa, compare preços antes de comprar e cozinhe mais em casa. Pequenas mudanças fazem grande diferença no fim do mês.`,
    salario: `${saudacao} Assim que receber o salário, separe primeiro os investimentos e a reserva. O que sobrar é para gastar. Isso se chama "pague-se primeiro" e é a base de uma vida financeira saudável.`,
  };

  // Economia mode responses
  const respostasEconomia: Record<string, string> = {
    gasto: `${saudacao} Vamos cortar gastos! Revise cada categoria: alimentação (cozinhar em casa economiza 40%), transporte (considere carona ou transporte público), assinaturas (cancele o que não usa). Cada real conta!`,
    investir: `${saudacao} Antes de investir agressivamente, foque em eliminar dívidas com juros altos e construir sua reserva de emergência. Tesouro Selic é o melhor começo - seguro e rende mais que poupança.`,
    cartao: `${saudacao} Use o cartão com consciência! Evite parcelamentos longos, aproveite cashback e nunca pague o mínimo da fatura. Os juros do rotativo são os maiores do mercado (400%+ ao ano).`,
    ponto: `${saudacao} Concentre gastos em poucos cartões para acumular mais pontos. Nunca compre algo só para acumular pontos - isso é armadilha. Use pontos para economizar em viagens e compras necessárias.`,
    meta: `${saudacao} Defina uma meta de economia mensal. Comece com 10% da renda e aumente gradualmente. Use o método dos envelopes: separe o dinheiro por categoria no início do mês.`,
    economia: `${saudacao} Top dicas de economia: 1) Lista de compras no supermercado, 2) Dia sem gastar por semana, 3) Regra das 48h para compras acima de R$100, 4) Renegociar contratos anualmente.`,
    salario: `${saudacao} Com o salário, faça: 50% para contas fixas, 20% para reserva/investimento, 15% para gastos variáveis, 15% para lazer. Ajuste conforme sua realidade mas mantenha a disciplina!`,
  };

  // Investidor mode responses
  const respostasInvestidor: Record<string, string> = {
    gasto: `${saudacao} Cada real economizado é um real que pode render. Com juros compostos, R$500/mês investidos a 12% ao ano viram R$115.000 em 10 anos. Pense nos gastos como custo de oportunidade.`,
    investir: `${saudacao} Diversifique! Sugiro: 40% renda fixa (CDB/Tesouro), 30% fundos imobiliários, 20% ações/ETFs, 10% alternativos. Com a Selic atual, renda fixa está muito atrativa. Revise a carteira trimestralmente.`,
    cartao: `${saudacao} Maximize o retorno do cartão! Concentre gastos no cartão com mais pontos, converta para milhas com bônus e use para viagens. BTG Black e Amex Platinum têm as melhores pontuações.`,
    ponto: `${saudacao} Pontos e milhas são investimento! O melhor uso geralmente é passagens em classe executiva (valor de até 5x o custo em pontos). Fique atento a promoções de bônus de transferência - podem dobrar o valor.`,
    meta: `${saudacao} Monte metas por horizonte: curto prazo (1 ano) em Tesouro Selic, médio prazo (3-5 anos) em CDBs e FIIs, longo prazo (10+ anos) em ações e ETFs. O tempo é seu maior aliado.`,
    economia: `${saudacao} Economia inteligente: reduza custos fixos (maior impacto), automatize investimentos e busque renda extra. Invista a diferença. O efeito bola de neve dos juros compostos é impressionante.`,
    salario: `${saudacao} Estratégia com salário: 1) Invista primeiro (mínimo 20%), 2) Pague contas essenciais, 3) Fundo de oportunidade (para investimentos pontuais), 4) Gastos pessoais com o restante.`,
  };

  const respostas = modo === 'economia' ? respostasEconomia :
    modo === 'investidor' ? respostasInvestidor : respostasNormal;

  // Match keywords
  for (const [key, resp] of Object.entries(respostas)) {
    if (msgLower.includes(key)) return resp;
  }

  // Default responses by mode
  if (modo === 'economia') {
    return `${saudacao} Estou aqui para ajudar você a economizar! Me pergunte sobre gastos, economia, cartões, metas ou salário. Cada centavo economizado é um passo para sua liberdade financeira.`;
  }
  if (modo === 'investidor') {
    return `${saudacao} Vamos falar de investimentos! Me pergunte sobre onde investir, cartões de pontos, metas financeiras ou como otimizar seu salário. Seu dinheiro precisa trabalhar para você.`;
  }
  return `${saudacao} Sou o Dimdim, seu assistente financeiro! Posso ajudar com gastos, investimentos, cartões de crédito, pontos, metas e muito mais. O que você precisa?`;
}

export async function POST(request: NextRequest) {
  try {
    seed();
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { mensagem } = body;

    if (!mensagem) {
      return NextResponse.json({ error: 'Envie uma mensagem' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare('SELECT modo_bot, humor_bot, nome FROM users WHERE id = ?').get(session.id) as UserRow;

    const resposta = gerarResposta(mensagem, user.modo_bot, user.humor_bot, user.nome);

    return NextResponse.json({ resposta });
  } catch (error) {
    console.error('Erro no bot:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
