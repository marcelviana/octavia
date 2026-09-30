"use client"
/**
 * I1-PR-12 — a página de FUMAÇA da pré-verificação sem sessão. O roteiro a copia para
 * `app/fumaca-i1pr12/[estado]/page.tsx` numa CÓPIA da árvore (sem `.env*`) antes de subir o `next dev` e a apaga no fim;
 * nunca é commitada em `app/`. Monta os componentes REAIS do upload: a casca e o
 * `AddContent` (o corpo da rota, como o `add-content-page-client` o monta para quem tem usuário); em `UP-carregando`, o
 * próprio `AddContentPageClient` — sem Firebase não há usuário, e a rota cai no *carregando…* de verdade (o "sem
 * usuário" que antes era `return null`). SÓ NA CÓPIA, dois remendos para o fluxo andar sem sessão: `getValidToken`
 * devolve um token de fumaça e os dois hooks não param em `!user` — o `POST` segue FABRICADO pelo `route()` do roteiro.
 */
import { useParams } from "next/navigation"
import AddContentPageClient from "@/components/add-content-page-client"
import { AddContent } from "@/components/add-content"
import { Casca } from "@/components/identidade/casca"

export default function Fumaca() {
  const { estado } = useParams<{ estado: string }>()
  if (estado === "UP-carregando") return <AddContentPageClient />
  return <Casca><AddContent onContentCreated={() => undefined} onNavigate={() => undefined} /></Casca>
}
