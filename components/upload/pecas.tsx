"use client"

/**
 * As peças do upload (I1-PR-12; folha `7-upload`, README-design §2.4): a ESCOLHA (`radio`: `radius.control`, contorno
 * `lineInfo`; marcada, contorno `accentInk` + `accent` a 12 %), o BOTÃO DO PASSO (`touch.list`; o ícone de 24 em
 * `accentInk` quando é escrita — *Salvar*, *Próximo*, *Importar todas* —, inativo em `lineInfo` com o rótulo `muted`),
 * o CAMPO (`touch.min` · `radius.control` · contorno `lineInfo`, ou `errorInk` na validação), a linha de validação sob
 * o campo ou a zona (`falha` 20 + `size.label` em `errorInk`) e a frase de espera (*carregando…*). Sem `@/components/ui/*`.
 */
import type { ReactNode } from "react"
import type { NomeIcone } from "@octavia/identidade"
import { Icone } from "@/components/identidade/icone"
import { CONTROLE_LISTA } from "@/components/identidade/controles"

/** O rótulo de um grupo de escolhas (*como você quer adicionar?*): `size.body` `muted`. */
export function Grupo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex flex-col gap-espaco-md">
      <p id={id} className="text-tam-body text-cor-muted">{rotulo}</p>
      {children}
    </div>
  )
}

export function Escolha({ marcada, onEscolher, className, children }: { marcada: boolean; onEscolher: () => void; className: string; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={marcada} onClick={onEscolher}
      className={`rounded-raio-control border-hairline text-left text-cor-text ${marcada ? "border-cor-accent-ink bg-cor-marcado" : "border-cor-line-info"} ${className}`}>
      {children}
    </button>
  )
}

export interface BotaoDoPassoProps {
  rotulo: string
  onClick: () => void
  icone?: NomeIcone
  /** a escrita (Salvar, Próximo, Importar todas): o ícone em `accentInk` */
  escrita?: boolean
  inativo?: boolean
}

export function BotaoDoPasso({ rotulo, onClick, icone, escrita = false, inativo = false }: BotaoDoPassoProps) {
  const tinta = inativo ? "text-cor-line-info" : escrita ? "text-cor-accent-ink" : ""
  return (
    <button type="button" onClick={onClick} disabled={inativo} className={`${CONTROLE_LISTA} border-cor-line-info disabled:text-cor-muted`}>
      {icone && <Icone nome={icone} tamanho={24} className={tinta} />}
      {rotulo}
    </button>
  )
}

/** A linha de botões do passo: à direita (o formulário, o lote, o criar, o passo 1) ou à esquerda (a zona). */
export function Botoes({ aDireita = true, children }: { aDireita?: boolean; children: ReactNode }) {
  return <div className={`flex flex-wrap items-center gap-espaco-lg ${aDireita ? "justify-end" : ""}`}>{children}</div>
}

const CAMPO = "w-full rounded-raio-control border-hairline bg-cor-bg text-tam-body text-cor-text placeholder:text-cor-muted px-espaco-lg"
/** O campo de uma linha (`touch.min`); `erro` troca o contorno por `errorInk`. */
export const campoDeUmaLinha = (erro = false) => `${CAMPO} h-toque-min leading-natural ${erro ? "border-cor-error-ink" : "border-cor-line-info"}`
/** O campo de duas linhas (2 × `touch.min`): as *Notas*, o corpo de cada música do lote. */
export const CAMPO_DE_DUAS_LINHAS = `${CAMPO} border-cor-line-info min-h-campo-duas-linhas py-espaco-md leading-entrelinha-text resize-y`

export function Campo({ rotulo, id, largo = false, children }: { rotulo: string; id: string; largo?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-espaco-sm min-w-0 ${largo ? "col-span-full" : ""}`}>
      <label htmlFor={id} className="text-tam-label text-cor-muted leading-natural">{rotulo}</label>
      {children}
    </div>
  )
}

/** A validação do cliente, sob o campo ou sob a zona: `falha` 20 + a frase em `errorInk` (entrelinha da `LinhaDeAviso`). */
export function Validacao({ frase }: { frase: string }) {
  return (
    <div role="alert" className="flex items-start gap-espaco-md">
      <Icone nome="falha" tamanho={20} className="text-cor-error-ink" />
      <p className="text-tam-label leading-web-entrelinha-aviso text-cor-error-ink break-words min-w-0">{frase}</p>
    </div>
  )
}

/** A frase de espera no lugar do corpo (*carregando…*): `font.display` · `size.title`, respiro `space.xxxl`. */
export function Espera({ frase }: { frase: string }) {
  return <p className="py-espaco-xxxl text-center font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural">{frase}</p>
}
