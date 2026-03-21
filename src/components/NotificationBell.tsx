'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Alerta {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  lido: number;
  data: string;
}

const TIPO_ICONS: Record<string, string> = {
  pontos: '\u2B50',
  preco: '\uD83D\uDCB0',
  meta: '\uD83C\uDFAF',
  conta: '\uD83D\uDCCB',
  alerta: '\u26A0\uFE0F',
};

export default function NotificationBell() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = alertas.filter(a => !a.lido).length;

  const fetchAlertas = useCallback(async () => {
    try {
      const res = await fetch('/api/alertas');
      if (res.ok) {
        const data = await res.json();
        setAlertas(Array.isArray(data) ? data : (data.alertas || []));
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 60000);
    return () => clearInterval(interval);
  }, [fetchAlertas]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAsRead = async (id: number) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, lido: 1 } : a));
    try {
      await fetch(`/api/alertas/${id}`, { method: 'PUT' });
    } catch {
      // non-critical
    }
  };

  const markAllRead = async () => {
    setAlertas(prev => prev.map(a => ({ ...a, lido: 1 })));
    try {
      await fetch('/api/alertas/read-all', { method: 'PUT' });
    } catch {
      // non-critical
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notificacoes"
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 12,
          border: '1.5px solid var(--border)',
          background: open ? '#F3E8FF' : 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 200ms ease',
        }}
      >
        \uD83D\uDD14
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#EF4444',
              color: 'white',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'white',
            borderRadius: 16,
            border: '1.5px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            zIndex: 500,
            animation: 'bellDropIn 200ms ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700 }}>Notificacoes</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--purple)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {alertas.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>\uD83D\uDD14</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Nenhuma notificacao</p>
            </div>
          ) : (
            alertas.map(a => (
              <button
                key={a.id}
                onClick={() => markAsRead(a.id)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: '1px solid #F3F4F6',
                  background: a.lido ? 'white' : '#FAFAFE',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  transition: 'background 150ms',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                  {TIPO_ICONS[a.tipo] || '\uD83D\uDD14'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: a.lido ? 500 : 700,
                      color: 'var(--text)',
                      marginBottom: 2,
                    }}
                  >
                    {a.titulo}
                  </p>
                  {a.mensagem && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {a.mensagem}
                    </p>
                  )}
                </div>
                {!a.lido && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--purple)',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
              </button>
            ))
          )}

          <style>{`
            @keyframes bellDropIn {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
