'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';

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
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchTransacoes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (activeFilter !== 'TODAS') params.set('status', activeFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

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
  }, [activeFilter, debouncedSearch]);

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
      alert('Preencha a descrição');
      return;
    }
    if (valor <= 0) {
      alert('Preencha o valor');
      return;
    }
    if (!formData.categoria) {
      alert('Selecione uma categoria');
      return;
    }
    if (!formData.data) {
      alert('Preencha a data');
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

      closeModal();
      fetchTransacoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar transação';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTx) return;
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/transacoes/${editingTx.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');

      closeModal();
      fetchTransacoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir transação';
      alert(message);
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
    } catch {
      alert('Erro ao exportar CSV');
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
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                height: 72,
                borderRadius: 16,
                background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
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
      ) : transacoes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {search ? 'Nenhum resultado' : 'Nenhuma transação'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {search
              ? `Nenhuma transação encontrada para "${search}"`
              : 'Comece adicionando sua primeira transação'}
          </p>
          {!search && (
            <button className="btn-primary" onClick={openNewModal}>+ Nova Transação</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transacoes.map(tx => {
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

                {/* Value */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
                onClick={handleDelete}
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
                {deleting ? 'Excluindo...' : '🗑 Excluir'}
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
    </div>
  );
}
