"use client"

/**
 * O menu da folha 4 (I1-PR-9; README-design §2.4, "menus (filtros, Mais)"):
 * abaixo do controle, com vão `space.sm`, itens `touch.min`, contorno `lineInfo`,
 * `radius.control`, fundo `bg`. Sem `@/components/ui/*`: um `div` posicionado,
 * que fecha com Esc e com o clique fora. `useMenu` é o estado; `PainelDoMenu`, a
 * caixa; `ItemDoMenu`, a linha de `touch.min`.
 */
import { useCallback, useEffect, useRef, useState } from "react"

export function useMenu() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fechar = useCallback(() => setAberto(false), [])
  const alternar = useCallback(() => setAberto((a) => !a), [])
  useEffect(() => {
    if (!aberto) return undefined
    const fora = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false) }
    document.addEventListener("mousedown", fora)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", fora)
      document.removeEventListener("keydown", esc)
    }
  }, [aberto])
  return { aberto, alternar, fechar, ref }
}

export const CAIXA_DO_MENU = "absolute top-full z-20 w-max bg-cor-bg border-hairline border-cor-line-info rounded-raio-control"

export function PainelDoMenu({ className = "", children, rotulo }: { className?: string; children: React.ReactNode; rotulo?: string }) {
  return (
    <div role="menu" aria-label={rotulo} className={`${CAIXA_DO_MENU} ${className}`}>
      {children}
    </div>
  )
}

export function ItemDoMenu({ onSelect, children, testid }: { onSelect: () => void; children: React.ReactNode; testid?: string }) {
  return (
    <button
      type="button"
      role="menuitem"
      data-testid={testid}
      onClick={onSelect}
      className="w-full h-toque-min flex items-center gap-espaco-md px-espaco-lg text-tam-body-small text-cor-text text-left"
    >
      {children}
    </button>
  )
}

/** O "▾" dos controles que abrem menu — mono `size.labelSmall`, `muted`. */
export function Seta() {
  return <span aria-hidden="true" className="font-fam-mono font-peso-mono text-tam-label-small text-cor-muted">▾</span>
}
