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

export type Intencao = 'gasto' | 'busca' | 'resumo' | 'pontos' | 'agenda' | 'boleto' | 'geral';

// Extrai múltiplos gastos de uma única mensagem
// Ex: "50 mercado, 30 uber, 20 farmácia" ou "gastei 50 no mercado\n30 no uber"
export function extrairMultiplosGastos(msg: string): Array<{ valor: number; descricao: string; categoria: string }> {
  // Divide por: nova linha, ponto-e-vírgula, barra, vírgula antes de número, " e " antes de número
  const partes = msg
    .split(/\n|;|\s\/\s|,\s*(?=\d|r\$)|(?<=\d)\s+e\s+(?=\d|r\$)/i)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (partes.length <= 1) return [];

  const gastos = partes
    .map(p => extrairGasto(p))
    .filter((g): g is NonNullable<typeof g> => g !== null);

  return gastos.length >= 2 ? gastos : [];
}

export function detectarIntencao(msg: string): Intencao {
  const m = msg.toLowerCase().trim();
  if (/(?:gastei|paguei|comprei|custou|foram)\s+\d/.test(m)) return 'gasto';
  if (/^r\$\s*\d+[.,]?\d*\s+\S+/.test(m)) return 'gasto';
  if (/^\d+[.,]?\d*\s+\S+/.test(m) && !/^\d+\s*(?:busca|procura|preco|preço)/.test(m)) return 'gasto';
  if (/(?:busca[r]?|procura[r]?|preco|preço|quanto custa|acha[r]?|encontra[r]?|pre[cç]o\s+d[oae])\s/.test(m)) return 'busca';
  if (/^(?:resumo|extrato|saldo)$/i.test(m)) return 'resumo';
  if (/(?:resumo|extrato|saldo|quanto\s+(?:tenho|gastei|sobrou)|como\s+t[aã]o?\s)/i.test(m)) return 'resumo';
  if (/(?:^pontos$|meus pontos|carteira de pontos|milhas|quanto valem|livelo|smiles|tudoazul|latam pass)/i.test(m)) return 'pontos';
  // Agenda/Compromissos
  if (/(?:reuni[aã]o|compromisso|agendar?|marcar?|consulta|dentista|m[eé]dico|encontro|evento)\s/i.test(m)) return 'agenda';
  if (/(?:amanh[aã]|pr[oó]xim[oa]|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)\s.*(?:[àa]s\s+\d|hora)/i.test(m)) return 'agenda';
  // Boletos
  if (/(?:boleto|conta\s+de\s+|vencimento|vence|fatura|parcela|mensalidade|aluguel)\s/i.test(m)) return 'boleto';
  if (/(?:pagar?\s+(?:a\s+)?conta|conta\s+(?:da\s+)?luz|conta\s+(?:de\s+)?[aá]gua|internet|condom[ií]nio)/i.test(m)) return 'boleto';
  return 'geral';
}

// Extrair dados de compromisso
export function extrairCompromisso(msg: string): { titulo: string; data: string; hora: string | null } | null {
  const m = msg.toLowerCase();
  let titulo = '';
  let data = '';
  let hora: string | null = null;

  // Extrair hora
  const horaMatch = m.match(/(?:[àa]s?\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:h(?:oras?)?|da\s+(?:manha|tarde|noite))?/i);
  if (horaMatch) {
    let h = parseInt(horaMatch[1]);
    const min = horaMatch[2] || '00';
    if (m.includes('tarde') || m.includes('noite')) h = h < 12 ? h + 12 : h;
    hora = `${String(h).padStart(2, '0')}:${min}`;
  }

  // Extrair data
  const hoje = new Date();
  if (/amanh[aã]/i.test(m)) {
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    data = amanha.toISOString().split('T')[0];
  } else if (/hoje/i.test(m)) {
    data = hoje.toISOString().split('T')[0];
  } else if (/pr[oó]xim[oa]\s+(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)/i.test(m)) {
    const dias: Record<string, number> = { segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6, domingo: 0 };
    const match = m.match(/pr[oó]xim[oa]\s+(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)/i);
    if (match) {
      const diaAlvo = dias[match[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] ?? 1;
      const d = new Date(hoje);
      while (d.getDay() !== diaAlvo || d <= hoje) d.setDate(d.getDate() + 1);
      data = d.toISOString().split('T')[0];
    }
  } else {
    const dataMatch = m.match(/(?:dia\s+)?(\d{1,2})(?:\/(\d{1,2}))?/);
    if (dataMatch) {
      const dia = parseInt(dataMatch[1]);
      const mes = dataMatch[2] ? parseInt(dataMatch[2]) - 1 : hoje.getMonth();
      const d = new Date(hoje.getFullYear(), mes, dia);
      if (d < hoje) d.setFullYear(d.getFullYear() + 1);
      data = d.toISOString().split('T')[0];
    }
  }

  // Extrair título (remove palavras de data/hora)
  titulo = msg.replace(/(?:amanh[aã]|hoje|pr[oó]xim[oa]\s+\w+|dia\s+\d+\/?\d*|[àa]s?\s+\d+(?::\d+)?(?:\s*h)?|da\s+(?:manha|tarde|noite)|horas?)/gi, '').trim();
  titulo = titulo.replace(/\s+/g, ' ').replace(/^[\s,.-]+|[\s,.-]+$/g, '');

  if (!titulo || !data) return null;
  return { titulo, data, hora };
}

// Extrair dados de boleto
export function extrairBoleto(msg: string): { tipo: string; valor: number | null; vencimento: string | null } | null {
  const m = msg.toLowerCase();
  let tipo = '';
  let valor: number | null = null;
  let vencimento: string | null = null;

  // Tipo
  if (/luz|energia|eletri/i.test(m)) tipo = 'Conta de Luz';
  else if (/[aá]gua/i.test(m)) tipo = 'Conta de Água';
  else if (/internet|wifi/i.test(m)) tipo = 'Internet';
  else if (/aluguel/i.test(m)) tipo = 'Aluguel';
  else if (/condom[ií]nio/i.test(m)) tipo = 'Condomínio';
  else if (/gas|g[aá]s/i.test(m)) tipo = 'Gás';
  else if (/celular|telefone/i.test(m)) tipo = 'Celular';
  else if (/faculdade|escola|mensalidade/i.test(m)) tipo = 'Educação';
  else if (/fatura|cart[aã]o/i.test(m)) tipo = 'Fatura Cartão';
  else tipo = msg.replace(/(?:boleto|conta|vence|pagar|de|da|do)\s*/gi, '').trim().substring(0, 50) || 'Outros';

  // Valor
  const valorMatch = m.match(/r\$?\s*(\d+[.,]?\d*)/);
  if (valorMatch) valor = parseFloat(valorMatch[1].replace(',', '.'));

  // Vencimento
  const hoje = new Date();
  const dataMatch = m.match(/(?:dia|vence(?:mento)?)\s*(\d{1,2})(?:\/(\d{1,2}))?/i);
  if (dataMatch) {
    const dia = parseInt(dataMatch[1]);
    const mes = dataMatch[2] ? parseInt(dataMatch[2]) - 1 : hoje.getMonth();
    const d = new Date(hoje.getFullYear(), mes, dia);
    if (d < hoje) d.setMonth(d.getMonth() + 1);
    vencimento = d.toISOString().split('T')[0];
  }

  if (!tipo) return null;
  return { tipo, valor, vencimento };
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
