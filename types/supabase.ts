export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string // Firebase UID (text format)
          email: string
          full_name: string | null
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          primary_instrument: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string // Firebase UID (text format)
          email: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          primary_instrument?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          primary_instrument?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          user_id: string // Firebase UID (text format)
          title: string
          artist: string | null
          album: string | null
          genre: string | null
          content_type: string
          key: string | null
          bpm: number | null
          time_signature: string | null
          difficulty: string | null
          capo: number | null
          tuning: string | null
          tags: string[] | null
          notes: string | null
          content_data: Json | null
          file_url: string | null
          thumbnail_url: string | null
          is_favorite: boolean
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string // Firebase UID (text format)
          title: string
          artist?: string | null
          album?: string | null
          genre?: string | null
          content_type: string
          key?: string | null
          bpm?: number | null
          time_signature?: string | null
          difficulty?: string | null
          capo?: number | null
          tuning?: string | null
          tags?: string[] | null
          notes?: string | null
          content_data?: Json | null
          file_url?: string | null
          thumbnail_url?: string | null
          is_favorite?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string // Firebase UID (text format)
          title?: string
          artist?: string | null
          album?: string | null
          genre?: string | null
          content_type?: string
          key?: string | null
          bpm?: number | null
          time_signature?: string | null
          difficulty?: string | null
          capo?: number | null
          tuning?: string | null
          tags?: string[] | null
          notes?: string | null
          content_data?: Json | null
          file_url?: string | null
          thumbnail_url?: string | null
          is_favorite?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      setlists: {
        Row: {
          id: string
          user_id: string // Firebase UID (text format)
          name: string
          description: string | null
          performance_date: string | null
          venue: string | null
          notes: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string // Firebase UID (text format)
          name: string
          description?: string | null
          performance_date?: string | null
          venue?: string | null
          notes?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string // Firebase UID (text format)
          name?: string
          description?: string | null
          performance_date?: string | null
          venue?: string | null
          notes?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      setlist_songs: {
        Row: {
          id: string
          setlist_id: string
          content_id: string
          position: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          setlist_id: string
          content_id: string
          position: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          setlist_id?: string
          content_id?: string
          position?: number
          notes?: string | null
          created_at?: string
        }
      }
      annotations: {
        Row: {
          id: string
          content_id: string
          user_id: string // Firebase UID (text format)
          annotation_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string // Firebase UID (text format)
          annotation_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          user_id?: string // Firebase UID (text format)
          annotation_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
