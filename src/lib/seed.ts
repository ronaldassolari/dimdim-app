import { sql, initDb } from './db';
import bcryptjs from 'bcryptjs';
import { AULAS_INICIANTE, AULAS_MODERADO, AULAS_AVANCADO } from './aulas-content';

let seeded = false;

export async function seed() {
  if (seeded) return;
  await initDb();

  const { rows } = await sql`SELECT id FROM users WHERE username = 'ronald'`;
  if (rows.length > 0) {
    seeded = true;
    return;
  }

  const hashedPassword = bcryptjs.hashSync('dimdim2026', 10);

  // User Ronald
  const { rows: userRows } = await sql`INSERT INTO users (username, password, nome, email, whatsapp, plano, plano_expira, modo_bot, horario_lembrete, horario_relatorio)
    VALUES ('ronald', ${hashedPassword}, 'Ronald Assolari', 'ronaldgodlove@hotmail.com', '+554196444719', 'PRO', '2026-04-17', 'normal', '08:00', 1) RETURNING id`;
  const userId = userRows[0].id as number;

  // Categories
  const categorias = [
    ['Alimentação', '🍔', '#FF6B6B', 'AMBOS'], ['Transporte', '🚗', '#4ECDC4', 'GASTO'],
    ['Saúde', '💊', '#45B7D1', 'GASTO'], ['Educação', '📚', '#96CEB4', 'GASTO'],
    ['Lazer', '🎮', '#FFEAA7', 'GASTO'], ['Moradia', '🏠', '#DDA0DD', 'GASTO'],
    ['Roupas', '👕', '#98D8C8', 'GASTO'], ['Eletrônicos', '📱', '#F7DC6F', 'GASTO'],
    ['Serviços', '🔧', '#BB8FCE', 'GASTO'], ['Investimentos', '📈', '#82E0AA', 'RECEITA'],
    ['Salário', '💰', '#00C853', 'RECEITA'], ['Freelance', '💻', '#7C3AED', 'RECEITA'],
    ['Outros', '📦', '#AEB6BF', 'AMBOS'], ['Assinatura', '📺', '#E74C3C', 'GASTO'],
    ['Combustível', '⛽', '#F39C12', 'GASTO'],
  ];
  for (const c of categorias) {
    await sql`INSERT INTO categorias (nome, icone, cor, tipo) VALUES (${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
  }

  // 15 Transactions
  const transacoes: [string, number, string, string, string, string][] = [
    ['Salário março', 8500, 'RECEITA', 'Salário', 'RECEBIDO', '2026-03-05'],
    ['Freelance design', 2500, 'RECEITA', 'Freelance', 'RECEBIDO', '2026-03-10'],
    ['Aluguel', 2200, 'GASTO', 'Moradia', 'PAGO', '2026-03-05'],
    ['Supermercado Carrefour', 487.30, 'GASTO', 'Alimentação', 'PAGO', '2026-03-03'],
    ['Uber mensal', 156.80, 'GASTO', 'Transporte', 'PAGO', '2026-03-08'],
    ['Netflix + Spotify', 69.80, 'GASTO', 'Assinatura', 'PAGO', '2026-03-01'],
    ['Farmácia Droga Raia', 89.50, 'GASTO', 'Saúde', 'PAGO', '2026-03-07'],
    ['Curso Udemy React', 29.90, 'GASTO', 'Educação', 'PAGO', '2026-03-12'],
    ['Gasolina Shell', 250, 'GASTO', 'Combustível', 'PAGO', '2026-03-09'],
    ['iFood restaurante', 67.40, 'GASTO', 'Alimentação', 'PAGO', '2026-03-14'],
    ['Conta de luz', 185, 'GASTO', 'Moradia', 'A_PAGAR', '2026-03-20'],
    ['Academia Smart Fit', 99.90, 'GASTO', 'Saúde', 'PAGO', '2026-03-01'],
    ['Roupa Renner', 189.90, 'GASTO', 'Roupas', 'PAGO', '2026-03-11'],
    ['Projeto cliente X', 1500, 'RECEITA', 'Freelance', 'A_RECEBER', '2026-03-25'],
    ['Internet Vivo', 129.90, 'GASTO', 'Serviços', 'A_PAGAR', '2026-03-22'],
  ];
  for (const t of transacoes) {
    await sql`INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data) VALUES (${userId}, ${t[0]}, ${t[1]}, ${t[2]}, ${t[3]}, ${t[4]}, ${t[5]})`;
  }

  // 3 Cards
  await sql`INSERT INTO cartoes (user_id, apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos) VALUES (${userId}, 'Nubank', 'Nubank', 'Mastercard', 'Black', 25000, 3450.60, 10, '#820AD1', 1.0, ${JSON.stringify(['Cashback'])})`;
  await sql`INSERT INTO cartoes (user_id, apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos) VALUES (${userId}, 'C6', 'C6 Bank', 'Mastercard', 'Black', 15000, 1230, 15, '#1a1a2e', 2.5, ${JSON.stringify(['Livelo', 'TudoAzul'])})`;
  await sql`INSERT INTO cartoes (user_id, apelido, banco, bandeira, nivel, limite, gasto_mes, vencimento, cor, pontos_por_real, programas_pontos) VALUES (${userId}, 'Itaú', 'Itaú', 'Mastercard', 'Black', 50000, 890, 20, '#FF6600', 3.5, ${JSON.stringify(['Livelo', 'Smiles'])})`;

  // 13 Programs
  const programas: [string, string, string, string, string, string, string][] = [
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
  for (const p of programas) {
    await sql`INSERT INTO programas_pontos (nome, tipo, descricao, categorias, link_cadastro, beneficios, pontuacao_media) VALUES (${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]}, ${p[6]})`;
  }

  // User points
  await sql`INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (${userId}, 1, 0, '2027-12-31', 1)`;
  await sql`INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (${userId}, 2, 0, '2027-12-31', 1)`;
  await sql`INSERT INTO analise_pontos (user_id, programa_id, saldo, validade, interesse) VALUES (${userId}, 5, 0, NULL, 1)`;

  // 7 Goals with varied progress
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'Viagem Europa', 15000, 4500, 'Viagens', '2027-06-01')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'Reserva de Emergência', 30000, 12000, 'Emergência', '2027-09-18')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'MacBook Pro M4', 18000, 18000, 'Tecnologia', '2026-12-01')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'MBA FGV', 45000, 5000, 'Educação', '2028-01-15')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'Entrada Apartamento', 80000, 62000, 'Moradia', '2027-12-31')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'Carro Novo', 55000, 8000, 'Veículo', '2028-06-01')`;
  await sql`INSERT INTO metas (user_id, titulo, valor_alvo, valor_atual, categoria, prazo) VALUES (${userId}, 'Fundo Investimentos', 100000, 23500, 'Investimentos', '2029-01-01')`;

  // 5 Saved searches
  const buscas: [string, string, number, string][] = [
    ['iPhone 15 Pro Max', '[{"loja":"Amazon","preco":7499},{"loja":"Magalu","preco":7899},{"loja":"Kabum","preco":7299}]', 7299, 'Kabum'],
    ['TV Samsung 55 4K', '[{"loja":"Casas Bahia","preco":2499},{"loja":"Magalu","preco":2599},{"loja":"Amazon","preco":2399}]', 2399, 'Amazon'],
    ['AirPods Pro 2', '[{"loja":"Amazon","preco":1899},{"loja":"Fast Shop","preco":2099},{"loja":"Kabum","preco":1799}]', 1799, 'Kabum'],
    ['Notebook Dell i7', '[{"loja":"Dell","preco":5499},{"loja":"Kabum","preco":5299},{"loja":"Amazon","preco":5399}]', 5299, 'Kabum'],
    ['Cadeira Gamer ThunderX3', '[{"loja":"Kabum","preco":1299},{"loja":"Pichau","preco":1349},{"loja":"Amazon","preco":1399}]', 1299, 'Kabum'],
  ];
  for (const b of buscas) {
    await sql`INSERT INTO buscas_preco (user_id, produto, resultados, menor_preco, loja_menor, monitorar) VALUES (${userId}, ${b[0]}, ${b[1]}, ${b[2]}, ${b[3]}, 1)`;
  }

  // Family
  await sql`INSERT INTO contas_familia (dono_id, nome_membro, email_membro, codigo_convite, status) VALUES (${userId}, 'Maria Santos', 'maria@email.com', 'DIMDIM-ABC123', 'PENDENTE')`;

  // Subscription
  await sql`INSERT INTO assinaturas (user_id, plano, valor, periodo, status, inicio, fim) VALUES (${userId}, 'PRO', 0, 'mensal', 'ATIVO', '2026-03-18', '2026-04-17')`;

  // 30 Lessons with real financial education content
  let ordem = 1;
  for (let i = 0; i < AULAS_INICIANTE.length; i++) {
    const a = AULAS_INICIANTE[i];
    await sql`INSERT INTO aulas (trilha, numero, titulo, conteudo, quiz, badge_nome, ordem) VALUES ('iniciante', ${i + 1}, ${a.titulo}, ${a.conteudo}, ${JSON.stringify(a.quiz)}, ${i === 9 ? 'Iniciante Completo' : null}, ${ordem++})`;
  }
  for (let i = 0; i < AULAS_MODERADO.length; i++) {
    const a = AULAS_MODERADO[i];
    await sql`INSERT INTO aulas (trilha, numero, titulo, conteudo, quiz, badge_nome, ordem) VALUES ('moderado', ${i + 1}, ${a.titulo}, ${a.conteudo}, ${JSON.stringify(a.quiz)}, ${i === 9 ? 'Moderado Completo' : null}, ${ordem++})`;
  }
  for (let i = 0; i < AULAS_AVANCADO.length; i++) {
    const a = AULAS_AVANCADO[i];
    await sql`INSERT INTO aulas (trilha, numero, titulo, conteudo, quiz, badge_nome, ordem) VALUES ('avancado', ${i + 1}, ${a.titulo}, ${a.conteudo}, ${JSON.stringify(a.quiz)}, ${i === 9 ? 'Avançado Completo' : null}, ${ordem++})`;
  }

  // Progress: 3 beginner lessons (aula IDs are sequential starting from 1)
  // We need the actual aula IDs - get the first 3 aulas
  const { rows: aulaIds } = await sql`SELECT id FROM aulas WHERE trilha = 'iniciante' ORDER BY numero ASC LIMIT 3`;
  if (aulaIds.length >= 3) {
    await sql`INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (${userId}, ${aulaIds[0].id}, 1, 3, '2026-03-10')`;
    await sql`INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (${userId}, ${aulaIds[1].id}, 1, 2, '2026-03-12')`;
    await sql`INSERT INTO progresso_aulas (user_id, aula_id, concluida, quiz_score, data_conclusao) VALUES (${userId}, ${aulaIds[2].id}, 1, 3, '2026-03-15')`;
  }

  // Alerts
  await sql`INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (${userId}, 'pontos', 'Bônus Livelo → Smiles', 'Transferência com 80% de bônus até domingo!')`;
  await sql`INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (${userId}, 'preco', 'TV Samsung caiu R$200', 'O produto que você monitora baixou de preço!')`;
  await sql`INSERT INTO alertas (user_id, tipo, titulo, mensagem) VALUES (${userId}, 'meta', 'Meta Viagem Europa', 'Você está 40% mais perto do seu objetivo!')`;

  seeded = true;
  console.log('✅ Seed data inserted successfully');
}
