'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import confetti from 'canvas-confetti';

interface Meta {
  id: number;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  categoria: string | null;
  prazo: string | null;
  ativa: number;
  created_at: string;
}

interface Badge {
  nome: string;
  descricao: string;
  icone: string;
  earned: boolean;
}

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

function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.ceil(months));
}

function CircularProgress({ progress, size = 140 }: { progress: number; size?: number }) {
  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(progress, 1);
  const offset = circumference * (1 - p);

  const color = p >= 1 ? '#00C853' : p >= 0.6 ? '#00C853' : p >= 0.3 ? '#F59E0B' : '#7C3AED';

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 800ms ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="800"
        fill="#1A1A2E"
      >
        {Math.round(p * 100)}%
      </text>
    </svg>
  );
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

interface FormData {
  titulo: string;
  valorAlvoDisplay: string;
  categoria: string;
  prazo: string;
  valorAtualDisplay: string;
}

const EMPTY_FORM: FormData = {
  titulo: '',
  valorAlvoDisplay: '',
  categoria: '',
  prazo: '',
  valorAtualDisplay: '',
};

const CATEGORIAS_META = [
  'Viagens', 'Investimentos', 'Educação', 'Moradia', 'Veículo',
  'Emergência', 'Tecnologia', 'Saúde', 'Outros',
];

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Update progress inline
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [addValueDisplay, setAddValueDisplay] = useState('');

  // Badge data
  const [badges, setBadges] = useState<Badge[]>([]);

  const fetchMetas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/metas');
      if (!res.ok) throw new Error('Erro ao carregar metas');
      const data = await res.json();
      setMetas(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const computeBadges = useCallback(async () => {
    try {
      const [txRes, cartoesRes, pontosRes, aulasRes] = await Promise.all([
        fetch('/api/transacoes'),
        fetch('/api/cartoes'),
        fetch('/api/pontos'),
        fetch('/api/aulas'),
      ]);

      let receitas = 0;
      let gastos = 0;
      let hasAPagar = false;
      let lessonsDone = 0;
      let numCartoes = 0;
      let numPontos = 0;

      if (txRes.ok) {
        const txData = await txRes.json();
        const txs = Array.isArray(txData) ? txData : [];
        receitas = txs.filter((t: { tipo: string }) => t.tipo === 'RECEITA').reduce((sum: number, t: { valor: number }) => sum + t.valor, 0);
        gastos = txs.filter((t: { tipo: string }) => t.tipo === 'GASTO').reduce((sum: number, t: { valor: number }) => sum + t.valor, 0);
        hasAPagar = txs.some((t: { status: string }) => t.status === 'A_PAGAR');
      }

      if (cartoesRes.ok) {
        const cData = await cartoesRes.json();
        numCartoes = Array.isArray(cData) ? cData.length : 0;
      }

      if (pontosRes.ok) {
        const pData = await pontosRes.json();
        const progs = Array.isArray(pData) ? pData : [];
        numPontos = progs.filter((p: { saldo: number | null }) => p.saldo !== null && p.saldo > 0).length;
      }

      if (aulasRes.ok) {
        const aData = await aulasRes.json();
        if (aData && Array.isArray(aData.aulas)) {
          lessonsDone = aData.aulas.filter((a: { concluida: number }) => a.concluida === 1).length;
        }
      }

      const savedPercent = receitas > 0 ? ((receitas - gastos) / receitas) * 100 : 0;
      const anyGoalAt100 = metas.some(m => m.valor_alvo > 0 && m.valor_atual >= m.valor_alvo);

      const badgeList: Badge[] = [
        {
          nome: 'Poupador do Mês',
          descricao: 'Poupou mais de 20% da renda',
          icone: '💰',
          earned: savedPercent > 20,
        },
        {
          nome: 'Zero Dívidas',
          descricao: 'Nenhuma conta a pagar pendente',
          icone: '🎉',
          earned: !hasAPagar,
        },
        {
          nome: 'Meta Batida',
          descricao: 'Completou uma meta em 100%',
          icone: '🏆',
          earned: anyGoalAt100,
        },
        {
          nome: 'Aluno Dedicado',
          descricao: '3 ou mais aulas concluídas',
          icone: '📚',
          earned: lessonsDone >= 3,
        },
        {
          nome: 'Cartão Master',
          descricao: '3 ou mais cartões cadastrados',
          icone: '💳',
          earned: numCartoes >= 3,
        },
        {
          nome: 'Explorador de Pontos',
          descricao: '3 ou mais programas de pontos',
          icone: '⭐',
          earned: numPontos >= 3,
        },
      ];

      setBadges(badgeList);
    } catch {
      // badges are non-critical
    }
  }, [metas]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  useEffect(() => {
    if (!loading && metas.length >= 0) {
      computeBadges();
    }
  }, [loading, metas, computeBadges]);

  const openModal = () => {
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(EMPTY_FORM);
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) { alert('Preencha o título'); return; }
    const valorAlvo = parseInputMoney(formData.valorAlvoDisplay);
    if (valorAlvo <= 0) { alert('Preencha o valor alvo'); return; }

    setSaving(true);
    try {
      const body = {
        titulo: formData.titulo.trim(),
        valor_alvo: valorAlvo,
        valor_atual: parseInputMoney(formData.valorAtualDisplay),
        categoria: formData.categoria || null,
        prazo: formData.prazo || null,
      };

      const res = await fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }

      closeModal();
      fetchMetas();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar meta';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (meta: Meta) => {
    const addValue = parseInputMoney(addValueDisplay);
    if (addValue <= 0) { alert('Informe um valor'); return; }

    const newValue = meta.valor_atual + addValue;
    const wasBelow = meta.valor_atual < meta.valor_alvo;

    try {
      const res = await fetch(`/api/metas/${meta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_atual: newValue }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      setUpdatingId(null);
      setAddValueDisplay('');
      fetchMetas();

      // Trigger confetti if just reached 100%
      if (wasBelow && newValue >= meta.valor_alvo) {
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 300);
      }
    } catch {
      alert('Erro ao atualizar progresso');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid var(--border)',
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    background: 'white',
    transition: 'all 200ms ease',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Metas & Conquistas</h1>
        <button className="btn-primary" onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          + Nova Meta
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          <Skeleton width="100%" height={320} />
          <Skeleton width="100%" height={320} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn-primary" onClick={fetchMetas}>Tentar novamente</button>
        </div>
      ) : (
        <>
          {/* Goals grid */}
          {metas.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhuma meta criada</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                Crie sua primeira meta e comece a acompanhar seu progresso
              </p>
              <button className="btn-primary" onClick={openModal}>+ Nova Meta</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 40 }}>
              {metas.map(meta => {
                const progress = meta.valor_alvo > 0 ? meta.valor_atual / meta.valor_alvo : 0;
                const isComplete = progress >= 1;
                const isUpdating = updatingId === meta.id;
                const monthsLeft = meta.prazo ? monthsUntil(meta.prazo) : null;
                const monthlyNeeded = monthsLeft && meta.valor_alvo > meta.valor_atual
                  ? (meta.valor_alvo - meta.valor_atual) / monthsLeft
                  : 0;

                return (
                  <div
                    key={meta.id}
                    className="card"
                    style={{
                      padding: '28px',
                      textAlign: 'center',
                      transition: 'all 300ms ease',
                      border: isComplete ? '2px solid #00C853' : undefined,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                    }}
                  >
                    {isComplete && (
                      <div style={{
                        background: '#E8F5E9',
                        color: '#00C853',
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-block',
                        marginBottom: 16,
                      }}>
                        Meta Atingida!
                      </div>
                    )}

                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                      {meta.titulo}
                    </h3>

                    {meta.categoria && (
                      <span style={{
                        background: '#F3E8FF',
                        color: '#7C3AED',
                        padding: '4px 12px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'inline-block',
                        marginBottom: 16,
                      }}>
                        {meta.categoria}
                      </span>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <CircularProgress progress={progress} size={140} />
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                      <span style={{ color: 'var(--purple)' }}>{formatMoney(meta.valor_atual)}</span>
                      {' '}de{' '}
                      <span style={{ color: 'var(--text)' }}>{formatMoney(meta.valor_alvo)}</span>
                    </p>

                    {meta.prazo && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                        Prazo: {new Date(meta.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    {/* IA suggestion */}
                    {!isComplete && monthlyNeeded > 0 && (
                      <div
                        style={{
                          background: '#F3E8FF',
                          padding: '10px 16px',
                          borderRadius: 12,
                          fontSize: 13,
                          color: '#7C3AED',
                          marginBottom: 16,
                          lineHeight: 1.5,
                        }}
                      >
                        Guarde {formatMoney(monthlyNeeded)}/mês para atingir no prazo
                      </div>
                    )}

                    {/* Update progress */}
                    {isUpdating ? (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          type="text"
                          placeholder="R$ 0,00"
                          value={addValueDisplay}
                          onChange={e => setAddValueDisplay(formatInputMoney(e.target.value))}
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            border: '1.5px solid var(--purple)',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                            fontFamily: "'Inter', sans-serif",
                          }}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateProgress(meta); }}
                        />
                        <button
                          onClick={() => handleUpdateProgress(meta)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 10,
                            border: 'none',
                            background: '#00C853',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => { setUpdatingId(null); setAddValueDisplay(''); }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: 'white',
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setUpdatingId(meta.id); setAddValueDisplay(''); }}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          padding: '12px 18px',
                          borderRadius: 12,
                          border: '1.5px solid var(--border)',
                          background: 'white',
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                        }}
                      >
                        Atualizar progresso
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Badges section */}
          {badges.length > 0 && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Conquistas</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {badges.map(badge => (
                  <div
                    key={badge.nome}
                    className="card"
                    style={{
                      padding: '24px 20px',
                      textAlign: 'center',
                      transition: 'all 200ms ease',
                      filter: badge.earned ? 'none' : 'grayscale(1)',
                      opacity: badge.earned ? 1 : 0.5,
                    }}
                    onMouseEnter={e => {
                      if (badge.earned) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                    }}
                  >
                    <div style={{ fontSize: 44, marginBottom: 12 }}>{badge.icone}</div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{badge.nome}</h4>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {badge.descricao}
                    </p>
                    {badge.earned && (
                      <div style={{
                        marginTop: 10,
                        background: '#E8F5E9',
                        color: '#00C853',
                        padding: '4px 12px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'inline-block',
                      }}>
                        Conquistado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Nova Meta">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Título */}
          <div>
            <label style={labelStyle}>Título</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Ex: Viagem para Europa"
              value={formData.titulo}
              onChange={e => updateForm('titulo', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Valor Alvo */}
          <div>
            <label style={labelStyle}>Valor alvo (R$)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0,00"
              value={formData.valorAlvoDisplay}
              onChange={e => updateForm('valorAlvoDisplay', formatInputMoney(e.target.value))}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Categoria */}
          <div>
            <label style={labelStyle}>Categoria</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIAS_META.map(c => {
                const isActive = formData.categoria === c;
                return (
                  <button
                    key={c}
                    onClick={() => updateForm('categoria', isActive ? '' : c)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 12,
                      border: `2px solid ${isActive ? 'var(--purple)' : 'var(--border)'}`,
                      background: isActive ? '#F3E8FF' : 'white',
                      color: isActive ? 'var(--purple)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prazo */}
          <div>
            <label style={labelStyle}>Prazo</label>
            <input
              style={inputStyle}
              type="date"
              value={formData.prazo}
              onChange={e => updateForm('prazo', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Valor Atual (opcional) */}
          <div>
            <label style={labelStyle}>Valor atual (opcional)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0,00"
              value={formData.valorAtualDisplay}
              onChange={e => updateForm('valorAtualDisplay', formatInputMoney(e.target.value))}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Save button */}
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              opacity: saving ? 0.7 : 1,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Salvando...' : 'Criar Meta'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
