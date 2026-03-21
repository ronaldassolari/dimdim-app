'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastContext';

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'GASTO' | 'RECEITA';
  categoria: string;
  status: string;
  data: string;
  cartao_id: number | null;
  recorrente: number;
  frequencia: string | null;
  observacoes: string | null;
}

interface Cartao {
  id: number;
  apelido: string;
  banco: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Alimentação': '🍔', 'Transporte': '🚗', 'Saúde': '💊', 'Educação': '📚',
  'Lazer': '🎮', 'Moradia': '🏠', 'Roupas': '👕', 'Eletrônicos': '📱',
  'Serviços': '🔧', 'Investimentos': '📈', 'Salário': '💰', 'Freelance': '💻',
  'Outros': '📦', 'Assinatura': '📺', 'Combustível': '⛽',
};

const CATEGORIAS = Object.keys(CATEGORY_ICONS);

const STATUS_LABELS: Record<string, string> = {
  PAGO: 'Pago',
  RECEBIDO: 'Recebido',
  A_PAGAR: 'A pagar',
  A_RECEBER: 'A receber',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PAGO: { bg: '#E8F5E9', color: '#00C853' },
  RECEBIDO: { bg: '#E8F5E9', color: '#00C853' },
  A_PAGAR: { bg: '#FFF8E1', color: '#F59E0B' },
  A_RECEBER: { bg: '#E3F2FD', color: '#3B82F6' },
};

type FilterTab = 'TODAS' | 'PAGO' | 'A_PAGAR' | 'RECEBIDO' | 'A_RECEBER';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PAGO', label: 'Pagas' },
  { key: 'A_PAGAR', label: 'A Pagar' },
  { key: 'RECEBIDO', label: 'Recebidas' },
  { key: 'A_RECEBER', label: 'A Receber' },
];

const FREQUENCIAS = [
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'ANUAL', label: 'Anual' },
];

type DateFilterKey = 'TODAS' | 'HOJE' | '7_DIAS' | 'ESTE_MES' | 'ESTE_ANO' | 'CUSTOM';

const DATE_FILTER_TABS: { key: DateFilterKey; label: string }[] = [
  { key: 'TODAS', label: 'Todas as datas' },
  { key: 'HOJE', label: 'Hoje' },
  { key: '7_DIAS', label: '7 dias' },
  { key: 'ESTE_MES', label: 'Este mês' },
  { key: 'ESTE_ANO', label: 'Este ano' },
  { key: 'CUSTOM', label: 'Personalizado' },
];

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
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

function getDateRange(key: DateFilterKey): { de: string; ate: string } | null {
  if (key === 'TODAS') return null;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  switch (key) {
    case 'HOJE':
      return { de: today, ate: today };
    case '7_DIAS': {
      const sevenAgo = new Date(now);
      sevenAgo.setDate(sevenAgo.getDate() - 6);
      return { de: sevenAgo.toISOString().slice(0, 10), ate: today };
    }
    case 'ESTE_MES': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { de: firstDay.toISOString().slice(0, 10), ate: today };
    }
    case 'ESTE_ANO': {
      const firstOfYear = new Date(now.getFullYear(), 0, 1);
      return { de: firstOfYear.toISOString().slice(0, 10), ate: today };
    }
    default:
      return null;
  }
}

interface FormData {
  descricao: string;
  valorDisplay: string;
  tipo: 'GASTO' | 'RECEITA';
  categoria: string;
  data: string;
  cartao_id: string;
  recorrente: boolean;
  frequencia: string;
  observacoes: string;
}

const EMPTY_FORM: FormData = {
  descricao: '',
  valorDisplay: '',
  tipo: 'GASTO',
  categoria: '',
  data: new Date().toISOString().slice(0, 10),
  cartao_id: '',
  recorrente: false,
  frequencia: 'MENSAL',
  observacoes: '',
};

