'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';

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

export default function CartoesPage() {
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

  const openModal = () => {
    setFormData(EMPTY_FORM);
    setCatalogoSearch('');
    setCatalogoResults([]);
    setShowCatalogo(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormData(EMPTY_FORM);
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
    if (!formData.apelido.trim()) { alert('Preencha o apelido'); return; }
    if (!formData.banco) { alert('Selecione o banco'); return; }
    if (!formData.bandeira) { alert('Selecione a bandeira'); return; }
    if (!formData.nivel) { alert('Selecione o nível'); return; }

    setSaving(true);
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

      const res = await fetch('/api/cartoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar');
      }

      closeModal();
      fetchCartoes();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cartão';
      alert(message);
    } finally {
      setSaving(false);
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
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Meus Cartões</h1>
        <button className="btn-primary" onClick={openModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <button className="btn-primary" onClick={openModal}>+ Adicionar Cartão</button>
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
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
                  transition: 'all 300ms ease',
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Card Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Adicionar Cartão">
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
            {saving ? 'Salvando...' : 'Salvar Cartão'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
