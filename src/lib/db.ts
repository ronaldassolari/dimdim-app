import { sql } from '@vercel/postgres';

let initialized = false;

export async function initDb() {
  if (initialized) return;

  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    whatsapp VARCHAR(20),
    plano VARCHAR(20) DEFAULT 'PRO_TRIAL',
    plano_expira VARCHAR(50),
    modo_bot VARCHAR(20) DEFAULT 'normal',
    humor_bot VARCHAR(20) DEFAULT 'amigavel',
    horario_lembrete VARCHAR(10) DEFAULT '08:00',
    horario_relatorio INTEGER DEFAULT 1,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(50) NOT NULL,
    cor VARCHAR(20) NOT NULL,
    tipo VARCHAR(10) DEFAULT 'GASTO'
  )`;

  await sql`CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    descricao VARCHAR(500) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    tipo VARCHAR(10) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'PAGO',
    data VARCHAR(20) NOT NULL,
    cartao_id INTEGER,
    recorrente INTEGER DEFAULT 0,
    frequencia VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    apelido VARCHAR(100) NOT NULL,
    banco VARCHAR(100) NOT NULL,
    bandeira VARCHAR(50) NOT NULL,
    nivel VARCHAR(50) NOT NULL,
    limite DECIMAL(12,2) DEFAULT 0,
    gasto_mes DECIMAL(12,2) DEFAULT 0,
    vencimento INTEGER DEFAULT 10,
    cor VARCHAR(20) DEFAULT '#1a1a2e',
    pontos_por_real DECIMAL(5,2) DEFAULT 1.0,
    programas_pontos TEXT DEFAULT '[]',
    ativo INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS programas_pontos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    categorias TEXT DEFAULT '[]',
    link_cadastro TEXT,
    beneficios TEXT,
    pontuacao_media VARCHAR(50),
    ativo INTEGER DEFAULT 1
  )`;

  await sql`CREATE TABLE IF NOT EXISTS analise_pontos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    programa_id INTEGER NOT NULL REFERENCES programas_pontos(id),
    saldo INTEGER DEFAULT 0,
    validade VARCHAR(20),
    alerta_dias INTEGER DEFAULT 30,
    interesse INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS metas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    titulo VARCHAR(255) NOT NULL,
    valor_alvo DECIMAL(12,2) NOT NULL,
    valor_atual DECIMAL(12,2) DEFAULT 0,
    categoria VARCHAR(100),
    prazo VARCHAR(20),
    ativa INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS alertas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT,
    lido INTEGER DEFAULT 0,
    data TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS buscas_preco (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    produto VARCHAR(500) NOT NULL,
    resultados TEXT DEFAULT '[]',
    menor_preco DECIMAL(12,2),
    loja_menor VARCHAR(200),
    monitorar INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS assinaturas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    plano VARCHAR(20) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    periodo VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ATIVO',
    inicio VARCHAR(20) NOT NULL,
    fim VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS contas_familia (
    id SERIAL PRIMARY KEY,
    dono_id INTEGER NOT NULL REFERENCES users(id),
    membro_id INTEGER,
    nome_membro VARCHAR(255),
    email_membro VARCHAR(255),
    codigo_convite VARCHAR(50) UNIQUE,
    permissao VARCHAR(20) DEFAULT 'proprio',
    status VARCHAR(20) DEFAULT 'PENDENTE',
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS aulas (
    id SERIAL PRIMARY KEY,
    trilha VARCHAR(20) NOT NULL,
    numero INTEGER NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    conteudo TEXT NOT NULL,
    quiz TEXT DEFAULT '[]',
    badge_nome VARCHAR(100),
    ordem INTEGER NOT NULL
  )`;

  await sql`CREATE TABLE IF NOT EXISTS progresso_aulas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    aula_id INTEGER NOT NULL REFERENCES aulas(id),
    concluida INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    data_conclusao VARCHAR(20),
    UNIQUE(user_id, aula_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS cartoes_catalogo (
    id SERIAL PRIMARY KEY,
    banco VARCHAR(100) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    bandeira VARCHAR(50) NOT NULL,
    nivel VARCHAR(50) NOT NULL,
    pontos_nacional DECIMAL(5,2) DEFAULT 0,
    pontos_internacional DECIMAL(5,2) DEFAULT 0,
    programas_compativeis TEXT DEFAULT '[]',
    cashback_percent DECIMAL(5,2) DEFAULT 0,
    anuidade DECIMAL(12,2) DEFAULT 0,
    anuidade_condicao TEXT,
    renda_minima DECIMAL(12,2) DEFAULT 0,
    sala_vip INTEGER DEFAULT 0,
    sala_vip_detalhes TEXT,
    observacoes TEXT,
    ativo INTEGER DEFAULT 1
  )`;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_transacoes_user ON transacoes(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_metas_user ON metas(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_buscas_user ON buscas_preco(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_analise_user ON analise_pontos(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_familia_dono ON contas_familia(dono_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_progresso_user ON progresso_aulas(user_id)`;

  // Assessor IA — Agenda/Compromissos
  await sql`CREATE TABLE IF NOT EXISTS compromissos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    titulo VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    hora VARCHAR(10),
    descricao TEXT,
    lembrete_minutos INTEGER DEFAULT 15,
    lembrete_canal VARCHAR(20) DEFAULT 'whatsapp',
    lembrete_enviado INTEGER DEFAULT 0,
    recorrente VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Assessor IA — Boletos
  await sql`CREATE TABLE IF NOT EXISTS boletos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    tipo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    valor DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    lembrete_dias INTEGER DEFAULT 1,
    lembrete_canal VARCHAR(20) DEFAULT 'whatsapp',
    lembrete_enviado INTEGER DEFAULT 0,
    pago INTEGER DEFAULT 0,
    recorrente VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Assessor IA — Preferências do Usuário (learning)
  await sql`CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    acao VARCHAR(100) NOT NULL,
    escolha VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  // Assessor IA — Histórico de Conversas
  await sql`CREATE TABLE IF NOT EXISTS conversas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_compromissos_user ON compromissos(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_boletos_user ON boletos(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_boletos_venc ON boletos(vencimento)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_conversas_user ON conversas(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id)`;

  initialized = true;
}

export { sql };
