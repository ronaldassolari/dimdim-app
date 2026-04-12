'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  plan: string;
  bot_mode: string;
}

interface SidebarProps {
  user: User;
}

const menuItems = [
  { href: '/', icon: '🏠', label: 'Início' },
  { href: '/assistente', icon: '🤖', label: 'Assessor IA' },
  { href: '/transacoes', icon: '💳', label: 'Transações' },
  { href: '/cartoes', icon: '🪪', label: 'Cartões' },
  { href: '/pontos', icon: '⭐', label: 'Pontos' },
  { href: '/metas', icon: '🎯', label: 'Metas' },
  { href: '/buscas', icon: '🔍', label: 'Busca de Preços' },
  { href: '/familia', icon: '👨‍👩‍👧‍👦', label: 'Família' },
  { href: '/academia', icon: '📚', label: 'Academia' },
  { href: '/configuracoes', icon: '⚙️', label: 'Configurações' },
];

const mobileItems = [
  { href: '/', icon: '🏠', label: 'Início' },
  { href: '/assistente', icon: '🤖', label: 'Assessor' },
  { href: '/transacoes', icon: '💳', label: 'Transações' },
  { href: '/cartoes', icon: '🪪', label: 'Cartões' },
  { href: '/configuracoes', icon: '⚙️', label: 'Mais' },
];

const planLabels: Record<string, { label: string; class: string }> = {
  free: { label: 'Free', class: 'pill-blue' },
  plus: { label: 'Plus', class: 'pill-green' },
  premium: { label: 'Premium', class: 'pill-purple' },
  family: { label: 'Family', class: 'pill-yellow' },
};

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const planInfo = planLabels[user?.plan] || planLabels.free;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: 240,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          background: '#FFFFFF',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          zIndex: 50,
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 8 }}>
          <span style={{ fontSize: 28 }}>💰</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)' }}>DIMDIM</span>
        </div>

        {/* User Card */}
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '14px 12px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--purple), var(--green))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Usuário'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                @{user?.username || 'user'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`pill ${planInfo.class}`} style={{ fontSize: 11, padding: '3px 10px' }}>
              {planInfo.label}
            </span>
            {user?.bot_mode === 'active' && (
              <span className="pill pill-green" style={{ fontSize: 11, padding: '3px 10px' }}>
                🤖 Bot ON
              </span>
            )}
          </div>
        </div>

        {/* Menu Links */}
        <nav aria-label="Menu principal" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--danger)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            width: '100%',
            marginTop: 8,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FFEBEE')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚪</span>
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Menu mobile"
        className="mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          background: '#FFFFFF',
          borderTop: '1px solid var(--border)',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 100,
          boxShadow: '0 -2px 20px rgba(0,0,0,0.06)',
        }}
      >
        {mobileItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 12px',
                borderRadius: 12,
                textDecoration: 'none',
                color: active ? 'var(--purple)' : 'var(--text-secondary)',
                transition: 'all 200ms ease',
                fontSize: 10,
                fontWeight: active ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
