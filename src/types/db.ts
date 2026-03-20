export interface UserRow {
  id: number;
  username: string;
  password: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  plano: string;
  plano_expira: string | null;
  modo_bot: string;
  humor_bot: string;
  horario_lembrete: string;
  horario_relatorio: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoriaRow {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  tipo: string;
}

export interface TransacaoRow {
  id: number;
  user_id: number;
  descricao: string;
  valor: number;
  tipo: 'GASTO' | 'RECEITA';
  categoria: string;
  status: string;
  data: string;
  cartao_id: number | null;
  recorrente: number;
  frequencia: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface CartaoRow {
  id: number;
  user_id: number;
  apelido: string;
  banco: string;
  bandeira: string;
  nivel: string;
  limite: number;
  gasto_mes: number;
  vencimento: number;
  cor: string;
  pontos_por_real: number;
  programas_pontos: string;
  ativo: number;
  created_at: string;
}

export interface ProgramaPontosRow {
  id: number;
  nome: string;
  tipo: string;
  descricao: string | null;
  categorias: string;
  link_cadastro: string | null;
  beneficios: string | null;
  pontuacao_media: string | null;
  ativo: number;
}

export interface AnalisePontosRow {
  id: number;
  user_id: number;
  programa_id: number;
  saldo: number;
  validade: string | null;
  alerta_dias: number;
  interesse: number;
  created_at: string;
}

export interface MetaRow {
  id: number;
  user_id: number;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  categoria: string | null;
  prazo: string | null;
  ativa: number;
  created_at: string;
}

export interface AlertaRow {
  id: number;
  user_id: number;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lido: number;
  data: string;
}

export interface BuscaPrecoRow {
  id: number;
  user_id: number;
  produto: string;
  resultados: string;
  menor_preco: number | null;
  loja_menor: string | null;
  monitorar: number;
  created_at: string;
}

export interface AssinaturaRow {
  id: number;
  user_id: number;
  plano: string;
  valor: number;
  periodo: string;
  status: string;
  inicio: string;
  fim: string | null;
  created_at: string;
}

export interface ContaFamiliaRow {
  id: number;
  dono_id: number;
  membro_id: number | null;
  nome_membro: string | null;
  email_membro: string | null;
  codigo_convite: string;
  permissao: string;
  status: string;
  created_at: string;
}

export interface AulaRow {
  id: number;
  trilha: string;
  numero: number;
  titulo: string;
  conteudo: string;
  quiz: string;
  badge_nome: string | null;
  ordem: number;
}

export interface ProgressoAulaRow {
  id: number;
  user_id: number;
  aula_id: number;
  concluida: number;
  quiz_score: number;
  data_conclusao: string | null;
}

export interface CartaoCatalogoRow {
  id: number;
  banco: string;
  nome: string;
  bandeira: string;
  nivel: string;
  pontos_nacional: number;
  pontos_internacional: number;
  programas_compativeis: string;
  cashback_percent: number;
  anuidade: number;
  anuidade_condicao: string | null;
  renda_minima: number;
  sala_vip: number;
  sala_vip_detalhes: string | null;
  observacoes: string | null;
  ativo: number;
}
