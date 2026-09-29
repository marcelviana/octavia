"use client"

/**
 * A BASE DA ESCALA da página do PDF (I1-PR-10, div. 761 — decisão do Marcel, 2026-09-29: "a folha"): em 100 % a
 * página tem a largura que a folha desenha — **60 % do painel** (README-design §2.4 "página do PDF"); na tela cheia,
 * **40 %** da largura em C e **85 %** em B (e A, mecânica), "tela cheia". Antes a base era `800` px, literal em JS —
 * invisível ao G-tok, que só lê classes e texto. O zoom (±0,2 entre 0,5 e 3) e o rótulo em % seguem os mesmos: só a
 * base muda. A largura útil é a caixa de conteúdo da área da página (sem o respiro), medida por `ResizeObserver`.
 */
import { useEffect, useState, type RefObject } from "react"
import { faixaDe } from "@octavia/identidade"

export const FRACAO_DA_PAGINA = { painel: 0.6, telaCheiaC: 0.4, telaCheiaB: 0.85 } as const

export function fracaoDaPagina(telaCheia: boolean, larguraDaJanela: number): number {
  if (!telaCheia) return FRACAO_DA_PAGINA.painel
  return faixaDe(larguraDaJanela) === "C" ? FRACAO_DA_PAGINA.telaCheiaC : FRACAO_DA_PAGINA.telaCheiaB
}

/** A largura da página em 100 %: a fração da largura útil da área (0 enquanto não medida). */
export function useBaseDaPagina(area: RefObject<HTMLElement | null>, telaCheia: boolean): number {
  const [util, setUtil] = useState(0)
  useEffect(() => {
    const el = area.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => { if (e) setUtil(e.contentRect.width) })
    ro.observe(el)
    return () => ro.disconnect()
  }, [area])
  const janela = typeof window === "undefined" ? 0 : window.innerWidth
  return Math.floor(util * fracaoDaPagina(telaCheia, janela))
}
