// Real price search with cascading fallback: Google → Mercado Livre → Bing

interface PriceResult {
  loja: string;
  preco: number;
  preco_original: number | null;
  desconto_percent: number;
  url: string;
  imagem: string | null;
  disponivel: boolean;
  titulo: string;
}

interface SearchResponse {
  produto: string;
  resultados: PriceResult[];
  menor_preco: { loja: string; preco: number; url: string } | null;
  status: 'real';
  fonte: string;
  atualizado_em: string;
}

function extractPrice(text: string): number | null {
  // Match R$ X.XXX,XX or R$ X,XX or R$XXXX patterns
  const patterns = [
    /R\$\s*([\d.]+,\d{2})/,
    /R\$\s*([\d.]+)/,
    /(\d{1,3}(?:\.\d{3})*,\d{2})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
      if (val > 0 && val < 500000) return val;
    }
  }
  return null;
}

function extractLoja(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const map: Record<string, string> = {
      'mercadolivre.com.br': 'Mercado Livre',
      'amazon.com.br': 'Amazon',
      'magazineluiza.com.br': 'Magalu',
      'americanas.com.br': 'Americanas',
      'kabum.com.br': 'Kabum',
      'casasbahia.com.br': 'Casas Bahia',
      'submarino.com.br': 'Submarino',
      'fastshop.com.br': 'Fast Shop',
      'pontofrio.com.br': 'Ponto Frio',
      'shopee.com.br': 'Shopee',
      'extra.com.br': 'Extra',
      'carrefour.com.br': 'Carrefour',
      'buscape.com.br': 'Buscapé',
      'zoom.com.br': 'Zoom',
    };
    return map[host] || host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1);
  } catch {
    return 'Loja';
  }
}

async function searchGoogle(produto: string): Promise<PriceResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return [];

  const query = `${produto} preço comprar`;
  const url = `https://customsearch.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cseId}&num=10&lr=lang_pt&gl=br`;

  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    console.warn(`Google CSE error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const results: PriceResult[] = [];

  for (const item of (data.items || [])) {
    const price = extractPrice(item.snippet || '') || extractPrice(item.title || '');
    if (!price) continue;

    results.push({
      titulo: item.title?.substring(0, 80) || produto,
      preco: price,
      preco_original: null,
      desconto_percent: 0,
      url: item.link,
      imagem: item.pagemap?.cse_image?.[0]?.src || null,
      loja: extractLoja(item.link),
      disponivel: true,
    });
  }

  return results.sort((a, b) => a.preco - b.preco);
}

async function searchMercadoLivre(produto: string): Promise<PriceResult[]> {
  // ML API requires auth token now; try with token if available, otherwise with access_token
  const token = process.env.ML_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'DimdimApp/1.0',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(produto)}&limit=10&sort=price_asc`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });

  if (!res.ok) throw new Error(`ML API error: ${res.status}`);

  const data = await res.json();
  const results: PriceResult[] = [];

  for (const item of (data.results || [])) {
    const preco = item.price || 0;
    if (preco <= 0) continue;
    const precoOriginal = item.original_price || null;
    const desconto = precoOriginal ? Math.round(((precoOriginal - preco) / precoOriginal) * 100) : 0;

    results.push({
      loja: 'Mercado Livre',
      preco: Math.round(preco * 100) / 100,
      preco_original: precoOriginal ? Math.round(precoOriginal * 100) / 100 : null,
      desconto_percent: desconto,
      url: item.permalink || `https://www.mercadolivre.com.br`,
      imagem: item.thumbnail || null,
      disponivel: (item.available_quantity || 0) > 0,
      titulo: item.title || produto,
    });
  }

  return results;
}

async function searchBuscape(produto: string): Promise<PriceResult[]> {
  // Scrape Buscapé search results page for real Brazilian prices
  const url = `https://www.buscape.com.br/search?q=${encodeURIComponent(produto)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Buscapé error: ${res.status}`);

  const html = await res.text();
  const results: PriceResult[] = [];

  // Extract prices from Buscapé HTML
  // Buscapé shows both installment prices (10x de R$ 280) and full prices (R$ 2.801)
  // We want full prices only — filter out installment values by:
  // 1. Skipping prices preceded by "x de" or "x R$" (installments)
  // 2. Taking higher-value prices when there are clusters

  const allPrices: number[] = [];
  const installmentPrices = new Set<number>();
  let match;

  // First pass: identify installment prices (preceded by Nx pattern)
  const installmentPattern = /\d+x\s*(?:de\s*)?R\$\s*([\d.]+,\d{2})/gi;
  while ((match = installmentPattern.exec(html)) !== null) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (val > 0) installmentPrices.add(val);
  }

  // Second pass: get all R$ prices
  const pricePattern = /R\$\s*([\d.]+,\d{2})/g;
  while ((match = pricePattern.exec(html)) !== null) {
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (val > 10 && val < 500000) allPrices.push(val);
  }

  // Filter: remove prices that match installment values (within 1% tolerance)
  const fullPrices = allPrices.filter(p =>
    !Array.from(installmentPrices).some(ip => Math.abs(p - ip) / ip < 0.01)
  );

  // Use full prices if available, fallback to all prices
  const prices = fullPrices.length >= 3 ? fullPrices : allPrices;
  const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b).slice(0, 8);

  for (const preco of uniquePrices) {
    results.push({
      titulo: produto,
      preco,
      preco_original: null,
      desconto_percent: 0,
      url: `https://www.buscape.com.br/search?q=${encodeURIComponent(produto)}`,
      imagem: null,
      loja: 'Buscapé',
      disponivel: true,
    });
  }

  return results;
}

