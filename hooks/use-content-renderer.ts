import { useMemo } from 'react'
import { isPdfFile, isImageFile } from '@/lib/utils'
import { ContentType, normalizeContentType } from '@/types/content'
import type { SongData, ContentRenderInfo } from '@/types/performance'

/**
 * Content Renderer Hook
 * 
 * Handles content type detection and rendering logic for performance mode.
 * Determines how to display each song's content (PDF, Image, Lyrics, or fallback).
 * 
 * Features:
 * - Content type normalization and detection
 * - File type detection (PDF vs Image)
 * - Fallback handling for unsupported formats
 * - Performance-optimized with memoization
 */

export interface UseContentRendererProps {
  currentSong: number
  currentSongData: SongData
  sheetUrls: (string | null)[]
  sheetMimeTypes: (string | null)[]
  lyricsData: string[]
}

export function useContentRenderer({
  currentSong,
  currentSongData,
  sheetUrls,
  sheetMimeTypes,
  lyricsData
}: UseContentRendererProps): ContentRenderInfo {
  
  return useMemo(() => {
    const normalizedContentType = normalizeContentType(currentSongData.content_type || '')
    
    // Handle sheet music content
    if (normalizedContentType === ContentType.SHEET) {
      const url = sheetUrls[currentSong]
      
      if (!url) {
        return { 
          renderType: 'no-sheet',
          hasContent: false,
          sheetUrl: null,
          lyricsContent: '',
          contentType: currentSongData.content_type || null
        }
      }
      
      const mimeType = sheetMimeTypes[currentSong] || undefined
      const isPdf = isPdfFile(url, mimeType)
      const isImage = isImageFile(url, mimeType)
      
      // File type detection (logging removed for performance)
      
      if (isPdf) {
        return { 
          renderType: 'pdf', 
          url,
          mimeType,
          hasContent: true,
          sheetUrl: url,
          lyricsContent: '',
          contentType: currentSongData.content_type || null
        }
      }
      
      if (isImage) {
        return { 
          renderType: 'image', 
          url,
          mimeType,
          hasContent: true,
          sheetUrl: url,
          lyricsContent: '',
          contentType: currentSongData.content_type || null
        }
      }
      
      // Unsupported file format
      return { 
        renderType: 'unsupported',
        hasContent: false,
        sheetUrl: url,
        lyricsContent: '',
        contentType: currentSongData.content_type || null,
        errorInfo: {
          url,
          mimeType: mimeType
        }
      }
    }
    
    // Handle lyrics content (default case)
    const lyrics = lyricsData[currentSong]
    
    if (lyrics) {
      return {
        renderType: 'lyrics',
        lyricsText: lyrics,
        hasContent: true,
        sheetUrl: null,
        lyricsContent: lyrics,
        contentType: currentSongData.content_type || null
      }
    }
    
    // No lyrics available
    return { 
      renderType: 'no-lyrics',
      hasContent: false,
      sheetUrl: null,
      lyricsContent: '',
      contentType: currentSongData.content_type || null
    }
    
  }, [currentSong, currentSongData, sheetUrls, sheetMimeTypes, lyricsData])
}