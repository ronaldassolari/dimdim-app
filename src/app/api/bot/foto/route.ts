import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { seed } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    await seed();

    const body = await request.json();
    const { imagem, whatsapp } = body;

    if (!imagem) {
      return NextResponse.json({ error: 'Envie a imagem em base64' }, { status: 400 });
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
    if (!apiKey) {
      return NextResponse.json({
        error: 'Análise de imagem indisponível (ANTHROPIC_API_KEY não configurada)',
        fallback: true,
        dados: { estabelecimento: '', valor: 0, data: new Date().toISOString().slice(0, 10), categoria: 'Outros' },
      }, { status: 200 });
    }

    // Clean base64 — remove data:image/... prefix if present
    const base64Clean = imagem.replace(/^data:image\/\w+;base64,/, '');
    const mediaType = imagem.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Clean },
            },
            {
              type: 'text',
              text: `Analise este comprovante/nota fiscal/recibo e extraia as informações. Responda APENAS com JSON válido, sem markdown:
{"estabelecimento":"nome da loja/empresa","valor":99.90,"data":"2026-03-19","categoria":"Alimentação|Transporte|Saúde|Educação|Lazer|Moradia|Roupas|Eletrônicos|Serviços|Outros","descricao":"descrição curta da compra","itens":["item1","item2"]}
Se não conseguir identificar algum campo, use null. Para categoria, escolha a mais adequada da lista.`,
            },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      console.warn('Anthropic Vision API error:', res.status);
      return NextResponse.json({
        dados: { estabelecimento: null, valor: 0, data: new Date().toISOString().slice(0, 10), categoria: 'Outros', descricao: null },
        texto: '⚠️ Não foi possível analisar a imagem automaticamente. Preencha os dados manualmente.',
        fallback: true,
      });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    let dados;
    try {
      dados = JSON.parse(text);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        dados = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Resposta não é JSON válido');
      }
    }

    return NextResponse.json({
      dados,
      texto: `📸 Comprovante analisado!\n🏪 ${dados.estabelecimento || 'N/A'}\n💰 R$ ${(dados.valor || 0).toFixed(2)}\n📂 ${dados.categoria || 'Outros'}\n📅 ${dados.data || 'hoje'}`,
    });
  } catch (error) {
    console.error('Erro ao analisar foto:', error);
    return NextResponse.json({ error: 'Erro ao analisar imagem' }, { status: 500 });
  }
}
