import { useMemo } from 'react'
import { isPdfFile, isImageFile } from '@/lib/utils'
import { ContentType, normalizeContentType } from '@/types/content'

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
  currentSongData: any
  sheetUrls: (string | null)[]
  sheetMimeTypes: (string | null)[]
  lyricsData: string[]
}

export interface ContentRenderInfo {
  renderType: 'pdf' | 'image' | 'lyrics' | 'no-sheet' | 'no-lyrics' | 'unsupported'
  url?: string
  mimeType?: string
  lyricsText?: string
  errorInfo?: {
    url: string
    mimeType: string | null
  }
}

export function useContentRenderer({
  currentSong,
  currentSongData,
  sheetUrls,
  sheetMimeTypes,
  lyricsData
}: UseContentRendererProps): ContentRenderInfo {
  
  return useMemo(() => {
    const normalizedContentType = normalizeContentType(currentSongData.content_type)
    
    // Handle sheet music content
    if (normalizedContentType === ContentType.SHEET) {
      const url = sheetUrls[currentSong]
      
      if (!url) {
        return { renderType: 'no-sheet' }
      }
      
      const mimeType = sheetMimeTypes[currentSong] || undefined
      const isPdf = isPdfFile(url, mimeType)
      const isImage = isImageFile(url, mimeType)
      
      // Log for debugging (matches existing behavior)
      console.log(`File type detection for song ${currentSong}:`, {
        url: url.substring(0, 50) + '...',
        mimeType,
        isPdf,
        isImage,
        contentType: currentSongData.content_type
      })
      
      if (isPdf) {
        return { 
          renderType: 'pdf', 
          url,
          mimeType 
        }
      }
      
      if (isImage) {
        return { 
          renderType: 'image', 
          url,
          mimeType 
        }
      }
      
      // Unsupported file format
      return { 
        renderType: 'unsupported',
        errorInfo: {
          url,
          mimeType: mimeType || null
        }
      }
    }
    
    // Handle lyrics content (default case)
    const lyrics = lyricsData[currentSong]
    
    if (lyrics) {
      return {
        renderType: 'lyrics',
        lyricsText: lyrics
      }
    }
    
    // No lyrics available
    return { renderType: 'no-lyrics' }
    
  }, [currentSong, currentSongData, sheetUrls, sheetMimeTypes, lyricsData])
}