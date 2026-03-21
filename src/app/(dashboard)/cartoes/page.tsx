'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastContext';

interface Cartao {
  id: number;
  apelido: string;
  banco: string;
  bandeira: string;
  nivel: string;
  limite: number;
  gasto_mes: number;
  vencimento: number;
  cor: string;
  pontos_por_real: number;
  programas_pontos: string;
  ativo: number;
}

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'GASTO' | 'RECEITA';
  categoria: string;
  status: string;
  data: string;
}

const BANCOS = [
  'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Banco do Brasil', 'Inter', 'C6 Bank',
  'XP', 'BTG Pactual', 'Next', 'PicPay', 'Mercado Pago', 'Neon', 'American Express',
  'Unicred', 'Will Bank', 'Sicoob', 'Sicredi', 'Outro',
];

const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard', 'Diners Club'];

const NIVEIS = ['Standard', 'Gold', 'Platinum', 'Black', 'Infinite', 'Signature', 'Centurion', 'Nanquim', 'Internacional'];

const COR_PRESETS = ['#820AD1', '#1a1a2e', '#0D1B2A', '#1E3A5F', '#2D3436', '#E74C3C', '#00C853', '#F39C12'];

const PROGRAMAS_PONTOS = [
  'Livelo', 'Smiles', 'Latam Pass', 'TudoAzul', 'Dotz', 'Esfera',
  'Stix', 'Elo Mais', 'Rappi', 'Cashback', 'Nenhum',
];

const BANDEIRA_ICONS: Record<string, string> = {
  'Visa': '💳', 'Mastercard': '🔴', 'Elo': '🟡', 'Amex': '🔵',
  'Hipercard': '🟠', 'Diners Club': '⚪',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🍔', 'Transporte': '🚗', 'Saúde': '💊', 'Educação': '📚',
  'Lazer': '🎮', 'Moradia': '🏠', 'Roupas': '👕', 'Eletrônicos': '📱',
  'Serviços': '🔧', 'Investimentos': '📈', 'Salário': '💰', 'Freelance': '💻',
  'Outros': '📦', 'Assinatura': '📺', 'Combustível': '⛽',
};

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

function estimatePontosPorReal(nivel: string): number {
  const n = nivel.toLowerCase();
  if (n === 'standard' || n === 'internacional') return 1;
  if (n === 'gold') return 1.5;
  if (n === 'platinum') return 2;
  if (['black', 'infinite', 'signature', 'centurion', 'nanquim'].includes(n)) return 2.5;
  return 1;
}

