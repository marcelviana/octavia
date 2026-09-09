export interface SetlistSong {
  id: string
  setlist_id: string
  content_id: string
  position: number
  notes: string | null
}

import type { Json } from "@/types/database.types"

export interface ContentData {
  id: string
  title: string
  artist: string | null
  content_type: string
  key: string | null
  bpm: number | null
  file_url: string | null
  // Json, não Record<...>: a coluna é jsonb e pode conter string/número/array
  // (é o mesmo defeito do achado b3 visto do lado do tipo — B2 PR-2, E2/E3).
  // Consumo é passthrough para a resposta; quem precisar de forma específica
  // valida na leitura.
  content_data: Json | null
}

export interface FormattedSetlistSong {
  id: string
  setlist_id: string
  content_id: string
  position: number
  notes: string | null
  content: ContentData
}

// (B7-PR2, decisão B7-D4) A interface `Setlist` que vivia aqui foi removida:
// zero consumidores e drift contra o banco (`event_date` não existe; a coluna
// é `performance_date`). O tipo da linha real é
// Database['public']['Tables']['setlists']['Row'] em types/database.types.ts.