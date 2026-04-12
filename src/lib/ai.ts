import Anthropic from '@anthropic-ai/sdk';
import { sql } from '@/lib/db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface UserContext {
  id: number;
  nome: string;
  modo_bot: string;
  humor_bot: string;
}

// Busca contexto financeiro completo do usuário para o prompt
export async function carregarContextoFinanceiro(userId: number): Promise<string> {
  const mes = new Date().toISOString().slice(0, 7);
  const hoje = new Date().toISOString().slice(0, 10);
  const em7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [receitasRes, gastosRes, categoriasRes, ultimasRes, metasRes, boletosRes, compromissosRes, pontosRes] =
    await Promise.all([
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes
          WHERE user_id=${userId} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes + '%'}`,
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes
          WHERE user_id=${userId} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes + '%'}`,
      sql`SELECT categoria, COALESCE(SUM(valor),0) as total FROM transacoes
          WHERE user_id=${userId} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes + '%'}
          GROUP BY categoria ORDER BY total DESC LIMIT 5`,
      sql`SELECT descricao, valor, categoria, data FROM transacoes
          WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 8`,
      sql`SELECT titulo, valor_alvo, valor_atual, prazo FROM metas
          WHERE user_id=${userId} AND ativa=1 LIMIT 3`,
      sql`SELECT tipo, valor, vencimento FROM boletos
          WHERE user_id=${userId} AND pago=0 AND vencimento >= ${hoje} AND vencimento <= ${em7dias}
          ORDER BY vencimento LIMIT 5`,
      sql`SELECT titulo, data, hora FROM compromissos
          WHERE user_id=${userId} AND data >= ${hoje} AND data <= ${em7dias}
          ORDER BY data, hora LIMIT 5`,
      sql`SELECT pp.nome, ap.saldo FROM analise_pontos ap
          JOIN programas_pontos pp ON pp.id = ap.programa_id
          WHERE ap.user_id=${userId} AND ap.saldo > 0 LIMIT 3`,
    ]);

  const receitas = Number((receitasRes.rows[0] as any).t);
  const gastos = Number((gastosRes.rows[0] as any).t);
  const saldo = receitas - gastos;

  const lines: string[] = [
    `=== Contexto financeiro de ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} ===`,
    `Receitas: R$ ${receitas.toFixed(2)} | Gastos: R$ ${gastos.toFixed(2)} | Saldo: R$ ${saldo.toFixed(2)}`,
  ];

  if (categoriasRes.rows.length) {
    lines.push('\nTop gastos por categoria:');
    for (const r of categoriasRes.rows) {
      lines.push(`  - ${(r as any).categoria}: R$ ${Number((r as any).total).toFixed(2)}`);
    }
  }

  if (ultimasRes.rows.length) {
    lines.push('\nÚltimas transações:');
    for (const r of ultimasRes.rows) {
      lines.push(`  - ${(r as any).data} | ${(r as any).descricao} | R$ ${Number((r as any).valor).toFixed(2)} (${(r as any).categoria})`);
    }
  }

  if (metasRes.rows.length) {
    lines.push('\nMetas ativas:');
    for (const r of metasRes.rows) {
      const perc = ((r as any).valor_alvo > 0 ? (Number((r as any).valor_atual) / Number((r as any).valor_alvo)) * 100 : 0).toFixed(0);
      lines.push(`  - ${(r as any).titulo}: R$ ${Number((r as any).valor_atual).toFixed(2)} / R$ ${Number((r as any).valor_alvo).toFixed(2)} (${perc}%) | Prazo: ${(r as any).prazo ?? 'sem prazo'}`);
    }
  }

  if (boletosRes.rows.length) {
    lines.push('\nBoletos vencendo nos próximos 7 dias:');
    for (const r of boletosRes.rows) {
      lines.push(`  - ${(r as any).tipo}: R$ ${Number((r as any).valor).toFixed(2)} | Vence: ${(r as any).vencimento}`);
    }
  }

  if (compromissosRes.rows.length) {
    lines.push('\nCompromissos próximos 7 dias:');
    for (const r of compromissosRes.rows) {
      lines.push(`  - ${(r as any).titulo} | ${(r as any).data}${(r as any).hora ? ' às ' + (r as any).hora : ''}`);
    }
  }

  if (pontosRes.rows.length) {
    lines.push('\nPontos/milhas:');
    for (const r of pontosRes.rows) {
      lines.push(`  - ${(r as any).nome}: ${Number((r as any).saldo).toLocaleString('pt-BR')} pts`);
    }
  }

  return lines.join('\n');
}

