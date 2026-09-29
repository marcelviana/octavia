"use client"
/**
 * I1-PR-10 — a página de FUMAÇA da pré-verificação sem sessão. O roteiro a copia para
 * `app/fumaca-i1pr10/[estado]/page.tsx` antes de subir o `next dev` (sem `.env`) e a APAGA no fim; nunca é
 * commitada em `app/`. Monta o `ContentPageClient` real (a casca e a visualização) com a fixture do estado.
 */
import { useParams } from "next/navigation"
import ContentPageClient from "@/components/content-page-client"
import { FIXTURES } from "@/docs/ux/I1-PR10-anexos/pre-verificacao/fixtures"

export default function Fumaca() {
  const { estado } = useParams<{ estado: string }>()
  const c = FIXTURES[estado]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return c ? <ContentPageClient content={c as any} /> : <p>fixture ausente</p>
}
