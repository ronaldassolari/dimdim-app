'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MODES = [
  { id: 'normal', label: 'Normal', desc: 'Dicas equilibradas sobre finanças' },
  { id: 'economia', label: 'Economia', desc: 'Foco em cortar gastos e economizar' },
  { id: 'investidor', label: 'Investidor', desc: 'Foco em investimentos e rentabilidade' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState('normal');
  const [firstGoal, setFirstGoal] = useState({ titulo: '', valor: '' });
  const [saving, setSaving] = useState(false);

  const saveMode = async () => {
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modo_bot: mode }),
    });
    setStep(2);
  };

  const saveGoal = async () => {
    if (!firstGoal.titulo || !firstGoal.valor) { setStep(3); return; }
    setSaving(true);
    await fetch('/api/metas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: firstGoal.titulo,
        valor_alvo: Number(firstGoal.valor),
        valor_atual: 0,
        prazo: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        categoria: 'Outros',
        prioridade: 'MEDIA',
      }),
    });
    setSaving(false);
    setStep(3);
  };

  const finish = () => router.push('/dashboard');

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bem-vindo ao Dimdim!</h2>
            <p className="text-gray-600 mb-6">Escolha como o DimdimBot deve se comportar:</p>
            <div className="space-y-3 mb-6">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    mode === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{m.label}</div>
                  <div className="text-sm text-gray-500">{m.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={saveMode} className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crie sua primeira meta</h2>
            <p className="text-gray-600 mb-6">Opcional — você pode pular esta etapa.</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
                <input
                  type="text"
                  placeholder="Ex: Reserva de emergência"
                  value={firstGoal.titulo}
                  onChange={e => setFirstGoal({ ...firstGoal, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor alvo (R$)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={firstGoal.valor}
                  onChange={e => setFirstGoal({ ...firstGoal, valor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Pular
              </button>
              <button onClick={saveGoal} disabled={saving} className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50">
                {saving ? 'Salvando...' : 'Criar meta'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tudo pronto!</h2>
            <p className="text-gray-600 mb-6">
              Seu Dimdim está configurado. Comece registrando seus gastos no dashboard ou pelo WhatsApp!
            </p>
            <button onClick={finish} className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              Ir para o Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
