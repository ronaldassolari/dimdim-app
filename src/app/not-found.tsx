import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="text-8xl font-bold text-emerald-200 mb-4">404</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Página não encontrada</h2>
        <p className="text-gray-600 mb-6">A página que você procura não existe ou foi movida.</p>
        <Link href="/dashboard" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
