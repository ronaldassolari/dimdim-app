'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { calcularMelhorOpcao, type PontosCalculation } from '@/lib/pontos-programs';
import { useToast } from '@/components/ToastContext';

interface Resultado {
  loja: string;
  preco: number;
  preco_original: number | null;
  desconto_percent: number;
  url: string;
  link?: string;
  imagem: string | null;
  titulo: string;
  disponivel: boolean;
}

interface Busca {
  id: number;
  user_id: number;
  produto: string;
  resultados: string;
  menor_preco: number;
  loja_menor: string;
  monitorar: number;
  created_at: string;
}

interface CardRecommendation {
  valor: number;
  ranking: {
    cartao_id: number;
    apelido: string;
    banco: string;
    bandeira: string;
    nivel: string;
    cor: string;
    pontosGanhos: number;
    valorEquivalente: number;
  }[];
  melhorCartao: {
    apelido: string;
    banco: string;
    pontosGanhos: number;
    valorEquivalente: number;
    cor: string;
  } | null;
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function getStoreSearchUrl(loja: string, query: string): string {
  const q = encodeURIComponent(query);
  const lojaLower = loja.toLowerCase();
  if (lojaLower.includes('magalu') || lojaLower.includes('magazine luiza')) {
    return `https://www.magazineluiza.com.br/busca/${q}`;
  }
  if (lojaLower.includes('amazon')) {
    return `https://www.amazon.com.br/s?k=${q}`;
  }
  if (lojaLower.includes('shopee')) {
    return `https://shopee.com.br/search?keyword=${q}`;
  }
  if (lojaLower.includes('mercado livre')) {
    return `https://lista.mercadolivre.com.br/${q}`;
  }
  if (lojaLower.includes('kabum')) {
    return `https://www.kabum.com.br/busca/${q}`;
  }
  if (lojaLower.includes('americanas')) {
    return `https://www.americanas.com.br/busca/${q}`;
  }
  if (lojaLower.includes('casas bahia')) {
    return `https://www.casasbahia.com.br/busca/${q}`;
  }
  return '';
}

function getMedalEmoji(index: number): string {
  if (index === 0) return '\u{1F947}';
  if (index === 1) return '\u{1F948}';
  if (index === 2) return '\u{1F949}';
  return '';
}

export default function BuscasPage() {
  const toast = useToast();
  const [savedBuscas, setSavedBuscas] = useState<Busca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentResults, setCurrentResults] = useState<Resultado[] | null>(null);
  const [currentProduct, setCurrentProduct] = useState('');
  const [cardRec, setCardRec] = useState<CardRecommendation | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'real' | null>(null);
  const [searchFonte, setSearchFonte] = useState('');
  const [expandedPontos, setExpandedPontos] = useState<Record<number, boolean>>({});

