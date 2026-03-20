'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Algo deu errado</h2>
        <p className="text-gray-600 mb-6">Ocorreu um erro inesperado. Tente novamente ou volte para o início.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
            Tentar novamente
          </button>
          <a href="/dashboard" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Ir para o início
          </a>
        </div>
      </div>
    </div>
  );
}
