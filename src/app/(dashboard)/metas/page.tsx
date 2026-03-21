'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ToastContext';

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

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.ceil(months));
}

function CircularProgress({ progress, size = 140, animate = true }: { progress: number; size?: number; animate?: boolean }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;
  const p = Math.min(animate ? animatedProgress : progress, 1);
  const offset = circumference * (1 - p);

  // Color thresholds: <25% red, 25-75% yellow, >75% green
  const color = p >= 1 ? '#00C853' : p > 0.75 ? '#00C853' : p >= 0.25 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    if (!animate) return;
    // Animate from 0 to target
    setAnimatedProgress(0);
    const target = Math.min(progress, 1);
    const duration = 1200; // ms
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedProgress(target * eased);
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, [progress, animate]);

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
        style={{ transition: 'stroke 400ms ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="800"
        fill={color}
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
  const toast = useToast();
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

  // Track achieved metas for confetti
  const previousMetasRef = useRef<Meta[]>([]);

  const fetchMetas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/metas');
      if (!res.ok) throw new Error('Erro ao carregar metas');
      const data = await res.json();
      const metasArray = Array.isArray(data) ? data : [];
      // Ensure numeric types
      const parsed = metasArray.map((m: Meta) => ({
        ...m,
        valor_alvo: Number(m.valor_alvo),
        valor_atual: Number(m.valor_atual),
        ativa: Number(m.ativa),
      }));
      setMetas(parsed);
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
        receitas = txs.filter((t: { tipo: string }) => t.tipo === 'RECEITA').reduce((sum: number, t: { valor: number }) => sum + Number(t.valor), 0);
        gastos = txs.filter((t: { tipo: string }) => t.tipo === 'GASTO').reduce((sum: number, t: { valor: number }) => sum + Number(t.valor), 0);
        hasAPagar = txs.some((t: { status: string }) => t.status === 'A_PAGAR');
      }

      if (cartoesRes.ok) {
        const cData = await cartoesRes.json();
        numCartoes = Array.isArray(cData) ? cData.length : 0;
      }

      if (pontosRes.ok) {
        const pData = await pontosRes.json();
        const progs = Array.isArray(pData) ? pData : [];
        numPontos = progs.filter((p: { saldo: number | null }) => p.saldo !== null && Number(p.saldo) > 0).length;
      }

      if (aulasRes.ok) {
        const aData = await aulasRes.json();
        // aulas endpoint returns object with trilhas, each having aulas array
        if (aData && typeof aData === 'object') {
          for (const trilha of Object.values(aData) as { aulas: { concluida: boolean }[] }[]) {
            if (trilha.aulas) {
              lessonsDone += trilha.aulas.filter((a) => a.concluida).length;
            }
          }
        }
      }

      const savedPercent = receitas > 0 ? ((receitas - gastos) / receitas) * 100 : 0;
      const anyGoalAt100 = metas.some(m => m.valor_alvo > 0 && m.valor_atual >= m.valor_alvo);

      const badgeList: Badge[] = [
        {
          nome: 'Poupador do Mes',
          descricao: 'Poupou mais de 20% da renda',
          icone: '💰',
          earned: savedPercent > 20,
        },
        {
          nome: 'Zero Dividas',
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
          descricao: '3 ou mais aulas concluidas',
          icone: '📚',
          earned: lessonsDone >= 3,
        },
        {
          nome: 'Cartao Master',
          descricao: '3 ou mais cartoes cadastrados',
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

  // Check if any meta just achieved 100% and fire confetti
  useEffect(() => {
    const prev = previousMetasRef.current;
    if (prev.length > 0 && metas.length > 0) {
      for (const meta of metas) {
        if (meta.valor_alvo > 0 && meta.valor_atual >= meta.valor_alvo) {
          const prevMeta = prev.find(m => m.id === meta.id);
          if (prevMeta && prevMeta.valor_atual < prevMeta.valor_alvo) {
            // This meta just reached 100%!
            setTimeout(() => {
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 } });
            }, 400);
          }
        }
      }
    }
    previousMetasRef.current = metas;
  }, [metas]);

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

  const [deleteMetaConfirm, setDeleteMetaConfirm] = useState<number | null>(null);
  const [deleteMetaLoading, setDeleteMetaLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.titulo.trim()) { toast.warning('Preencha o titulo'); return; }
    const valorAlvo = parseInputMoney(formData.valorAlvoDisplay);
    if (valorAlvo <= 0) { toast.warning('Preencha o valor alvo'); return; }

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

      toast.success('Meta criada!');
      closeModal();
      fetchMetas();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar meta';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (meta: Meta) => {
    const addValue = parseInputMoney(addValueDisplay);
    if (addValue <= 0) { toast.warning('Informe um valor'); return; }

    const newValue = meta.valor_atual + addValue;

    try {
      const res = await fetch(`/api/metas/${meta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_atual: newValue }),
      });

      if (!res.ok) throw new Error('Erro ao atualizar');

      // Optimistic update for instant feedback
      setMetas(prev => prev.map(m =>
        m.id === meta.id ? { ...m, valor_atual: newValue } : m
      ));

      setUpdatingId(null);
      setAddValueDisplay('');
      toast.success('Progresso atualizado!');

      // Also re-fetch to ensure consistency
      fetchMetas();
    } catch {
      toast.error('Erro ao atualizar progresso');
    }
  };

  const handleDeleteMeta = async (id: number) => {
    setDeleteMetaLoading(true);
    try {
      const res = await fetch(`/api/metas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      toast.success('Meta excluida!');
      setDeleteMetaConfirm(null);
      fetchMetas();
    } catch {
      toast.error('Erro ao excluir meta');
    } finally {
      setDeleteMetaLoading(false);
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

  // Summary stats
  const totalMetas = metas.length;
  const metasAtingidas = metas.filter(m => m.valor_alvo > 0 && m.valor_atual >= m.valor_alvo).length;
  const totalAlvo = metas.reduce((sum, m) => sum + m.valor_alvo, 0);
  const totalAtual = metas.reduce((sum, m) => sum + Math.min(m.valor_atual, m.valor_alvo), 0);
  const overallProgress = totalAlvo > 0 ? totalAtual / totalAlvo : 0;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(0, 200, 83, 0.3); }
          50% { box-shadow: 0 0 20px rgba(0, 200, 83, 0.6); }
        }
        @keyframes celebrateBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
          {/* Summary bar */}
          {metas.length > 0 && (
            <div className="card" style={{ marginBottom: 24, padding: '20px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
                    Progresso geral
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.round(overallProgress * 100)}%`,
                        height: '100%',
                        borderRadius: 5,
                        background: overallProgress > 0.75 ? 'linear-gradient(90deg, #00C853, #69F0AE)' : overallProgress >= 0.25 ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : 'linear-gradient(90deg, #EF4444, #FCA5A5)',
                        transition: 'width 800ms ease',
                      }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', minWidth: 40 }}>
                      {Math.round(overallProgress * 100)}%
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>{totalMetas}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Metas</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#00C853' }}>{metasAtingidas}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Atingidas</p>
                </div>
                <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{formatMoney(totalAtual)}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>de {formatMoney(totalAlvo)}</p>
                </div>
              </div>
            </div>
          )}

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
                const remaining = Math.max(0, meta.valor_alvo - meta.valor_atual);
                const days = meta.prazo ? daysUntil(meta.prazo) : null;
                const monthsLeft = meta.prazo ? monthsUntil(meta.prazo) : null;
                const monthlyNeeded = monthsLeft && remaining > 0
                  ? remaining / monthsLeft
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
                      animation: isComplete ? 'pulseGlow 3s ease infinite' : undefined,
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = isComplete
                        ? '0 8px 32px rgba(0,200,83,0.2)'
                        : '0 8px 32px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteMetaConfirm(meta.id); }}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'white',
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        transition: 'all 200ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#FFEBEE'; e.currentTarget.style.color = '#EF4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      title="Excluir meta"
                    >
                      x
                    </button>

                    {isComplete && (
                      <div style={{
                        background: '#E8F5E9',
                        color: '#00C853',
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 16,
                        animation: 'celebrateBounce 2s ease infinite',
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
                      <CircularProgress progress={progress} size={140} animate={true} />
                    </div>

                    <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ color: 'var(--purple)' }}>{formatMoney(meta.valor_atual)}</span>
                      {' '}de{' '}
                      <span style={{ color: 'var(--text)' }}>{formatMoney(meta.valor_alvo)}</span>
                    </p>

                    {/* Remaining amount */}
                    {!isComplete && remaining > 0 && (
                      <p style={{
                        fontSize: 13,
                        color: '#EF4444',
                        fontWeight: 600,
                        marginBottom: 8,
                      }}>
                        Faltam {formatMoney(remaining)} para atingir a meta
                      </p>
                    )}

                    {/* Deadline countdown */}
                    {meta.prazo && (
                      <div style={{ marginBottom: 8 }}>
                        {days !== null && days > 0 ? (
                          <p style={{
                            fontSize: 13,
                            color: days <= 30 ? '#EF4444' : days <= 90 ? '#F59E0B' : 'var(--text-secondary)',
                            fontWeight: 600,
                          }}>
                            {isComplete ? (
                              <>Prazo: {new Date(meta.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}</>
                            ) : (
                              <>Vence em {days} dia{days !== 1 ? 's' : ''}</>
                            )}
                          </p>
                        ) : days !== null && days <= 0 && !isComplete ? (
                          <p style={{
                            fontSize: 13,
                            color: '#EF4444',
                            fontWeight: 700,
                          }}>
                            Prazo vencido!
                          </p>
                        ) : meta.prazo && isComplete ? (
                          <p style={{ fontSize: 13, color: '#00C853', fontWeight: 600 }}>
                            Concluída antes do prazo!
                          </p>
                        ) : null}
                      </div>
                    )}

                    {/* Monthly suggestion */}
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
                        Guarde {formatMoney(monthlyNeeded)}/mes para atingir no prazo
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
          {/* Titulo */}
          <div>
            <label style={labelStyle}>Titulo</label>
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

      {/* Delete Confirmation Dialog */}
      {deleteMetaConfirm !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Excluir meta?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir esta meta? Esta acao nao pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteMetaConfirm(null)}
                disabled={deleteMetaLoading}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'white',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMeta(deleteMetaConfirm)}
                disabled={deleteMetaLoading}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: '#EF4444', color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: deleteMetaLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteMetaLoading ? 0.7 : 1,
                }}
              >
                {deleteMetaLoading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
