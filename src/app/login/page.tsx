'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
      setError(err.message === 'Credenciais inválidas'
        ? 'Usuário ou senha incorretos. Verifique e tente novamente.'
        : err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome || username, senha: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.success) {
        setSuccess(`Conta criada! Seu login: ${data.user?.username || username}`);
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
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

        {/* Toggle Login/Register */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F3F4F6', borderRadius: 12, padding: 4 }}>
          <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === 'login' ? 'white' : 'transparent', color: mode === 'login' ? '#7C3AED' : '#9CA3AF',
              boxShadow: mode === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 200ms' }}>
            Entrar
          </button>
          <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: mode === 'register' ? 'white' : 'transparent', color: mode === 'register' ? '#7C3AED' : '#9CA3AF',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 200ms' }}>
            Criar conta
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Nome completo</label>
              <input className="input" type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
              {mode === 'login' ? 'Usuário' : 'Escolha um usuário'}
            </label>
            <input className="input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={mode === 'login' ? 'Seu usuário' : 'Ex: joaosilva'} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>
              {mode === 'login' ? 'Senha' : 'Crie uma senha (mín. 6 chars)'}
            </label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required minLength={mode === 'register' ? 6 : undefined} />
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16, textAlign: 'center', background: '#FEF2F2', padding: '10px 16px', borderRadius: 10 }}>{error}</p>}
          {success && <p style={{ color: '#10B981', fontSize: 13, marginBottom: 16, textAlign: 'center', background: '#F0FDF4', padding: '10px 16px', borderRadius: 10 }}>{success}</p>}

          <button className="btn-secondary" type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? (
              <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} /> {mode === 'login' ? 'Entrando...' : 'Criando...'}</>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar conta grátis'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
            Conta demo: <strong>ronald</strong> / <strong>dimdim2026</strong>
          </p>
        )}
      </div>
    </div>
  );
}
