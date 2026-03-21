'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ToastContext';

interface Aula {
  id: number;
  trilha: string;
  numero: number;
  titulo: string;
  concluida: boolean;
  quiz_score: number;
  acessivel: boolean;
  badge_nome: string | null;
  data_conclusao: string | null;
}

interface Trilha {
  trilha: string;
  acessivel: boolean;
  aulas: Aula[];
}

interface AulaDetalhe {
  id: number;
  trilha: string;
  numero: number;
  titulo: string;
  conteudo: string;
  quiz: { pergunta: string; opcoes: string[]; correta: number }[];
  badge_nome: string | null;
}

interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  message: string;
}

const TRILHA_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string; gradient: string }> = {
  iniciante: { label: 'Iniciante', emoji: '🌱', color: '#00C853', bg: '#E8F5E9', gradient: 'linear-gradient(135deg, #00C853, #69F0AE)' },
  moderado: { label: 'Moderado', emoji: '📊', color: '#3B82F6', bg: '#DBEAFE', gradient: 'linear-gradient(135deg, #3B82F6, #93C5FD)' },
  avancado: { label: 'Avancado', emoji: '🚀', color: '#7C3AED', bg: '#F3E8FF', gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)' },
};

export default function AcademiaPage() {
  const toast = useToast();
  const [trilhas, setTrilhas] = useState<Record<string, Trilha>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTrilha, setExpandedTrilha] = useState<string | null>(null);
  const [selectedAula, setSelectedAula] = useState<AulaDetalhe | null>(null);
  const [loadingAula, setLoadingAula] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState<string | null>(null);

  const fetchTrilhas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/aulas');
      if (!res.ok) throw new Error('Erro ao carregar aulas');
      const data = await res.json();
      setTrilhas(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrilhas();
  }, [fetchTrilhas]);

  const openAula = async (aulaId: number) => {
    setLoadingAula(true);
    setQuizAnswers([]);
    setQuizResult(null);
    try {
      const res = await fetch(`/api/aulas/${aulaId}`);
      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao abrir aula');
        return;
      }
      const data = await res.json();
      setSelectedAula(data);
      setQuizAnswers(new Array(data.quiz?.length || 0).fill(null));
    } catch {
      toast.error('Erro ao carregar aula.');
    } finally {
      setLoadingAula(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedAula) return;
    if (quizAnswers.some((a) => a === null)) {
      toast.warning('Responda todas as perguntas antes de enviar.');
      return;
    }
    setSubmittingQuiz(true);
    try {
      const res = await fetch(`/api/aulas/${selectedAula.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: quizAnswers }),
      });
      if (!res.ok) throw new Error('Erro ao enviar quiz');
      const result = await res.json();
      setQuizResult(result);

      if (result.passed) {
        // Refresh trilhas to update progress
        const trilhaRes = await fetch('/api/aulas');
        if (trilhaRes.ok) {
          const updatedTrilhas = await trilhaRes.json();
          setTrilhas(updatedTrilhas);

          // Check if track is now complete
          const currentTrilha = updatedTrilhas[selectedAula.trilha];
          if (currentTrilha) {
            const allDone = currentTrilha.aulas.every((a: Aula) => a.concluida);
            if (allDone && selectedAula.badge_nome) {
              setShowBadgeAnimation(selectedAula.badge_nome);
              setTimeout(() => setShowBadgeAnimation(null), 4000);
            }
          }
        }
      }
    } catch {
      toast.error('Erro ao enviar quiz.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const renderContent = (conteudo: string) => {
    return conteudo.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h2 key={i} style={{ fontSize: 22, fontWeight: 800, marginTop: 24, marginBottom: 12, color: 'var(--text)' }}>{trimmed.slice(2)}</h2>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={i} style={{ fontSize: 18, fontWeight: 700, marginTop: 20, marginBottom: 10, color: 'var(--text)' }}>{trimmed.slice(3)}</h3>;
      }
      if (trimmed.startsWith('### ')) {
        return <h4 key={i} style={{ fontSize: 16, fontWeight: 700, marginTop: 16, marginBottom: 8, color: 'var(--text)' }}>{trimmed.slice(4)}</h4>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, paddingLeft: 8 }}>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>&#x2022;</span>
            <span style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>{trimmed.slice(2)}</span>
          </div>
        );
      }
      if (trimmed === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', marginBottom: 4 }}>{trimmed}</p>;
    });
  };

  // Collect earned badges
  const earnedBadges: string[] = [];
  Object.values(trilhas).forEach((trilha) => {
    const allDone = trilha.aulas.every((a) => a.concluida);
    if (allDone && trilha.aulas.length > 0) {
      const lastAula = trilha.aulas[trilha.aulas.length - 1];
      if (lastAula.badge_nome) earnedBadges.push(lastAula.badge_nome);
    }
  });

  // Overall stats
  const totalAulas = Object.values(trilhas).reduce((sum, t) => sum + t.aulas.length, 0);
  const totalConcluidas = Object.values(trilhas).reduce((sum, t) => sum + t.aulas.filter(a => a.concluida).length, 0);
  const overallPct = totalAulas > 0 ? Math.round((totalConcluidas / totalAulas) * 100) : 0;

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
          <div style={{ width: 260, height: 32, borderRadius: 12, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ width: '100%', height: 200, borderRadius: 16, background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
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
          <button className="btn-primary" onClick={fetchTrilhas}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  // Lesson detail view
  if (selectedAula) {
    return (
      <div className="fade-in">
        <button
          onClick={() => { setSelectedAula(null); setQuizResult(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: 'white',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 24,
            color: 'var(--text)',
          }}
        >
          ← Voltar
        </button>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: TRILHA_CONFIG[selectedAula.trilha]?.gradient || '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              {selectedAula.numero}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: TRILHA_CONFIG[selectedAula.trilha]?.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                {TRILHA_CONFIG[selectedAula.trilha]?.label} - Aula {selectedAula.numero}
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selectedAula.titulo}</h2>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            {renderContent(selectedAula.conteudo)}
          </div>
        </div>

        {/* Quiz */}
        {selectedAula.quiz && selectedAula.quiz.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Quiz</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Responda corretamente pelo menos 2 de 3 perguntas para passar.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {selectedAula.quiz.map((q, qi) => (
                <div key={qi}>
                  <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                    {qi + 1}. {q.pergunta}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.opcoes.map((opcao, oi) => {
                      const selected = quizAnswers[qi] === oi;
                      let borderColor = selected ? '#7C3AED' : 'var(--border)';
                      let bg = selected ? '#F3E8FF' : 'white';

                      if (quizResult) {
                        if (oi === q.correta) {
                          borderColor = '#00C853';
                          bg = '#E8F5E9';
                        } else if (selected && oi !== q.correta) {
                          borderColor = '#EF4444';
                          bg = '#FFEBEE';
                        }
                      }

                      return (
                        <button
                          key={oi}
                          onClick={() => {
                            if (quizResult) return;
                            const newAnswers = [...quizAnswers];
                            newAnswers[qi] = oi;
                            setQuizAnswers(newAnswers);
                          }}
                          disabled={!!quizResult}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 12,
                            border: `2px solid ${borderColor}`,
                            background: bg,
                            cursor: quizResult ? 'default' : 'pointer',
                            fontSize: 14,
                            fontWeight: selected ? 600 : 400,
                            color: 'var(--text)',
                            textAlign: 'left',
                            transition: 'all 200ms',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              border: `2px solid ${borderColor}`,
                              background: selected ? (quizResult ? bg : '#7C3AED') : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {selected && !quizResult && '●'}
                            {quizResult && oi === q.correta && '✓'}
                            {quizResult && selected && oi !== q.correta && '✕'}
                          </span>
                          {opcao}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!quizResult ? (
              <button
                className="btn-primary"
                onClick={submitQuiz}
                disabled={submittingQuiz || quizAnswers.some((a) => a === null)}
                style={{ width: '100%', padding: '14px', fontSize: 15, marginTop: 24, opacity: submittingQuiz ? 0.6 : 1 }}
              >
                {submittingQuiz ? 'Enviando...' : 'Enviar Respostas'}
              </button>
            ) : (
              <div
                style={{
                  marginTop: 24,
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: quizResult.passed ? '#E8F5E9' : '#FFEBEE',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>{quizResult.passed ? '🎉' : '😔'}</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: quizResult.passed ? '#00C853' : '#EF4444', marginBottom: 4 }}>
                  {quizResult.score}/{quizResult.total}
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: quizResult.passed ? '#00C853' : '#EF4444', marginBottom: 8 }}>
                  {quizResult.passed ? 'Aprovado!' : 'Tente novamente'}
                </p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{quizResult.message}</p>
                {!quizResult.passed && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers(new Array(selectedAula.quiz.length).fill(null));
                    }}
                    style={{ marginTop: 16 }}
                  >
                    Tentar Novamente
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Badge animation overlay */}
      {showBadgeAnimation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 300ms ease',
          }}
          onClick={() => setShowBadgeAnimation(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 24,
              padding: '48px 40px',
              textAlign: 'center',
              animation: 'badgePop 600ms ease',
              maxWidth: 360,
            }}
          >
            <div style={{ fontSize: 80, marginBottom: 16, animation: 'badgeSpin 1s ease' }}>🏆</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Badge Conquistado!</h2>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>{showBadgeAnimation}</p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Parabens! Voce completou a trilha inteira!</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes badgePop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes badgeSpin { 0% { transform: rotate(0deg) scale(0.5); } 50% { transform: rotate(180deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes completePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,83,0.2); } 50% { box-shadow: 0 0 0 6px rgba(0,200,83,0.1); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          🎓 Academia Dimdim
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Aprenda a dominar suas financas passo a passo.
        </p>
      </div>

      {/* Overall progress summary */}
      {totalAulas > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
                Progresso geral
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div style={{
                    width: `${overallPct}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                    transition: 'width 800ms ease',
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', minWidth: 40 }}>
                  {overallPct}%
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED' }}>{totalConcluidas}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Concluidas</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{totalAulas}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total</p>
            </div>
            <div style={{ textAlign: 'center', padding: '0 16px', borderLeft: '1px solid var(--border)' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B' }}>{earnedBadges.length}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Badges</p>
            </div>
          </div>
        </div>
      )}

      {/* Track cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {(['iniciante', 'moderado', 'avancado'] as const).map((key) => {
          const trilha = trilhas[key];
          if (!trilha) return null;
          const config = TRILHA_CONFIG[key];
          const completed = trilha.aulas.filter((a) => a.concluida).length;
          const total = trilha.aulas.length;
          const pct = total > 0 ? (completed / total) * 100 : 0;
          const isExpanded = expandedTrilha === key;
          const isLocked = !trilha.acessivel;
          const allComplete = completed === total && total > 0;

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                className="card"
                onClick={() => {
                  if (isLocked) return;
                  setExpandedTrilha(isExpanded ? null : key);
                }}
                style={{
                  cursor: isLocked ? 'default' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isLocked ? 0.7 : 1,
                  border: allComplete ? `2px solid ${config.color}` : isExpanded ? `2px solid ${config.color}` : undefined,
                  transition: 'all 200ms',
                  animation: allComplete ? 'completePulse 3s ease infinite' : undefined,
                }}
              >
                {isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontSize: 24,
                    }}
                  >
                    🔒
                  </div>
                )}

                {/* Completion badge */}
                {allComplete && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: config.bg,
                      color: config.color,
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Completa!
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: config.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                    }}
                  >
                    {allComplete ? '🏆' : config.emoji}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: config.color }}>{config.label}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {completed}/{total} aulas concluidas
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: config.gradient,
                      transition: 'width 600ms ease',
                    }}
                  />
                </div>

                {/* Progress text */}
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'right', fontWeight: 600 }}>
                  {Math.round(pct)}%
                </p>

                {isLocked && (
                  <div style={{ marginTop: 8, textAlign: 'center' }}>
                    <a
                      href="/configuracoes"
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#7C3AED',
                        textDecoration: 'none',
                      }}
                    >
                      🔓 Upgrade para Pro
                    </a>
                  </div>
                )}
              </div>

              {/* Expanded lessons */}
              {isExpanded && !isLocked && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  {trilha.aulas.map((aula) => {
                    const isDone = aula.concluida;
                    const isCurrent = aula.acessivel && !isDone;
                    const isAulaLocked = !aula.acessivel;

                    return (
                      <button
                        key={aula.id}
                        onClick={() => {
                          if (isAulaLocked) return;
                          openAula(aula.id);
                        }}
                        disabled={isAulaLocked || loadingAula}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: isCurrent ? `2px solid ${config.color}` : '1px solid var(--border)',
                          background: isDone ? config.bg : isCurrent ? 'white' : '#FAFAFA',
                          cursor: isAulaLocked ? 'default' : 'pointer',
                          opacity: isAulaLocked ? 0.5 : 1,
                          textAlign: 'left',
                          transition: 'all 200ms',
                          fontSize: 14,
                          color: 'var(--text)',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: isDone ? config.color : isCurrent ? config.bg : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isDone ? 'white' : isCurrent ? config.color : '#9CA3AF',
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? '✓' : isAulaLocked ? '🔒' : aula.numero}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: isCurrent ? 700 : 500, display: 'block' }}>{aula.titulo}</span>
                          {isDone && aula.data_conclusao && (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginTop: 2 }}>
                              Concluida em {new Date(aula.data_conclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                              {aula.quiz_score > 0 && ` - Quiz: ${aula.quiz_score}/3`}
                            </span>
                          )}
                        </div>
                        {isDone && <span style={{ fontSize: 12, color: config.color, fontWeight: 600 }}>Concluida</span>}
                        {isCurrent && <span style={{ fontSize: 12, color: config.color, fontWeight: 700 }}>Iniciar →</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Badges Conquistados</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {earnedBadges.map((badge, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 20px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)',
                  border: '1px solid #FFE082',
                }}
              >
                <span style={{ fontSize: 28 }}>🏆</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
