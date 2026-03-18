'use client';
import { useEffect, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(2px)',
          animation: 'overlayIn 200ms ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 300ms ease',
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
            background: '#FFFFFF',
            zIndex: 1,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
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
        <div style={{ padding: 24, flex: 1 }}>{children}</div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
