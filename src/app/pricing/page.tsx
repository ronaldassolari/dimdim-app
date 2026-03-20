'use client';

import { useState } from 'react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Para começar a organizar suas finanças',
    features: [
      '50 transações/mês',
      'Resumo financeiro básico',
      'Bot WhatsApp',
      '3 categorias personalizadas',
      '1 meta financeira',
    ],
    cta: 'Começar grátis',
    href: '/login',
    popular: false,
  },
  {
    name: 'Plus',
    price: { monthly: 19.90, annual: 15.92 },
    description: 'Para quem quer controle total',
    features: [
      'Transações ilimitadas',
      'Insights com IA',
      'Busca de preços',
      'Academia financeira completa',
      'Metas ilimitadas',
      'Exportação CSV',
      'Relatório mensal',
    ],
    cta: 'Assinar Plus',
    href: '/login',
    popular: true,
  },
  {
    name: 'Pro',
    price: { monthly: 49.90, annual: 39.92 },
    description: 'Para famílias e investidores',
    features: [
      'Tudo do Plus',
      'Calculadora de pontos',
      'Família (até 3 usuários)',
      'Relatório detalhado mensal',
      'Suporte prioritário',
      'API access',
      'Integração com bancos (em breve)',
    ],
    cta: 'Assinar Pro',
    href: '/login',
    popular: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link href="/landing" className="text-2xl font-bold text-emerald-600">Dimdim</Link>
        <Link href="/login" className="text-sm text-gray-600 hover:text-emerald-600">Entrar</Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Planos simples, preço justo</h1>
          <p className="text-lg text-gray-600 mb-8">Escolha o plano ideal para suas finanças</p>

          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm ${!annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>Mensal</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${annual ? 'bg-emerald-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-7' : ''}`} />
            </button>
            <span className={`text-sm ${annual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Anual <span className="text-emerald-600 font-medium">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-white border-2 border-emerald-500 shadow-xl scale-105'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {price === 0 ? 'Grátis' : `R$${price.toFixed(2).replace('.', ',')}`}
                  </span>
                  {price > 0 && <span className="text-gray-500 text-sm">/mês</span>}
                </div>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="text-center py-8 text-sm text-gray-500">
        <div className="flex justify-center gap-6">
          <Link href="/privacidade" className="hover:text-emerald-600">Privacidade</Link>
          <Link href="/termos" className="hover:text-emerald-600">Termos</Link>
          <Link href="/landing" className="hover:text-emerald-600">Home</Link>
        </div>
      </footer>
    </div>
  );
}
