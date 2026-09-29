"use client"

/**
 * As peças do editor (I1-PR-11; folha `6-content-editor`, README-design §2.4): o BLOCO (contorno `line` ·
 * `radius.control`, o título em `font.display` · `size.button` · `tracking.display`, `muted`), o CAMPO (`touch.min` ·
 * contorno `lineInfo` · `radius.control` · `size.body`; o rótulo `size.label` `muted`), a SELEÇÃO (o campo com *▾*),
 * o botão do bloco (*Adicionar seção / compasso*: `touch.min`, `adicionar` 20 `accentInk`) e a CAIXA DE MARCAR (20,
 * contorno `lineInfo`, `radius.chip`, alvo `touch.min`). Sem `@/components/ui/*`.
 */
import type { ReactNode } from "react"
import { Icone } from "@/components/identidade/icone"
import type { Opcao } from "@/components/editors/frases-editor"
import type { NomeIcone } from "@octavia/identidade"

export function Bloco({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-hairline border-cor-line rounded-raio-control pt-espaco-lg px-espaco-xl pb-espaco-xl flex flex-col gap-espaco-lg min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-espaco-lg">
        <h2 className="font-fam-display font-peso-display text-tam-button tracking-display uppercase text-cor-muted leading-natural">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  )
}

/** A grade dos campos de um bloco: 3 colunas iguais em C, 2 em B e A (README-design §2.2, "180"). */
export const GRADE = "grid grid-cols-2 c:grid-cols-3 gap-espaco-lg"

export function Campo({ rotulo, id, largo = false, children }: { rotulo: string; id: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-espaco-sm min-w-0 ${largo ? "col-span-full" : ""}`}>
      <label htmlFor={id} className="text-tam-label text-cor-muted leading-natural">{rotulo}</label>
      {children}
    </div>
  )
}

const CONTORNO = "w-full rounded-raio-control border-hairline border-cor-line-info bg-cor-bg text-tam-body text-cor-text placeholder:text-cor-muted"
/** O campo de várias linhas: o respiro e a entrelinha do corpo; a altura mínima é de quem usa (duas linhas, a letra). */
export const ENTRADA_ALTA = `${CONTORNO} py-espaco-md px-espaco-lg leading-entrelinha-text resize-y`
/** O campo do corpo do editor (a folha: `min-height` `touch.min`, respiro `space.md`, entrelinha `lineHeight.text`). */
export const ENTRADA = `${CONTORNO} min-h-toque-min py-espaco-md px-espaco-lg leading-entrelinha-text`
/** O campo de *Detalhes* (a folha: altura `touch.min`, uma linha). */
export const ENTRADA_META = `${CONTORNO} h-toque-min px-espaco-lg leading-natural`

interface SelecaoProps {
  id: string; testid: string; valor: string; opcoes: readonly Opcao[]; escolha: string; meta?: boolean
  onMudar: (valor: string) => void
}

/** A seleção: o `<select>` nativo com o *▾* da folha; sem valor, a opção *escolha* (inativa, como o placeholder de antes). */
export function Selecao({ id, testid, valor, opcoes, escolha, meta = false, onMudar }: SelecaoProps) {
  return (
    <div className="relative flex items-center">
      <select id={id} data-testid={testid} value={valor} onChange={(e) => onMudar(e.target.value)}
        className={`${meta ? ENTRADA_META : ENTRADA} appearance-none pr-espaco-xxl ${valor ? "" : "text-cor-muted"}`}>
        <option value="" disabled hidden>{escolha}</option>
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-espaco-lg font-fam-mono text-tam-label-small text-cor-muted">▾</span>
    </div>
  )
}

export function BotaoDoBloco({ rotulo, icone = "adicionar", onClick }: { rotulo: string; icone?: NomeIcone; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="h-toque-min rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-md px-espaco-md text-tam-body-small text-cor-text">
      <Icone nome={icone} tamanho={20} className="text-cor-accent-ink" />
      {rotulo}
    </button>
  )
}

/** O controle só de ícone (remover, duplicar): alvo `touch.min`, o nome acessível é a frase. */
export function BotaoIcone({ nome, icone, onClick }: { nome: string; icone: NomeIcone; onClick: () => void }) {
  return (
    <button type="button" aria-label={nome} onClick={onClick} className="w-toque-min h-toque-min shrink-0 flex items-center justify-center text-cor-muted">
      <Icone nome={icone} tamanho={20} />
    </button>
  )
}

/** A caixa de marcar (20 no alvo `touch.min`): vazia é o quadrado de contorno `lineInfo`; marcada, o `garantida`. */
export function CaixaDeMarcar({ rotulo, marcado, onMudar }: { rotulo: string; marcado: boolean; onMudar: (v: boolean) => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={marcado} onClick={() => onMudar(!marcado)}
      className="min-h-toque-min flex items-center gap-espaco-md text-tam-body-small text-cor-text text-left">
      {marcado
        ? <Icone nome="garantida" tamanho={20} className="text-cor-accent-ink" />
        : <svg aria-hidden width={20} height={20} viewBox="0 0 20 20" className="shrink-0 text-cor-line-info"><rect x="0.5" y="0.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" /></svg>}
      {rotulo}
    </button>
  )
}
