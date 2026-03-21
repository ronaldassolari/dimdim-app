'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastContext';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `+55 (${digits}`;
  if (digits.length <= 7) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface UserConfig {
  id: number;
  username: string;
  nome: string;
  email: string | null;
  whatsapp: string | null;
  plano: string;
  plano_expira: string | null;
  modo_bot: string;
  humor_bot: string;
  horario_lembrete: string;
  horario_relatorio: number;
  avatar_url: string | null;
  created_at: string;
}

const PLANO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  LITE: { label: 'Lite', color: '#3B82F6', bg: '#DBEAFE' },
  LITE_ANUAL: { label: 'Lite Anual', color: '#3B82F6', bg: '#DBEAFE' },
  PRO: { label: 'Pro', color: '#7C3AED', bg: '#F3E8FF' },
  PRO_ANUAL: { label: 'Pro Anual', color: '#7C3AED', bg: '#F3E8FF' },
  TRIAL: { label: 'Trial Pro', color: '#F59E0B', bg: '#FFF8E1' },
};

const MODOS: { key: string; emoji: string; label: string; desc: string }[] = [
  { key: 'normal', emoji: '🤖', label: 'Normal', desc: 'Equilibrio entre economia e qualidade de vida' },
  { key: 'economia', emoji: '💰', label: 'Economia', desc: 'Foco maximo em economizar e cortar gastos' },
  { key: 'investidor', emoji: '📈', label: 'Investidor', desc: 'Prioriza investimentos e crescimento patrimonial' },
];

const HUMORES: { key: string; label: string; desc: string }[] = [
  { key: 'formal', label: 'Formal', desc: 'Comunicacao profissional e direta' },
  { key: 'amigavel', label: 'Amigavel', desc: 'Tom casual e acolhedor' },
  { key: 'humorado', label: 'Humorado', desc: 'Piadas e analogias divertidas' },
];

const FEATURES_LITE = [
  'Cadastro de transacoes',
  'Dashboard basico',
  'Metas financeiras (ate 3)',
  'Academia - trilha Iniciante',
  'Bot WhatsApp basico',
  'Busca de precos',
];

const FEATURES_PRO = [
  'Tudo do Lite +',
  'Metas ilimitadas',
  'Academia completa (3 trilhas)',
  'Bot WhatsApp inteligente',
  'Calculadora de pontos',
  'Plano familiar',
  'Google Agenda',
  'Relatorios avancados',
  'Suporte prioritario',
];

