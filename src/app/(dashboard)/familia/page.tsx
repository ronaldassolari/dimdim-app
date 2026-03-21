'use client';

import { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/ToastContext';

interface Membro {
  id: number;
  dono_id: number;
  nome_membro: string;
  email_membro: string;
  codigo_convite: string;
  permissao: string;
  status: string;
  gastos_mes?: number;
  created_at: string;
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://dimdim-snowy.vercel.app';

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE: { label: 'Pendente', color: '#F59E0B', bg: '#FFF8E1' },
  ATIVO: { label: 'Aceito', color: '#00C853', bg: '#E8F5E9' },
  EXPIRADO: { label: 'Expirado', color: '#EF4444', bg: '#FFEBEE' },
};

const PERMISSAO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: '#7C3AED', bg: '#F3E8FF' },
  ver_tudo: { label: 'Ver Tudo', color: '#3B82F6', bg: '#DBEAFE' },
  proprio: { label: 'Somente Proprio', color: '#6B7280', bg: '#F3F4F6' },
};

export default function FamiliaPage() {
  const toast = useToast();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editMembro, setEditMembro] = useState<Membro | null>(null);
  const [inviteResult, setInviteResult] = useState<Membro | null>(null);
  const [saving, setSaving] = useState(false);

  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPermissao, setFormPermissao] = useState('proprio');
  const [editPermissao, setEditPermissao] = useState('proprio');
  const [removeConfirmId, setRemoveConfirmId] = useState<number | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchMembros = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/familia');
      if (!res.ok) throw new Error('Erro ao carregar membros');
      const data = await res.json();
      setMembros(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembros();
  }, [fetchMembros]);

  const handleInvite = async () => {
    if (!formNome.trim() || !formEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/familia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_membro: formNome.trim(),
          email_membro: formEmail.trim(),
          permissao: formPermissao,
        }),
      });
      if (!res.ok) throw new Error('Erro ao convidar');
      const newMembro = await res.json();
      setInviteResult(newMembro);
      setMembros((prev) => [newMembro, ...prev]);
    } catch {
      toast.error('Erro ao enviar convite. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editMembro) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/familia/${editMembro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissao: editPermissao }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar');
      const updated = await res.json();
      setMembros((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setShowEdit(false);
      setEditMembro(null);
    } catch {
      toast.error('Erro ao atualizar membro.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    setRemoveLoading(true);
    try {
      const res = await fetch(`/api/familia/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover');
      setMembros((prev) => prev.filter((m) => m.id !== id));
      toast.success('Membro removido!');
      setRemoveConfirmId(null);
    } catch {
      toast.error('Erro ao remover membro.');
    } finally {
      setRemoveLoading(false);
    }
  };

  const openInviteModal = () => {
    setFormNome('');
    setFormEmail('');
    setFormPermissao('proprio');
    setInviteResult(null);
    setShowInvite(true);
  };

  const openEditModal = (membro: Membro) => {
    setEditMembro(membro);
    setEditPermissao(membro.permissao);
    setShowEdit(true);
  };

  const maxGasto = Math.max(...membros.map((m) => m.gastos_mes || 0), 1);

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
          <div style={{ width: 200, height: 32, borderRadius: 12, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ width: '100%', height: 100, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', marginBottom: 16 }} />
        ))}
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
          <button className="btn-primary" onClick={fetchMembros}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Família</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Gerencie os membros do seu plano familiar
          </p>
        </div>
        <button className="btn-primary" onClick={openInviteModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>+</span> Convidar Membro
        </button>
      </div>

      {/* Info Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)',
          border: '1px solid #DDD6FE',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>👨‍👩‍👧‍👦</span>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED' }}>
              {membros.length <= 2 ? `${membros.length} pessoa${membros.length !== 1 ? 's' : ''} incluida${membros.length !== 1 ? 's' : ''} no plano.` : `${membros.length} membros no plano familiar.`}
            </p>
            <p style={{ fontSize: 13, color: '#6D28D9' }}>
              2 pessoas incluidas no plano. +R$ 5/mes por membro adicional a partir do 3o.
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      {membros.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👨‍👩‍👧‍👦</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Nenhum membro ainda</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Convide familiares para acompanhar as financas juntos.
          </p>
          <button className="btn-primary" onClick={openInviteModal}>Convidar primeiro membro</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {membros.map((membro) => {
            const permInfo = PERMISSAO_LABELS[membro.permissao] || PERMISSAO_LABELS.proprio;
            const statusInfo = STATUS_BADGES[membro.status] || STATUS_BADGES.PENDENTE;
            return (
              <div
                key={membro.id}
                className="card"
                style={{ padding: '20px 24px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--purple), var(--green))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {membro.nome_membro.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{membro.nome_membro}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: permInfo.bg,
                          color: permInfo.color,
                        }}
                      >
                        {permInfo.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{membro.email_membro}</p>
                  </div>

                  {/* Gastos */}
                  <div style={{ textAlign: 'right', minWidth: 120 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>Gastos do mes</p>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>
                      {formatMoney(membro.gastos_mes || 0)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEditModal(membro)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 200ms',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setRemoveConfirmId(membro.id)}
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
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FFEBEE')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      title="Remover"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spending comparison chart */}
      {membros.length > 0 && (
        <div className="card" style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Gastos por membro</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {membros.map((membro) => {
              const gasto = membro.gastos_mes || 0;
              const pct = maxGasto > 0 ? (gasto / maxGasto) * 100 : 0;
              return (
                <div key={membro.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{membro.nome_membro}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>{formatMoney(gasto)}</span>
                  </div>
                  <div style={{ width: '100%', height: 12, borderRadius: 6, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        height: '100%',
                        borderRadius: 6,
                        background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                        transition: 'width 600ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Convidar Membro">
        {inviteResult ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Convite enviado!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              Compartilhe o código abaixo com {inviteResult.nome_membro}:
            </p>

            <div
              style={{
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                borderRadius: 16,
                padding: '24px 20px',
                marginBottom: 24,
              }}
            >
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>CODIGO DO CONVITE</p>
              <p style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: 3 }}>{inviteResult.codigo_convite}</p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Você foi convidado para o DimDim Família! Use o código: ${inviteResult.codigo_convite} para entrar. Baixe em: ${APP_URL}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 28px',
                  borderRadius: 16,
                  background: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'all 200ms',
                }}
              >
                <span style={{ fontSize: 22 }}>📱</span> Enviar via WhatsApp
              </a>

              <button
                onClick={() => {
                  const text = `Você foi convidado para o DimDim Família! Use o código: ${inviteResult.codigo_convite} para entrar. Baixe em: ${APP_URL}`;
                  navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: copied ? '#E8F5E9' : 'white',
                  color: copied ? '#00C853' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                {copied ? '✓ Copiado!' : '📋 Copiar link'}
              </button>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nome do membro</label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex: Maria Silva"
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
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="maria@email.com"
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
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Permissao</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['admin', 'ver_tudo', 'proprio'] as const).map((perm) => {
                  const info = PERMISSAO_LABELS[perm];
                  const active = formPermissao === perm;
                  return (
                    <button
                      key={perm}
                      onClick={() => setFormPermissao(perm)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: 12,
                        border: `2px solid ${active ? info.color : 'var(--border)'}`,
                        background: active ? info.bg : 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? info.color : 'var(--text-secondary)',
                        transition: 'all 200ms',
                      }}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleInvite}
              disabled={saving || !formNome.trim() || !formEmail.trim()}
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 8, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Enviando...' : 'Gerar Convite'}
            </button>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditMembro(null); }} title="Editar Membro">
        {editMembro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', background: 'var(--bg)', borderRadius: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--purple), var(--green))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {editMembro.nome_membro.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{editMembro.nome_membro}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{editMembro.email_membro}</p>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Permissao</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['admin', 'ver_tudo', 'proprio'] as const).map((perm) => {
                  const info = PERMISSAO_LABELS[perm];
                  const active = editPermissao === perm;
                  return (
                    <button
                      key={perm}
                      onClick={() => setEditPermissao(perm)}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        borderRadius: 12,
                        border: `2px solid ${active ? info.color : 'var(--border)'}`,
                        background: active ? info.bg : 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? info.color : 'var(--text-secondary)',
                        transition: 'all 200ms',
                      }}
                    >
                      {info.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleEdit}
              disabled={saving}
              style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 8, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        )}
      </Modal>

      {/* Remove Confirmation Dialog */}
      {removeConfirmId !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32,
            maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Remover membro?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              Tem certeza que deseja remover este membro da familia?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setRemoveConfirmId(null)}
                disabled={removeLoading}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  border: '1.5px solid var(--border)', background: 'white',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRemove(removeConfirmId)}
                disabled={removeLoading}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, border: 'none',
                  background: '#EF4444', color: 'white', fontSize: 14,
                  fontWeight: 600, cursor: removeLoading ? 'not-allowed' : 'pointer',
                  opacity: removeLoading ? 0.7 : 1,
                }}
              >
                {removeLoading ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
