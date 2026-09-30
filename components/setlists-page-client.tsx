"use client"

/**
 * A rota das setlists, do lado do cliente (I1-PR-13; folha `8-setlists`). Os carregamentos de antes — o `isLoading` do
 * Firebase (*"Loading your setlists..."*, fora da casca), o pedaço do `dynamic` (*"Loading setlists..."*) e o sem
 * usuário (`return null`: tela em branco) — são UM, na casca: o título, *Nova setlist* (inerte) e *carregando as
 * setlists…* (`SET-carregando`). O `handleSelectSetlist` de antes empurrava `/setlist/{id}`, rota que não existe, e
 * não tinha chamador (div. 498, I1-D33): saiu.
 */
import dynamic from "next/dynamic"
import { Casca } from "@/components/identidade/casca"
import { SetlistsCarregando } from "@/components/setlists/moldura"
import { useAuth } from "@/contexts/firebase-auth-context"

// Bundle splitting: o gerente das setlists vem num pedaço à parte
const SetlistManager = dynamic(() => import("@/components/setlist-manager").then((mod) => ({ default: mod.SetlistManager })), {
  loading: () => <SetlistsCarregando />,
  ssr: false, // Client-side only for better performance
})

export default function SetlistsPageClient() {
  const { user, isLoading } = useAuth()
  return <Casca>{isLoading || !user ? <SetlistsCarregando /> : <SetlistManager />}</Casca>
}
