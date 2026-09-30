/**
 * Os tipos das setlists na tela (I1-PR-13) — os que viviam em `types/performance.ts` (só as setlists os usavam).
 * A linha da setlist (`setlist_songs`) tem id PRÓPRIO: é por ele que se remove (o defeito (a) do N2 §10.3.5 removia
 * pelo id do content), e é o que a rota devolve ao adicionar (o defeito (b) inventava um).
 */
import type { Database } from "@/types/database.types"

export type Content = Database["public"]["Tables"]["content"]["Row"]
export type Setlist = Database["public"]["Tables"]["setlists"]["Row"]

/** O content como vem embutido na setlist (`GET /api/setlists`): um recorte da linha do content. */
export type ContentDaLinha = Pick<Content, "id" | "title" | "artist" | "content_type"> & Partial<Pick<Content, "bpm">>

export interface LinhaDaSetlist {
  id: string
  position: number
  notes: string | null
  content: ContentDaLinha
}

export type SetlistComMusicas = Setlist & { setlist_songs: LinhaDaSetlist[] }

export interface FormularioDaSetlist {
  name: string
  description: string
  performance_date: string
  venue: string
  notes: string
}
