// NLP functions for DimdimBot message parsing

export function extrairGasto(msg: string): { valor: number; descricao: string; categoria: string } | null {
  const patterns = [
    /(?:gastei|paguei|comprei|custou|foram?)\s+(?:r\$?\s*)?(\d+[.,]?\d*)\s*(?:reais?)?\s*(?:no|na|em|de|com)?\s*(.+)/i,
    /(?:r\$?\s*)?(\d+[.,]?\d*)\s*(?:reais?)?\s*(?:no|na|em|de|com)\s*(.+)/i,
    /^r\$\s*(\d+[.,]?\d*)\s+(.+)/i,
    /^(\d+[.,]?\d*)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const desc = match[2].trim().replace(/[.!?]+$/, '');
      if (valor > 0 && valor <= 100000 && desc.length > 0) {
        return { valor, descricao: desc, categoria: detectarCategoria(desc) };
      }
    }
  }
  return null;
}

export function detectarCategoria(desc: string): string {
  const d = desc.toLowerCase();
  if (/ifood|uber\s*eat|rappi|hambur|pizza|restaur|almoc|jant|lanche|cafe|padaria|mercado|supermercado|feira|bigpao|pao|acougue|hortifruti/.test(d)) return 'Alimentação';
  if (/uber|99|taxi|gasolina|combustivel|estacionamento|pedagio|onibus|metro/.test(d)) return 'Transporte';
  if (/farmacia|medico|consulta|exame|remedio|hospital|dentista/.test(d)) return 'Saúde';
  if (/curso|livro|escola|faculdade|mensalidade/.test(d)) return 'Educação';
  if (/netflix|spotify|disney|hbo|amazon.*prime|cinema|show|jogo|game/.test(d)) return 'Lazer';
  if (/aluguel|condominio|agua|luz|energia|internet|celular|telefone/.test(d)) return 'Moradia';
  if (/roupa|sapato|tenis|camisa|calca|vestido/.test(d)) return 'Roupas';
  if (/celular|notebook|fone|mouse|teclado|monitor/.test(d)) return 'Eletrônicos';
  return 'Outros';
}

export function detectarIntencao(msg: string): 'gasto' | 'busca' | 'resumo' | 'pontos' | 'geral' {
  const m = msg.toLowerCase().trim();
  if (/(?:gastei|paguei|comprei|custou|foram)\s+\d/.test(m)) return 'gasto';
  if (/^r\$\s*\d+[.,]?\d*\s+\S+/.test(m)) return 'gasto';
  if (/^\d+[.,]?\d*\s+\S+/.test(m) && !/^\d+\s*(?:busca|procura|preco|preço)/.test(m)) return 'gasto';
  if (/(?:busca[r]?|procura[r]?|preco|preço|quanto custa|acha[r]?|encontra[r]?|pre[cç]o\s+d[oae])\s/.test(m)) return 'busca';
  if (/^(?:resumo|extrato|saldo)$/i.test(m)) return 'resumo';
  if (/(?:resumo|extrato|saldo|quanto\s+(?:tenho|gastei|sobrou)|como\s+t[aã]o?\s)/i.test(m)) return 'resumo';
  // Pontos
  if (/(?:^pontos$|meus pontos|carteira de pontos|milhas|quanto valem|livelo|smiles|tudoazul|latam pass)/i.test(m)) return 'pontos';
  return 'geral';
}

export function detectarIntencaoComConfianca(msg: string): { intencao: 'gasto' | 'busca' | 'resumo' | 'pontos' | 'geral'; confianca: number } {
  const m = msg.toLowerCase().trim();

  // High confidence patterns
  if (/(?:gastei|paguei|comprei|custou|foram)\s+\d/.test(m)) return { intencao: 'gasto', confianca: 0.95 };
  if (/^r\$\s*\d+[.,]?\d*\s+\S+/.test(m)) return { intencao: 'gasto', confianca: 0.9 };
  if (/^(?:resumo|extrato|saldo)$/i.test(m)) return { intencao: 'resumo', confianca: 0.95 };
  if (/(?:busca[r]?|procura[r]?|quanto custa)\s/.test(m)) return { intencao: 'busca', confianca: 0.9 };

  // Pontos
  if (/^(?:pontos|meus pontos|milhas)$/i.test(m)) return { intencao: 'pontos', confianca: 0.95 };
  if (/(?:livelo|smiles|tudoazul|latam pass|carteira de pontos|quanto valem)/i.test(m)) return { intencao: 'pontos', confianca: 0.85 };

  // Medium confidence patterns
  if (/^\d+[.,]?\d*\s+\S+/.test(m) && !/^\d+\s*(?:busca|procura|preco|preço)/.test(m)) return { intencao: 'gasto', confianca: 0.7 };
  if (/(?:resumo|extrato|saldo|quanto\s+(?:tenho|gastei|sobrou))/i.test(m)) return { intencao: 'resumo', confianca: 0.8 };
  if (/(?:preco|preço|pre[cç]o\s+d[oae])\s/.test(m)) return { intencao: 'busca', confianca: 0.7 };

  return { intencao: 'geral', confianca: 1.0 };
}
