"use client"
/**
 * D-0-PR1 — a página de FUMAÇA da parte B do aceite no navegador (`aceite-navegador.ts`). O roteiro a copia para
 * `app/fumaca-d0/page.tsx` numa CÓPIA da árvore (sem `.env*`) antes de subir o `next dev` na 3110 e a apaga no fim;
 * nunca é commitada em `app/` (o molde da I1-PR-11, `docs/ux/I1-PR11-anexos/pre-verificacao/pagina-fumaca.tsx`).
 * Monta o `ContentPageClient` REAL (a casca e a visualização) com a linha que vem no fragmento da URL (JSON em base64,
 * UTF-8): a linha da Tab como o `PUT` do editor a gravaria. O fragmento não sai do navegador.
 */
import { useEffect, useState } from "react"
import ContentPageClient from "@/components/content-page-client"
import type { ConteudoVisto } from "@/components/content/tipos"

export default function Fumaca() {
  const [linha, setLinha] = useState<ConteudoVisto | null>(null)
  useEffect(() => {
    const h = window.location.hash.slice(1)
    if (h) setLinha(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h), (c) => c.charCodeAt(0)))))
  }, [])
  return linha ? <ContentPageClient content={linha} /> : <p>fumaça: sem linha</p>
}
