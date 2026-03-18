'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setUser(d.user); setLoading(false); })
      .catch(() => { router.push('/login'); });
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} />
      <main className="main-content" style={{ flex: 1, marginLeft: 240, padding: '24px 32px', maxWidth: '100%', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