// System prompt do assessor pessoal
function buildSystemPrompt(user: UserContext, contexto: string): string {
  const tom = user.humor_bot === 'direto' ? 'direto e objetivo, sem enrolação' :
    user.humor_bot === 'tecnico' ? 'técnico e analítico, use dados e percentuais' :
    'amigável e encorajador';

  const perfil = user.modo_bot === 'economia' ? 'focado em cortar gastos e economizar' :
    user.modo_bot === 'investidor' ? 'focado em investimentos e multiplicar patrimônio' :
    'equilibrado entre consumo consciente e crescimento financeiro';

  return `Você é o DimdimBot, assessor financeiro pessoal de ${user.nome}.

Seu perfil: ${perfil}. Tom: ${tom}.
Hoje: ${new Date().toLocaleDateString('pt-BR')}.

${contexto}

INSTRUÇÕES IMPORTANTES:
- Você tem acesso às ferramentas abaixo para registrar dados. Use-as quando o usuário mencionar gastos, boletos, compromissos, etc.
- Quando registrar algo, confirme com o usuário de forma concisa.
- Analise os dados financeiros do usuário e dê conselhos personalizados e práticos baseados no contexto real.
- Se o usuário perguntar sobre sua situação financeira, use os dados do contexto para responder com precisão.
- Seja proativo: se notar padrões de gastos ruins, alerte. Se tiver boletos vencendo, mencione.
- Responda SEMPRE em português brasileiro.
- Use *negrito* para destacar valores e informações importantes no WhatsApp.
- Seja conciso. Máximo 5 linhas por resposta, a menos que o usuário peça análise detalhada.`;
}

// Ferramentas disponíveis para o Claude
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'registrar_gasto',
    description: 'Registra um ou múltiplos gastos do usuário no banco de dados',
    input_schema: {
      type: 'object' as const,
      properties: {
        gastos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              valor: { type: 'number', description: 'Valor em reais' },
              descricao: { type: 'string', description: 'Descrição do gasto' },
              categoria: {
                type: 'string',
                enum: ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Roupas', 'Eletrônicos', 'Outros'],
              },
              recorrente: {
                type: 'string',
                enum: ['mensal', 'semanal', 'anual', 'unico'],
                description: 'Frequência se for gasto recorrente. "unico" para gastos avulsos.',
              },
              data: { type: 'string', description: 'Data YYYY-MM-DD, padrão hoje' },
            },
            required: ['valor', 'descricao', 'categoria'],
          },
          description: 'Lista de gastos a registrar (pode ser 1 ou vários)',
        },
      },
      required: ['gastos'],
    },
  },
  {
    name: 'registrar_boleto',
    description: 'Registra conta/boleto com data de vencimento e lembrete automático',
    input_schema: {
      type: 'object' as const,
      properties: {
        tipo: { type: 'string', description: 'Tipo do boleto (Conta de Luz, Aluguel, Internet, etc)' },
        valor: { type: 'number', description: 'Valor em reais' },
        vencimento: { type: 'string', description: 'Data de vencimento YYYY-MM-DD' },
        recorrente: {
          type: 'string',
          enum: ['mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'nao'],
          description: 'Se é recorrente e qual frequência',
        },
        lembrete_dias: { type: 'number', description: 'Dias antes do vencimento para lembrar. Padrão: 1' },
      },
      required: ['tipo', 'vencimento'],
    },
  },
  {
    name: 'registrar_compromisso',
    description: 'Registra compromisso ou evento na agenda com lembrete',
    input_schema: {
      type: 'object' as const,
      properties: {
        titulo: { type: 'string' },
        data: { type: 'string', description: 'Data YYYY-MM-DD' },
        hora: { type: 'string', description: 'Hora HH:MM (opcional)' },
        lembrete_minutos: { type: 'number', description: 'Minutos antes do evento para lembrar. Padrão: 60' },
        recorrente: {
          type: 'string',
          enum: ['diario', 'semanal', 'mensal', 'nao'],
          description: 'Se o compromisso se repete',
        },
      },
      required: ['titulo', 'data'],
    },
  },
  {
    name: 'buscar_preco',
    description: 'Busca preços de um produto na internet',
    input_schema: {
      type: 'object' as const,
      properties: {
        produto: { type: 'string', description: 'Nome do produto para buscar' },
      },
      required: ['produto'],
    },
  },
];

