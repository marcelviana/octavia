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

export interface Setlist {
  id: string
  name: string
  description: string | null
  user_id: string
  event_date: string | null
  venue: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  setlist_songs?: FormattedSetlistSong[]
}