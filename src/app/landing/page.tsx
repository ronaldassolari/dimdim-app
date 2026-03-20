export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white">
      <header className="max-w-5xl mx-auto px-6 py-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">💰 Dimdim</h1>
        <a href="/login" className="bg-emerald-500 hover:bg-emerald-600 px-6 py-2 rounded-lg font-medium transition">Entrar</a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <section className="text-center mb-20">
          <h2 className="text-5xl font-bold mb-6">Controle suas finanças<br/>pelo WhatsApp</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Mande &quot;30 bigpao&quot; e pronto — gasto registrado. Sem app, sem planilha, sem complicação.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/login" className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-lg font-bold text-lg transition">Começar grátis</a>
            <a href="/pricing" className="border border-white/30 hover:bg-white/10 px-8 py-3 rounded-lg font-bold text-lg transition">Ver planos</a>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-bold mb-2">Registre gastos por mensagem</h3>
            <p className="text-gray-400">&quot;50 ifood&quot;, &quot;150 luz&quot;, &quot;gastei 200 no mercado&quot; — o bot entende tudo.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold mb-2">Resumo instantâneo</h3>
            <p className="text-gray-400">Mande &quot;resumo&quot; e veja entradas, saídas e saldo do mês em segundos.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-bold mb-2">Busca de preços</h3>
            <p className="text-gray-400">&quot;busca iphone&quot; — preços reais do Mercado Livre direto no WhatsApp.</p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">🎓 Academia Financeira</h3>
            <p className="text-gray-400">30 aulas de educação financeira com quiz e certificados. Do básico ao avançado.</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold mb-4">💳 Calculadora de Pontos</h3>
            <p className="text-gray-400">40+ cartões brasileiros. Saiba qual usar em cada compra para maximizar pontos.</p>
          </div>
        </section>

        <section className="text-center py-12 border-t border-white/10">
          <h3 className="text-2xl font-bold mb-4">Pronto para organizar suas finanças?</h3>
          <a href="/login" className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-lg font-bold text-lg transition inline-block">Criar conta grátis</a>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-gray-500 text-sm border-t border-white/10">
        <p>Dimdim © 2026 — Assistente Financeiro Pessoal</p>
        <div className="mt-2 flex gap-4 justify-center">
          <a href="/privacidade" className="hover:text-gray-300">Privacidade</a>
          <a href="/termos" className="hover:text-gray-300">Termos de Uso</a>
        </div>
      </footer>
    </div>
  );
}
