import { useState, useEffect, useMemo } from 'react'
import { getCachedFileInfo, cacheFilesForContent } from '@/lib/offline-cache'

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
  songs: any[]
}

export interface ContentCachingState {
  sheetUrls: (string | null)[]
  sheetMimeTypes: (string | null)[]
  lyricsData: string[]
  isLoading: boolean
}

export function useContentCaching({ songs }: UseContentCachingProps): ContentCachingState {
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])
  const [sheetMimeTypes, setSheetMimeTypes] = useState<(string | null)[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Extract lyrics data from songs
  const lyricsData = useMemo(() => 
    songs.map((song: any) => song?.content_data?.lyrics || ""),
    [songs]
  )

  // Load sheet URLs from cache or fallback to original URLs
  useEffect(() => {
    if (songs.length === 0) {
      setSheetUrls([])
      setSheetMimeTypes([])
      return
    }

    let toRevoke: string[] = []
    setIsLoading(true)

    const loadSheetUrls = async () => {
      try {
        console.log('Loading sheet URLs for performance mode, songs:', songs.length)
        
        const results = await Promise.all(
          songs.map(async (song: any, index: number) => {
            if (song?.id) {
              console.log(`Loading cached file info for song ${index}: ${song.title} (ID: ${song.id})`)
              
              try {
                const fileInfo = await getCachedFileInfo(song.id)
                if (fileInfo) {
                  console.log(`Found cached file for song ${index}: ${fileInfo.url.substring(0, 50)}... (MIME: ${fileInfo.mimeType})`)
                  toRevoke.push(fileInfo.url)
                  return { url: fileInfo.url, mimeType: fileInfo.mimeType }
                } else {
                  console.log(`No cached file found for song ${index}, using file_url: ${song.file_url}`)
                }
              } catch (error) {
                console.warn(`Cache lookup failed for song ${index}:`, error)
              }
            }
            
            // Fallback to original URL
            return { 
              url: song?.file_url || song?.content_data?.file || null, 
              mimeType: null 
            }
          })
        )
        
        console.log('Sheet URLs loaded:', results.map((r, i) => 
          `${i}: ${r.url?.substring(0, 50)}... (MIME: ${r.mimeType})`
        ))
        
        setSheetUrls(results.map(r => r.url))
        setSheetMimeTypes(results.map(r => r.mimeType))
      } catch (error) {
        console.error('Failed to load sheet URLs:', error)
        // Set fallback URLs
        setSheetUrls(songs.map(song => song?.file_url || song?.content_data?.file || null))
        setSheetMimeTypes(songs.map(() => null))
      } finally {
        setIsLoading(false)
      }
    }

    loadSheetUrls()

    // Cleanup function to revoke blob URLs
    return () => {
      toRevoke.forEach(url => {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          console.warn('Failed to revoke blob URL:', error)
        }
      })
    }
  }, [songs])

  // Background caching for performance
  useEffect(() => {
    if (songs.length === 0) return

    const cacheContent = async () => {
      try {
        await cacheFilesForContent(songs)
      } catch (error) {
        console.error('Failed to cache files for performance:', error)
        // Don't throw - caching failure shouldn't break performance mode
      }
    }

    cacheContent()
  }, [songs])

  return {
    sheetUrls,
    sheetMimeTypes,
    lyricsData,
    isLoading
  }
}