// Executa as ferramentas chamadas pelo Claude
async function executarFerramenta(
  nome: string,
  input: Record<string, unknown>,
  userId: number
): Promise<string> {
  const hoje = new Date().toISOString().slice(0, 10);

  if (nome === 'registrar_gasto') {
    const gastos = input.gastos as Array<{
      valor: number; descricao: string; categoria: string;
      recorrente?: string; data?: string;
    }>;
    const resultados = [];

    for (const g of gastos) {
      const dataGasto = g.data ?? hoje;
      const recorrente = g.recorrente && g.recorrente !== 'unico' ? 1 : 0;
      const freq = g.recorrente && g.recorrente !== 'unico' ? g.recorrente : null;

      const { rows } = await sql`
        INSERT INTO transacoes (user_id, descricao, valor, tipo, categoria, status, data, recorrente, frequencia)
        VALUES (${userId}, ${g.descricao}, ${g.valor}, 'GASTO', ${g.categoria}, 'PAGO', ${dataGasto}, ${recorrente}, ${freq})
        RETURNING id
      `;
      resultados.push({ id: (rows[0] as any).id, ...g });
    }

    if (resultados.length === 1) {
      const g = resultados[0];
      return `Gasto registrado: ID #${g.id} | ${g.descricao} | R$ ${g.valor.toFixed(2)} | ${g.categoria}${g.recorrente && g.recorrente !== 'unico' ? ` | recorrente ${g.recorrente}` : ''}`;
    }
    const total = gastos.reduce((s, g) => s + g.valor, 0);
    return `${resultados.length} gastos registrados. Total: R$ ${total.toFixed(2)}\n` +
      resultados.map((g, i) => `${i + 1}. #${g.id} ${g.descricao} R$ ${g.valor.toFixed(2)}`).join('\n');
  }

  if (nome === 'registrar_boleto') {
    const { tipo, valor, vencimento, recorrente, lembrete_dias } = input as {
      tipo: string; valor?: number; vencimento: string;
      recorrente?: string; lembrete_dias?: number;
    };
    const lem = lembrete_dias ?? 1;
    const rec = recorrente && recorrente !== 'nao' ? recorrente : null;

    const { rows } = await sql`
      INSERT INTO boletos (user_id, tipo, valor, vencimento, lembrete_dias, recorrente)
      VALUES (${userId}, ${tipo}, ${valor ?? null}, ${vencimento}, ${lem}, ${rec})
      RETURNING id
    `;
    return `Boleto registrado: #${(rows[0] as any).id} | ${tipo}${valor ? ` | R$ ${(valor as number).toFixed(2)}` : ''} | Vence: ${vencimento} | Lembrete: ${lem} dia(s) antes${rec ? ` | Recorrente: ${rec}` : ''}`;
  }

  if (nome === 'registrar_compromisso') {
    const { titulo, data, hora, lembrete_minutos, recorrente } = input as {
      titulo: string; data: string; hora?: string;
      lembrete_minutos?: number; recorrente?: string;
    };
    const lem = lembrete_minutos ?? 60;
    const rec = recorrente && recorrente !== 'nao' ? recorrente : null;

    const { rows } = await sql`
      INSERT INTO compromissos (user_id, titulo, data, hora, lembrete_minutos, recorrente)
      VALUES (${userId}, ${titulo}, ${data}, ${hora ?? null}, ${lem}, ${rec})
      RETURNING id
    `;
    return `Compromisso registrado: #${(rows[0] as any).id} | ${titulo} | ${data}${hora ? ' às ' + hora : ''} | Lembrete: ${lem} min antes${rec ? ` | Recorrente: ${rec}` : ''}`;
  }

  if (nome === 'buscar_preco') {
    const { searchPrices } = await import('@/lib/price-search');
    const result = await searchPrices(input.produto as string);
    const top = result.resultados.filter(r => r.disponivel).slice(0, 3);
    if (!top.length) return `Nenhum resultado encontrado para "${input.produto}"`;
    return top.map(r => `${r.titulo.slice(0, 50)} - R$ ${r.preco.toFixed(2)} (${r.loja})`).join('\n');
  }

  return 'Ferramenta não reconhecida';
}

// Ponto de entrada principal: processa mensagem com IA
export async function processarMensagemIA(
  mensagem: string,
  user: UserContext
): Promise<{ resposta: string; acoes: Record<string, unknown>[] }> {
  const contexto = await carregarContextoFinanceiro(user.id);
  const systemPrompt = buildSystemPrompt(user, contexto);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: mensagem },
  ];

  const acoes: Record<string, unknown>[] = [];

  // Agentic loop — continua até Claude parar de chamar ferramentas
  let response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    tools: TOOLS,
    messages,
  });

  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const tu of toolUses) {
      const resultado = await executarFerramenta(tu.name, tu.input as Record<string, unknown>, user.id);
      acoes.push({ ferramenta: tu.name, input: tu.input, resultado });
      toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: resultado });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  const resposta = textBlock?.text ?? 'Não entendi. Pode reformular?';

  return { resposta, acoes };
}