export default function ConfiguracoesPage() {
  const toast = useToast();
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('perfil');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [modoBotForm, setModoBotForm] = useState('normal');
  const [humorBotForm, setHumorBotForm] = useState('amigavel');
  const [horarioLembrete, setHorarioLembrete] = useState('09:00');
  const [horarioRelatorio, setHorarioRelatorio] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const emailValid = email === '' || emailRegex.test(email);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/configuracoes');
      if (!res.ok) throw new Error('Erro ao carregar configuracoes');
      const data = await res.json();
      setConfig(data);
      setNome(data.nome || '');
      setEmail(data.email || '');
      setWhatsapp(data.whatsapp || '');
      setModoBotForm(data.modo_bot || 'normal');
      setHumorBotForm(data.humor_bot || 'amigavel');
      setHorarioLembrete(data.horario_lembrete || '09:00');
      setHorarioRelatorio(data.horario_relatorio || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dimdim-theme');
    const isDark = saved === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dimdim-theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const savePerfil = async () => {
    if (email && !emailRegex.test(email)) {
      setEmailTouched(true);
      return;
    }
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, whatsapp }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      const updated = await res.json();
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Perfil salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar configuracoes.');
    } finally {
      setSaving(false);
    }
  };

  const saveBot = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo_bot: modoBotForm,
          humor_bot: humorBotForm,
          horario_lembrete: horarioLembrete,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      const updated = await res.json();
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Configuracoes do bot salvas!');
    } catch {
      toast.error('Erro ao salvar configuracoes do bot.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'perfil', label: 'Perfil', icon: '👤' },
    { key: 'bot', label: 'Bot', icon: '🤖' },
    { key: 'plano', label: 'Plano', icon: '💎' },
    { key: 'integracoes', label: 'Integracoes', icon: '🔗' },
  ];

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
          <div style={{ width: 240, height: 32, borderRadius: 12, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ width: '100%', height: 56, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 24 }} />
        <div style={{ width: '100%', height: 400, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>{error || 'Erro desconhecido'}</p>
          <button className="btn-primary" onClick={fetchConfig}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  const planoInfo = PLANO_LABELS[config.plano] || PLANO_LABELS.LITE;
  const isTrial = config.plano === 'TRIAL';
  const isPro = ['PRO', 'PRO_ANUAL', 'TRIAL'].includes(config.plano);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Configuracoes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Personalize sua experiencia no DIMDIM
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{darkMode ? '🌙' : '☀️'}</span>
          <button
            onClick={toggleDarkMode}
            style={{
              width: 52,
              height: 28,
              borderRadius: 14,
              background: darkMode ? '#7C3AED' : '#E5E7EB',
              position: 'relative',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 200ms',
            }}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: darkMode ? 27 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                transition: 'all 200ms',
              }}
            />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: '#F3F4F6',
          borderRadius: 16,
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSaveSuccess(false); }}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: active ? 'white' : 'transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--text)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 200ms',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: '#E8F5E9',
            color: '#00C853',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 300ms ease',
          }}
        >
          ✓ Configuracoes salvas com sucesso!
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* PERFIL TAB */}
      {activeTab === 'perfil' && (
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Dados pessoais</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 200ms',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: 40,
                    borderRadius: 12,
                    border: `1px solid ${emailTouched && !emailValid ? '#EF4444' : 'var(--border)'}`,
                    fontSize: 15,
                    outline: 'none',
                    transition: 'border-color 200ms',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = emailTouched && !emailValid ? '#EF4444' : '#7C3AED')}
                />
                {emailTouched && email !== '' && (
                  <span style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 18,
                  }}>
                    {emailValid ? '✅' : '❌'}
                  </span>
                )}
              </div>
              {emailTouched && !emailValid && email !== '' && (
                <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>Email invalido</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                placeholder="+55 (11) 99999-9999"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 200ms',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <button
              className="btn-primary"
              onClick={savePerfil}
              disabled={saving || (email !== '' && !emailValid)}
              style={{ padding: '14px 32px', fontSize: 15, alignSelf: 'flex-start', opacity: saving || (email !== '' && !emailValid) ? 0.6 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </div>
      )}

      {/* BOT TAB */}
      {activeTab === 'bot' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Modo ativo */}
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Modo ativo</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Como o bot deve te ajudar?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {MODOS.map((modo) => {
                const active = modoBotForm === modo.key;
                return (
                  <button
                    key={modo.key}
                    onClick={() => setModoBotForm(modo.key)}
                    style={{
                      padding: '20px 16px',
                      borderRadius: 16,
                      border: `2px solid ${active ? '#7C3AED' : 'var(--border)'}`,
                      background: active ? '#F3E8FF' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 200ms',
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{modo.emoji}</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? '#7C3AED' : 'var(--text)', marginBottom: 4 }}>{modo.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{modo.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Humor */}
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Humor do bot</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Tom de comunicacao preferido</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {HUMORES.map((humor) => {
                const active = humorBotForm === humor.key;
                return (
                  <button
                    key={humor.key}
                    onClick={() => setHumorBotForm(humor.key)}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      padding: '16px',
                      borderRadius: 14,
                      border: `2px solid ${active ? '#00C853' : 'var(--border)'}`,
                      background: active ? '#E8F5E9' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 200ms',
                    }}
                  >
                    <p style={{ fontSize: 15, fontWeight: 700, color: active ? '#00C853' : 'var(--text)', marginBottom: 4 }}>{humor.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{humor.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horarios */}
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Horarios</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Horario do lembrete diario</label>
                <input
                  type="time"
                  value={horarioLembrete}
                  onChange={(e) => setHorarioLembrete(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 15,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Dia do relatorio mensal</label>
                <select
                  value={horarioRelatorio}
                  onChange={(e) => setHorarioRelatorio(Number(e.target.value))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 15,
                    outline: 'none',
                    background: 'white',
                    minWidth: 100,
                  }}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Dia {d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={saveBot}
            disabled={saving}
            style={{ padding: '14px 32px', fontSize: 15, alignSelf: 'flex-start', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Salvando...' : 'Salvar Configuracoes do Bot'}
          </button>
        </div>
      )}

      {/* PLANO TAB */}
      {activeTab === 'plano' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current plan */}
          <div
            className="card"
            style={{
              background: isPro ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>SEU PLANO ATUAL</p>
              <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                {planoInfo.label}
              </h2>
              {isTrial && config.plano_expira && (
                <p style={{ fontSize: 14, opacity: 0.9 }}>
                  Trial Pro ativo ate {new Date(config.plano_expira).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Comparison table */}
          <div className="card" style={{ overflow: 'auto' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Compare os planos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid var(--border)', fontSize: 14, fontWeight: 700 }}>Recurso</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '2px solid var(--border)', fontSize: 14, fontWeight: 700 }}>
                    <span style={{ background: '#DBEAFE', color: '#3B82F6', padding: '4px 12px', borderRadius: 20 }}>Lite</span>
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '2px solid var(--border)', fontSize: 14, fontWeight: 700 }}>
                    <span style={{ background: '#F3E8FF', color: '#7C3AED', padding: '4px 12px', borderRadius: 20 }}>Pro</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Transacoes', true, true],
                  ['Dashboard', true, true],
                  ['Metas financeiras', 'Ate 3', 'Ilimitadas'],
                  ['Academia', 'Iniciante', 'Completa'],
                  ['Bot WhatsApp', 'Basico', 'Inteligente'],
                  ['Busca de precos', true, true],
                  ['Calculadora de pontos', false, true],
                  ['Plano familiar', false, true],
                  ['Google Agenda', false, true],
                  ['Relatorios avancados', false, true],
                  ['Suporte prioritario', false, true],
                ].map(([feature, lite, pro], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'white' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500 }}>{feature as string}</td>
                    <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>
                      {lite === true ? <span style={{ color: '#00C853', fontSize: 18 }}>✓</span> : lite === false ? <span style={{ color: '#D1D5DB' }}>-</span> : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lite as string}</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 16px', fontSize: 14 }}>
                      {pro === true ? <span style={{ color: '#00C853', fontSize: 18 }}>✓</span> : pro === false ? <span style={{ color: '#D1D5DB' }}>-</span> : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{pro as string}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pricing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
              <div
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  border: '2px solid #DBEAFE',
                  textAlign: 'center',
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6', marginBottom: 8 }}>Lite</h4>
                <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>R$ 19,90<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/mes</span></p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ou R$ 169/ano</p>
              </div>
              <div
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  border: '2px solid #DDD6FE',
                  background: '#FAFAFE',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#00C853',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 20,
                }}>
                  1o mes gratis
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>Pro</h4>
                <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>R$ 49,90<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/mes</span></p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>ou R$ 419/ano</p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setShowPlanModal(true)}
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 20 }}
            >
              Mudar plano
            </button>
          </div>
        </div>
      )}

      {/* INTEGRACOES TAB */}
      {activeTab === 'integracoes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Google Agenda */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  📅
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Google Agenda</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sincronize seus lembretes financeiros</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!isPro && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F3E8FF', color: '#7C3AED' }}>
                    Pro
                  </span>
                )}
                <div
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 14,
                    background: isPro ? '#E5E7EB' : '#E5E7EB',
                    position: 'relative',
                    cursor: isPro ? 'pointer' : 'default',
                    opacity: isPro ? 1 : 0.5,
                    transition: 'all 200ms',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 3,
                      left: 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      transition: 'all 200ms',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  📱
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>WhatsApp</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {config.whatsapp ? `Conectado: ${config.whatsapp}` : 'Nao conectado'}
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: config.whatsapp ? '#E8F5E9' : '#FFF8E1',
                  color: config.whatsapp ? '#00C853' : '#F59E0B',
                }}
              >
                {config.whatsapp ? 'Conectado' : 'Pendente'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Plan change modal */}
      <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Mudar Plano">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { key: 'LITE', label: 'Lite Mensal', price: 'R$ 19,90/mes', color: '#3B82F6' },
            { key: 'LITE_ANUAL', label: 'Lite Anual', price: 'R$ 169/ano (R$ 14,08/mes)', color: '#3B82F6' },
            { key: 'PRO', label: 'Pro Mensal', price: 'R$ 49,90/mes - 1o mes gratis', color: '#7C3AED' },
            { key: 'PRO_ANUAL', label: 'Pro Anual', price: 'R$ 419/ano (R$ 34,92/mes)', color: '#7C3AED' },
          ].map((plan) => {
            const current = config.plano === plan.key;
            return (
              <button
                key={plan.key}
                style={{
                  padding: '20px',
                  borderRadius: 16,
                  border: `2px solid ${current ? plan.color : 'var(--border)'}`,
                  background: current ? (plan.color === '#7C3AED' ? '#F3E8FF' : '#DBEAFE') : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.label}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{plan.price}</p>
                  </div>
                  {current && (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: plan.color, color: 'white' }}>
                      Atual
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
            A mudanca de plano sera processada na proxima cobranca.
          </p>
        </div>
      </Modal>
    </div>
  );
}
