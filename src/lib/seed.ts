import getDb from './db';
import bcryptjs from 'bcryptjs';

export function seed() {
  const db = getDb();

  // Check if already seeded
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('ronald');
  if (existing) return;

  const hashedPassword = bcryptjs.hashSync('dimdim2026', 10);

  // User Ronald — dados reais
  db.prepare(`INSERT INTO users (username, password, nome, email, whatsapp, plano, plano_expira, modo_bot, horario_lembrete, horario_relatorio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    'ronald', hashedPassword, 'Ronald Assolari', 'ronaldgodlove@hotmail.com', '+554196444719', 'PRO', '2026-04-17', 'normal', '08:00', 1
  );

  // Categories
  const categorias = [
    ['Alimentação', '🍔', '#FF6B6B', 'AMBOS'],
    ['Transporte', '🚗', '#4ECDC4', 'GASTO'],
    ['Saúde', '💊', '#45B7D1', 'GASTO'],
    ['Educação', '📚', '#96CEB4', 'GASTO'],
    ['Lazer', '🎮', '#FFEAA7', 'GASTO'],
    ['Moradia', '🏠', '#DDA0DD', 'GASTO'],
    ['Roupas', '👕', '#98D8C8', 'GASTO'],
    ['Eletrônicos', '📱', '#F7DC6F', 'GASTO'],
    ['Serviços', '🔧', '#BB8FCE', 'GASTO'],
    ['Investimentos', '📈', '#82E0AA', 'RECEITA'],
    ['Salário', '💰', '#00C853', 'RECEITA'],
    ['Freelance', '💻', '#7C3AED', 'RECEITA'],
    ['Outros', '📦', '#AEB6BF', 'AMBOS'],
    ['Assinatura', '📺', '#E74C3C', 'GASTO'],
    ['Combustível', '⛽', '#F39C12', 'GASTO'],
  ];
  const catStmt = db.prepare('INSERT INTO categorias (nome, icone, cor, tipo) VALUES (?, ?, ?, ?)');
  for (const c of categorias) catStmt.run(...c);

  // 15 Transactions for March 2026
  const transacoes = [
    [1, 'Salário março', 8500, 'RECEITA', 'Salário', 'RECEBIDO', '2026-03-05'],
    [1, 'Freelance design', 2500, 'RECEITA', 'Freelance', 'RECEBIDO', '2026-03-10'],
    [1, 'Aluguel', 2200, 'GASTO', 'Moradia', 'PAGO', '2026-03-05'],
    [1, 'Supermercado Carrefour', 487.30, 'GASTO', 'Alimentação', 'PAGO', '2026-03-03'],
    [1, 'Uber mensal', 156.80, 'GASTO', 'Transporte', 'PAGO', '2026-03-08'],
    [1, 'Netflix + Spotify', 69.80, 'GASTO', 'Assinatura', 'PAGO', '2026-03-01'],
    [1, 'Farmácia Droga Raia', 89.50, 'GASTO', 'Saúde', 'PAGO', '2026-03-07'],
    [1, 'Curso Udemy React', 29.90, 'GASTO', 'Educação', 'PAGO', '2026-03-12'],
    [1, 'Gasolina Shell', 250, 'GASTO', 'Combustível', 'PAGO', '2026-03-09'],
    [1, 'iFood restaurante', 67.40, 'GASTO', 'Alimentação', 'PAGO', '2026-03-14'],
    [1, 'Conta de luz', 185, 'GASTO', 'Moradia', 'A_PAGAR', '2026-03-20'],
    [1, 'Academia Smart Fit', 99.90, 'GASTO', 'Saúde', 'PAGO', '2026-03-01'],
    [1, 'Roupa Renner', 189.90, 'GASTO', 'Roupas', 'PAGO', '2026-03-11'],
    [1, 'Projeto cliente X', 1500, 'RECEITA', 'Freelance', 'A_RECEBER', '2026-03-25'],
    [1, 'Internet Vivo', 129.90, 'GASTO', 'Serviços', 'A_PAGAR', '2026-03-22'],
  ];
  const txStmt = db.prepare('INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const t of transacoes) txStmt.run(...t);

  // 3 Cards — cartões reais do Ronald
  const cartoes = [
    [1, 'Nubank', 'Nubank', 'Mastercard', 'Black', 25000, 3450.60, 10, '#820AD1', 1.0, JSON.stringify(['Cashback'])],
    [1, 'C6', 'C6 Bank', 'Mastercard', 'Black', 15000, 1230, 15, '#1a1a2e', 2.5, JSON.stringify(['Livelo', 'TudoAzul'])],
    [1, 'Itaú', 'Itaú', 'Mastercard', 'Black', 50000, 890, 20, '#FF6600', 3.5, JSON.stringify(['Livelo', 'Smiles'])],
  ];
  const cardStmt = db.prepare('INSERT INTO cartoes (user_id, apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const c of cartoes) cardStmt.run(...c);

  // 13 Programs
  const programas = [
    ['Livelo', 'milhas', 'Programa de pontos que vira milhas em várias cias aéreas', '["Viagens","Compras","Streaming"]', 'https://www.livelo.com.br', 'Troca por milhas, produtos, cashback', '1-5 pts/R$'],
    ['Smiles', 'milhas', 'Programa de milhas da Gol', '["Viagens","Alimentação"]', 'https://www.smiles.com.br', 'Milhas Gol, parceiros, produtos', '1-3 pts/R$'],
    ['Latam Pass', 'milhas', 'Programa da Latam Airlines', '["Viagens"]', 'https://www.latampass.latam.com', 'Milhas Latam, upgrade, parceiros', '1-4 pts/R$'],
    ['TudoAzul', 'milhas', 'Programa da Azul Linhas Aéreas', '["Viagens"]', 'https://www.tudoazul.com', 'Milhas Azul, parceiros', '1-3 pts/R$'],
    ['Dotz', 'pontos', 'Programa de fidelidade multi-parceiros', '["Alimentação","Combustível","Farmácia"]', 'https://www.dotz.com.br', 'Troca por produtos, cashback, descontos', '1 pt/R$'],
    ['Esfera', 'pontos', 'Programa Bradesco', '["Compras","Viagens"]', 'https://www.programaesfera.com.br', 'Milhas, produtos, experiências', '1-3 pts/R$'],
    ['Stix', 'pontos', 'Carrefour + Ipiranga + Shell', '["Supermercado","Combustível"]', 'https://www.stix.com.br', 'Desconto em compras parceiros', '1 pt/R$'],
    ['Elo Mais', 'pontos', 'Programa cartões Elo', '["Compras"]', 'https://www.elomais.com.br', 'Pontos cartão Elo', '1 pt/R$'],
    ['Rappi', 'cashback', 'Rappi Prime cashback', '["Alimentação","Mercado"]', 'https://www.rappi.com.br', 'Cashback em pedidos', 'Até 15% cashback'],
    ['iFood', 'cashback', 'iFood Club benefícios', '["Alimentação"]', 'https://www.ifood.com.br', 'Cupons, frete grátis, cashback', 'Até 10% desconto'],
    ['Uber', 'cashback', 'Uber Cash rewards', '["Transporte","Alimentação"]', 'https://www.uber.com', 'Cashback Uber/UberEats', 'Até 5% cashback'],
    ['99', 'cashback', '99Pay cashback', '["Transporte"]', 'https://www.99app.com', 'Cashback em corridas', 'Até 10% cashback'],
    ['Multiplus', 'milhas', 'Programa Latam (legado)', '["Viagens"]', 'https://www.latampass.latam.com', 'Migrado para Latam Pass', '1 pt/R$'],
  ];
  const progStmt = db.prepare('INSERT INTO programas_pontos (nome, tipo, descricao, categorias, link_cadastro, beneficios, pontuacao_media) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const p of programas) progStmt.run(...p);

  // User points: Ronald atualiza os saldos reais depois
  db.prepare('INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (?, ?, ?, ?, ?)').run(1, 1, 0, '2027-12-31', 1);
  db.prepare('INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (?, ?, ?, ?, ?)').run(1, 2, 0, '2027-12-31', 1);
  db.prepare('INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (?, ?, ?, ?, ?)').run(1, 5, 0, null, 1);

  // 2 Goals — metas reais do Ronald
  db.prepare('INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'Viagem Europa', 15000, 0, 'Viagens', '2028-03-18');
  db.prepare('INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (?, ?, ?, ?, ?, ?)').run(1, 'Reserva de Emergência', 30000, 0, 'Investimentos', '2027-09-18');

  // 5 Saved searches
  const buscas = [
    [1, 'iPhone 15 Pro Max', '[{"loja":"Amazon","preco":7499},{"loja":"Magalu","preco":7899},{"loja":"Kabum","preco":7299}]', 7299, 'Kabum'],
    [1, 'TV Samsung 55 4K', '[{"loja":"Casas Bahia","preco":2499},{"loja":"Magalu","preco":2599},{"loja":"Amazon","preco":2399}]', 2399, 'Amazon'],
    [1, 'AirPods Pro 2', '[{"loja":"Amazon","preco":1899},{"loja":"Fast Shop","preco":2099},{"loja":"Kabum","preco":1799}]', 1799, 'Kabum'],
    [1, 'Notebook Dell i7', '[{"loja":"Dell","preco":5499},{"loja":"Kabum","preco":5299},{"loja":"Amazon","preco":5399}]', 5299, 'Kabum'],
    [1, 'Cadeira Gamer ThunderX3', '[{"loja":"Kabum","preco":1299},{"loja":"Pichau","preco":1349},{"loja":"Amazon","preco":1399}]', 1299, 'Kabum'],
  ];
  const buscaStmt = db.prepare('INSERT INTO buscas_preco (user_id, produto, resultados, menor_preco, loja_menor, monitorar) VALUES (?, ?, ?, ?, ?, 1)');
  for (const b of buscas) buscaStmt.run(...b);

  // 1 Family member pending
  db.prepare('INSERT INTO contas_familia (dono_id, nome_membro, email_membro, codigo_convite, status) VALUES (?, ?, ?, ?, ?)').run(1, 'Maria Santos', 'maria@email.com', 'DIMDIM-ABC123', 'PENDENTE');

  // Subscription — Pro trial 30 dias grátis
  db.prepare('INSERT INTO assinaturas (user_id, plano, valor, periodo, status, inicio, fim) VALUES (?, ?, ?, ?, ?, ?, ?)').run(1, 'PRO', 0, 'mensal', 'ATIVO', '2026-03-18', '2026-04-17');

  // 30 Lessons (10 per track)
  const aulasIniciante = [
    'O que é orçamento e por que você precisa de um',
    'Diferença entre dívida boa e dívida ruim',
    'O que são juros compostos (a 8ª maravilha do mundo)',
    'Como montar sua reserva de emergência',
    'Cartão de crédito: vilão ou aliado?',
    'Como categorizar seus gastos',
    'Regra 50-30-20: necessidades, desejos, investimentos',
    'O que é inflação e como ela corrói seu dinheiro',
    'Como sair do vermelho em 90 dias',
    'Primeiros passos para poupar todo mês',
  ];
  const aulasModerdo = [
    'Tesouro Direto: o investimento mais seguro do Brasil',
    'CDB, LCI e LCA: o que são e como funcionam',
    'Fundo de renda fixa vs investimento direto',
    'Como funciona o Imposto de Renda em investimentos',
    'O que é taxa Selic e como ela afeta sua vida',
    'Planejamento de metas financeiras em 1, 5 e 10 anos',
    'Como usar cartão de crédito para acumular pontos sem gastar mais',
    'Seguros: quais você realmente precisa',
    'Previdência privada PGBL vs VGBL',
    'Como negociar dívidas e sair do Serasa',
  ];
  const aulasAvancado = [
    'Fundos Imobiliários (FIIs): renda passiva todo mês',
    'Ações: como funciona a bolsa para iniciantes',
    'Diversificação de carteira: não coloque tudo num lugar',
    'ETFs: invista no índice todo de uma vez',
    'Dividendos: como viver de renda passiva',
    'Planejamento de aposentadoria antecipada (FIRE)',
    'Imposto de Renda: declaração e otimização',
    'Câmbio e investimentos internacionais',
    'Criptomoedas: o que é real e o que é especulação',
    'Sucessão patrimonial: proteja o que você construiu',
  ];

  const aulaStmt = db.prepare('INSERT INTO aulas (trilha, numero, titulo, conteudo, quiz, badge_nome, ordem) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const makeContent = (titulo: string, trilha: string) => `# ${titulo}\n\nConteúdo completo da aula sobre "${titulo}". Esta é uma aula da trilha ${trilha} da Academia Dimdim.\n\n## O que você vai aprender\n\nNesta aula vamos explorar os conceitos fundamentais sobre ${titulo.toLowerCase()}.\n\n## Exemplo prático\n\nImagine que você ganha R$ 5.000 por mês. Veja como aplicar este conceito no seu dia a dia...\n\n## Resumo\n\n- Conceito principal explicado de forma simples\n- Exemplo com valores reais brasileiros\n- Passo a passo para aplicar hoje mesmo`;

  const makeQuiz = (titulo: string) => JSON.stringify([
    { pergunta: `Qual é o principal conceito de "${titulo}"?`, opcoes: ['Opção A', 'Opção B (correta)', 'Opção C'], correta: 1 },
    { pergunta: 'Como aplicar este conceito no dia a dia?', opcoes: ['De forma gradual (correta)', 'Tudo de uma vez', 'Não se aplica'], correta: 0 },
    { pergunta: 'Qual é o próximo passo recomendado?', opcoes: ['Ignorar', 'Esperar', 'Colocar em prática hoje (correta)'], correta: 2 },
  ]);

  let ordem = 1;
  for (let i = 0; i < aulasIniciante.length; i++) {
    aulaStmt.run('iniciante', i + 1, aulasIniciante[i], makeContent(aulasIniciante[i], 'Iniciante'), makeQuiz(aulasIniciante[i]), i === 9 ? 'Iniciante Completo' : null, ordem++);
  }
  for (let i = 0; i < aulasModerdo.length; i++) {
    aulaStmt.run('moderado', i + 1, aulasModerdo[i], makeContent(aulasModerdo[i], 'Moderado'), makeQuiz(aulasModerdo[i]), i === 9 ? 'Moderado Completo' : null, ordem++);
  }
  for (let i = 0; i < aulasAvancado.length; i++) {
    aulaStmt.run('avancado', i + 1, aulasAvancado[i], makeContent(aulasAvancado[i], 'Avançado'), makeQuiz(aulasAvancado[i]), i === 9 ? 'Avançado Completo' : null, ordem++);
  }

  // Ronald's progress: 3 beginner lessons completed
  db.prepare('INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (?, ?, ?, ?, ?)').run(1, 1, 1, 3, '2026-03-10');
  db.prepare('INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (?, ?, ?, ?, ?)').run(1, 2, 1, 2, '2026-03-12');
  db.prepare('INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (?, ?, ?, ?, ?)').run(1, 3, 1, 3, '2026-03-15');

  // Alerts
  db.prepare('INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (?, ?, ?, ?)').run(1, 'pontos', 'Bônus Livelo → Smiles', 'Transferência com 80% de bônus até domingo!');
  db.prepare('INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (?, ?, ?, ?)').run(1, 'preco', 'TV Samsung caiu R$200', 'O produto que você monitora baixou de preço!');
  db.prepare('INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (?, ?, ?, ?)').run(1, 'meta', 'Meta Viagem Europa', 'Você está 40% mais perto do seu objetivo!');

  console.log('✅ Seed data inserted successfully');
}
