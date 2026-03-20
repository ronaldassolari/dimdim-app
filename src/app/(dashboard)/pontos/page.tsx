'use client';

import { useEffect, useState, useCallback } from 'react';

interface Programa {
  id: number;
  nome: string;
  tipo: string;
  descricao: string;
  categorias: string;
  link_cadastro: string;
  beneficios: string;
  pontuacao_media: string;
  saldo: number | null;
  validade: string | null;
  alerta_dias: number | null;
  interesse: number | null;
  analise_id: number | null;
}

interface RankingItem {
  cartao_id: number;
  apelido: string;
  banco: string;
  bandeira: string;
  nivel: string;
  cor: string;
  pontos_por_real: number;
  programas_pontos: string[];
  pontosGanhos: number;
  valorEquivalente: number;
}

interface CalcResult {
  valor: number;
  categoria: string | null;
  ranking: RankingItem[];
  melhorCartao: RankingItem | null;
}

const CATEGORIAS_ONDE = ['Alimentação', 'Combustível', 'Supermercado', 'Viagens', 'Streaming', 'Farmácia', 'Cartão'];

const CALC_CATEGORIES = [
  '', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer',
  'Moradia', 'Combustível', 'Viagens', 'Supermercado', 'Streaming', 'Farmácia',
];

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatInputMoney(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseInputMoney(formatted: string): number {
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function daysUntilDate(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function Skeleton({ width, height }: { width: string | number; height: string | number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export default function PontosPage() {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'meus' | 'calculadora' | 'onde'>('meus');

  // Calculator state
  const [calcValorDisplay, setCalcValorDisplay] = useState('');
  const [calcCategoria, setCalcCategoria] = useState('');
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Edit saldo state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSaldo, setEditSaldo] = useState('');

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<Programa | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add program state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addProgramaId, setAddProgramaId] = useState('');
  const [addSaldo, setAddSaldo] = useState('');
  const [addValidade, setAddValidade] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [savingSaldoId, setSavingSaldoId] = useState<number | null>(null);

  const fetchProgramas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pontos');
      if (!res.ok) throw new Error('Erro ao carregar programas');
      const data = await res.json();
      setProgramas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgramas();
  }, [fetchProgramas]);

  const handleCalc = async () => {
    const valor = parseInputMoney(calcValorDisplay);
    if (valor <= 0) { alert('Informe um valor'); return; }

    setCalcLoading(true);
    try {
      const res = await fetch('/api/pontos/calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor, categoria: calcCategoria || null }),
      });
      if (!res.ok) throw new Error('Erro na calculadora');
      const data = await res.json();
      setCalcResult(data);
    } catch {
      alert('Erro ao calcular pontos');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleUpdateSaldo = async (programaId: number) => {
    const saldo = parseInt(editSaldo, 10);
    if (isNaN(saldo) || saldo < 0) { alert('Informe um saldo válido'); return; }

    setSavingSaldoId(programaId);
    try {
      const res = await fetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa_id: programaId, saldo }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar saldo');
      setEditingId(null);
      setEditSaldo('');
      fetchProgramas();
    } catch {
      alert('Erro ao atualizar saldo');
    } finally {
      setSavingSaldoId(null);
    }
  };

  const handleDeletePrograma = async () => {
    if (!deleteConfirm || !deleteConfirm.analise_id) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/pontos/${deleteConfirm.analise_id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ao remover programa');
      setProgramas(prev => prev.map(p => p.id === deleteConfirm.id ? { ...p, saldo: null, validade: null, analise_id: null } : p));
      setDeleteConfirm(null);
    } catch {
      alert('Erro ao remover programa');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddPrograma = async () => {
    if (!addProgramaId) { alert('Selecione um programa'); return; }
    const saldo = parseInt(addSaldo, 10);
    if (isNaN(saldo) || saldo <= 0) { alert('Informe um saldo válido'); return; }

    setAddSaving(true);
    try {
      const res = await fetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programa_id: Number(addProgramaId),
          saldo,
          validade: addValidade || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar programa');
      setAddModalOpen(false);
      setAddProgramaId('');
      setAddSaldo('');
      setAddValidade('');
      fetchProgramas();
    } catch {
      alert('Erro ao adicionar programa');
    } finally {
      setAddSaving(false);
    }
  };

  const handleInteresse = async (programaId: number) => {
    try {
      const res = await fetch('/api/pontos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa_id: programaId, interesse: 1 }),
      });
      if (!res.ok) throw new Error('Erro');
      fetchProgramas();
    } catch {
      alert('Erro ao registrar interesse');
    }
  };

  const meusPrograms = programas.filter(p => p.saldo !== null && p.saldo > 0);

  const getPersonalizedMessage = (item: RankingItem, best: RankingItem | null, ranking: RankingItem[]) => {
    const nivel = item.nivel.toLowerCase();
    if (['black', 'infinite', 'signature'].includes(nivel)) {
      return `Excelente escolha! Seu ${item.banco} ${item.nivel} acumula ${item.pontosGanhos.toLocaleString('pt-BR')} pontos = ${formatMoney(item.valorEquivalente)}. Uma das melhores opções da sua carteira.`;
    }
    if (nivel === 'standard' || nivel === 'internacional') {
      const bestCard = ranking[0];
      if (bestCard && bestCard.cartao_id !== item.cartao_id) {
        const diff = bestCard.pontosGanhos - item.pontosGanhos;
        return `Com seu ${item.banco} Standard você acumula ${item.pontosGanhos.toLocaleString('pt-BR')} pts. Considere usar seu ${bestCard.apelido} para ${diff.toLocaleString('pt-BR')} pontos a mais.`;
      }
    }
    return null;
  };

  const programaTypeIcon = (tipo: string) => {
    if (tipo === 'milhas') return '✈️';
    if (tipo === 'cashback') return '💰';
    return '⭐';
  };

  const tabs = [
    { key: 'meus' as const, label: 'Meus Pontos' },
    { key: 'calculadora' as const, label: 'Calculadora' },
    { key: 'onde' as const, label: 'Onde Ganhar' },
  ];

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Programas de Pontos</h1>
          <button className="btn-primary" onClick={() => setAddModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            + Adicionar Programa
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  background: isActive ? 'var(--purple)' : 'var(--bg)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          <Skeleton width="100%" height={180} />
          <Skeleton width="100%" height={180} />
          <Skeleton width="100%" height={180} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn-primary" onClick={fetchProgramas}>Tentar novamente</button>
        </div>
      ) : (
        <>
          {/* Meus Pontos Tab */}
          {activeTab === 'meus' && (
            <div>
              {meusPrograms.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum saldo de pontos</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Adicione seu saldo nos programas de pontos
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {meusPrograms.map(prog => {
                    const valorReais = (prog.saldo || 0) * 0.01;
                    const diasValidade = prog.validade ? daysUntilDate(prog.validade) : null;
                    const isEditing = editingId === prog.id;

                    return (
                      <div
                        key={prog.id}
                        className="card"
                        style={{
                          padding: '24px',
                          transition: 'all 200ms ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              background: '#F3E8FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 22,
                            }}
                          >
                            {programaTypeIcon(prog.tipo)}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>{prog.nome}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              {prog.tipo}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--purple)', marginBottom: 4 }}>
                          {(prog.saldo || 0).toLocaleString('pt-BR')}
                        </div>
                        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                          ≈ {formatMoney(valorReais)}
                        </div>

                        {diasValidade !== null && (
                          <div
                            style={{
                              fontSize: 12,
                              padding: '6px 12px',
                              borderRadius: 10,
                              display: 'inline-block',
                              marginBottom: 12,
                              background: diasValidade < 30 ? '#FFEBEE' : diasValidade < 90 ? '#FFF8E1' : '#E8F5E9',
                              color: diasValidade < 30 ? '#EF4444' : diasValidade < 90 ? '#F59E0B' : '#00C853',
                              fontWeight: 600,
                            }}
                          >
                            {diasValidade < 30
                              ? `Expira em ${diasValidade} dias!`
                              : diasValidade < 90
                              ? `Atenção: ${diasValidade} dias restantes`
                              : `Válido até ${new Date(prog.validade + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                          </div>
                        )}

                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                            <input
                              type="number"
                              placeholder="Novo saldo"
                              value={editSaldo}
                              onChange={e => setEditSaldo(e.target.value)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: '1.5px solid var(--purple)',
                                borderRadius: 10,
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: "'Inter', sans-serif",
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateSaldo(prog.id)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                border: 'none',
                                background: 'var(--purple)',
                                color: 'white',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              OK
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditSaldo(''); }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid var(--border)',
                                background: 'white',
                                fontSize: 13,
                                cursor: 'pointer',
                              }}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(prog.id); setEditSaldo(String(prog.saldo || 0)); }}
                            style={{
                              marginTop: 4,
                              padding: '8px 16px',
                              borderRadius: 10,
                              border: '1.5px solid var(--border)',
                              background: 'white',
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              width: '100%',
                            }}
                          >
                            Editar saldo
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteConfirm(prog)}
                          style={{
                            marginTop: 8,
                            padding: '8px 16px',
                            borderRadius: 10,
                            border: '1.5px solid #FCA5A5',
                            background: 'white',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#EF4444',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            width: '100%',
                          }}
                        >
                          Remover programa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Calculadora Tab */}
          {activeTab === 'calculadora' && (
            <div style={{ maxWidth: 640 }}>
              <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🧮
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>Quanto vou ganhar?</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Compare pontos entre seus cartões</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                      Valor da compra (R$)
                    </label>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={calcValorDisplay}
                      onChange={e => setCalcValorDisplay(formatInputMoney(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                        transition: 'all 200ms ease',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                      Categoria (opcional)
                    </label>
                    <select
                      value={calcCategoria}
                      onChange={e => setCalcCategoria(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 14,
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                        background: 'white',
                        appearance: 'auto' as React.CSSProperties['appearance'],
                      }}
                    >
                      <option value="">Todas as categorias</option>
                      {CALC_CATEGORIES.filter(c => c !== '').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={handleCalc}
                    disabled={calcLoading}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: calcLoading ? 0.7 : 1,
                      cursor: calcLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {calcLoading ? 'Calculando...' : 'Calcular'}
                  </button>
                </div>
              </div>

              {/* Results */}
              {calcResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                    Ranking para compra de {formatMoney(calcResult.valor)}
                  </h3>

                  {calcResult.ranking.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        Nenhum cartão cadastrado. Adicione cartões primeiro.
                      </p>
                    </div>
                  ) : (
                    calcResult.ranking.map((item, idx) => {
                      const isBest = idx === 0;
                      const msg = getPersonalizedMessage(item, calcResult.melhorCartao, calcResult.ranking);

                      return (
                        <div
                          key={item.cartao_id}
                          className="card"
                          style={{
                            padding: '20px 24px',
                            border: isBest ? '2px solid #00C853' : '1px solid var(--border)',
                            background: isBest ? '#F0FFF4' : 'white',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {isBest && (
                            <div style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: '#00C853',
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              MELHOR
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: `linear-gradient(135deg, ${item.cor} 0%, ${item.cor}CC 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 11,
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              #{idx + 1}
                            </div>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 700 }}>{item.apelido}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {item.banco} · {item.bandeira} · {item.nivel}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 24, marginBottom: msg ? 12 : 0 }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Pontos ganhos</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>
                                {item.pontosGanhos.toLocaleString('pt-BR')}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Valor equivalente</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: '#00C853' }}>
                                {formatMoney(item.valorEquivalente)}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>Taxa</div>
                              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                                {item.pontos_por_real}x
                              </div>
                            </div>
                          </div>

                          {msg && (
                            <div
                              style={{
                                background: isBest ? '#E8F5E9' : '#FFF8E1',
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: 13,
                                color: isBest ? '#2E7D32' : '#F57F17',
                                lineHeight: 1.5,
                              }}
                            >
                              {msg}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Onde Ganhar Tab */}
          {activeTab === 'onde' && (
            <div>
              {CATEGORIAS_ONDE.map(cat => {
                const filtered = programas.filter(p => {
                  try {
                    const cats: string[] = JSON.parse(p.categorias || '[]');
                    return cats.some(c => c.toLowerCase().includes(cat.toLowerCase()));
                  } catch {
                    return false;
                  }
                });

                if (filtered.length === 0) return null;

                return (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#F3E8FF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}>
                        {cat === 'Alimentação' ? '🍔' : cat === 'Combustível' ? '⛽' : cat === 'Supermercado' ? '🛒' : cat === 'Viagens' ? '✈️' : cat === 'Streaming' ? '📺' : cat === 'Farmácia' ? '💊' : '💳'}
                      </span>
                      {cat}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                      {filtered.map(prog => {
                        const hasInteresse = prog.interesse === 1;

                        return (
                          <div
                            key={prog.id}
                            className="card"
                            style={{
                              padding: '20px',
                              transition: 'all 200ms ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <span style={{ fontSize: 24 }}>{programaTypeIcon(prog.tipo)}</span>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>{prog.nome}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{prog.tipo}</div>
                              </div>
                            </div>

                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
                              {prog.beneficios}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <span style={{
                                background: '#E8F5E9',
                                color: '#00C853',
                                padding: '3px 10px',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {prog.pontuacao_media}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                              {prog.link_cadastro && (
                                <a
                                  href={prog.link_cadastro}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    border: '1.5px solid var(--purple)',
                                    background: 'white',
                                    color: 'var(--purple)',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 200ms ease',
                                  }}
                                >
                                  Acessar
                                </a>
                              )}
                              <button
                                onClick={() => handleInteresse(prog.id)}
                                disabled={hasInteresse}
                                style={{
                                  flex: 1,
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  border: 'none',
                                  background: hasInteresse ? '#E8F5E9' : 'var(--purple)',
                                  color: hasInteresse ? '#00C853' : 'white',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: hasInteresse ? 'default' : 'pointer',
                                  transition: 'all 200ms ease',
                                }}
                              >
                                {hasInteresse ? 'Interesse salvo' : 'Tenho Interesse'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Program Modal */}
      {addModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px',
            maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Adicionar Programa</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Programa</label>
                <select
                  value={addProgramaId}
                  onChange={e => setAddProgramaId(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 14, fontFamily: "'Inter', sans-serif",
                    outline: 'none', background: 'white', appearance: 'auto' as React.CSSProperties['appearance'],
                  }}
                >
                  <option value="">Selecione...</option>
                  {programas.filter(p => !p.saldo || p.saldo === 0).map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.tipo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Saldo de pontos</label>
                <input
                  type="number"
                  placeholder="Ex: 50000"
                  value={addSaldo}
                  onChange={e => setAddSaldo(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Data de vencimento (opcional)</label>
                <input
                  type="date"
                  value={addValidade}
                  onChange={e => setAddValidade(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none',
                  }}
                />
              </div>

              {addSaldo && Number(addSaldo) > 0 && (
                <div style={{ background: '#F3E8FF', padding: '12px 16px', borderRadius: 12, fontSize: 14, color: '#7C3AED', fontWeight: 500 }}>
                  Seus {Number(addSaldo).toLocaleString('pt-BR')} pontos valem ~{formatMoney(Number(addSaldo) * 0.01)}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setAddModalOpen(false); setAddProgramaId(''); setAddSaldo(''); setAddValidade(''); }}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12,
                    border: '1.5px solid var(--border)', background: 'white',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAddPrograma}
                  disabled={addSaving}
                  style={{
                    flex: 1, opacity: addSaving ? 0.7 : 1,
                    cursor: addSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {addSaving ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px',
            maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Remover programa?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja remover <strong>{deleteConfirm.nome}</strong>? Seu saldo de pontos será removido.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'white',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePrograma}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: '#EF4444', color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