  // Advanced filter state
  const [showFilters, setShowFilters] = useState(true);
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterSort, setFilterSort] = useState<'relevante' | 'menor_preco' | 'maior_avaliacao'>('relevante');
  const [filterLojas, setFilterLojas] = useState<string[]>([]);

  const fetchBuscas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/buscas');
      if (!res.ok) throw new Error('Erro ao carregar buscas');
      const data = await res.json();
      setSavedBuscas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuscas();
  }, [fetchBuscas]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setCurrentResults(null);
    setCardRec(null);
    setSearchStatus(null);
    setSearchFonte('');
    setCurrentProduct(searchTerm.trim());
    setExpandedPontos({});
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterSort('relevante');
    setFilterLojas([]);
    try {
      const res = await fetch('/api/buscas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto: searchTerm.trim() }),
      });
      if (!res.ok) throw new Error('Erro na busca');
      const busca = await res.json();
      const resultados: Resultado[] = JSON.parse(busca.resultados || '[]');
      setCurrentResults(resultados);
      setSearchStatus(busca.status || 'real');
      setSearchFonte(busca.fonte || '');
      setSavedBuscas((prev) => [busca, ...prev.filter((b) => b.id !== busca.id)]);

      // Fetch card recommendation for lowest price
      const menorPreco = busca.menor_preco;
      if (menorPreco > 0) {
        setLoadingCard(true);
        try {
          const cardRes = await fetch('/api/pontos/calculadora', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ valor: menorPreco }),
          });
          if (cardRes.ok) {
            const cardData = await cardRes.json();
            setCardRec(cardData);
          }
        } catch {
          // Silently fail card recommendation
        } finally {
          setLoadingCard(false);
        }
      }
    } catch {
      toast.error('Erro ao buscar precos. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/buscas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao deletar');
      setSavedBuscas((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error('Erro ao excluir busca.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const minPrice = currentResults ? Math.min(...currentResults.filter((r) => r.disponivel).map((r) => r.preco)) : 0;

  // Deduplicate results by loja + preco (keep first occurrence)
  const deduplicatedResults = useMemo(() => {
    if (!currentResults) return null;
    const seen = new Set<string>();
    return currentResults.filter((r) => {
      const key = `${r.loja}-${r.preco}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [currentResults]);

  // Unique list of stores from current results
  const availableLojas = useMemo(() => {
    if (!deduplicatedResults) return [];
    return Array.from(new Set(deduplicatedResults.map((r) => r.loja))).sort();
  }, [deduplicatedResults]);

  // Apply filters + sort
  const filteredResults = useMemo(() => {
    if (!deduplicatedResults) return null;
    let items = [...deduplicatedResults];

    const minP = filterMinPrice !== '' ? parseFloat(filterMinPrice) : null;
    const maxP = filterMaxPrice !== '' ? parseFloat(filterMaxPrice) : null;

    if (minP !== null && !isNaN(minP)) items = items.filter((r) => r.preco >= minP);
    if (maxP !== null && !isNaN(maxP)) items = items.filter((r) => r.preco <= maxP);
    if (filterLojas.length > 0) items = items.filter((r) => filterLojas.includes(r.loja));

    if (filterSort === 'menor_preco') {
      items = items.sort((a, b) => a.preco - b.preco);
    } else if (filterSort === 'maior_avaliacao') {
      // Since we don't have rating data, put items with discounts first as a proxy
      items = items.sort((a, b) => (b.desconto_percent || 0) - (a.desconto_percent || 0));
    }
    // 'relevante' keeps original order

    return items;
  }, [deduplicatedResults, filterMinPrice, filterMaxPrice, filterLojas, filterSort]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterMinPrice !== '') count++;
    if (filterMaxPrice !== '') count++;
    if (filterSort !== 'relevante') count++;
    if (filterLojas.length > 0) count++;
    return count;
  }, [filterMinPrice, filterMaxPrice, filterSort, filterLojas]);

  const toggleLoja = (loja: string) => {
    setFilterLojas((prev) =>
      prev.includes(loja) ? prev.filter((l) => l !== loja) : [...prev, loja]
    );
  };

  const clearFilters = () => {
    setFilterMinPrice('');
    setFilterMaxPrice('');
    setFilterSort('relevante');
    setFilterLojas([]);
  };

  // Calculate points comparison for each result
  const getPontosForResult = (preco: number): PontosCalculation[] => {
    return calcularMelhorOpcao(preco);
  };

  if (loading) {
    return (
      <div className="fade-in">
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 220, height: 32, borderRadius: 12, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ width: '100%', height: 80, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 24 }} />
        <div style={{ width: '100%', height: 300, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn-primary" onClick={fetchBuscas}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Busca de Precos</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Compare precos em varias lojas e encontre a melhor oferta.
        </p>
      </div>

      {/* Search Input */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: '28px 24px',
          background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)',
          border: '1px solid #DDD6FE',
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED', marginBottom: 16, textAlign: 'center' }}>
          O que voce quer comprar?
        </p>
        <div style={{ display: 'flex', gap: 12, maxWidth: 600, margin: '0 auto' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: iPhone 16, Notebook Dell, AirPods Pro..."
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 14,
              border: '2px solid #DDD6FE',
              fontSize: 16,
              outline: 'none',
              transition: 'border-color 200ms',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
            onBlur={(e) => (e.target.style.borderColor = '#DDD6FE')}
          />
          <button
            className="btn-primary"
            onClick={handleSearch}
            disabled={searching || !searchTerm.trim()}
            style={{
              padding: '14px 28px',
              fontSize: 15,
              borderRadius: 14,
              whiteSpace: 'nowrap',
              opacity: searching ? 0.6 : 1,
            }}
          >
            {searching ? 'Buscando...' : '\u{1F50D} Buscar'}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {currentResults && !searching && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowFilters((v) => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🎛️</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Filtros avancados</span>
              {activeFilterCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: '#7C3AED', color: 'white',
                }}>
                  {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeFilterCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearFilters(); }}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: '#FEE2E2', color: '#DC2626', border: 'none', cursor: 'pointer',
                  }}
                >
                  Limpar filtros
                </button>
              )}
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{showFilters ? '▲' : '▼'}</span>
            </div>
          </div>

          {showFilters && (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {/* Price range */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Faixa de preco (R$)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                      fontSize: 14, outline: 'none', width: 0,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0, fontSize: 14 }}>—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                      fontSize: 14, outline: 'none', width: 0,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ordenar por
                </p>
                <select
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value as typeof filterSort)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E5E7EB',
                    fontSize: 14, outline: 'none', background: 'white', cursor: 'pointer',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                >
                  <option value="relevante">Mais relevante</option>
                  <option value="menor_preco">Menor preco</option>
                  <option value="maior_avaliacao">Maior desconto</option>
                </select>
              </div>

              {/* Stores */}
              {availableLojas.length > 0 && (
                <div style={{ gridColumn: availableLojas.length > 4 ? 'span 2' : undefined }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Filtrar por loja
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableLojas.map((loja) => {
                      const selected = filterLojas.includes(loja);
                      return (
                        <button
                          key={loja}
                          onClick={() => toggleLoja(loja)}
                          style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            border: selected ? '1.5px solid #7C3AED' : '1.5px solid #E5E7EB',
                            background: selected ? '#F3E8FF' : 'white',
                            color: selected ? '#7C3AED' : 'var(--text)',
                            transition: 'all 150ms',
                          }}
                        >
                          {loja}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter summary when collapsed with active filters */}
          {!showFilters && activeFilterCount > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {filterMinPrice && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED', fontWeight: 600 }}>
                  Min: R$ {filterMinPrice}
                </span>
              )}
              {filterMaxPrice && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED', fontWeight: 600 }}>
                  Max: R$ {filterMaxPrice}
                </span>
              )}
              {filterSort !== 'relevante' && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED', fontWeight: 600 }}>
                  {filterSort === 'menor_preco' ? 'Menor preco' : 'Maior desconto'}
                </span>
              )}
              {filterLojas.map((l) => (
                <span key={l} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED', fontWeight: 600 }}>
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Searching state */}
      {searching && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#7C3AED',
                  animation: `pulse 1.5s infinite ${i * 0.3}s`,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Buscando precos para &quot;{currentProduct}&quot;...</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Buscando nas lojas... pode levar alguns segundos</p>
        </div>
      )}

      {/* Results */}
      {filteredResults && !searching && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
              Resultados para &quot;{currentProduct}&quot;
            </h3>
            {searchStatus && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: '#E8F5E9',
                color: '#2E7D32',
              }}>
                {`REAL - ${searchFonte}`}
              </span>
            )}
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {filteredResults.length} resultado{filteredResults.length !== 1 ? 's' : ''}
              {activeFilterCount > 0 && deduplicatedResults && filteredResults.length < deduplicatedResults.length && (
                <span style={{ color: '#7C3AED', fontWeight: 600 }}> (filtrado de {deduplicatedResults.length})</span>
              )}
            </span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔎</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Nenhum resultado com esses filtros</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Tente ajustar ou limpar os filtros.</p>
              <button
                onClick={clearFilters}
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none', background: '#7C3AED',
                  color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            {filteredResults.map((result, i) => {
              const isCheapest = result.disponivel && result.preco === minPrice;
              const pontosRanking = getPontosForResult(result.preco);
              const top3 = pontosRanking.slice(0, 3);
              const rest = pontosRanking.slice(3);
              const isExpanded = expandedPontos[i] || false;
              const storeUrl = getStoreSearchUrl(result.loja, currentProduct);
              // Ignora URLs genéricas de busca (ex: buscape.com.br/search?q=...) e usa storeUrl específica
              const isGenericSearchUrl = (u?: string) => !u || u.includes('/search?q=') || u.includes('?q=');
              const rawUrl = result.url || result.link;
              const ofertaUrl = (!isGenericSearchUrl(rawUrl) ? rawUrl : null) || storeUrl || rawUrl || '#';

              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '20px',
                    border: isCheapest ? '2px solid #00C853' : '1px solid transparent',
                    background: isCheapest ? 'linear-gradient(135deg, #F0FFF4, #FAFFFC)' : undefined,
                    position: 'relative',
                    opacity: result.disponivel ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isCheapest ? '0 4px 20px rgba(0, 200, 83, 0.15)' : undefined,
                  }}
                >
                  {isCheapest && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #00C853, #00E676)',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 14px',
                        borderRadius: 20,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 2px 8px rgba(0,200,83,0.4)',
                        letterSpacing: '0.3px',
                      }}
                    >
                      🏆 Menor preco!
                    </div>
                  )}
                  {result.imagem && (
                    <div style={{ width: '100%', height: 80, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={result.imagem} alt={result.titulo || result.loja} style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.titulo || result.loja}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {result.loja}
                  </p>
                  {result.preco_original && result.preco_original > result.preco && (
                    <p style={{ fontSize: 12, color: '#999', textDecoration: 'line-through', marginBottom: 2 }}>
                      {formatMoney(result.preco_original)}
                      <span style={{ color: '#EF4444', fontWeight: 600, textDecoration: 'none', marginLeft: 6 }}>-{result.desconto_percent}%</span>
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: isCheapest ? '#00C853' : 'var(--text)',
                        margin: 0,
                      }}
                    >
                      {formatMoney(result.preco)}
                    </p>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 6,
                      background: '#FFF3E0',
                      color: '#E65100',
                      whiteSpace: 'nowrap',
                    }}>
                      Preco aproximado
                    </span>
                  </div>
                  {!result.disponivel && (
                    <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Indisponivel</span>
                  )}
                  {result.disponivel && (
                    <a
                      href={ofertaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        marginBottom: 12,
                        padding: '8px 16px',
                        borderRadius: 10,
                        background: isCheapest ? '#00C853' : '#7C3AED',
                        color: 'white',
                        transition: 'opacity 150ms',
                        width: 'fit-content',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      🛒 Ver oferta →
                    </a>
                  )}

                  {/* Points comparison section */}
                  {result.disponivel && (
                    <div style={{
                      marginTop: 'auto',
                      borderTop: '1px solid #F3F4F6',
                      paddingTop: 12,
                    }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Programas de Pontos
                      </p>

                      {/* Top 3 options */}
                      {top3.map((opt, idx) => {
                        const isBest = idx === 0;
                        return (
                          <div
                            key={opt.id}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 10,
                              marginBottom: 6,
                              background: isBest ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' : '#F9FAFB',
                              border: isBest ? '1.5px solid #F59E0B' : '1px solid #F3F4F6',
                              position: 'relative',
                            }}
                          >
                            {isBest && (
                              <span style={{
                                position: 'absolute',
                                top: -8,
                                right: 8,
                                background: '#F59E0B',
                                color: 'white',
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: 6,
                              }}>
                                MELHOR OPCAO
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14 }}>{getMedalEmoji(idx)}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {opt.loja} - {opt.nome}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  {opt.pontosGanhos.toLocaleString('pt-BR')} pts ({opt.taxa}x) = {formatMoney(opt.valorPontos)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: isBest ? '#D97706' : '#00C853' }}>
                                  {formatMoney(opt.precoFinal)}
                                </div>
                                <div style={{ fontSize: 10, color: '#00C853', fontWeight: 600 }}>
                                  -{formatMoney(opt.economia)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Expandable rest */}
                      {rest.length > 0 && (
                        <>
                          <button
                            onClick={() => setExpandedPontos(prev => ({ ...prev, [i]: !prev[i] }))}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: '1px solid #E5E7EB',
                              background: 'white',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#7C3AED',
                              cursor: 'pointer',
                              transition: 'all 200ms',
                              marginTop: 4,
                            }}
                          >
                            {isExpanded ? 'Ocultar outras opcoes' : `Ver outras ${rest.length} opcoes`} {isExpanded ? '\u25B2' : '\u25BC'}
                          </button>

                          {isExpanded && (
                            <div style={{ marginTop: 6 }}>
                              {rest.map((opt) => (
                                <div
                                  key={opt.id}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    marginBottom: 4,
                                    background: '#F9FAFB',
                                    border: '1px solid #F3F4F6',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {opt.loja} - {opt.nome}
                                      </div>
                                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                                        {opt.pontosGanhos.toLocaleString('pt-BR')} pts ({opt.taxa}x) = {formatMoney(opt.valorPontos)}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                                        {formatMoney(opt.precoFinal)}
                                      </div>
                                      <div style={{ fontSize: 9, color: '#00C853', fontWeight: 600 }}>
                                        -{formatMoney(opt.economia)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Card recommendation */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #F0FFF4, #E8F5E9)', border: '1px solid #A5D6A7' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Qual cartao usar?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Analise para comprar pelo menor preco ({formatMoney(minPrice)})
            </p>
            {loadingCard ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #00C853', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Calculando...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : cardRec && cardRec.melhorCartao ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: 56,
                    height: 36,
                    borderRadius: 8,
                    background: cardRec.melhorCartao.cor || '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  CARD
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{cardRec.melhorCartao.apelido}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{cardRec.melhorCartao.banco}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#00C853' }}>+{cardRec.melhorCartao.pontosGanhos} pontos</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>equivale a {formatMoney(cardRec.melhorCartao.valorEquivalente)}</p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Cadastre seus cartoes para ver a melhor opcao de pagamento.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty state - no search yet */}
      {!currentResults && !searching && savedBuscas.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{'\u{1F50D}'}</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Encontre o melhor preco</h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            Pesquise qualquer produto e compararemos os precos em diversas lojas para voce encontrar a melhor oferta.
          </p>
        </div>
      )}

      {/* Saved Searches */}
      {savedBuscas.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Buscas salvas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedBuscas.map((busca) => (
              <div
                key={busca.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {'\u{1F6D2}'}
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{busca.produto}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {formatDate(busca.created_at)} - {busca.loja_menor}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#00C853' }}>{formatMoney(busca.menor_preco)}</p>
                </div>
                {busca.monitorar === 1 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: '#E8F5E9',
                      color: '#00C853',
                      flexShrink: 0,
                    }}
                  >
                    Monitorando
                  </span>
                )}
                <button
                  onClick={() => handleDelete(busca.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: '1px solid #FECACA',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FFEBEE')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                  title="Excluir"
                >
                  {'\u{1F5D1}\uFE0F'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
