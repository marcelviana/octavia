import type { Database } from "@/types/supabase"

// Base types from Supabase
export type Content = Database["public"]["Tables"]["content"]["Row"]
export type Setlist = Database["public"]["Tables"]["setlists"]["Row"]

// Enhanced types for performance mode
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

// Performance mode specific interfaces
export interface PerformanceModeProps {
  onExitPerformance: () => void
  selectedContent?: Content | null
  selectedSetlist?: SetlistWithSongs | null
  startingSongIndex?: number
}

export interface SongData {
  id: string
  title?: string | null
  artist?: string | null
  key?: string | null
  bpm?: number | null
  content_type?: string | null
  file_url?: string | null
  content_data?: {
    lyrics?: string
    file?: string
  } | null
}

// Performance controls state
export interface PerformanceControlsState {
  zoom: number
  isPlaying: boolean
  bpm: number
  darkSheet: boolean
  bpmFeedback: string | null
  showControls: boolean
}

// Content caching state
export interface ContentCacheState {
  sheetUrls: (string | null)[]
  sheetMimeTypes: (string | null)[]
  lyricsData: string[]
  isLoading: boolean
}

// Content render information
export interface ContentRenderInfo {
  renderType: 'pdf' | 'image' | 'lyrics' | 'no-sheet' | 'no-lyrics' | 'unsupported'
  url?: string
  mimeType?: string
  lyricsText?: string
  hasContent: boolean
  sheetUrl: string | null
  lyricsContent: string
  contentType: string | null
}

// Navigation state
export interface NavigationState {
  currentSong: number
  canGoNext: boolean
  canGoPrevious: boolean
  currentSongData: SongData
}

// Performance metrics (for optimization)
export interface PerformanceMetrics {
  navigationTime: number
  cacheHitRate: number
  renderTime: number
  memoryUsage?: number
}