export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8 max-w-3xl mx-auto">
      <a href="/" className="text-emerald-400 hover:underline mb-8 inline-block">← Voltar</a>
      <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: 19 de março de 2026</p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-2 text-white">1. Dados Coletados</h2>
          <p>Coletamos: nome de usuário, senha (hasheada com bcrypt), e-mail, número de WhatsApp, e dados financeiros que você registra voluntariamente (transações, metas, cartões).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">2. Finalidade</h2>
          <p>Seus dados são utilizados exclusivamente para fornecer o serviço de assistente financeiro pessoal: registrar gastos, gerar resumos, buscar preços e oferecer insights.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">3. Base Legal (LGPD)</h2>
          <p>O tratamento de dados é baseado no consentimento do titular (Art. 7°, I da LGPD) e na execução de contrato (Art. 7°, V).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">4. Compartilhamento</h2>
          <p>Não vendemos seus dados. Compartilhamos apenas com: Vercel (hospedagem e banco de dados), OpenAI (processamento de linguagem natural do bot — sem dados financeiros identificáveis), e Mercado Livre (busca de preços — sem dados pessoais).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">5. Armazenamento e Segurança</h2>
          <p>Dados armazenados no Vercel Postgres (Neon) com criptografia em trânsito (TLS). Senhas hasheadas com bcrypt. JWT com expiração de 7 dias. Headers de segurança (X-Frame-Options, X-Content-Type-Options).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">6. Seus Direitos (LGPD Art. 18)</h2>
          <p>Você tem direito a: acessar seus dados, corrigir dados incorretos, solicitar exclusão da conta e portabilidade dos dados. Para exercer esses direitos, entre em contato pelo WhatsApp ou e-mail.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">7. Retenção</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão, os dados são removidos em até 30 dias.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">8. Contato</h2>
          <p>Responsável: Ronald Santos Assolari<br/>E-mail: ronaldgodlove@hotmail.com</p>
        </section>
      </div>
    </div>
  );
}
