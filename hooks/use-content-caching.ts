import { useState, useEffect, useMemo, useRef } from 'react'
import { getCachedFileInfo, cacheFilesForContent, warmCache } from '@/lib/offline-cache'
import type { SongData, ContentCacheState } from '@/types/performance'

/**
 * Content Caching Hook
 * 
 * Handles all file loading, caching, and URL management for performance mode.
 * Critical requirement: Minimize cache lookup time for live performance.
 * 
 * Features:
 * - Automatic cache loading for all songs
 * - Blob URL management and cleanup
 * - Fallback to original file URLs
 * - Background caching for performance
 * - Resource cleanup on unmount
 */

export interface UseContentCachingProps {
  songs: SongData[]
}

export function useContentCaching({ songs }: UseContentCachingProps): ContentCacheState {
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])
  const [sheetMimeTypes, setSheetMimeTypes] = useState<(string | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Create stable references to prevent infinite loops
  const songsRef = useRef(songs)
  
  // Use a memoized hash to detect actual changes
  const songsHash = useMemo(() => {
    if (!songs || songs.length === 0) return 'empty'
    return JSON.stringify(songs.map(song => ({ 
      id: song?.id, 
      file_url: song?.file_url,
      content_file: song?.content_data?.file 
    })))
  }, [songs])

  // Update ref when songs actually change
  useEffect(() => {
    songsRef.current = songs
  }, [songsHash])

  // Extract lyrics data from songs
  const lyricsData = useMemo(() => 
    songs.map((song: any) => song?.content_data?.lyrics || ""),
    [songs]
  )

  // Load sheet URLs from cache or fallback to original URLs
  useEffect(() => {
    const currentSongs = songsRef.current
    
    if (songsHash === 'empty') {
      setSheetUrls([])
      setSheetMimeTypes([])
      setIsLoading(false)
      return
    }

    let isMounted = true
    const toRevoke: string[] = []
    setIsLoading(true)

    const loadSheetUrls = async () => {
      try {        
        const results = await Promise.all(
          currentSongs.map(async (song: any) => {
            if (song?.id && isMounted) {
              try {
                const fileInfo = await getCachedFileInfo(song.id)
                if (fileInfo && isMounted) {
                  toRevoke.push(fileInfo.url)
                  return { url: fileInfo.url, mimeType: fileInfo.mimeType }
                }
              } catch (error) {
                // Silently continue with fallback
              }
            }
            
            // Fallback to original URL
            return { 
              url: song?.file_url || song?.content_data?.file || null, 
              mimeType: null 
            }
          })
        )
        
        if (isMounted) {
          setSheetUrls(results.map(r => r.url))
          setSheetMimeTypes(results.map(r => r.mimeType))
        }
      } catch (error) {
        if (isMounted) {
          // Set fallback URLs
          setSheetUrls(currentSongs.map(song => song?.file_url || song?.content_data?.file || null))
          setSheetMimeTypes(currentSongs.map(() => null))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSheetUrls()

    // Enhanced cleanup function
    return () => {
      isMounted = false
      // Revoke blob URLs for memory management
      toRevoke.forEach(url => {
        try {
          if (url && typeof url === 'string' && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
          }
        } catch (error) {
          // Silently continue - browser may have already cleaned up
        }
      })
      // Clear references to help GC
      toRevoke.length = 0
    }
  }, [songsHash])

  // Background caching and cache warming for performance
  useEffect(() => {
    if (songsHash === 'empty') return

    let isMounted = true
    const abortController = new AbortController()

    const cacheContent = async () => {
      try {
        if (isMounted) {
          // First, warm the cache for better performance on first load
          await warmCache('high')
          
          // Then cache the current songs in background
          await cacheFilesForContent(songsRef.current)
        }
      } catch (error) {
        // Don't throw - caching failure shouldn't break performance mode
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Background caching failed:', error)
        }
      }
    }

    // Use a small delay to prevent overwhelming the system
    const timeoutId = setTimeout(cacheContent, 10)

    return () => {
      isMounted = false
      abortController.abort()
      clearTimeout(timeoutId)
    }
  }, [songsHash])

  // Warm cache on component mount for immediate performance benefit
  useEffect(() => {
    // Warm cache immediately for better first-load experience
    warmCache('normal').catch(() => {
      // Silently continue if cache warming fails
    })
  }, [])

  return {
    sheetUrls,
    sheetMimeTypes,
    lyricsData,
    isLoading
  }
}