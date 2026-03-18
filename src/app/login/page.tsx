'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #F3E8FF 0%, #E8F5E9 100%)' }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: 400, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#7C3AED' }}>DIMDIM</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>Assistente Financeiro Pessoal</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Usuário</label>
            <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Seu usuário" required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Senha</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required />
          </div>
          {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
          <button className="btn-secondary" type="submit" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 16 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
