/**
 * Os controles das telas com casca (I1-PR-9; folha `4-content-lista`,
 * README-design §2.4): o botão de escrita *Adicionar* (`touch.list`, contorno
 * `lineInfo` — `accentInk` quando é o único controle do vazio, precedente do
 * N2-S1f —, `adicionar` 24 em `accentInk`, rótulo `text` · `size.bodySmall`) e o
 * "alternável" (aba, filtro, página: `touch.min`, `radius.control`; marcado em
 * contorno `accentInk` e fundo `accent` a 12 % — `web.alfaMarcado`).
 */
import Link from "next/link"
import { Icone } from "@/components/identidade/icone"

export const CONTROLE_LISTA = "h-toque-list rounded-raio-control border-hairline flex items-center gap-espaco-md px-espaco-lg text-tam-body-small text-cor-text"

export function BotaoAdicionar({ rotulo, destaque = false, testid }: { rotulo: string; destaque?: boolean; testid?: string }) {
  return (
    <Link href="/add-content" data-testid={testid} className={`${CONTROLE_LISTA} ${destaque ? "border-cor-accent-ink" : "border-cor-line-info"}`}>
      <Icone nome="adicionar" tamanho={24} className="text-cor-accent-ink" />
      {rotulo}
    </Link>
  )
}

/** A classe do alternável: marcado (contorno `accentInk` + fundo marcado) ou não (contorno `line`, texto `muted`). */
export function alternavel(marcado: boolean, extra = ""): string {
  return `h-toque-min rounded-raio-control border-hairline flex items-center text-tam-body-small ${marcado ? "border-cor-accent-ink bg-cor-marcado text-cor-text" : "border-cor-line text-cor-muted"} ${extra}`
}

/** O título da tela: `font.display` · `size.titleSmall` · `tracking.displayWide`, caixa alta. */
export function TituloDaTela({ children }: { children: React.ReactNode }) {
  return <h1 className="font-fam-display font-peso-display text-tam-title-small tracking-display-wide uppercase leading-natural">{children}</h1>
}
