"use client"

/**
 * O diálogo de apagar conteúdo (I1-PR-9; folha 4, `LIB-apagar`; README-design
 * §2.4 "diálogo"): fundo `bg` a 82 % (`web.alfaDialogo`); a folha na largura
 * `folha.largura` (720 em C, 663 em B) a `folha.topo` do alto (100 · 96), respiro
 * `space.xxl`; título `font.display` · `size.title` · `tracking.display`; a
 * pergunta `size.body` · `lineHeight.text`; *Cancelar* e *Apagar* (contorno
 * `errorInk`, o `apagar setlist` 24 — reuso aceito na folha). Mesmo contrato de
 * antes (`open` · `onOpenChange` · `content` · `onConfirm`); Esc fecha.
 */
import React, { useEffect } from "react"
import { Icone } from "@/components/identidade/icone"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { FRASES_LISTA, comDado } from "@/components/library/frases-lista"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  content?: { title?: string } | null
  onConfirm: () => void
}

export function DeleteContentDialog({ open, onOpenChange, content, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return undefined
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false) }
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [open, onOpenChange])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-cor-dialogo flex justify-center items-start pt-web-folha-topo px-web-margem">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apagar-conteudo-titulo"
        className="w-web-folha-largura max-w-full bg-cor-bg border-hairline border-cor-line-info rounded-raio-control p-espaco-xxl flex flex-col gap-espaco-xl text-cor-text"
      >
        <h2 id="apagar-conteudo-titulo" className="font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural">
          {FRASES_LISTA["lib.apagar.titulo"]}
        </h2>
        <p className="text-tam-body leading-entrelinha-text">{comDado("lib.apagar.pergunta", { título: content?.title ?? "" })}</p>
        <div className="flex flex-wrap justify-end gap-espaco-lg">
          <button type="button" onClick={() => onOpenChange(false)} className={`${CONTROLE_LISTA} border-cor-line-info`}>
            {FRASES_LISTA["acao.cancelar"]}
          </button>
          <button type="button" onClick={onConfirm} className={`${CONTROLE_LISTA} border-cor-error-ink`}>
            <Icone nome="apagar-setlist" tamanho={24} className="text-cor-error-ink" />
            {FRASES_LISTA["lib.apagar.confirmar"]}
          </button>
        </div>
      </div>
    </div>
  )
}
