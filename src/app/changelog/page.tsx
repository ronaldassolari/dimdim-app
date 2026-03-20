import Link from 'next/link';

const releases = [
  {
    version: '1.2.0',
    date: '2026-03-19',
    title: 'Audit Enterprise-Grade',
    changes: [
      'Sentry monitoring para captura de erros em produção',
      'Cookie consent banner (LGPD compliance)',
      'Pricing page com planos Free, Plus e Pro',
      'Error boundaries para melhor experiência do usuário',
      'Testes E2E com Playwright',
      'CD automático via GitHub Actions',
      'Onboarding wizard para novos usuários',
      'API handler wrapper para código mais limpo',
      'CSRF protection no middleware',
      'Documentação completa da API',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-19',
    title: 'Refinamento & Segurança',
    changes: [
      'NLP melhorado: "30 bigpao", "R$150 luz" agora reconhecidos',
      'Middleware com security headers e rate limiting',
      'Landing page, política de privacidade e termos de uso',
      'Health check com teste de conectividade do banco',
      'Input validation em todas as rotas',
      'Paginação na API de transações',
      'Exportação de dados (LGPD)',
      'Exclusão de conta (LGPD)',
      '39 testes unitários para NLP',
      'CI com GitHub Actions',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-18',
    title: 'Launch',
    changes: [
      'Dashboard financeiro com gráficos',
      'Registro de gastos e receitas',
      'Bot WhatsApp com NLP',
      'Sistema de metas financeiras',
      'Calculadora de pontos de cartão',
      'Academia financeira com 30 aulas',
      'Busca de preços',
      'Gestão de família financeira',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto">
        <Link href="/landing" className="text-2xl font-bold text-emerald-600">Dimdim</Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-emerald-600">Entrar</Link>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Changelog</h1>
        <div className="space-y-12">
          {releases.map(r => (
            <div key={r.version} className="relative pl-8 border-l-2 border-emerald-200">
              <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-emerald-500" />
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-lg font-bold text-gray-900">v{r.version}</span>
                <span className="text-sm text-gray-500">{r.date}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{r.title}</h3>
              <ul className="space-y-1">
                {r.changes.map((c, i) => (
                  <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
