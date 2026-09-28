"use client"

/**
 * A coluna lateral (I1-PR-10; folha 5, README-design §2.4 "corpo | detalhes" e "detalhes"): *Detalhes* e *Notas
 * de palco*, cada um num painel de contorno `line`; o rótulo em `font.display` · `size.button` ·
 * `tracking.display`, `muted`; o par chave (`size.label`, `muted`) / valor (`text`). Em C, `web.colunaLateral`
 * (320) ao lado do corpo; em B (e A) desce, largura toda (`web.empilha`). Um par por campo que existe, na ordem de
 * antes (div. 747). Nota vazia: uma frase só (`view.notas.vazio`).
 */
import { FRASES_VIEW, camposDe } from "@/components/content/frases-visualizacao"
import type { ConteudoVisto } from "@/components/content/tipos"

const CAIXA = "border-hairline border-cor-line rounded-raio-control py-espaco-lg px-espaco-xl flex flex-col gap-espaco-md"
const ROTULO = "font-fam-display font-peso-display text-tam-button tracking-display uppercase text-cor-muted leading-natural"

export function ContentSidebar({ content }: { content: ConteudoVisto }) {
  return (
    <aside className="grow shrink basis-full c:grow-0 c:shrink-0 c:basis-web-coluna-lateral min-w-0 flex flex-col gap-espaco-xl">
      <section className={CAIXA}>
        <h2 className={ROTULO}>{FRASES_VIEW["view.detalhes"]}</h2>
        {camposDe(content).map((c) => (
          <div key={c.chave} className="flex justify-between gap-espaco-lg text-tam-label">
            <span className="text-cor-muted">{c.chave}</span>
            <span className="text-cor-text text-right break-words min-w-0">{c.valor}</span>
          </div>
        ))}
      </section>
      <section className={CAIXA}>
        <h2 className={ROTULO}>{FRASES_VIEW["view.notas"]}</h2>
        <p className={`text-tam-label leading-entrelinha-text whitespace-pre-wrap break-words ${content.notes ? "text-cor-text" : "text-cor-muted"}`}>
          {content.notes || FRASES_VIEW["view.notas.vazio"]}
        </p>
      </section>
    </aside>
  )
}
