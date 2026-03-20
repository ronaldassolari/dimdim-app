import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await seed();

    const body = await request.json();
    const { texto, whatsapp } = body;

    // Audio comes pre-transcribed (by OpenClaw or frontend Web Speech API)
    // We process the text to extract transaction data
    if (!texto) {
      return NextResponse.json({ error: 'Envie o texto transcrito do áudio' }, { status: 400 });
    }

    // Find user
    let userId: number | null = null;
    if (whatsapp) {
      const { rows } = await sql`SELECT id FROM users WHERE whatsapp = ${whatsapp}`;
      if (rows[0]) userId = (rows[0] as any).id;
    }
    if (!userId) {
      const session = getSession();
      if (session) userId = session.id;
    }
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      // Use Anthropic to extract structured data
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `O usuário ditou o seguinte sobre uma transação financeira: "${texto}"

Extraia as informações e responda APENAS com JSON válido, sem markdown:
{"descricao":"descrição curta","valor":99.90,"categoria":"Alimentação|Transporte|Saúde|Educação|Lazer|Moradia|Roupas|Eletrônicos|Serviços|Outros","tipo":"GASTO|RECEITA","data":"2026-03-19"}
Se não souber a data, use a de hoje. Se for ambíguo o tipo, assuma GASTO.`,
          }],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        const respText = data.content?.[0]?.text || '';
        try {
          const jsonMatch = respText.match(/\{[\s\S]*\}/);
          const dados = JSON.parse(jsonMatch ? jsonMatch[0] : respText);
          return NextResponse.json({
            dados,
            texto: `🎤 Entendi: ${dados.descricao} — R$ ${(dados.valor || 0).toFixed(2)} (${dados.categoria})`,
          });
        } catch { /* fall through to regex extraction */ }
      }
    }

    // Fallback: regex extraction
    const valorMatch = texto.match(/(\d+[.,]?\d*)\s*(?:reais?|r\$)/i) || texto.match(/r\$\s*(\d+[.,]?\d*)/i);
    const valor = valorMatch ? parseFloat(valorMatch[1].replace(',', '.')) : 0;

    const descricao = texto.replace(/(\d+[.,]?\d*)\s*(?:reais?|r\$)/gi, '').replace(/r\$\s*(\d+[.,]?\d*)/gi, '').trim() || texto;

    return NextResponse.json({
      dados: {
        descricao,
        valor,
        categoria: 'Outros',
        tipo: 'GASTO',
        data: new Date().toISOString().slice(0, 10),
      },
      texto: `🎤 Entendi: ${descricao} — R$ ${valor.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Erro ao processar áudio:', error);
    return NextResponse.json({ error: 'Erro ao processar áudio' }, { status: 500 });
  }
}