export default function TransacoesPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('TODAS');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transacao | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const toast = useToast();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('TODAS');
  const [customDateDe, setCustomDateDe] = useState('');
  const [customDateAte, setCustomDateAte] = useState('');

  // Compute effective date range
  const effectiveDateRange = useMemo(() => {
    if (dateFilter === 'CUSTOM') {
      return (customDateDe || customDateAte)
        ? { de: customDateDe || '', ate: customDateAte || '' }
        : null;
    }
    return getDateRange(dateFilter);
  }, [dateFilter, customDateDe, customDateAte]);

  const fetchTransacoes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'TODAS') params.set('status', activeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (effectiveDateRange?.de) params.set('data_de', effectiveDateRange.de);
      if (effectiveDateRange?.ate) params.set('data_ate', effectiveDateRange.ate);

      const res = await fetch(`/api/transacoes?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar transações');

      const data = await res.json();
      setTransacoes(Array.isArray(data) ? data : (data.transacoes || []));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, debouncedSearch, effectiveDateRange]);

  const fetchCartoes = useCallback(async () => {
    try {
      const res = await fetch('/api/cartoes');
      if (res.ok) {
        const data = await res.json();
        setCartoes(Array.isArray(data) ? data : []);
      }
    } catch {
      // cartoes is optional
    }
  }, []);

  useEffect(() => {
    fetchCartoes();
  }, [fetchCartoes]);

  useEffect(() => {
    fetchTransacoes();
  }, [fetchTransacoes]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  // Client-side filtered results (additional case-insensitive filtering for local responsiveness)
  const filteredTransacoes = useMemo(() => {
    if (!debouncedSearch) return transacoes;
    const q = debouncedSearch.toLowerCase();
    return transacoes.filter(tx =>
      tx.descricao.toLowerCase().includes(q) ||
      tx.categoria.toLowerCase().includes(q)
    );
  }, [transacoes, debouncedSearch]);

  const openNewModal = () => {
    setEditingTx(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (tx: Transacao) => {
    setEditingTx(tx);
    setFormData({
      descricao: tx.descricao,
      valorDisplay: (tx.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tipo: tx.tipo,
      categoria: tx.categoria,
      data: tx.data,
      cartao_id: tx.cartao_id ? String(tx.cartao_id) : '',
      recorrente: !!tx.recorrente,
      frequencia: tx.frequencia || 'MENSAL',
      observacoes: tx.observacoes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTx(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    const valor = parseInputMoney(formData.valorDisplay);
    if (!formData.descricao.trim()) {
      toast.warning('Preencha a descricao');
      return;
    }
    if (valor <= 0) {
      toast.warning('Preencha o valor');
      return;
    }
    if (!formData.categoria) {
      toast.warning('Selecione uma categoria');
      return;
    }
    if (!formData.data) {
      toast.warning('Preencha a data');
      return;
    }

    setSaving(true);
    try {
      const status = formData.tipo === 'GASTO'
        ? (formData.data <= new Date().toISOString().slice(0, 10) ? 'PAGO' : 'A_PAGAR')
        : (formData.data <= new Date().toISOString().slice(0, 10) ? 'RECEBIDO' : 'A_RECEBER');

      const body = {
        descricao: formData.descricao.trim(),
        valor,
        tipo: formData.tipo,
        categoria: formData.categoria,
        status,
        data: formData.data,
        cartao_id: formData.cartao_id ? Number(formData.cartao_id) : null,
        recorrente: formData.recorrente,
        frequencia: formData.recorrente ? formData.frequencia : null,
        observacoes: formData.observacoes.trim() || null,
      };

      let res: Response;
      if (editingTx) {
        res = await fetch(`/api/transacoes/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/transacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }

      toast.success(editingTx ? 'Transacao atualizada!' : 'Transacao criada!');
      closeModal();
      fetchTransacoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar transacao';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTx) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/transacoes/${editingTx.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');

      toast.success('Transacao excluida!');
      setDeleteConfirmOpen(false);
      closeModal();
      fetchTransacoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir transacao';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'TODAS') params.set('status', activeFilter);

      const res = await fetch(`/api/transacoes/export?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao exportar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exportado!');
    } catch {
      toast.error('Erro ao exportar CSV');
    }
  };

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const hasActiveDateFilter = dateFilter !== 'TODAS';

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Transações</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            📥 Exportar CSV
          </button>
          <button className="btn-primary" onClick={openNewModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            + Nova Transação
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: 'none',
                fontSize: 13,
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

      {/* Date filter */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: hasActiveDateFilter && dateFilter === 'CUSTOM' ? 10 : 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 14, marginRight: 4 }}>📅</span>
          {DATE_FILTER_TABS.map(tab => {
            const isActive = dateFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setDateFilter(tab.key);
                  if (tab.key !== 'CUSTOM') {
                    setCustomDateDe('');
                    setCustomDateAte('');
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  border: isActive ? '1.5px solid #3B82F6' : '1.5px solid transparent',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  background: isActive ? '#EFF6FF' : 'var(--bg)',
                  color: isActive ? '#3B82F6' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
          {hasActiveDateFilter && dateFilter !== 'CUSTOM' && (
            <button
              onClick={() => { setDateFilter('TODAS'); setCustomDateDe(''); setCustomDateAte(''); }}
              style={{
                padding: '4px 8px',
                borderRadius: 8,
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#FEE2E2',
                color: '#EF4444',
              }}
            >
              Limpar
            </button>
          )}
        </div>
        {dateFilter === 'CUSTOM' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>De</span>
            <input
              type="date"
              value={customDateDe}
              onChange={e => setCustomDateDe(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                background: 'white',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Até</span>
            <input
              type="date"
              value={customDateAte}
              onChange={e => setCustomDateAte(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                fontSize: 13,
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
                background: 'white',
              }}
            />
            {(customDateDe || customDateAte) && (
              <button
                onClick={() => { setCustomDateDe(''); setCustomDateAte(''); setDateFilter('TODAS'); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: '#FEE2E2',
                  color: '#EF4444',
                }}
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>
          🔍
        </span>
        <input
          className="input"
          type="text"
          placeholder="Buscar transação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 20px',
                borderRadius: 16,
                background: 'white',
                boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                <div
                  style={{
                    height: 14,
                    borderRadius: 6,
                    width: '70%',
                    background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
                <div
                  style={{
                    height: 10,
                    borderRadius: 5,
                    width: '45%',
                    background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              </div>
              <div
                style={{
                  width: 80,
                  height: 16,
                  borderRadius: 6,
                  alignSelf: 'center',
                  background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error}</p>
          <button className="btn-primary" onClick={fetchTransacoes}>Tentar novamente</button>
        </div>
      ) : filteredTransacoes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {search || hasActiveDateFilter ? 'Nenhum resultado' : 'Nenhuma transação'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {search
              ? `Nenhuma transação encontrada para "${search}"`
              : hasActiveDateFilter
                ? 'Nenhuma transação encontrada para o período selecionado'
                : 'Comece adicionando sua primeira transação'}
          </p>
          {!search && !hasActiveDateFilter && (
            <button className="btn-primary" onClick={openNewModal}>+ Nova Transação</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTransacoes.map(tx => {
            const statusStyle = STATUS_STYLES[tx.status] || STATUS_STYLES.PAGO;
            return (
              <div
                key={tx.id}
                className="card"
                onClick={() => openEditModal(tx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: tx.tipo === 'RECEITA' ? '#E8F5E9' : '#FFEBEE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[tx.categoria] || '📦'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: 2,
                    }}
                  >
                    {tx.descricao}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {tx.categoria} · {formatDate(tx.data)}
                    {tx.recorrente ? ' · 🔄' : ''}
                  </p>
                </div>

                {/* Value + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: tx.tipo === 'RECEITA' ? '#00C853' : '#EF4444',
                        marginBottom: 4,
                      }}
                    >
                      {tx.tipo === 'RECEITA' ? '+' : '-'} {formatMoney(tx.valor)}
                    </p>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 10,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {STATUS_LABELS[tx.status] || tx.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(tx); }}
                    title="Editar"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: '1.5px solid var(--border)',
                      background: 'white',
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 200ms ease',
                      flexShrink: 0,
                    }}
                  >
                    ✏️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingTx ? 'Editar Transação' : 'Nova Transação'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Description */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="Ex: Almoço no restaurante"
              value={formData.descricao}
              onChange={e => updateForm('descricao', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Value */}
          <div>
            <label style={labelStyle}>Valor (R$)</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="0,00"
              value={formData.valorDisplay}
              onChange={e => updateForm('valorDisplay', formatInputMoney(e.target.value))}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Type toggle */}
          <div>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['GASTO', 'RECEITA'] as const).map(tipo => {
                const isActive = formData.tipo === tipo;
                return (
                  <button
                    key={tipo}
                    onClick={() => updateForm('tipo', tipo)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 12,
                      border: `2px solid ${isActive ? (tipo === 'GASTO' ? '#EF4444' : '#00C853') : 'var(--border)'}`,
                      background: isActive ? (tipo === 'GASTO' ? '#FFEBEE' : '#E8F5E9') : 'white',
                      color: isActive ? (tipo === 'GASTO' ? '#EF4444' : '#00C853') : 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                    }}
                  >
                    {tipo === 'GASTO' ? '↓ Gasto' : '↑ Receita'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category grid */}
          <div>
            <label style={labelStyle}>Categoria</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 8,
              }}
            >
              {CATEGORIAS.map(cat => {
                const isActive = formData.categoria === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => updateForm('categoria', cat)}
                    title={cat}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 4px',
                      borderRadius: 12,
                      border: `2px solid ${isActive ? 'var(--purple)' : 'transparent'}`,
                      background: isActive ? '#F3E8FF' : 'var(--bg)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      fontSize: 22,
                    }}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? 'var(--purple)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>Data</label>
            <input
              style={inputStyle}
              type="date"
              value={formData.data}
              onChange={e => updateForm('data', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Card selector */}
          {cartoes.length > 0 && (
            <div>
              <label style={labelStyle}>Cartão (opcional)</label>
              <select
                style={{ ...inputStyle, appearance: 'auto' }}
                value={formData.cartao_id}
                onChange={e => updateForm('cartao_id', e.target.value)}
              >
                <option value="">Sem cartão</option>
                {cartoes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.apelido} ({c.banco})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurrent */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.recorrente}
                  onChange={e => updateForm('recorrente', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--purple)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Transação recorrente</span>
              </label>
            </div>
            {formData.recorrente && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FREQUENCIAS.map(f => {
                  const isActive = formData.frequencia === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => updateForm('frequencia', f.value)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isActive ? 'var(--purple)' : 'var(--bg)',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        transition: 'all 200ms ease',
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Notas adicionais..."
              value={formData.observacoes}
              onChange={e => updateForm('observacoes', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--purple)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {editingTx && (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleting}
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1.5px solid #EF4444',
                  background: deleting ? '#FFEBEE' : 'white',
                  color: '#EF4444',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}
              >
                {deleting ? 'Excluindo...' : '\uD83D\uDDD1 Excluir'}
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                opacity: saving ? 0.7 : 1,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving
                ? 'Salvando...'
                : editingTx
                  ? 'Salvar alterações'
                  : 'Criar transação'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Excluir transacao?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir <strong>{editingTx?.descricao}</strong>? Esta acao nao pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'white',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: '#EF4444', color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
