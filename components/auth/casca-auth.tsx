/**
 * A casca das cinco telas de auth — a composição do S0 da folha `1-auth`
 * (README-design §2.4): marca | coluna do formulário lado a lado em C, com o vão
 * `web.vaoAuth` (140); em B e A a marca sobe e o vão é `space.xxxl` (o mesmo
 * token, que troca de valor com a faixa). Respiro vertical `space.xxxl`; coluna
 * `web.colunaAuth` (420) com vão `space.xxl`; rótulo da tela em `font.display` ·
 * `size.bodySmall` · `tracking.displayWide` · caixa alta · `muted`; apoio em
 * `size.body` · `lineHeight.text` · `muted`.
 */
import Image from "next/image"
import { FRASES_AUTH } from "./frases-auth"

export interface CascaAuthProps {
  rotulo: string
  apoio?: string
  children?: React.ReactNode
}

export function CascaAuth({ rotulo, apoio, children }: CascaAuthProps) {
  return (
    <main className="min-h-screen bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural py-espaco-xxxl flex justify-center items-start">
      <div className="flex flex-col c:flex-row items-center gap-web-vao-auth">
        <div role="img" aria-label={FRASES_AUTH["marca.octavia"]} className="relative shrink-0 w-web-marca-largura h-web-marca-altura">
          <Image src="/marcas/octavia-dark.png" alt="" fill unoptimized priority />
        </div>
        <div className="flex flex-col gap-espaco-xxl w-web-coluna-auth">
          <div className="flex flex-col gap-espaco-md">
            <h1 className="font-fam-display font-peso-display text-tam-body-small tracking-display-wide uppercase text-cor-muted">
              {rotulo}
            </h1>
            {apoio && <p className="text-tam-body leading-entrelinha-text text-cor-muted">{apoio}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}

/** A linha de rodapé: texto em `muted` e o link em `accentInk`, `size.label`. */
export function RodapeAuth({ texto, children }: { texto: string; children?: React.ReactNode }) {
  return (
    <p className="flex flex-wrap gap-espaco-sm text-tam-label">
      <span className="text-cor-muted">{texto}</span>
      {children}
    </p>
  )
}

/** "ou", entre o *Entrar* e o *Entrar com Google*. */
export function SeparadorAuth() {
  return (
    <div className="flex items-center gap-espaco-md">
      <div className="flex-1 h-barra-hairline bg-cor-line" />
      <span className="text-tam-label text-cor-muted">{FRASES_AUTH["login.ou"]}</span>
      <div className="flex-1 h-barra-hairline bg-cor-line" />
    </div>
  )
}
