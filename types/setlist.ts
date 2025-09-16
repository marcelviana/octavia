export interface SetlistSong {
  id: string
  setlist_id: string
  content_id: string
  position: number
  notes: string | null
}

export interface ContentData {
  id: string
  title: string
  artist: string | null
  content_type: string
  key: string | null
  bpm: number | null
  file_url: string | null
  content_data: Record<string, unknown> | null
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