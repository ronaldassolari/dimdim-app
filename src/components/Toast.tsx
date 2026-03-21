'use client';

import { useToast, ToastItem } from './ToastContext';

const STYLES: Record<string, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', icon: '\u2713' },
  error:   { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '\u2717' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '!' },
  info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: 'i' },
};

function ToastMessage({ toast }: { toast: ToastItem }) {
  const s = STYLES[toast.type];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 18px',
        borderRadius: 12,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        fontSize: 14,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        animation: toast.leaving ? 'toastOut 200ms ease forwards' : 'toastIn 200ms ease',
        maxWidth: 380,
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: s.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {s.icon}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <ToastMessage key={t.id} toast={t} />
        ))}
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(40px); }
        }
      `}</style>
    </>
  );
}
