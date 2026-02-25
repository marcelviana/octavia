/**
 * Content Loading Hook
 *
 * Extracts data loading logic from optimized-performance-mode component.
 * Handles loading of sheet URLs, MIME types, lyrics, and chords data
 * with proper caching and memory tracking.
 */

import { useState, useEffect } from 'react'
import type { SongData } from '@/types/performance'
import { useAdvancedContentCache } from '@/lib/advanced-content-cache'
import { useMemoryManagement } from '@/lib/memory-management'

interface ContentLoadingResult {
  sheetUrls: (string | null)[]
  sheetMimeTypes: (string | null)[]
  lyricsData: string[]
  chordsData: Array<{ chords: any; sections: any }>
  isLoading: boolean
}

export function useContentLoading(songs: SongData[]): ContentLoadingResult {
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])
  const [sheetMimeTypes, setSheetMimeTypes] = useState<(string | null)[]>([])
  const [lyricsData, setLyricsData] = useState<string[]>([])
  const [chordsData, setChordsData] = useState<Array<{ chords: any; sections: any }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const { getCachedContent } = useAdvancedContentCache()
  const { trackResource } = useMemoryManagement()

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const loadContent = async () => {
      const newSheetUrls: (string | null)[] = []
      const newMimeTypes: (string | null)[] = []
      const newLyricsData: string[] = []
      const newChordsData: Array<{ chords: any; sections: any }> = []

      for (let i = 0; i < songs.length; i++) {
        const song = songs[i]
        if (!song) continue

        // Load file content if available
        if (song.file_url) {
          try {
            const cached = await getCachedContent(song.file_url, song.id)
            if (cached && isMounted) {
              const blobUrl = URL.createObjectURL(cached.data)
              newSheetUrls[i] = blobUrl
              newMimeTypes[i] = cached.mimeType

              // Track blob URL for cleanup
              trackResource(`blob-url-${song.id}`, 'blob', {
                url: blobUrl,
                revoke: () => URL.revokeObjectURL(blobUrl)
              })
            } else {
              newSheetUrls[i] = null
              newMimeTypes[i] = null
            }
          } catch (error) {
            console.warn(`Failed to load content for song ${song.id}:`, error)
            newSheetUrls[i] = null
            newMimeTypes[i] = null
          }
        } else {
          newSheetUrls[i] = null
          newMimeTypes[i] = null
        }

        // Load lyrics from content_data
        if (song.content_data?.lyrics) {
          newLyricsData[i] = song.content_data.lyrics
        } else {
          newLyricsData[i] = ''
        }

        // Load chords/sections from content_data
        newChordsData[i] = {
          chords: song.content_data?.chords || null,
          sections: song.content_data?.sections || null
        }
      }

      if (isMounted) {
        setSheetUrls(newSheetUrls)
        setSheetMimeTypes(newMimeTypes)
        setLyricsData(newLyricsData)
        setChordsData(newChordsData)
        setIsLoading(false)
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [songs, getCachedContent, trackResource])

  return {
    sheetUrls,
    sheetMimeTypes,
    lyricsData,
    chordsData,
    isLoading
  }
}
