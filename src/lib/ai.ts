// @ts-nocheck
import { sql } from '@/lib/db';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export interface UserContext {
  id: number;
  nome: string;
  modo_bot: string;
  humor_bot: string;
}

// Busca contexto financeiro completo do usuario para o prompt
export async function carregarContextoFinanceiro(userId: number): Promise<string> {
  const mes = new Date().toISOString().slice(0, 7);
  const hoje = new Date().toISOString().slice(0, 10);
  const em7dias = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [receitasRes, gastosRes, categoriasRes, ultimasRes, metasRes, boletosRes, compromissosRes, pontosRes] =
    await Promise.all([
      sql`SELECT COALESCE(SUM(valor),0) as t FROM transacoes WHERE user_id=${userId} AND tipo='RECEITA' AND status='RECEBIDO' AND data LIKE ${mes + '%'}`,
      sql`SELECT COALESCE(SUM(valor),0) as total FROM transacoes WHERE user_id=${userId} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes + '%'}`,
      sql`SELECT categoria, COALESCE(SUM(valor),0) as total FROM transacoes WHERE user_id=${userId} AND tipo='GASTO' AND status='PAGO' AND data LIKE ${mes + '%'} GROUP BY categoria ORDER BY total DESC LIMIT 5`,
      sql`SELECT descricao, valor, categoria, data FROM transacoes WHERE user_id=${userId} ORDER BY created_at DESC LIMIT 8`,
      sql`SELECT titulo, valor_alvo, valor_atual, prazo FROM metas WHERE user_id=${userId} AND ativa=1 LIMIT 3`,
      sql`SELECT tipo, valor, vencimento FROM boletos WHERE user_id=${userId} AND pago=0 AND vencimento >= ${hoje} AND vencimento <= ${em7dias} ORDER BY vencimento LIMIT 5`,
      sql`SELECT titulo, data, hora FROM compromissos WHERE user_id=${userId} AND data >= ${hoje} AND data <= ${em7dias} ORDER BY data, hora LIMIT 5`,
      sql`SELECT pp.nome, ap.saldo FROM analise_pontos ap JOIN programas_pontos pp ON pp.id = ap.programa_id WHERE ap.user_id=${userId} AND ap.saldo > 0 LIMIT 3`,
    ]);

  const receitas = Number((receitasRes.rows[0] as any).t);
  const gastos = Number((gastosRes.rows[0] as any).total);
  const saldo = receitas - gastos;

  const lines: string[] = [
    `Contexto financeiro de ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
    `Receitas: R$ ${receitas.toFixed(2)} | Gastos: R$ ${gastos.toFixed(2)} | Saldo: R$ ${saldo.toFixed(2)}`,
  ];

  if (categoriasRes.rows.length) {
    lines.push('\nTop gastos por categoria:');
    for (const r of categoriasRes.rows) {
      lines.push(`  - ${(r as any).categoria}: R$ ${Number((r as any).total).toFixed(2)}`);
    }
  }

  if (ultimasRes.rows.length) {
    lines.push('\nUltimas transacoes:');
    for (const r of ultimasRes.rows) {
      lines.push(`  - ${(r as any).data} | ${(r as any).descricao} | R$ ${Number((r as any).valor).toFixed(2)}`);
    }
  }

  if (metasRes.rows.length) {
    lines.push('\nMetas ativas:');
    for (const r of metasRes.rows) {
      const perc = (r as any).valor_alvo > 0 ? (Number((r as any).valor_atual) / Number((r as any).valor_alvo) * 100).toFixed(0) : 0;
      lines.push(`  - ${(r as any).titulo}: R$ ${Number((r as any).valor_atual).toFixed(2)} / R$ ${Number((r as any).valor_alvo).toFixed(2)} (${perc}%)`);
    }
  }

  if (boletosRes.rows.length) {
    lines.push('\nBoletos vencendo nos proximos 7 dias:');
    for (const r of boletosRes.rows) {
      lines.push(`  - ${(r as any).tipo}: R$ ${Number((r as any).valor).toFixed(2)} | Vence: ${(r as any).vencimento}`);
    }
  }

  if (compromissosRes.rows.length) {
    lines.push('\nCompromissos proximos 7 dias:');
    for (const r of compromissosRes.rows) {
      lines.push(`  - ${(r as any).titulo} | ${(r as any).data}${(r as any).hora ? ' as ' + (r as any).hora : ''}`);
    }
  }

  if (pontosRes.rows.length) {
    lines.push('\nPontos/milhas:');
    for (const r of pontosRes.rows) {
      lines.push(`  - ${(r as any).nome}: ${Number((r as any).saldo).toLocaleString('pt-BR')} pontos`);
    }
  }

  return lines.join('\n');
}

// System prompt do assessor pessoal
function buildSystemPrompt(user: UserContext, contexto: string): string {
  const tom = user.humor_bot === 'direto' ? 'direto e objetivo, sem enrolacao' :
    user.humor_bot === 'tecnico' ? 'tecnico e analitico, use dados e percentuais' :
    'amigavel e encorajador';

  const perfil = user.modo_bot === 'economia' ? 'focado em cortar gastos e economizar' :
    user.modo_bot === 'investidor' ? 'focado em investimentos e multiplicar patrimonio' :
    'equilibrado entre consumo consciente e crescimento financeiro';

  return 'Voce e o DimdimBot, assessor financeiro pessoal de ' + user.nome + '.\n' +
    'Seu perfil: ' + perfil + '. Tom: ' + tom + '.\n' +
    'Hoje: ' + new Date().toLocaleDateString('pt-BR') + '.\n\n' +
    contexto + '\n\n' +
    'INSTRUCOES IMPORTANTES:\n' +
    '- Voce tem acesso as ferramentas abaixo para registrar dados. Use-as quando o usuario mencionar gastos, boletos ou compromissos.\n' +
    '- Quando registrar algo, confirme com o usuario de forma concisa.\n' +
    '- Analise os dados financeiros do usuario e de conselhos personalizados e praticos baseados no contexto.\n' +
    '- Se o usuario perguntar sobre sua situacao financeira, use os dados do contexto para responder com precisao.\n' +
    '- Seja proativo: se notar padroes de gastos ruins, alerte. Se tiver boletos vencendo, mencione.\n' +
    '- Responda SEMPRE em portugues brasileiro.\n' +
    '- Use *negrito* para destacar valores e informacoes importantes no WhatsApp.\n' +
    '- Seja conciso: maximo 5 linhas por resposta, a menos que o usuario peca analise detalhada.';
}

// Ferramentas disponiveis (formato OpenAI/DeepSeek)
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'registrar_gasto',
      description: 'Registra um ou multiplos gastos do usuario no banco de dados',
      parameters: {
        type: 'object',
        properties: {
          gastos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                valor: { type: 'number', description: 'Valor em reais' },
                descricao: { type: 'string', description: 'Descricao do gasto' },
                categoria: {
                  type: 'string',
                  enum: ['Alimentacao', 'Transporte', 'Saude', 'Educacao', 'Lazer', 'Moradia', 'Roupas', 'Outros'],
                },
                recorrente: { type: 'string', enum: ['mensal', 'semanal', 'anual', 'unico'] },
                data: { type: 'string', description: 'Data YYYY-MM-DD (opcional, padrao hoje)' },
              },
              required: ['valor', 'descricao', 'categoria'],
            },
          },
        },
        required: ['gastos'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_boleto',
      description: 'Registra um boleto ou conta a pagar',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', description: 'Tipo do boleto/conta' },
          valor: { type: 'number', description: 'Valor em reais' },
          vencimento: { type: 'string', description: 'Data de vencimento YYYY-MM-DD' },
          lembrete_dias: { type: 'number', description: 'Dias antes do vencimento para lembrar. Padrao: 3' },
        },
        required: ['tipo', 'vencimento'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'registrar_compromisso',
      description: 'Registra compromisso ou evento na agenda com lembrete',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          data: { type: 'string', description: 'Data YYYY-MM-DD' },
          hora: { type: 'string', description: 'Hora HH:MM (opcional)' },
          lembrete_minutos: { type: 'number', description: 'Minutos antes do evento para lembrar. Padrao: 30' },
          recorrente: { type: 'string', enum: ['diario', 'semanal', 'mensal', 'nao'], description: 'Se o compromisso se repete' },
        },
        required: ['titulo', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_preco',
      description: 'Busca preco de um produto',
      parameters: {
        type: 'object',
        properties: {
          produto: { type: 'string' },
        },
        required: ['produto'],
      },
    },
  },
];

// Executa a ferramenta solicitada pela IA
async function executarFerramenta(nome: string, input: Record<string, unknown>, userId: number): Promise<string> {
  if (nome === 'registrar_gasto') {
    const gastos = input.gastos as any[];
    const hoje = new Date().toISOString().slice(0, 10);
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
      return 'Gasto registrado: ID #' + g.id + ' | ' + g.descricao + ' | R$ ' + g.valor.toFixed(2) + ' | ' + g.categoria;
    }
    const total = (gastos as any[]).reduce((s, g) => s + g.valor, 0);
    return resultados.length + ' gastos registrados. Total: R$ ' + total.toFixed(2) + '\n' +
      resultados.map((g, i) => (i + 1) + '. #' + g.id + ' ' + g.descricao + ' R$ ' + g.valor.toFixed(2)).join('\n');
  }

  if (nome === 'registrar_boleto') {
    const { tipo, valor, vencimento, lembrete_dias } = input as any;
    const lem = lembrete_dias ?? 3;
    const { rows } = await sql`
      INSERT INTO boletos (user_id, tipo, valor, vencimento, lembrete_dias, pago)
      VALUES (${userId}, ${tipo}, ${valor ?? 0}, ${vencimento}, ${lem}, 0)
      RETURNING id
    `;
    return 'Boleto registrado: #' + (rows[0] as any).id + ' | ' + tipo + ' | Vence: ' + vencimento;
  }

  if (nome === 'registrar_compromisso') {
    const { titulo, data, hora, lembrete_minutos, recorrente } = input as any;
    const lem = lembrete_minutos ?? 30;
    const rec = recorrente ?? 'nao';
    const { rows } = await sql`
      INSERT INTO compromissos (user_id, titulo, data, hora, lembrete_minutos, recorrente)
      VALUES (${userId}, ${titulo}, ${data}, ${hora ?? null}, ${lem}, ${rec})
      RETURNING id
    `;
    return 'Compromisso registrado: #' + (rows[0] as any).id + ' | ' + titulo + ' | ' + data + (hora ? ' as ' + hora : '');
  }

  if (nome === 'buscar_preco') {
    const { searchPrices } = await import('@/lib/price-search');
    const result = await searchPrices(input.produto as string);
    const top = result.resultados.filter((r: any) => r.disponivel).slice(0, 3);
    if (!top.length) return 'Nenhum resultado encontrado para "' + input.produto + '"';
    return top.map((r: any) => r.titulo.slice(0, 50) + ' - R$ ' + r.preco.toFixed(2) + ' (' + r.loja + ')').join('\n');
  }

  return 'Ferramenta nao reconhecida';
}

// Ponto de entrada principal: processa mensagem com IA (DeepSeek)
export async function processarMensagemIA(
  mensagem: string,
  user: UserContext
): Promise<{ resposta: string; acoes: Record<string, unknown>[] }> {
  const contexto = await carregarContextoFinanceiro(user.id);
  const systemPrompt = buildSystemPrompt(user, contexto);

  const messages: any[] = [{ role: 'user', content: mensagem }];
  const acoes: Record<string, unknown>[] = [];

  let finishReason = '';
  let lastMessage: any = null;

  do {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + DEEPSEEK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1024,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    });

    const data = await res.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error(JSON.stringify(data));
    }

    const choice = data.choices[0];
    lastMessage = choice.message;
    finishReason = choice.finish_reason;

    messages.push({
      role: 'assistant',
      content: choice.message.content,
      tool_calls: choice.message.tool_calls,
    });

    if (finishReason === 'tool_calls' && choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        const input = JSON.parse(tc.function.arguments);
        const resultado = await executarFerramenta(tc.function.name, input, user.id);
        acoes.push({ ferramenta: tc.function.name, input, resultado });
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: resultado,
        });
      }
    }
  } while (finishReason === 'tool_calls');

  const resposta = (lastMessage && lastMessage.content) ? lastMessage.content : 'Nao consegui processar sua mensagem.';

  return { resposta, acoes };
}
