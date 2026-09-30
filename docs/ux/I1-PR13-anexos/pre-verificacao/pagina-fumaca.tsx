"use client"
/**
 * I1-PR-13 — a página de FUMAÇA da pré-verificação sem sessão. O roteiro a copia para
 * `app/fumaca-i1pr13/[estado]/page.tsx` numa CÓPIA da árvore (sem `.env*`) antes de subir o `next dev` e a apaga no fim;
 * nunca é commitada em `app/`. Monta os componentes REAIS das setlists: a casca e o `SetlistManager` (o corpo da rota,
 * como o `setlists-page-client` o monta para quem tem usuário); em `SET-carregando`, o próprio `SetlistsPageClient` —
 * sem Firebase não há usuário, e a rota cai no *carregando as setlists…* de verdade (o "sem usuário" que antes era
 * `return null`). SÓ NA CÓPIA, três remendos para a tela andar sem sessão (`remendos.sh`): o `useSetlists` recebe um
 * usuário de fumaça; o `lib/setlist-service.ts` e o `getUserContentPage` de `lib/content-service.ts` usam um usuário e
 * um token de fumaça. Toda leitura e toda escrita seguem FABRICADAS pelo `route()` do roteiro.
 */
import { useParams } from "next/navigation"
import SetlistsPageClient from "@/components/setlists-page-client"
import { SetlistManager } from "@/components/setlist-manager"
import { Casca } from "@/components/identidade/casca"

export default function Fumaca() {
  const { estado } = useParams<{ estado: string }>()
  if (estado === "SET-carregando") return <SetlistsPageClient />
  return <Casca><SetlistManager /></Casca>
}
