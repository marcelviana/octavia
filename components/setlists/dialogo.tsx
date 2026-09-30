"use client"

/**
 * O diálogo das setlists (I1-PR-13; folha `8-setlists`, README-design §2.4 "diálogo"): fundo `bg` a 82 %
 * (`web.alfaDialogo`); a folha na largura `folha.largura` (720 em C, 663 em B) a `folha.topo` do alto (100 · 96),
 * respiro `space.xxl`, vão `space.xl`; o título em `font.display` · `size.title` · `tracking.display`. A `LinhaDeAviso`
 * da ação fica DENTRO dele, logo abaixo do título (decisão 14 do aval). Esc fecha — menos durante o envio. O fundo rola
 * quando a folha passa da altura da janela (o picker com a biblioteca inteira).
 */
import { useEffect, useId, type ReactNode } from "react"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { Icone } from "@/components/identidade/icone"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import type { NomeIcone } from "@octavia/identidade"
import { FRASES_SET } from "@/components/setlists/frases-setlists"

interface DialogoProps {
  titulo: string
  onFechar: () => void
  /** durante o envio o diálogo não fecha (nem pelo Esc, nem pelo *Cancelar*) */
  preso?: boolean
  /** a falha da ação, abaixo do título; em `abaixo`, depois do corpo (o apagar: abaixo da pergunta) */
  falha?: FalhaDaTela | null
  falhaAbaixo?: boolean
  botoes: ReactNode
  children?: ReactNode
}

export function Dialogo({ titulo, onFechar, preso = false, falha, falhaAbaixo = false, botoes, children }: DialogoProps) {
  const id = useId()
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !preso) onFechar() }
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onFechar, preso])
  const linha = falha && (
    <LinhaDeAviso tipo={falha.tipo} motivo={falha.motivo} detalhe={falha.detalhe}
      acao={falha.onTentar ? { rotulo: FRASES_SET["acao.tentar"], onPress: falha.onTentar } : undefined} />
  )
  return (
    <div className="fixed inset-0 z-50 bg-cor-dialogo overflow-y-auto flex justify-center items-start pt-web-folha-topo pb-espaco-xxl px-web-margem">
      <div role="dialog" aria-modal="true" aria-labelledby={id}
        className="w-web-folha-largura max-w-full bg-cor-bg border-hairline border-cor-line-info rounded-raio-control p-espaco-xxl flex flex-col gap-espaco-xl text-cor-text font-fam-ui font-peso-ui leading-natural">
        <h2 id={id} className="font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural">{titulo}</h2>
        {!falhaAbaixo && linha}
        {children}
        {falhaAbaixo && linha}
        <div className="flex flex-wrap justify-end items-center gap-espaco-lg">{botoes}</div>
      </div>
    </div>
  )
}

export function Cancelar({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`${CONTROLE_LISTA} border-cor-line-info`}>{FRASES_SET["acao.cancelar"]}</button>
}

interface ConfirmarProps {
  rotulo: string
  icone: NomeIcone
  onClick?: () => void
  /** o nome acessível longo (rótulo curto na tela — N3-D17) */
  nome?: string
  inativo?: boolean
  /** o *Apagar*: contorno e ícone em `errorInk` */
  perigo?: boolean
  envia?: boolean
}

/** O botão de escrita do diálogo (`touch.list`): o ícone em `accentInk` (ou `errorInk`); inativo, `lineInfo` e o rótulo `muted`. */
export function Confirmar({ rotulo, icone, onClick, nome, inativo = false, perigo = false, envia = false }: ConfirmarProps) {
  const tinta = inativo ? "text-cor-line-info" : perigo ? "text-cor-error-ink" : "text-cor-accent-ink"
  return (
    <button type={envia ? "submit" : "button"} onClick={onClick} disabled={inativo} aria-label={nome}
      className={`${CONTROLE_LISTA} ${perigo ? "border-cor-error-ink" : "border-cor-line-info"} disabled:text-cor-muted`}>
      <Icone nome={icone} tamanho={24} className={tinta} />
      {rotulo}
    </button>
  )
}
