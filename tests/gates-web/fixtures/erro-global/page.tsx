"use client"

/**
 * G-faixa, a FIXTURE do limite de erro global (I1-PR14). **Não é rota do app**: o executor a copia para
 * `app/g-faixa-erro-global/page.tsx` (caminho no `.gitignore`) só durante a medição e a apaga depois
 * (`scripts/gates-web/COMO-RODAR.md`, seção da I1-PR14). O servidor renderiza `null`; depois da hidratação o
 * cliente lança — o `ErrorBoundary` de `app/layout.tsx` captura e mostra a tela de erro.
 */
import { useEffect, useState } from "react"

export default function ErroGlobalDeFixture() {
  const [lancar, setLancar] = useState(false)
  useEffect(() => setLancar(true), [])
  if (lancar) throw new Error("G-faixa: erro de fixture (I1-PR14)")
  return null
}
