'use client';

import * as Sentry from "@sentry/nextjs";
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Algo deu errado</h2>
          <p className="text-gray-600 mb-6">Ocorreu um erro inesperado. Nossa equipe foi notificada.</p>
          <button onClick={() => reset()} className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
