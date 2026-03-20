export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8 max-w-3xl mx-auto">
      <a href="/" className="text-emerald-400 hover:underline mb-8 inline-block">← Voltar</a>
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: 19 de março de 2026</p>

      <div className="space-y-6 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-2 text-white">1. Aceitação</h2>
          <p>Ao utilizar o Dimdim, você concorda com estes termos. Se não concordar, não utilize o serviço.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">2. Serviço</h2>
          <p>O Dimdim é um assistente financeiro pessoal que permite registrar gastos, visualizar resumos, buscar preços e receber insights via WhatsApp e dashboard web.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">3. Responsabilidade</h2>
          <p>O Dimdim não é uma instituição financeira. Não oferecemos consultoria financeira, investimentos ou crédito. As informações são baseadas nos dados que você fornece.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">4. Conta</h2>
          <p>Você é responsável por manter a segurança da sua conta e senha. Não compartilhe suas credenciais.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">5. Uso Aceitável</h2>
          <p>É proibido: tentar acessar contas de outros usuários, sobrecarregar o serviço com requisições automatizadas, ou utilizar o bot para fins ilegais.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">6. Disponibilidade</h2>
          <p>O serviço é fornecido &quot;como está&quot;. Não garantimos disponibilidade 100%. Manutenções podem ocorrer sem aviso prévio.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 text-white">7. Cancelamento</h2>
          <p>Você pode cancelar sua conta a qualquer momento. Seus dados serão excluídos conforme a Política de Privacidade.</p>
        </section>
      </div>
    </div>
  );
}
