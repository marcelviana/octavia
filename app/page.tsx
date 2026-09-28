/**
 * A landing — `/`, a folha `2-landing` (T-I1-R111 em C, T-I1-R112 em B; README-design
 * §2.4 e §5.3): a composição do S0, a mesma do auth — marca | coluna lado a lado em C
 * com o vão `web.vaoAuth` (140); em B a marca sobe e o vão é `space.xxxl` (o mesmo
 * token, que troca de valor com a faixa). Marca 340 × 219 (`web.marca`, o PNG do
 * auth); coluna `web.colunaAuth` (420) com vão `space.xxl`; a frase em
 * `font.displayMedium` · `size.title` · `lineHeight.text` (I1-E11); *Entrar* principal
 * com o `log-in` 24, *Criar conta* secundário (decisão 16); o link da política em
 * `accentInk` · `size.label`. Os destinos são os de antes (I1-D9): `/login`,
 * `/signup`, `/privacy-policy`.
 *
 * FAIXA A (errata da I1-D11): sem folha — empilha como B, margem `web.margem` e a
 * coluna na largura do viewport (`max-w-full`).
 *
 * Estática: server component, sem checagem de sessão nem redirect (§17 do pre-check).
 */
import Image from "next/image"
import Link from "next/link"
import { LinkBotao } from "@/components/identidade/link-botao"
import { FRASES_LANDING } from "@/components/landing/frases-landing"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural py-espaco-xxxl px-web-margem flex justify-center items-start">
      <div className="max-w-full min-w-0 flex flex-col c:flex-row items-center gap-web-vao-auth">
        <div className="relative shrink-0 w-web-marca-largura h-web-marca-altura max-w-full">
          <Image src="/marcas/octavia-dark.png" alt={FRASES_LANDING["landing.marca"]} fill unoptimized priority />
        </div>
        <div className="flex flex-col gap-espaco-xxl w-web-coluna-auth max-w-full">
          <p className="font-fam-display-medium font-peso-display-medium text-tam-title leading-entrelinha-text text-cor-text">
            {FRASES_LANDING["landing.frase"]}
          </p>
          <div className="flex flex-col gap-espaco-lg">
            <Link href="/login">
              <LinkBotao principal icone="log-in">{FRASES_LANDING["landing.entrar"]}</LinkBotao>
            </Link>
            <Link href="/signup">
              <LinkBotao>{FRASES_LANDING["landing.criar"]}</LinkBotao>
            </Link>
          </div>
          <Link href="/privacy-policy" className="text-tam-label text-cor-accent-ink hover:text-cor-text">
            {FRASES_LANDING["landing.politica"]}
          </Link>
        </div>
      </div>
    </main>
  )
}
