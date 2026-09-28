/**
 * I1-PR-8 — a política de privacidade com a identidade da folha `3-privacy-policy` (T-I1-R113 em C, T-I1-R114 em B):
 * coluna `folha.largura` (720 em C, 663 em B; A mecânica, `max-w-full` com `web.margem`), títulos em `font.display`
 * com entrelinha natural (I1-E12), corpo em `font.ui · size.body · lineHeight.text`, e-mail em `accentInk`.
 * O TEXTO é o de antes, byte a byte (I1-D17 exceção, I1-D19): não se traduz nem se reescreve — o CN
 * `tests/gates-web/privacy-texto.test.ts` o compara com `docs/ux/I1-PR8-anexos/texto-antes.txt`. Sem espaço antes do
 * e-mail, como sempre foi: o respiro é `ml-espaco-xs` (div. 692). Server component, sem hook (o `"use client"` saiu).
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural py-espaco-xxxl px-web-margem flex justify-center items-start">
      <div className="w-web-folha-largura max-w-full flex flex-col gap-espaco-xxl">
        <h1 className="font-fam-display font-peso-display text-tam-title-large leading-natural">
          Privacy Policy / Política de Privacidade
        </h1>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            What data we collect and why / Quais dados coletamos e por quê
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            We collect your name, email address, and usage behavior to personalize
            your experience, provide support, and improve our services.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Coletamos seu nome, endereço de e-mail e comportamento de uso para
            personalizar sua experiência, oferecer suporte e aprimorar nossos
            serviços.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            Legal basis for processing / Base legal para o tratamento
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            Under GDPR and LGPD, we process your data with your consent, to
            fulfill our contract with you, and to comply with legal obligations.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Conforme o GDPR e a LGPD, tratamos seus dados com seu consentimento,
            para cumprir nosso contrato com você e para atender a obrigações
            legais.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            Storage of your data / Armazenamento dos seus dados
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            Your information is stored securely on trusted cloud providers. We
            keep data only as long as necessary for the purposes stated in this
            policy.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Suas informações são armazenadas com segurança em provedores de
            nuvem confiáveis. Mantemos os dados apenas pelo tempo necessário para
            as finalidades descritas nesta política.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            Your rights / Seus direitos
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            You may request access, correction, deletion, or portability of your
            data. You can also withdraw consent at any time.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Você pode solicitar acesso, correção, exclusão ou portabilidade dos
            seus dados. Também é possível revogar o consentimento a qualquer
            momento.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            Third-party services / Serviços de terceiros
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            We use services such as Google Authentication and analytics tools.
            These providers may process your data according to their own privacy
            policies.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Utilizamos serviços como Google Authentication e ferramentas de
            análise. Esses provedores podem tratar seus dados de acordo com suas
            próprias políticas de privacidade.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">Contact / Contato</h2>
          <p className="text-tam-body leading-entrelinha-text">
            If you have questions, contact our Data Protection Officer at
            <a href="mailto:dpo@octavia.app" className="text-cor-accent-ink underline ml-espaco-xs">dpo@octavia.app</a>.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Se você tiver dúvidas, entre em contato com nosso Encarregado de
            Proteção de Dados pelo e-mail
            <a href="mailto:dpo@octavia.app" className="text-cor-accent-ink underline ml-espaco-xs">dpo@octavia.app</a>.
          </p>
        </section>
        <section className="flex flex-col gap-espaco-md">
          <h2 className="font-fam-display font-peso-display text-tam-title leading-natural">
            Cookies and consent / Cookies e consentimento
          </h2>
          <p className="text-tam-body leading-entrelinha-text">
            We use cookies to remember your preferences and understand how the
            application is used. You can manage cookies in your browser settings.
          </p>
          <p className="text-tam-body leading-entrelinha-text">
            Utilizamos cookies para lembrar suas preferências e entender como o
            aplicativo é utilizado. Você pode gerenciar os cookies nas
            configurações do seu navegador.
          </p>
        </section>
      </div>
    </main>
  )
}