async function searchZoom(produto: string): Promise<PriceResult[]> {
  const url = `https://www.zoom.com.br/search?q=${encodeURIComponent(produto)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Zoom error: ${res.status}`);

  const html = await res.text();
  const startTag = '<script id="__NEXT_DATA__" type="application/json">';
  const startIdx = html.indexOf(startTag);
  const endIdx = startIdx >= 0 ? html.indexOf('</script>', startIdx + startTag.length) : -1;
  const jsonStr = startIdx >= 0 && endIdx >= 0 ? html.slice(startIdx + startTag.length, endIdx) : null;
  const match = jsonStr ? [null, jsonStr] : null;
  if (!match || !match[1]) throw new Error('Zoom: __NEXT_DATA__ not found');

  const data = JSON.parse(match[1]);
  const hits: Array<{
    name: string;
    price: number;
    image?: string;
    url: string;
    bestOffer?: { merchantName?: string };
  }> = data?.props?.initialReduxState?.hits?.hits ?? [];

  const results: PriceResult[] = [];
  for (const hit of hits) {
    if (!hit.price || hit.price <= 0) continue;
    results.push({
      titulo: hit.name?.substring(0, 80) || produto,
      preco: Math.round(hit.price * 100) / 100,
      preco_original: null,
      desconto_percent: 0,
      url: `https://www.zoom.com.br${hit.url}`,
      imagem: hit.image || null,
      loja: hit.bestOffer?.merchantName || 'Zoom',
      disponivel: true,
    });
  }

  return results.sort((a, b) => a.preco - b.preco).slice(0, 10);
}

async function searchBing(produto: string): Promise<PriceResult[]> {
  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) return [];

  const query = `${produto} preço comprar site:mercadolivre.com.br OR site:amazon.com.br OR site:magazineluiza.com.br`;
  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&mkt=pt-BR&count=10`;

  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    console.warn(`Bing API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const results: PriceResult[] = [];

  for (const item of (data.webPages?.value || [])) {
    const price = extractPrice(item.snippet || '') || extractPrice(item.name || '');
    if (!price) continue;

    results.push({
      titulo: item.name?.substring(0, 80) || produto,
      preco: price,
      preco_original: null,
      desconto_percent: 0,
      url: item.url,
      imagem: null,
      loja: extractLoja(item.url),
      disponivel: true,
    });
  }

  return results.sort((a, b) => a.preco - b.preco);
}

export async function searchPrices(produto: string): Promise<SearchResponse> {
  const now = new Date().toISOString();

  // Run all sources in parallel, merge results
  const sources = [
    { name: 'Zoom', fn: () => searchZoom(produto) },
    { name: 'Google', fn: () => searchGoogle(produto) },
    { name: 'Mercado Livre', fn: () => searchMercadoLivre(produto) },
    { name: 'Bing', fn: () => searchBing(produto) },
    { name: 'Buscapé', fn: () => searchBuscape(produto) },
  ];

  const settled = await Promise.allSettled(sources.map(s => s.fn()));
  const fontes: string[] = [];
  let allResults: PriceResult[] = [];

  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === 'fulfilled' && result.value.length > 0) {
      console.log(`[price-search] ${sources[i].name} — ${result.value.length} resultados`);
      fontes.push(sources[i].name);
      allResults = allResults.concat(result.value);
    } else if (result.status === 'rejected') {
      console.warn(`[price-search] ${sources[i].name} falhou:`, result.reason);
    }
  }

  // Deduplicate by rounding price to 2 decimals + loja
  const seen = new Set<string>();
  const resultados = allResults.filter(r => {
    const key = `${r.loja}|${r.preco.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.preco - b.preco);

  if (resultados.length === 0) {
    return { produto, resultados: [], menor_preco: null, status: 'real', fonte: 'nenhuma', atualizado_em: now };
  }

  const disponiveis = resultados.filter(r => r.disponivel);
  const menor = disponiveis.length > 0
    ? disponiveis.reduce((min, r) => r.preco < min.preco ? r : min, disponiveis[0])
    : null;

  return {
    produto,
    resultados,
    menor_preco: menor ? { loja: menor.loja, preco: menor.preco, url: menor.url } : null,
    status: 'real',
    fonte: fontes.join('+'),
    atualizado_em: now,
  };
}
