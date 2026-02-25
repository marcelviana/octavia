/**
 * Performance Effects Hook
 *
 * Consolidates side effects for performance mode:
 * - Content preloading
 * - Keyboard shortcuts
 * - Focus management
 * - Performance measurement
 */

import { useEffect, useRef } from 'react'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useAdvancedContentCache } from '@/lib/advanced-content-cache'
import { usePerformanceMonitoring } from '@/lib/performance-monitor'
import type { SongData } from '@/types/performance'

interface UsePerformanceEffectsProps {
  songs: SongData[]
  currentSong: number
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  changeBpm: (delta: number, label: string) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Manages all side effects for optimized performance mode
 */
export function usePerformanceEffects({
  songs,
  currentSong,
  isPlaying,
  setIsPlaying,
  changeBpm,
  containerRef
}: UsePerformanceEffectsProps) {
  // Advanced content caching
  const { preloadForCurrentSetlist } = useAdvancedContentCache()

  // Performance monitoring
  const { measureRender } = usePerformanceMonitoring()

  // Preload content when song changes
  useEffect(() => {
    if (songs.length > 0) {
      preloadForCurrentSetlist(songs, currentSong)
    }
  }, [songs, currentSong, preloadForCurrentSetlist])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isPlaying,
    setIsPlaying,
    changeBpm
  })

  // Focus management - focus container on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [containerRef])

  // Measure render performance
  useEffect(() => {
    measureRender('OptimizedPerformanceMode', () => {
      // Component rendered
    })
  })
}
