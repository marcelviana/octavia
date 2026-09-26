import type { Database } from "@/types/database.types"

// Base types from Supabase
type Content = Database["public"]["Tables"]["content"]["Row"]
export type Setlist = Database["public"]["Tables"]["setlists"]["Row"]

// Tipos de setlist (os do modo performance saíram com o palco, I1-PR3)
export interface SetlistSong {
  id: string
  position: number
  notes: string | null
  content: Content
}

export interface SetlistWithSongs extends Setlist {
  setlist_songs: SetlistSong[]
  is_favorite?: boolean
}

// Form data for setlist creation/editing
export interface SetlistFormData {
  name: string
  description: string
  performance_date: string
  venue: string
  notes: string
}
