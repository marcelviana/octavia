export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      annotations: {
        Row: {
          annotation_data: Json
          content_id: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annotation_data: Json
          content_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annotation_data?: Json
          content_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          album: string | null
          artist: string | null
          bpm: number | null
          capo: number | null
          content_data: Json | null
          content_type: string
          created_at: string | null
          difficulty: string | null
          file_url: string | null
          genre: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          key: string | null
          notes: string | null
          tags: string[] | null
          thumbnail_url: string | null
          time_signature: string | null
          title: string
          tuning: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          album?: string | null
          artist?: string | null
          bpm?: number | null
          capo?: number | null
          content_data?: Json | null
          content_type: string
          created_at?: string | null
          difficulty?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          key?: string | null
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          time_signature?: string | null
          title: string
          tuning?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          album?: string | null
          artist?: string | null
          bpm?: number | null
          capo?: number | null
          content_data?: Json | null
          content_type?: string
          created_at?: string | null
          difficulty?: string | null
          file_url?: string | null
          genre?: string | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          key?: string | null
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          time_signature?: string | null
          title?: string
          tuning?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          primary_instrument: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          primary_instrument?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          primary_instrument?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      setlist_songs: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          notes: string | null
          position: number
          setlist_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position: number
          setlist_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          position?: number
          setlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_songs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          notes: string | null
          performance_date: string | null
          updated_at: string | null
          user_id: string
          venue: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          notes?: string | null
          performance_date?: string | null
          updated_at?: string | null
          user_id: string
          venue?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          notes?: string | null
          performance_date?: string | null
          updated_at?: string | null
          user_id?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_setlist_song: {
        Args: { p_content_id: string; p_notes: string; p_setlist_id: string }
        Returns: {
          content_id: string
          created_at: string | null
          id: string
          notes: string | null
          position: number
          setlist_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "setlist_songs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      delete_content_resequence: {
        Args: { p_content_id: string }
        Returns: {
          album: string | null
          artist: string | null
          bpm: number | null
          capo: number | null
          content_data: Json | null
          content_type: string
          created_at: string | null
          difficulty: string | null
          file_url: string | null
          genre: string | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          key: string | null
          notes: string | null
          tags: string[] | null
          thumbnail_url: string | null
          time_signature: string | null
          title: string
          tuning: string | null
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "content"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      remove_setlist_song: {
        Args: { p_song_id: string }
        Returns: {
          id: string
          position: number
        }[]
      }
      reorder_setlist_songs: {
        Args: { p_setlist_id: string; p_song_ids: string[] }
        Returns: {
          id: string
          position: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
