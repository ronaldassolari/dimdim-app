import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dimdim.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nome TEXT NOT NULL,
      email TEXT,
      whatsapp TEXT,
      plano TEXT DEFAULT 'PRO_TRIAL' CHECK(plano IN ('LITE','PRO','PRO_TRIAL','LITE_ANUAL','PRO_ANUAL')),
      plano_expira TEXT,
      modo_bot TEXT DEFAULT 'normal' CHECK(modo_bot IN ('normal','economia','investidor')),
      humor_bot TEXT DEFAULT 'amigavel' CHECK(humor_bot IN ('formal','amigavel','humorado')),
      horario_lembrete TEXT DEFAULT '08:00',
      horario_relatorio INTEGER DEFAULT 1,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      icone TEXT NOT NULL,
      cor TEXT NOT NULL,
      tipo TEXT DEFAULT 'GASTO' CHECK(tipo IN ('GASTO','RECEITA','AMBOS'))
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('GASTO','RECEITA')),
      categoria TEXT NOT NULL,
      status TEXT DEFAULT 'PAGO' CHECK(status IN ('PAGO','A_PAGAR','RECEBIDO','A_RECEBER')),
      data TEXT NOT NULL,
      cartao_id INTEGER,
      recorrente INTEGER DEFAULT 0,
      frequencia TEXT,
      observacoes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cartao_id) REFERENCES cartoes(id)
    );

    CREATE TABLE IF NOT EXISTS cartoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      apelido TEXT NOT NULL,
      banco TEXT NOT NULL,
      bandeira TEXT NOT NULL,
      nivel TEXT NOT NULL,
      limite REAL DEFAULT 0,
      gasto_mes REAL DEFAULT 0,
      vencimento INTEGER DEFAULT 10,
      cor TEXT DEFAULT '#1a1a2e',
      pontos_por_real REAL DEFAULT 1.0,
      programas_pontos TEXT DEFAULT '[]',
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS programas_pontos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      categorias TEXT DEFAULT '[]',
      link_cadastro TEXT,
      beneficios TEXT,
      pontuacao_media TEXT,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS analise_pontos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      programa_id INTEGER NOT NULL,
      saldo INTEGER DEFAULT 0,
      validade TEXT,
      alerta_dias INTEGER DEFAULT 30,
      interesse INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (programa_id) REFERENCES programas_pontos(id)
    );

    CREATE TABLE IF NOT EXISTS metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      valor_alvo REAL NOT NULL,
      valor_atual REAL DEFAULT 0,
      categoria TEXT,
      prazo TEXT,
      ativa INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alertas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensagem TEXT,
      lido INTEGER DEFAULT 0,
      data TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS buscas_preco (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      produto TEXT NOT NULL,
      resultados TEXT DEFAULT '[]',
      menor_preco REAL,
      loja_menor TEXT,
      monitorar INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assinaturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plano TEXT NOT NULL,
      valor REAL NOT NULL,
      periodo TEXT NOT NULL,
      status TEXT DEFAULT 'ATIVO',
      inicio TEXT NOT NULL,
      fim TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contas_familia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dono_id INTEGER NOT NULL,
      membro_id INTEGER,
      nome_membro TEXT,
      email_membro TEXT,
      codigo_convite TEXT UNIQUE,
      permissao TEXT DEFAULT 'proprio' CHECK(permissao IN ('admin','ver_tudo','proprio')),
      status TEXT DEFAULT 'PENDENTE' CHECK(status IN ('ATIVO','PENDENTE','INATIVO')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (dono_id) REFERENCES users(id),
      FOREIGN KEY (membro_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS aulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trilha TEXT NOT NULL CHECK(trilha IN ('iniciante','moderado','avancado')),
      numero INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      quiz TEXT DEFAULT '[]',
      badge_nome TEXT,
      ordem INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progresso_aulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      aula_id INTEGER NOT NULL,
      concluida INTEGER DEFAULT 0,
      quiz_score INTEGER DEFAULT 0,
      data_conclusao TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (aula_id) REFERENCES aulas(id),
      UNIQUE(user_id, aula_id)
    );

    CREATE TABLE IF NOT EXISTS cartoes_catalogo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      banco TEXT NOT NULL,
      nome TEXT NOT NULL,
      bandeira TEXT NOT NULL,
      nivel TEXT NOT NULL,
      pontos_nacional REAL DEFAULT 0,
      pontos_internacional REAL DEFAULT 0,
      programas_compativeis TEXT DEFAULT '[]',
      cashback_percent REAL DEFAULT 0,
      anuidade REAL DEFAULT 0,
      anuidade_condicao TEXT,
      renda_minima REAL DEFAULT 0,
      sala_vip INTEGER DEFAULT 0,
      sala_vip_detalhes TEXT,
      observacoes TEXT,
      ativo INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_catalogo_banco ON cartoes_catalogo(banco);
    CREATE INDEX IF NOT EXISTS idx_catalogo_bandeira ON cartoes_catalogo(bandeira);
    CREATE INDEX IF NOT EXISTS idx_catalogo_nivel ON cartoes_catalogo(nivel);

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_transacoes_user ON transacoes(user_id);
    CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data);
    CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
    CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id);
    CREATE INDEX IF NOT EXISTS idx_metas_user ON metas(user_id);
    CREATE INDEX IF NOT EXISTS idx_alertas_user ON alertas(user_id);
    CREATE INDEX IF NOT EXISTS idx_alertas_data ON alertas(data);
    CREATE INDEX IF NOT EXISTS idx_buscas_user ON buscas_preco(user_id);
    CREATE INDEX IF NOT EXISTS idx_buscas_data ON buscas_preco(created_at);
    CREATE INDEX IF NOT EXISTS idx_analise_user ON analise_pontos(user_id);
    CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON assinaturas(user_id);
    CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
    CREATE INDEX IF NOT EXISTS idx_familia_dono ON contas_familia(dono_id);
    CREATE INDEX IF NOT EXISTS idx_progresso_user ON progresso_aulas(user_id);
  `);
}

export default getDb;
