'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Mensagem {
  id: number;
  role: 'user' | 'assistant';
  texto: string;
  timestamp: Date;
  acoes?: Array<{ ferramenta: string; input: Record<string, unknown> }>;
}

type EstadoAvatar = 'idle' | 'ouvindo' | 'pensando' | 'falando';

// Avatar animado — círculos pulsantes que mudam conforme estado
function Avatar({ estado }: { estado: EstadoAvatar }) {
  const cores: Record<EstadoAvatar, string> = {
    idle: 'from-violet-600 to-indigo-600',
    ouvindo: 'from-emerald-500 to-teal-500',
    pensando: 'from-amber-500 to-orange-500',
    falando: 'from-blue-500 to-cyan-500',
  };

  const labels: Record<EstadoAvatar, string> = {
    idle: 'Pronto para ajudar',
    ouvindo: 'Ouvindo...',
    pensando: 'Analisando...',
    falando: 'Respondendo',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Anéis pulsantes */}
        {estado !== 'idle' && (
          <>
            <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${cores[estado]} opacity-20 animate-ping`} />
            <div className={`absolute w-24 h-24 rounded-full bg-gradient-to-br ${cores[estado]} opacity-30 animate-pulse`} />
          </>
        )}

        {/* Avatar principal */}
        <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${cores[estado]} flex items-center justify-center shadow-lg transition-all duration-500`}>
          {estado === 'idle' && (
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
          {estado === 'ouvindo' && (
            <div className="flex items-end gap-0.5 h-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1.5 bg-white rounded-full animate-bounce"
                  style={{ height: `${Math.random() * 16 + 8}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}
          {estado === 'pensando' && (
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {estado === 'falando' && (
            <svg className="w-9 h-9 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm font-medium text-gray-400">{labels[estado]}</span>
    </div>
  );
}

// Badge de ação executada
function BadgeAcao({ ferramenta }: { ferramenta: string }) {
  const map: Record<string, { icon: string; label: string; color: string }> = {
    registrar_gasto: { icon: '✅', label: 'Gasto registrado', color: 'bg-emerald-900/50 text-emerald-300' },
    registrar_boleto: { icon: '📅', label: 'Boleto salvo', color: 'bg-blue-900/50 text-blue-300' },
    registrar_compromisso: { icon: '🗓️', label: 'Compromisso salvo', color: 'bg-violet-900/50 text-violet-300' },
    buscar_preco: { icon: '🔍', label: 'Preço buscado', color: 'bg-amber-900/50 text-amber-300' },
  };
  const info = map[ferramenta] ?? { icon: '⚡', label: ferramenta, color: 'bg-gray-800 text-gray-300' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${info.color}`}>
      {info.icon} {info.label}
    </span>
  );
}

export default function AssistentePage() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: 0,
      role: 'assistant',
      texto: 'Olá! Sou seu assessor financeiro pessoal. Pode me dizer um gasto, perguntar sobre sua situação financeira, agendar uma conta ou pedir conselhos. Também aceito áudio! 🎙️',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [estado, setEstado] = useState<EstadoAvatar>('idle');
  const [gravando, setGravando] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = useCallback(async (texto: string, endpoint = '/api/bot/mensagem', body?: Record<string, unknown>) => {
    if (!texto.trim() && !body) return;

    const userMsg: Mensagem = {
      id: nextId.current++,
      role: 'user',
      texto: texto || '🎤 Áudio',
      timestamp: new Date(),
    };
    setMensagens(prev => [...prev, userMsg]);
    setCarregando(true);
    setEstado('pensando');

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? { mensagem: texto }),
      });

      const data = await res.json();
      setEstado('falando');

      const botMsg: Mensagem = {
        id: nextId.current++,
        role: 'assistant',
        texto: data.resposta ?? data.error ?? 'Erro ao processar.',
        timestamp: new Date(),
        acoes: data.acoes,
      };
      setMensagens(prev => [...prev, botMsg]);

      // Volta ao idle após mostrar resposta
      setTimeout(() => setEstado('idle'), 1500);
    } catch {
      setMensagens(prev => [...prev, {
        id: nextId.current++,
        role: 'assistant',
        texto: 'Erro de conexão. Tente novamente.',
        timestamp: new Date(),
      }]);
      setEstado('idle');
    } finally {
      setCarregando(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || carregando) return;
    enviarMensagem(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const iniciarGravacao = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await enviarMensagem('🎤 Áudio', '/api/bot/audio', { audio: base64, mime: 'audio/webm' });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setGravando(true);
      setEstado('ouvindo');
    } catch {
      alert('Permissão de microfone negada.');
    }
  };

  const pararGravacao = () => {
    mediaRecorderRef.current?.stop();
    setGravando(false);
  };

  const sugestoes = [
    'Como estou de gasto esse mês?',
    '50 mercado, 30 uber',
    'Aluguel R$2.800 vence dia 5',
    'Dentista sexta às 15h',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto px-4 py-4">
      {/* Avatar */}
      <div className="flex flex-col items-center py-4">
        <Avatar estado={estado} />
      </div>

      {/* Sugestões rápidas (só quando idle e sem histórico) */}
      {mensagens.length === 1 && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {sugestoes.map(s => (
            <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-gray-700">
        {mensagens.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user'
              ? 'bg-violet-600 text-white rounded-2xl rounded-tr-sm'
              : 'bg-gray-800 text-gray-100 rounded-2xl rounded-tl-sm'} px-4 py-2.5 shadow`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
              {msg.acoes && msg.acoes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {msg.acoes.map((a, i) => <BadgeAcao key={i} ferramenta={a.ferramenta} />)}
                </div>
              )}
              <p className="text-xs mt-1 opacity-50">
                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um gasto, pergunta ou comando..."
            rows={1}
            disabled={carregando || gravando}
            className="w-full resize-none rounded-2xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 pr-12 text-sm focus:outline-none focus:border-violet-500 transition-colors max-h-32"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
        </div>

        {/* Botão microfone */}
        <button
          type="button"
          onMouseDown={iniciarGravacao}
          onMouseUp={pararGravacao}
          onTouchStart={iniciarGravacao}
          onTouchEnd={pararGravacao}
          disabled={carregando}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
            gravando
              ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Segurar para falar"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        {/* Botão enviar */}
        <button
          type="submit"
          disabled={!input.trim() || carregando}
          className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
      <p className="text-center text-xs text-gray-600 mt-1">Segure 🎤 para falar · Enter para enviar</p>
    </div>
  );
}
