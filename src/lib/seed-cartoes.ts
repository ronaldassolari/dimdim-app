import getDb from './db';

interface CartaoCatalogo {
  banco: string;
  nome: string;
  bandeira: string;
  nivel: string;
  pontos_nacional: number;
  pontos_internacional: number;
  programas_compativeis: string[];
  cashback_percent: number;
  anuidade: number;
  anuidade_condicao: string | null;
  renda_minima: number;
  sala_vip: boolean;
  sala_vip_detalhes: string | null;
  observacoes: string | null;
}

const CATALOGO: CartaoCatalogo[] = [
  // ═══════════════════════ NUBANK ═══════════════════════
  {
    banco: 'Nubank', nome: 'Nubank Roxinho', bandeira: 'Mastercard', nivel: 'Standard',
    pontos_nacional: 0, pontos_internacional: 0,
    programas_compativeis: ['Cashback'],
    cashback_percent: 1, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Sem pontos, só cashback 1% direto na fatura'
  },
  {
    banco: 'Nubank', nome: 'Nubank Ultravioleta', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 0, pontos_internacional: 0,
    programas_compativeis: ['Cashback'],
    cashback_percent: 1, anuidade: 0, anuidade_condicao: 'Grátis com R$5mil/mês de gasto', renda_minima: 5000,
    sala_vip: true, sala_vip_detalhes: 'Dragon Pass',
    observacoes: 'Cashback 1% em tudo, sem pontos tradicionais'
  },

  // ═══════════════════════ ITAÚ ═══════════════════════
  {
    banco: 'Itaú', nome: 'Itaú Personnalité', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 3.5, pontos_internacional: 4.5,
    programas_compativeis: ['Sempre Presente', 'Livelo', 'Latam Pass', 'Smiles'],
    cashback_percent: 0, anuidade: 980, anuidade_condicao: null, renda_minima: 8000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey',
    observacoes: null
  },
  {
    banco: 'Itaú', nome: 'Itaú Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 4, pontos_internacional: 5,
    programas_compativeis: ['Sempre Presente', 'Livelo', 'Latam Pass', 'Smiles'],
    cashback_percent: 0, anuidade: 1020, anuidade_condicao: null, renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'Visa Airport Companion',
    observacoes: null
  },
  {
    banco: 'Itaú', nome: 'Itaú Visa Infinite Privilege', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 5.5, pontos_internacional: 8,
    programas_compativeis: ['Sempre Presente', 'Livelo', 'Latam Pass', 'Smiles', 'TudoAzul'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Isenta (Private, R$1M investido)', renda_minima: 0,
    sala_vip: true, sala_vip_detalhes: 'Ilimitado (todas as salas)',
    observacoes: 'Ultra exclusivo, líder nacional em pontuação 2026'
  },
  {
    banco: 'Itaú', nome: 'Itaú Mastercard Platinum', bandeira: 'Mastercard', nivel: 'Platinum',
    pontos_nacional: 2, pontos_internacional: 2,
    programas_compativeis: ['Sempre Presente', 'Livelo'],
    cashback_percent: 0, anuidade: 480, anuidade_condicao: null, renda_minima: 5000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: null
  },
  {
    banco: 'Itaú', nome: 'Itaú Empresas Mastercard Black', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 2, pontos_internacional: 3,
    programas_compativeis: ['Sempre Presente'],
    cashback_percent: 0, anuidade: 999, anuidade_condicao: null, renda_minima: 0,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey 2x/ano',
    observacoes: 'Cartão empresarial'
  },

  // ═══════════════════════ BRADESCO ═══════════════════════
  {
    banco: 'Bradesco', nome: 'Bradesco Prime Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3, pontos_internacional: 3,
    programas_compativeis: ['Livelo', 'Smiles', 'Latam Pass', 'TudoAzul'],
    cashback_percent: 0, anuidade: 780, anuidade_condicao: null, renda_minima: 8000,
    sala_vip: true, sala_vip_detalhes: 'Bradesco Lounge + LoungeKey',
    observacoes: null
  },
  {
    banco: 'Bradesco', nome: 'Bradesco Amex Platinum', bandeira: 'Amex', nivel: 'Platinum',
    pontos_nacional: 2.5, pontos_internacional: 2.5,
    programas_compativeis: ['Membership Rewards', 'Livelo', 'Smiles', 'Latam Pass'],
    cashback_percent: 0, anuidade: 830, anuidade_condicao: null, renda_minima: 8000,
    sala_vip: true, sala_vip_detalhes: 'Priority Pass ilimitado + 12 convidados + Bradesco Lounge',
    observacoes: null
  },
  {
    banco: 'Bradesco', nome: 'Bradesco Amex Black', bandeira: 'Amex', nivel: 'Black',
    pontos_nacional: 2, pontos_internacional: 2,
    programas_compativeis: ['Membership Rewards', 'Livelo'],
    cashback_percent: 0, anuidade: 1350, anuidade_condicao: null, renda_minima: 15000,
    sala_vip: true, sala_vip_detalhes: 'Ilimitado (Priority Pass + Amex Lounges)',
    observacoes: null
  },
  {
    banco: 'Bradesco', nome: 'Bradesco Corporate Elo Nanquim Diners Club', bandeira: 'Elo', nivel: 'Black',
    pontos_nacional: 2.5, pontos_internacional: 2.5,
    programas_compativeis: ['Livelo'],
    cashback_percent: 0, anuidade: 985, anuidade_condicao: null, renda_minima: 0,
    sala_vip: true, sala_vip_detalhes: 'Diners + Bradesco Lounge ilimitado',
    observacoes: 'Melhor pontuação nacional empresarial'
  },

  // ═══════════════════════ SANTANDER ═══════════════════════
  {
    banco: 'Santander', nome: 'Santander Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3, pontos_internacional: 3,
    programas_compativeis: ['Esfera', 'Livelo', 'Smiles', 'Latam Pass'],
    cashback_percent: 0, anuidade: 780, anuidade_condicao: null, renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey',
    observacoes: null
  },
  {
    banco: 'Santander', nome: 'Santander AAdvantage Black', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 1.8, pontos_internacional: 3,
    programas_compativeis: ['AAdvantage (American Airlines)', 'Smiles'],
    cashback_percent: 0, anuidade: 780, anuidade_condicao: null, renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey 4x + Mastercard GRU ilimitado',
    observacoes: 'Milhas nunca expiram. 2,8 milhas/dólar com Clube Smiles'
  },
  {
    banco: 'Santander', nome: 'Santander Decolar Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3, pontos_internacional: 3,
    programas_compativeis: ['Passaporte Decolar'],
    cashback_percent: 0, anuidade: 780, anuidade_condicao: null, renda_minima: 15000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Pontos não expiram'
  },
  {
    banco: 'Santander', nome: 'Santander GOL Smiles Infinite', bandeira: 'Mastercard', nivel: 'Infinite',
    pontos_nacional: 1.8, pontos_internacional: 3,
    programas_compativeis: ['Smiles'],
    cashback_percent: 0, anuidade: 780, anuidade_condicao: null, renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey',
    observacoes: 'Milhas não expiram. 3 milhas/dólar com Clube Smiles'
  },

  // ═══════════════════════ BANCO DO BRASIL ═══════════════════════
  {
    banco: 'Banco do Brasil', nome: 'Ourocard Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 1, pontos_internacional: 1,
    programas_compativeis: ['Benefícios BB', 'Livelo'],
    cashback_percent: 0, anuidade: 1025, anuidade_condicao: null, renda_minima: 8000,
    sala_vip: true, sala_vip_detalhes: 'Visa Airport Companion 4x/ano',
    observacoes: null
  },
  {
    banco: 'Banco do Brasil', nome: 'Ourocard Elo Grafite', bandeira: 'Elo', nivel: 'Platinum',
    pontos_nacional: 1.5, pontos_internacional: 1.5,
    programas_compativeis: ['Livelo'],
    cashback_percent: 0, anuidade: 480, anuidade_condicao: null, renda_minima: 4000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: null
  },

  // ═══════════════════════ C6 BANK ═══════════════════════
  {
    banco: 'C6 Bank', nome: 'C6 Mastercard', bandeira: 'Mastercard', nivel: 'Standard',
    pontos_nacional: 1, pontos_internacional: 1,
    programas_compativeis: ['Átomos', 'TudoAzul'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: '1 pt/R$ gasto (Átomos → TudoAzul)'
  },
  {
    banco: 'C6 Bank', nome: 'C6 Carbon', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 2.5, pontos_internacional: 2.5,
    programas_compativeis: ['Átomos', 'TudoAzul', 'Smiles'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis com R$5mil/mês', renda_minima: 5000,
    sala_vip: true, sala_vip_detalhes: 'Dragon Pass',
    observacoes: null
  },

  // ═══════════════════════ BTG PACTUAL ═══════════════════════
  {
    banco: 'BTG Pactual', nome: 'BTG Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3, pontos_internacional: 3,
    programas_compativeis: ['BTG+', 'Livelo', 'Smiles', 'Latam Pass'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis com R$25k/mês ou R$5M investido', renda_minima: 15000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey ilimitado + 20 convidados',
    observacoes: null
  },
  {
    banco: 'BTG Pactual', nome: 'BTG Black', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 4, pontos_internacional: 4,
    programas_compativeis: ['BTG+', 'Livelo', 'Smiles'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis com R$40k/mês ou R$3M investido', renda_minima: 25000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey ilimitado',
    observacoes: null
  },

  // ═══════════════════════ XP INVESTIMENTOS ═══════════════════════
  {
    banco: 'XP', nome: 'XP Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3.5, pontos_internacional: 3.5,
    programas_compativeis: ['XP', 'Livelo', 'Smiles'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis para investidores', renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'LoungeKey',
    observacoes: null
  },
  {
    banco: 'XP', nome: 'XP Visa Infinite Privilege', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 4.5, pontos_internacional: 4.5,
    programas_compativeis: ['XP', 'Livelo', 'Smiles', 'Latam Pass'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis com R$1M investido', renda_minima: 0,
    sala_vip: true, sala_vip_detalhes: 'Ilimitado',
    observacoes: '2o melhor em pontuação geral 2026'
  },

  // ═══════════════════════ INTER ═══════════════════════
  {
    banco: 'Inter', nome: 'Inter Gold', bandeira: 'Mastercard', nivel: 'Gold',
    pontos_nacional: 1, pontos_internacional: 1,
    programas_compativeis: ['Inter Loop', 'TudoAzul'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Fatura em débito automático para pontuar'
  },
  {
    banco: 'Inter', nome: 'Inter Black', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 2, pontos_internacional: 2,
    programas_compativeis: ['Inter Loop', 'TudoAzul'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis com R$5mil/mês', renda_minima: 5000,
    sala_vip: true, sala_vip_detalhes: 'Mastercard Lounges',
    observacoes: null
  },

  // ═══════════════════════ NEXT ═══════════════════════
  {
    banco: 'Next', nome: 'Next Visa Platinum', bandeira: 'Visa', nivel: 'Platinum',
    pontos_nacional: 1.5, pontos_internacional: 1.5,
    programas_compativeis: ['Livelo'],
    cashback_percent: 0, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: null
  },

  // ═══════════════════════ NEON ═══════════════════════
  {
    banco: 'Neon', nome: 'Neon Mastercard', bandeira: 'Mastercard', nivel: 'Standard',
    pontos_nacional: 0, pontos_internacional: 0,
    programas_compativeis: ['Cashback'],
    cashback_percent: 0.5, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Sem pontos tradicionais, cashback 0,5%'
  },

  // ═══════════════════════ CAIXA ═══════════════════════
  {
    banco: 'Caixa', nome: 'Caixa Visa Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 2, pontos_internacional: 2,
    programas_compativeis: ['Vai de Visa'],
    cashback_percent: 0, anuidade: 600, anuidade_condicao: null, renda_minima: 6000,
    sala_vip: true, sala_vip_detalhes: 'Visa Airport Companion',
    observacoes: null
  },

  // ═══════════════════════ PICPAY ═══════════════════════
  {
    banco: 'PicPay', nome: 'PicPay Card', bandeira: 'Mastercard', nivel: 'Standard',
    pontos_nacional: 0, pontos_internacional: 0,
    programas_compativeis: ['Cashback'],
    cashback_percent: 1.5, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Cashback 1,5% em tudo, direto na conta'
  },

  // ═══════════════════════ MERCADO PAGO ═══════════════════════
  {
    banco: 'Mercado Pago', nome: 'Mercado Pago Black', bandeira: 'Mastercard', nivel: 'Black',
    pontos_nacional: 0, pontos_internacional: 0,
    programas_compativeis: ['Mercado Pontos', 'Cashback'],
    cashback_percent: 1, anuidade: 0, anuidade_condicao: 'Grátis', renda_minima: 0,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Cashback 1% + pontos Meli'
  },

  // ═══════════════════════ AMERICAN EXPRESS (Bradesco) ═══════════════════════
  {
    banco: 'American Express', nome: 'Amex Green', bandeira: 'Amex', nivel: 'Standard',
    pontos_nacional: 1, pontos_internacional: 1,
    programas_compativeis: ['Membership Rewards'],
    cashback_percent: 0, anuidade: 280, anuidade_condicao: null, renda_minima: 3000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: null
  },
  {
    banco: 'American Express', nome: 'Amex Gold', bandeira: 'Amex', nivel: 'Gold',
    pontos_nacional: 1.5, pontos_internacional: 1.5,
    programas_compativeis: ['Membership Rewards', 'Livelo'],
    cashback_percent: 0, anuidade: 480, anuidade_condicao: null, renda_minima: 5000,
    sala_vip: true, sala_vip_detalhes: 'Amex Lounges',
    observacoes: null
  },
  {
    banco: 'American Express', nome: 'Amex Platinum', bandeira: 'Amex', nivel: 'Platinum',
    pontos_nacional: 2.5, pontos_internacional: 2.5,
    programas_compativeis: ['Membership Rewards', 'Livelo', 'Smiles', 'Latam Pass'],
    cashback_percent: 0, anuidade: 830, anuidade_condicao: null, renda_minima: 10000,
    sala_vip: true, sala_vip_detalhes: 'Priority Pass ilimitado + 12 convidados + Bradesco Lounge',
    observacoes: null
  },
  {
    banco: 'American Express', nome: 'Amex The Centurion (Black Card)', bandeira: 'Amex', nivel: 'Centurion',
    pontos_nacional: 5, pontos_internacional: 5,
    programas_compativeis: ['Membership Rewards', 'Livelo', 'Smiles', 'Latam Pass', 'TudoAzul'],
    cashback_percent: 0, anuidade: 5000, anuidade_condicao: 'Convite apenas', renda_minima: 0,
    sala_vip: true, sala_vip_detalhes: 'Todos os lounges ilimitados',
    observacoes: 'Top pontuação, pódio 2026, somente por convite'
  },

  // ═══════════════════════ SICREDI / UNICRED / BANESCARD ═══════════════════════
  {
    banco: 'Unicred', nome: 'Unicred Platinum', bandeira: 'Mastercard', nivel: 'Platinum',
    pontos_nacional: 2, pontos_internacional: 2,
    programas_compativeis: ['Livelo'],
    cashback_percent: 0, anuidade: 480, anuidade_condicao: null, renda_minima: 5000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: 'Destaque fora dos grandes bancos 2026'
  },
  {
    banco: 'Banescard', nome: 'Banescard Infinite', bandeira: 'Visa', nivel: 'Infinite',
    pontos_nacional: 3, pontos_internacional: 3,
    programas_compativeis: ['Livelo'],
    cashback_percent: 0, anuidade: 680, anuidade_condicao: null, renda_minima: 8000,
    sala_vip: false, sala_vip_detalhes: null,
    observacoes: null
  },
];

export function seedCartoesCatalogo() {
  const db = getDb();

  // Check if already seeded
  const count = (db.prepare('SELECT COUNT(*) as c FROM cartoes_catalogo').get() as any)?.c || 0;
  if (count > 0) return;

  const stmt = db.prepare(`
    INSERT INTO cartoes_catalogo (banco, nome, bandeira, nivel, pontos_nacional, pontos_internacional, programas_compativeis, cashback_percent, anuidade, anuidade_condicao, renda_minima, sala_vip, sala_vip_detalhes, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const c of CATALOGO) {
      stmt.run(
        c.banco, c.nome, c.bandeira, c.nivel,
        c.pontos_nacional, c.pontos_internacional,
        JSON.stringify(c.programas_compativeis),
        c.cashback_percent, c.anuidade, c.anuidade_condicao,
        c.renda_minima, c.sala_vip ? 1 : 0,
        c.sala_vip_detalhes, c.observacoes
      );
    }
  });

  insertAll();
  console.log(`✅ Catálogo de cartões: ${CATALOGO.length} cartões inseridos`);
}
