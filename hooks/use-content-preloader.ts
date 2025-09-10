import { useEffect, useRef, useMemo } from 'react'
import { getCachedFileInfo, cacheFilesForContent, preloadContent } from '@/lib/offline-cache'
import type { SongData } from '@/types/performance'

/**
 * Content Preloader Hook
 * 
 * Intelligently preloads the next song's content for seamless live performance transitions.
 * Critical for live music where waiting for file downloads during song changes is unacceptable.
 * 
 * Features:
 * - Preloads next song when current song loads
 * - Preloads previous song for backward navigation
 * - Prioritizes content based on user navigation patterns
 * - Manages memory by cleaning up old preloaded content
 * - Works alongside main content caching system
 */

export interface UseContentPreloaderProps {
  songs: SongData[]
  currentSongIndex: number
  isPlaying?: boolean
  enablePreloading?: boolean
}

export function useContentPreloader({ 
  songs, 
  currentSongIndex, 
  isPlaying = false,
  enablePreloading = true 
}: UseContentPreloaderProps) {
  const preloadedIndexes = useRef(new Set<number>())
  const abortController = useRef<AbortController>(new AbortController())
  
  // Calculate preload targets based on current position and user patterns
  const preloadTargets = useMemo(() => {
    if (!enablePreloading || !songs || songs.length === 0) return []
    
    const targets: Array<{ index: number; priority: number; reason: string }> = []
    
    // Next song (highest priority for live performance)
    if (currentSongIndex + 1 < songs.length) {
      targets.push({ 
        index: currentSongIndex + 1, 
        priority: 1, 
        reason: 'next_song' 
      })
    }
    
    // Previous song (for backward navigation during performance)
    if (currentSongIndex - 1 >= 0) {
      targets.push({ 
        index: currentSongIndex - 1, 
        priority: 2, 
        reason: 'previous_song' 
      })
    }
    
    // Song after next (if playing and likely to continue forward)
    if (isPlaying && currentSongIndex + 2 < songs.length) {
      targets.push({ 
        index: currentSongIndex + 2, 
        priority: 3, 
        reason: 'lookahead' 
      })
    }
    
    // Sort by priority (lower number = higher priority)
    return targets.sort((a, b) => a.priority - b.priority)
  }, [songs, currentSongIndex, isPlaying, enablePreloading])
  
  // Preload content for target songs
  useEffect(() => {
    if (preloadTargets.length === 0) return
    
    // Abort any previous preloading
    abortController.current.abort()
    abortController.current = new AbortController()
    
    let isMounted = true
    
    const preloadNext = async () => {
      try {
        for (const target of preloadTargets) {
          // Skip if already preloaded or component unmounted
          if (!isMounted || preloadedIndexes.current.has(target.index)) continue
          
          const song = songs[target.index]
          if (!song?.id) continue
          
          try {
            // Check if already cached
            const cached = await getCachedFileInfo(song.id)
            if (cached) {
              preloadedIndexes.current.add(target.index)
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Song ${target.index} already cached (${target.reason})`)
              }
              continue
            }
            
            // Preload the content
            if (isMounted) {
              await preloadContent([song], abortController.current.signal)
              preloadedIndexes.current.add(target.index)
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`🚀 Preloaded song ${target.index}: ${song.title || 'Unknown'} (${target.reason})`)
              }
            }
          } catch (error) {
            // Don't let preload failures affect performance mode
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Failed to preload song ${target.index}:`, error)
            }
          }
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Preloading error:', error)
        }
      }
    }
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleCallback = window.requestIdleCallback(() => {
        if (isMounted) preloadNext()
      }, { timeout: 5000 }) // 5s max wait
      
      return () => {
        isMounted = false
        window.cancelIdleCallback(idleCallback)
        abortController.current.abort()
      }
    } else {
      // Fallback for environments without requestIdleCallback
      const timeoutId = setTimeout(() => {
        if (isMounted) preloadNext()
      }, 500) // 500ms delay
      
      return () => {
        isMounted = false
        clearTimeout(timeoutId)
        abortController.current.abort()
      }
    }
  }, [preloadTargets, songs])
  
  // Clean up old preloaded content to manage memory
  useEffect(() => {
    const currentIndex = currentSongIndex
    const keepRange = 3 // Keep 3 songs before and after current
    
    // Remove preload flags for songs that are now far from current position
    const toRemove: number[] = []
    preloadedIndexes.current.forEach(index => {
      if (Math.abs(index - currentIndex) > keepRange) {
        toRemove.push(index)
      }
    })
    
    toRemove.forEach(index => {
      preloadedIndexes.current.delete(index)
    })
    
    if (process.env.NODE_ENV === 'development' && toRemove.length > 0) {
      console.log(`🗑️ Cleaned up preload cache for songs: ${toRemove.join(', ')}`)
    }
  }, [currentSongIndex])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortController.current.abort()
      preloadedIndexes.current.clear()
    }
  }, [])
  
  // Return preload state for debugging/monitoring
  return {
    preloadedSongs: Array.from(preloadedIndexes.current),
    nextTargets: preloadTargets.map(t => ({ 
      songIndex: t.index, 
      title: songs[t.index]?.title || 'Unknown',
      reason: t.reason 
    })),
    isEnabled: enablePreloading
  }
}