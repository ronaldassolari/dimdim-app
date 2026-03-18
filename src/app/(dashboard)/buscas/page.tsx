'use client';

import { useEffect, useState, useCallback } from 'react';

interface Resultado {
  loja: string;
  preco: number;
  link: string;
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

export default function BuscasPage() {
  const [savedBuscas, setSavedBuscas] = useState<Busca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [currentResults, setCurrentResults] = useState<Resultado[] | null>(null);
  const [currentProduct, setCurrentProduct] = useState('');
  const [cardRec, setCardRec] = useState<CardRecommendation | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

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
    setCurrentProduct(searchTerm.trim());
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
      alert('Erro ao buscar precos. Tente novamente.');
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
      alert('Erro ao excluir busca.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const minPrice = currentResults ? Math.min(...currentResults.filter((r) => r.disponivel).map((r) => r.preco)) : 0;

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
            {searching ? 'Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </div>

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
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Comparando em varias lojas</p>
        </div>
      )}

      {/* Results */}
      {currentResults && !searching && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Resultados para &quot;{currentProduct}&quot;
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 24 }}>
            {currentResults.map((result, i) => {
              const isCheapest = result.disponivel && result.preco === minPrice;
              return (
                <div
                  key={i}
                  className="card"
                  style={{
                    padding: '20px',
                    border: isCheapest ? '2px solid #00C853' : undefined,
                    position: 'relative',
                    opacity: result.disponivel ? 1 : 0.5,
                  }}
                >
                  {isCheapest && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: 12,
                        background: '#00C853',
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      Menor preco!
                    </div>
                  )}
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {result.loja}
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: isCheapest ? '#00C853' : 'var(--text)',
                      marginBottom: 8,
                    }}
                  >
                    {formatMoney(result.preco)}
                  </p>
                  {!result.disponivel && (
                    <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>Indisponivel</span>
                  )}
                  {result.disponivel && (
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: '#7C3AED',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Ver na loja →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

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
          <div style={{ fontSize: 72, marginBottom: 16 }}>🔍</div>
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
                  🛒
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
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
