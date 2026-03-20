'use client';

import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erro no Dashboard</h2>
        <p className="text-gray-600 mb-6">Não foi possível carregar esta seção. Tente novamente.</p>
        <button onClick={() => reset()} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
