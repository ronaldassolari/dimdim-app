'use client';

import { useEffect, useState, useCallback } from 'react';

interface Saldo {
  receitas: number;
  gastos: number;
  aReceber: number;
  aPagar: number;
  saldo: number;
}

interface GraficoPonto {
  dia: number;
  realizado: number | null;
  projetado: number;
}

interface Meta {
  id: number;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  categoria: string | null;
  progresso: number;
}

interface Pontos {
  total: number;
  valorReais: number;
}

interface DashboardData {
  saldo: Saldo;
  grafico: GraficoPonto[];
  metas: Meta[];
  pontos: Pontos;
  insights: string[];
  alertas: number;
}

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  status: string;
  data: string;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🍔', 'Transporte': '🚗', 'Saúde': '💊', 'Educação': '📚',
  'Lazer': '🎮', 'Moradia': '🏠', 'Roupas': '👕', 'Eletrônicos': '📱',
  'Serviços': '🔧', 'Investimentos': '📈', 'Salário': '💰', 'Freelance': '💻',
  'Outros': '📦', 'Assinatura': '📺', 'Combustível': '⛽',
};

const INSIGHT_ICONS = ['💡', '📊', '🎯', '⭐', '🔔'];

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function Skeleton({ width, height }: { width: string | number; height: string | number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 12,
        background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

function CircularProgress({ progress, size = 100 }: { progress: number; size?: number }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#00C853"
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="800"
        fill="#1A1A2E"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

function MiniChart({ grafico }: { grafico: GraficoPonto[] }) {
  const width = 700;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 70 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = grafico.flatMap(p => [
    p.realizado !== null ? p.realizado : null,
    p.projetado,
  ]).filter((v): v is number => v !== null);

  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(...allValues, 1);
  const range = maxVal - minVal || 1;

  const toX = (dia: number) => padding.left + ((dia - 1) / Math.max(grafico.length - 1, 1)) * chartW;
  const toY = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH;

  const realizadoPoints = grafico
    .filter(p => p.realizado !== null)
    .map(p => `${toX(p.dia)},${toY(p.realizado as number)}`)
    .join(' ');

  const projetadoPoints = grafico
    .map(p => `${toX(p.dia)},${toY(p.projetado)}`)
    .join(' ');

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minVal + (range / yTicks) * i;
    return { val, y: toY(val) };
  });

  const xStep = Math.ceil(grafico.length / 10);
  const xLabels = grafico.filter((_, i) => i % xStep === 0 || i === grafico.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {yLabels.map((tick, i) => (
        <g key={i}>
          <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="#E5E7EB" strokeWidth="1" />
          <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" fontSize="11" fill="#6B7280">
            {tick.val >= 1000 || tick.val <= -1000
              ? `${(tick.val / 1000).toFixed(1)}k`
              : tick.val.toFixed(0)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabels.map(p => (
        <text key={p.dia} x={toX(p.dia)} y={height - 8} textAnchor="middle" fontSize="11" fill="#6B7280">
          {p.dia}
        </text>
      ))}

      {/* Projetado line (dashed gray) */}
      <polyline
        points={projetadoPoints}
        fill="none"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeDasharray="6 4"
      />

      {/* Realizado line (solid green) */}
      {realizadoPoints && (
        <polyline
          points={realizadoPoints}
          fill="none"
          stroke="#00C853"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Dots on realizado */}
      {grafico
        .filter(p => p.realizado !== null)
        .filter((_, i, arr) => i === arr.length - 1 || i % xStep === 0)
        .map(p => (
          <circle
            key={p.dia}
            cx={toX(p.dia)}
            cy={toY(p.realizado as number)}
            r="4"
            fill="#00C853"
            stroke="white"
            strokeWidth="2"
          />
        ))}

      {/* Legend */}
      <g transform={`translate(${padding.left}, ${padding.top - 16})`}>
        <line x1="0" y1="0" x2="20" y2="0" stroke="#00C853" strokeWidth="2.5" />
        <text x="26" y="4" fontSize="11" fill="#6B7280">Realizado</text>
        <line x1="100" y1="0" x2="120" y2="0" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6 4" />
        <text x="126" y="4" fontSize="11" fill="#6B7280">Projetado</text>
      </g>
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentTx, setRecentTx] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  const now = new Date();
  const [mesAtual, setMesAtual] = useState(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [ano, mesNum] = mesAtual.split('-').map(Number);
  const mesLabel = `${MESES[mesNum - 1]} ${ano}`;

  const navigateMonth = (dir: number) => {
    const d = new Date(ano, mesNum - 1 + dir, 1);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, txRes, userRes] = await Promise.all([
        fetch(`/api/dashboard?mes=${mesAtual}`),
        fetch(`/api/transacoes?mes=${mesAtual}`),
        fetch('/api/auth/me'),
      ]);

      if (!dashRes.ok) throw new Error('Erro ao carregar dashboard');

      const dashData = await dashRes.json();
      setData(dashData);

      if (txRes.ok) {
        const txData = await txRes.json();
        const txList = Array.isArray(txData) ? txData : (txData.transacoes || []);
        setRecentTx(txList.slice(0, 5));
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserName(userData.user?.name || '');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [mesAtual]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="fade-in" role="status" aria-label="Carregando dashboard" style={{ padding: '0' }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div style={{ marginBottom: 32 }}>
          <Skeleton width={300} height={32} />
          <div style={{ marginTop: 8 }}><Skeleton width={180} height={16} /></div>
        </div>
        <div style={{ marginBottom: 24 }}><Skeleton width="100%" height={180} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={120} />
        </div>
        <Skeleton width="100%" height={300} />
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
          <button className="btn-primary" onClick={fetchData}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { saldo, grafico, metas, pontos, insights } = data;
  const firstName = userName.split(' ')[0] || 'Usuário';
  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const metaPrincipal = metas.length > 0 ? metas[0] : null;

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, textTransform: 'capitalize' }}>
          {todayStr}
        </p>
      </div>

      {/* Hero Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            right: 60,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
          <button
            aria-label="Mes anterior"
            onClick={() => navigateMonth(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 200ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            ‹
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', minWidth: 140, textAlign: 'center' }}>
            {mesLabel}
          </span>
          <button
            aria-label="Proximo mes"
            onClick={() => navigateMonth(1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 200ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
          >
            ›
          </button>
        </div>

        {/* Saldo */}
        <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Saldo do mês</p>
          <p style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>
            {formatMoney(saldo.saldo)}
          </p>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ background: 'rgba(0,200,83,0.2)', color: '#B9F6CA', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            ↑ Entradas {formatMoney(saldo.receitas)}
          </span>
          <span style={{ background: 'rgba(239,68,68,0.2)', color: '#FFCDD2', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            ↓ Saídas {formatMoney(saldo.gastos)}
          </span>
          <span style={{ background: 'rgba(59,130,246,0.2)', color: '#BBDEFB', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            ◷ A Receber {formatMoney(saldo.aReceber)}
          </span>
          <span style={{ background: 'rgba(245,158,11,0.2)', color: '#FFF9C4', padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            ◷ A Pagar {formatMoney(saldo.aPagar)}
          </span>
        </div>
      </div>

      {/* 4-card grid */}
      <section
        aria-label="Resumo financeiro"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Entradas */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📈
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Entradas</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#00C853', marginBottom: 4 }}>
            {formatMoney(saldo.receitas)}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            previsto: {formatMoney(saldo.receitas + saldo.aReceber)}
          </p>
        </div>

        {/* Saídas */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              📉
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Saídas</span>
            {saldo.gastos > saldo.receitas * 0.8 && (
              <span style={{ marginLeft: 'auto', fontSize: 18 }} title="Gastos acima da média">⚠️</span>
            )}
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>
            {formatMoney(saldo.gastos)}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            previsto: {formatMoney(saldo.gastos + saldo.aPagar)}
          </p>
        </div>

        {/* Economia do mês (pontos) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              ⭐
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Economia do mês</span>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--purple)', marginBottom: 4 }}>
            {formatMoney(pontos.valorReais)}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {pontos.total.toLocaleString('pt-BR')} pontos acumulados
          </p>
        </div>

        {/* Meta principal */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              🎯
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Meta principal</span>
          </div>
          {metaPrincipal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CircularProgress progress={metaPrincipal.progresso / 100} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{metaPrincipal.titulo}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatMoney(metaPrincipal.valor_atual)} de {formatMoney(metaPrincipal.valor_alvo)}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhuma meta ativa</p>
              <a href="/metas" style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>
                Criar meta +
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Chart + Insights */}
      <section
        aria-label="Grafico e insights"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Chart */}
        <div className="card" style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Fluxo diário</h3>
          {grafico.length > 0 ? (
            <MiniChart grafico={grafico} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              Sem dados para exibir
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Insights</h3>
          {insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {insights.map((text, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'var(--bg)',
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1.2, flexShrink: 0 }}>
                    {INSIGHT_ICONS[i % INSIGHT_ICONS.length]}
                  </span>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nenhum insight disponível ainda.</p>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section aria-label="Ultimas transacoes" className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Últimas transações</h3>
          <a
            href="/transacoes"
            style={{ fontSize: 13, color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}
          >
            Ver todas →
          </a>
        </div>

        {recentTx.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentTx.map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: tx.tipo === 'RECEITA' ? '#E8F5E9' : '#FFEBEE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[tx.categoria] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tx.descricao}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {tx.categoria} · {formatDate(tx.data)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: tx.tipo === 'RECEITA' ? '#00C853' : '#EF4444',
                    }}
                  >
                    {tx.tipo === 'RECEITA' ? '+' : '-'} {formatMoney(tx.valor)}
                  </p>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background:
                        tx.status === 'PAGO' || tx.status === 'RECEBIDO'
                          ? '#E8F5E9'
                          : '#FFF8E1',
                      color:
                        tx.status === 'PAGO' || tx.status === 'RECEBIDO'
                          ? '#00C853'
                          : '#F59E0B',
                    }}
                  >
                    {tx.status === 'PAGO' ? 'Pago' : tx.status === 'RECEBIDO' ? 'Recebido' : tx.status === 'A_PAGAR' ? 'A pagar' : 'A receber'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhuma transação neste mês</p>
          </div>
        )}
      </section>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: '1fr 320px'"],
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
