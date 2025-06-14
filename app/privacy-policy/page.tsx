"use client"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-8 space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Privacy Policy / Política de Privacidade
        </h1>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            What data we collect and why / Quais dados coletamos e por quê
          </h2>
          <p className="mb-2">
            We collect your name, email address, and usage behavior to personalize
            your experience, provide support, and improve our services.
          </p>
          <p>
            Coletamos seu nome, endereço de e-mail e comportamento de uso para
            personalizar sua experiência, oferecer suporte e aprimorar nossos
            serviços.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Legal basis for processing / Base legal para o tratamento
          </h2>
          <p className="mb-2">
            Under GDPR and LGPD, we process your data with your consent, to
            fulfill our contract with you, and to comply with legal obligations.
          </p>
          <p>
            Conforme o GDPR e a LGPD, tratamos seus dados com seu consentimento,
            para cumprir nosso contrato com você e para atender a obrigações
            legais.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Storage of your data / Armazenamento dos seus dados
          </h2>
          <p className="mb-2">
            Your information is stored securely on trusted cloud providers. We
            keep data only as long as necessary for the purposes stated in this
            policy.
          </p>
          <p>
            Suas informações são armazenadas com segurança em provedores de
            nuvem confiáveis. Mantemos os dados apenas pelo tempo necessário para
            as finalidades descritas nesta política.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Your rights / Seus direitos
          </h2>
          <p className="mb-2">
            You may request access, correction, deletion, or portability of your
            data. You can also withdraw consent at any time.
          </p>
          <p>
            Você pode solicitar acesso, correção, exclusão ou portabilidade dos
            seus dados. Também é possível revogar o consentimento a qualquer
            momento.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Third-party services / Serviços de terceiros
          </h2>
          <p className="mb-2">
            We use services such as Google Authentication and analytics tools.
            These providers may process your data according to their own privacy
            policies.
          </p>
          <p>
            Utilizamos serviços como Google Authentication e ferramentas de
            análise. Esses provedores podem tratar seus dados de acordo com suas
            próprias políticas de privacidade.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact / Contato</h2>
          <p className="mb-2">
            If you have questions, contact our Data Protection Officer at
            <a href="mailto:dpo@octavia.app" className="text-blue-600 underline ml-1">dpo@octavia.app</a>.
          </p>
          <p>
            Se você tiver dúvidas, entre em contato com nosso Encarregado de
            Proteção de Dados pelo e-mail
            <a href="mailto:dpo@octavia.app" className="text-blue-600 underline ml-1">dpo@octavia.app</a>.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Cookies and consent / Cookies e consentimento
          </h2>
          <p className="mb-2">
            We use cookies to remember your preferences and understand how the
            application is used. You can manage cookies in your browser settings.
          </p>
          <p>
            Utilizamos cookies para lembrar suas preferências e entender como o
            aplicativo é utilizado. Você pode gerenciar os cookies nas
            configurações do seu navegador.
          </p>
        </section>
      </div>
    </div>
  )
}