function daysUntilVencimento(vencimento: number): number {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), vencimento);
  if (thisMonth <= now) {
    thisMonth.setMonth(thisMonth.getMonth() + 1);
  }
  return Math.ceil((thisMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Estimate R$ value of points (average ~0.02 R$ per point)
const POINT_VALUE_BRL = 0.02;

interface CatalogoCartao {
  id: number;
  banco: string;
  nome: string;
  bandeira: string;
  nivel: string;
  pontos_nacional: number;
  pontos_internacional: number;
  programas_compativeis: string[];
  cashback_percent: number;
  anuidade: number;
  anuidade_condicao: string | null;
  renda_minima: number;
  sala_vip: boolean;
  sala_vip_detalhes: string | null;
  observacoes: string | null;
}

interface FormData {
  apelido: string;
  banco: string;
  bandeira: string;
  nivel: string;
  limiteDisplay: string;
  vencimento: string;
  cor: string;
  programas: string[];
  catalogoId: number | null;
}

const EMPTY_FORM: FormData = {
  apelido: '',
  banco: '',
  bandeira: '',
  nivel: '',
  limiteDisplay: '',
  vencimento: '10',
  cor: '#1a1a2e',
  programas: [],
  catalogoId: null,
};

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

function CardPreview({ form }: { form: FormData }) {
  const limite = parseInputMoney(form.limiteDisplay);
  const ptsPerReal = estimatePontosPorReal(form.nivel);

  return (
    <div
      style={{
        width: '100%',
        minHeight: 160,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${form.cor || '#1a1a2e'} 0%, ${form.cor || '#1a1a2e'}CC 100%)`,
        color: 'white',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 300ms ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }}
      />
      <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>
        {form.banco || 'Banco'}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
        {form.apelido || 'Apelido do cartão'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {form.bandeira && (
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
            {form.bandeira}
          </span>
        )}
        {form.nivel && (
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
            {form.nivel}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        {limite > 0 ? `Limite: ${formatMoney(limite)}` : 'Limite: -'}
      </div>
      {form.nivel && (
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
          ~{ptsPerReal} pts/R$
        </div>
      )}
    </div>
  );
}

// ====== Card Detail Drawer ======
function CardDetailDrawer({
  cartao,
  open,
  onClose,
  onEdit,
  onDelete,
}: {
  cartao: Cartao | null;
  open: boolean;
  onClose: () => void;
  onEdit: (c: Cartao) => void;
  onDelete: (c: Cartao) => void;
}) {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [simulateValue, setSimulateValue] = useState('');

  // Fetch last 5 transactions for this card
  useEffect(() => {
    if (!cartao || !open) { setTransactions([]); return; }
    let cancelled = false;
    setLoadingTx(true);
    fetch(`/api/transacoes?cartao_id=${cartao.id}&limit=5`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return;
        const txList = Array.isArray(data) ? data : (data?.transacoes || []);
        setTransactions(txList.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingTx(false); });
    return () => { cancelled = true; };
  }, [cartao, open]);

  // Reset simulator on card change
  useEffect(() => {
    setSimulateValue('');
  }, [cartao?.id]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!cartao) return null;

  const programas: string[] = (() => {
    try { return JSON.parse(cartao.programas_pontos || '[]'); } catch { return []; }
  })();
  const gastoPercent = cartao.limite > 0 ? (cartao.gasto_mes / cartao.limite) * 100 : 0;
  const barColor = gastoPercent < 60 ? '#00C853' : gastoPercent < 80 ? '#F59E0B' : '#EF4444';
  const diasVencimento = daysUntilVencimento(cartao.vencimento);

  // Points calculation
  const accumulatedPoints = Math.round(cartao.gasto_mes * cartao.pontos_por_real);
  const accumulatedPointsValue = accumulatedPoints * POINT_VALUE_BRL;

  // Simulator
  const simulateAmount = parseInputMoney(simulateValue);
  const simulatedPoints = Math.round(simulateAmount * cartao.pontos_por_real);
  const simulatedPointsValue = simulatedPoints * POINT_VALUE_BRL;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)',
          zIndex: 49,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100%',
          width: 400,
          maxWidth: '100vw',
          background: 'white',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.12)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            background: 'white',
            zIndex: 1,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Detalhes do Cartão</h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--text-secondary)',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FFEBEE')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg)')}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card visual header */}
          <div
            style={{
              borderRadius: 16,
              background: `linear-gradient(135deg, ${cartao.cor} 0%, ${cartao.cor}CC 100%)`,
              color: 'white',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 2 }}>{cartao.banco}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{cartao.apelido}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                {BANDEIRA_ICONS[cartao.bandeira] || '💳'} {cartao.bandeira}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                {cartao.nivel}
              </span>
            </div>
          </div>

          {/* Limit bar */}
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Limite utilizado</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{Math.round(gastoPercent)}%</span>
            </div>
            <div style={{ width: '100%', height: 10, background: '#E5E7EB', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${Math.min(gastoPercent, 100)}%`, height: '100%', background: barColor, borderRadius: 5, transition: 'width 600ms ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>{formatMoney(cartao.gasto_mes)} gasto</span>
              <span>{formatMoney(cartao.limite)} limite</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#00C853', marginTop: 8 }}>
              {formatMoney(Math.max(0, cartao.limite - cartao.gasto_mes))} disponível
            </div>
          </div>

          {/* Due date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: diasVencimento <= 5 ? '#FEF2F2' : 'var(--bg)', borderRadius: 14, padding: 16 }}>
            <span style={{ fontSize: 28 }}>📅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: diasVencimento <= 5 ? '#EF4444' : 'var(--text)' }}>
                Vence em {diasVencimento} {diasVencimento === 1 ? 'dia' : 'dias'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Todo dia {cartao.vencimento}
              </div>
            </div>
          </div>

          {/* Points info */}
          <div style={{ background: '#F3E8FF', borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>⭐</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>
                  {accumulatedPoints.toLocaleString('pt-BR')} pontos acumulados
                </div>
                <div style={{ fontSize: 12, color: '#7C3AED', opacity: 0.7 }}>
                  Valor estimado: ~{formatMoney(accumulatedPointsValue)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#7C3AED', opacity: 0.8 }}>
              Taxa: {cartao.pontos_por_real} pts/R$ gasto
            </div>
            {programas.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {programas.map(p => (
                  <span key={p} style={{ background: 'rgba(124,58,237,0.15)', color: '#7C3AED', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Points simulator */}
          <div style={{ background: '#FFFBEB', borderRadius: 14, padding: 16, border: '1px solid #FDE68A' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              🧮 Simulador de Pontos
            </div>
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#92400E', fontWeight: 600, pointerEvents: 'none' }}>R$</span>
              <input
                type="text"
                placeholder="0,00"
                value={simulateValue}
                onChange={e => setSimulateValue(formatInputMoney(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 40px',
                  borderRadius: 10,
                  border: '1.5px solid #FDE68A',
                  fontSize: 14,
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  background: 'white',
                  transition: 'all 200ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#F59E0B')}
                onBlur={e => (e.currentTarget.style.borderColor = '#FDE68A')}
              />
            </div>
            {simulateAmount > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, color: '#92400E' }}>
                  Você ganharia <strong>{simulatedPoints.toLocaleString('pt-BR')} pontos</strong> = <strong>{formatMoney(simulatedPointsValue)}</strong>
                </div>
                <div style={{ fontSize: 12, color: '#B45309', background: 'rgba(245,158,11,0.1)', padding: '6px 10px', borderRadius: 8 }}>
                  Com este cartão você economizaria {formatMoney(simulatedPointsValue)} nesta compra
                </div>
              </div>
            )}
          </div>

          {/* Last 5 transactions */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              📋 Últimas transações neste cartão
            </div>
            {loadingTx ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 10, background: 'var(--bg)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E5E7EB', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 12, borderRadius: 4, width: '60%', background: '#E5E7EB', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)' }} />
                      <div style={{ height: 10, borderRadius: 4, width: '40%', background: '#E5E7EB', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13, background: 'var(--bg)', borderRadius: 12 }}>
                Nenhuma transação encontrada neste cartão
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 12,
                      background: 'var(--bg)',
                      transition: 'all 200ms ease',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: tx.tipo === 'RECEITA' ? '#E8F5E9' : '#FFEBEE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {CATEGORY_ICONS[tx.categoria] || '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.descricao}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDate(tx.data)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tx.tipo === 'RECEITA' ? '#00C853' : '#EF4444', flexShrink: 0 }}>
                      {tx.tipo === 'RECEITA' ? '+' : '-'}{formatMoney(tx.valor)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
            <button
              onClick={() => { onClose(); onEdit(cartao); }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'white',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => { onClose(); onDelete(cartao); }}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: '1.5px solid #FCA5A5',
                background: 'white',
                fontSize: 14,
                fontWeight: 600,
                color: '#EF4444',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              🗑 Excluir
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}

// ====== Main Page ======
export default function CartoesPage() {
  const toast = useToast();
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [catalogoSearch, setCatalogoSearch] = useState('');
  const [catalogoResults, setCatalogoResults] = useState<CatalogoCartao[]>([]);
  const [showCatalogo, setShowCatalogo] = useState(false);
  const [searchingCatalogo, setSearchingCatalogo] = useState(false);
  const catalogoRef = useRef<HTMLDivElement>(null);
  const [editingCartao, setEditingCartao] = useState<Cartao | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Cartao | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Drawer state
  const [drawerCartao, setDrawerCartao] = useState<Cartao | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (catalogoRef.current && !catalogoRef.current.contains(e.target as Node)) {
        setShowCatalogo(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCartoes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cartoes');
      if (!res.ok) throw new Error('Erro ao carregar cartões');
      const data = await res.json();
      setCartoes(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchCatalogo = useCallback((query: string) => {
    setCatalogoSearch(query);
    if (query.length < 2) { setCatalogoResults([]); setShowCatalogo(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchingCatalogo(true);
      try {
        const res = await fetch(`/api/cartoes/catalogo?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setCatalogoResults(data.cartoes || []);
          setShowCatalogo(true);
        }
      } catch { /* ignore */ }
      setSearchingCatalogo(false);
    }, 300);
  }, []);

  const selectFromCatalogo = (cartao: CatalogoCartao) => {
    const BANCO_CORES: Record<string, string> = {
      'Nubank': '#820AD1', 'Itaú': '#FF6600', 'Bradesco': '#CC092F', 'Santander': '#EC0000',
      'Banco do Brasil': '#FFCC00', 'C6 Bank': '#1a1a2e', 'BTG Pactual': '#0D1B2A',
      'XP': '#FFD700', 'Inter': '#FF7A00', 'Next': '#00C853', 'Neon': '#0088FF',
      'Caixa': '#005CA9', 'PicPay': '#21C25E', 'Mercado Pago': '#009EE3',
      'American Express': '#006FCF', 'Unicred': '#00A651', 'Banescard': '#003399',
    };
    setFormData({
      apelido: cartao.nome,
      banco: cartao.banco,
      bandeira: cartao.bandeira,
      nivel: cartao.nivel,
      limiteDisplay: '',
      vencimento: '10',
      cor: BANCO_CORES[cartao.banco] || '#1a1a2e',
      programas: cartao.programas_compativeis.filter(p => p !== 'Cashback'),
      catalogoId: cartao.id,
    });
    setCatalogoSearch(cartao.nome);
    setShowCatalogo(false);
  };

  const openModal = (cartao?: Cartao) => {
    setEditError('');
    if (cartao) {
      setEditingCartao(cartao);
      let programas: string[] = [];
      try { programas = JSON.parse(cartao.programas_pontos || '[]'); } catch { programas = []; }
      setFormData({
        apelido: cartao.apelido,
        banco: cartao.banco,
        bandeira: cartao.bandeira,
        nivel: cartao.nivel,
        limiteDisplay: cartao.limite > 0 ? cartao.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        vencimento: String(cartao.vencimento),
        cor: cartao.cor,
        programas,
        catalogoId: null,
      });
      setCatalogoSearch('');
    } else {
      setEditingCartao(null);
      setFormData(EMPTY_FORM);
      setCatalogoSearch('');
    }
    setCatalogoResults([]);
    setShowCatalogo(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCartao(null);
    setFormData(EMPTY_FORM);
    setEditError('');
  };

  const updateForm = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePrograma = (programa: string) => {
    setFormData(prev => {
      const current = prev.programas;
      if (programa === 'Nenhum') {
        return { ...prev, programas: current.includes('Nenhum') ? [] : ['Nenhum'] };
      }
      const withoutNenhum = current.filter(p => p !== 'Nenhum');
      if (withoutNenhum.includes(programa)) {
        return { ...prev, programas: withoutNenhum.filter(p => p !== programa) };
      }
      return { ...prev, programas: [...withoutNenhum, programa] };
    });
  };

  const handleSave = async () => {
    if (!formData.apelido.trim()) { setEditError('Preencha o apelido'); return; }
    if (!formData.banco) { setEditError('Selecione o banco'); return; }
    if (!formData.bandeira) { setEditError('Selecione a bandeira'); return; }
    if (!formData.nivel) { setEditError('Selecione o nível'); return; }

    setSaving(true);
    setEditError('');
    try {
      const body = {
        apelido: formData.apelido.trim(),
        banco: formData.banco,
        bandeira: formData.bandeira,
        nivel: formData.nivel,
        limite: parseInputMoney(formData.limiteDisplay),
        vencimento: Number(formData.vencimento) || 10,
        cor: formData.cor,
        programas_pontos: formData.programas.filter(p => p !== 'Nenhum'),
      };

      const url = editingCartao ? `/api/cartoes/${editingCartao.id}` : '/api/cartoes';
      const method = editingCartao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }

      // Optimistic update for edit
      if (editingCartao) {
        const updated = await res.json();
        setCartoes(prev => prev.map(c => c.id === editingCartao.id ? { ...c, ...updated } : c));
      }

      toast.success(editingCartao ? 'Cartao atualizado!' : 'Cartao adicionado!');
      closeModal();
      fetchCartoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cartao';
      setEditError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/cartoes/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        throw new Error('Erro ao excluir cartao');
      }
      // Remove from local state
      setCartoes(prev => prev.filter(c => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast.success('Cartao removido!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDrawer = (cartao: Cartao) => {
    setDrawerCartao(cartao);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Delay clearing cartao so exit animation plays
    setTimeout(() => setDrawerCartao(null), 300);
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
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Meus Cartões</h1>
        <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          + Adicionar Cartão
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          <Skeleton width="100%" height={240} />
          <Skeleton width="100%" height={240} />
          <Skeleton width="100%" height={240} />
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn-primary" onClick={fetchCartoes}>Tentar novamente</button>
        </div>
      ) : cartoes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum cartão cadastrado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Adicione seus cartões para acompanhar gastos e pontos
          </p>
          <button className="btn-primary" onClick={() => openModal()}>+ Adicionar Cartão</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {cartoes.map(cartao => {
            const programas: string[] = (() => {
              try { return JSON.parse(cartao.programas_pontos || '[]'); } catch { return []; }
            })();
            const gastoPercent = cartao.limite > 0 ? (cartao.gasto_mes / cartao.limite) * 100 : 0;
            const barColor = gastoPercent < 60 ? '#00C853' : gastoPercent < 80 ? '#F59E0B' : '#EF4444';
            const diasVencimento = daysUntilVencimento(cartao.vencimento);

            return (
              <div
                key={cartao.id}
                onClick={() => openDrawer(cartao)}
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  transition: 'all 300ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.16)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)';
                }}
              >
                {/* Card top - colored area */}
                <div
                  style={{
                    background: `linear-gradient(135deg, ${cartao.cor} 0%, ${cartao.cor}CC 100%)`,
                    color: 'white',
                    padding: '24px 24px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: -40,
                      right: -40,
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -20,
                      right: 50,
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                    }}
                  />

                  <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, marginBottom: 2 }}>
                    {cartao.banco}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                    {cartao.apelido}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                      {cartao.bandeira}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                      {cartao.nivel}
                    </span>
                  </div>
                </div>

                {/* Card bottom - white area */}
                <div style={{ background: 'white', padding: '20px 24px' }}>
                  {/* Limit bar */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {formatMoney(cartao.gasto_mes)} gasto de {formatMoney(cartao.limite)}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                        {Math.round(gastoPercent)}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(gastoPercent, 100)}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: 4,
                          transition: 'width 600ms ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Vencimento */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>📅</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Vence em <strong style={{ color: diasVencimento <= 5 ? '#EF4444' : 'var(--text)' }}>{diasVencimento} dias</strong>
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Dia {cartao.vencimento}
                    </span>
                  </div>

                  {/* Pontos info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>⭐</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>
                      {cartao.pontos_por_real} pts/R$
                    </span>
                  </div>

                  {/* Programas pills */}
                  {programas.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {programas.map(p => (
                        <span
                          key={p}
                          style={{
                            background: '#F3E8FF',
                            color: '#7C3AED',
                            padding: '3px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openModal(cartao); }}
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border)',
                        background: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(cartao); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #FCA5A5',
                        background: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#EF4444',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Detail Drawer */}
      <CardDetailDrawer
        cartao={drawerCartao}
        open={drawerOpen}
        onClose={closeDrawer}
        onEdit={(c) => openModal(c)}
        onDelete={(c) => setDeleteConfirm(c)}
      />

      {/* Add Card Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingCartao ? 'Editar Cartão' : 'Adicionar Cartão'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Preview */}
          <div>
            <label style={labelStyle}>Preview</label>
            <CardPreview form={formData} />
          </div>

          {/* Catalog Search */}
          <div style={{ position: 'relative' }} ref={catalogoRef}>
            <label style={labelStyle}>Encontre seu cartão</label>
            <input
              style={{ ...inputStyle, borderColor: showCatalogo ? 'var(--purple)' : undefined }}
              type="text"
              placeholder="Digite: Nubank Ultravioleta, Itaú Infinite, C6 Carbon..."
              value={catalogoSearch}
              onChange={e => searchCatalogo(e.target.value)}
              onFocus={() => { if (catalogoResults.length > 0) setShowCatalogo(true); }}
            />
            {searchingCatalogo && (
              <div style={{ position: 'absolute', right: 12, top: 38, color: 'var(--text-secondary)', fontSize: 12 }}>Buscando...</div>
            )}
            {showCatalogo && catalogoResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'white', border: '1.5px solid var(--border)', borderRadius: 12,
                maxHeight: 280, overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                marginTop: 4,
              }}>
                {catalogoResults.map(c => (
                  <button key={c.id} onClick={() => selectFromCatalogo(c)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6', fontSize: 13, fontFamily: "'Inter', sans-serif",
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{c.nome}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.banco}</span>
                      <span style={{ fontSize: 10, background: '#E5E7EB', padding: '1px 6px', borderRadius: 4 }}>{c.bandeira}</span>
                      <span style={{ fontSize: 10, background: '#E5E7EB', padding: '1px 6px', borderRadius: 4 }}>{c.nivel}</span>
                      <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
                        {c.pontos_nacional > 0 ? `${c.pontos_nacional} pts/R$` : c.cashback_percent > 0 ? `${c.cashback_percent}% cashback` : ''}
                      </span>
                      {c.anuidade === 0 && <span style={{ fontSize: 10, background: '#D1FAE5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>Grátis</span>}
                      {c.sala_vip && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 4 }}>VIP</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {formData.catalogoId && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 16px', fontSize: 13, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Preenchido do catálogo. Personalize abaixo.</span>
              <button onClick={() => { setFormData(EMPTY_FORM); setCatalogoSearch(''); }} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Limpar</button>
            </div>
          )}

          {/* Apelido */}
          <div>
            <label style={labelStyle}>Apelido</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Ex: Meu Nubank Black"
              value={formData.apelido}
              onChange={e => updateForm('apelido', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Banco */}
          <div>
            <label style={labelStyle}>Banco</label>
            <select
              style={{ ...inputStyle, appearance: 'auto' }}
              value={formData.banco}
              onChange={e => updateForm('banco', e.target.value)}
            >
              <option value="">Selecione o banco</option>
              {BANCOS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Bandeira */}
          <div>
            <label style={labelStyle}>Bandeira</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BANDEIRAS.map(b => {
                const isActive = formData.bandeira === b;
                return (
                  <button
                    key={b}
                    onClick={() => updateForm('bandeira', b)}
                    style={{
                      padding: '8px 16px',
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
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nível */}
          <div>
            <label style={labelStyle}>Nível</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NIVEIS.map(n => {
                const isActive = formData.nivel === n;
                return (
                  <button
                    key={n}
                    onClick={() => updateForm('nivel', n)}
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
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pontuação automática */}
          {formData.nivel && (
            <div
              style={{
                background: '#F3E8FF',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                color: '#7C3AED',
                fontWeight: 500,
              }}
            >
              Seu cartão {formData.nivel} acumula ~{estimatePontosPorReal(formData.nivel)} pts/R$
            </div>
          )}

          {/* Limite */}
          <div>
            <label style={labelStyle}>Limite (R$)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0,00"
              value={formData.limiteDisplay}
              onChange={e => updateForm('limiteDisplay', formatInputMoney(e.target.value))}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Vencimento */}
          <div>
            <label style={labelStyle}>Dia do vencimento</label>
            <select
              style={{ ...inputStyle, appearance: 'auto' }}
              value={formData.vencimento}
              onChange={e => updateForm('vencimento', e.target.value)}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </select>
          </div>

          {/* Cor */}
          <div>
            <label style={labelStyle}>Cor do cartão</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {COR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => updateForm('cor', c)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: c,
                    border: formData.cor === c ? '3px solid var(--purple)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    boxShadow: formData.cor === c ? '0 0 0 2px white, 0 0 0 4px var(--purple)' : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={formData.cor}
                onChange={e => updateForm('cor', e.target.value)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '2px solid var(--border)',
                  cursor: 'pointer',
                  padding: 2,
                }}
                title="Cor personalizada"
              />
            </div>
          </div>

          {/* Programas de pontos */}
          <div>
            <label style={labelStyle}>Programas de pontos</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PROGRAMAS_PONTOS.map(p => {
                const isActive = formData.programas.includes(p);
                return (
                  <label
                    key={p}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 12,
                      border: `2px solid ${isActive ? 'var(--purple)' : 'var(--border)'}`,
                      background: isActive ? '#F3E8FF' : 'white',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? 'var(--purple)' : 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => togglePrograma(p)}
                      style={{ width: 16, height: 16, accentColor: 'var(--purple)', cursor: 'pointer' }}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>

          {editError && (
            <div style={{ background: '#FFEBEE', color: '#EF4444', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500 }}>
              {editError}
            </div>
          )}

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
            {saving ? 'Salvando...' : editingCartao ? 'Salvar Alterações' : 'Salvar Cartão'}
          </button>
        </div>
      </Modal>

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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Excluir cartão?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja remover <strong>{deleteConfirm.apelido}</strong>? Esta ação não pode ser desfeita.
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
                onClick={handleDelete}
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
