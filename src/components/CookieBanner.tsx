'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = async () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
    try {
      await fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accepted: true }) });
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-md bg-white/90 border-t border-gray-200 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-700 text-center sm:text-left">
          Usamos cookies essenciais para o funcionamento do site. Ao continuar, você concorda com nossa{' '}
          <Link href="/privacidade" className="text-emerald-600 underline hover:text-emerald-700">Política de Privacidade</Link>.
        </p>
        <div className="flex gap-3 shrink-0">
          <Link href="/privacidade" className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Ver política
          </Link>
          <button onClick={accept} className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
