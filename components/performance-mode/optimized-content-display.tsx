/**
 * Optimized Content Display Component
 * 
 * High-performance version of content display for live performances
 * with comprehensive memoization and optimization strategies.
 */

import React, { memo, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ContentRenderInfo, SongData } from '@/types/performance'

interface OptimizedContentDisplayProps {
  renderInfo: ContentRenderInfo
  currentSongData: SongData
  darkSheet: boolean
  zoom: number
  className?: string
}

// Memoized PDF display component
const MemoizedPDFDisplay = memo(function PDFDisplay({ 
  url, 
  zoom,
  darkSheet 
}: { 
  url: string
  zoom: number
  darkSheet: boolean
}) {
  const transformStyle = useMemo(() => ({
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top left',
    filter: darkSheet ? 'invert(1)' : 'none'
  }), [zoom, darkSheet])

  return (
    <div 
      className="w-full h-full overflow-auto"
      style={transformStyle}
    >
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full border-none"
        title="Sheet Music PDF"
        loading="eager" // Critical for performance
      />
    </div>
  )
})

// Memoized Image display component  
const MemoizedImageDisplay = memo(function ImageDisplay({
  url,
  zoom,
  darkSheet,
  title
}: {
  url: string
  zoom: number
  darkSheet: boolean
  title?: string
}) {
  const imageStyle = useMemo(() => ({
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top left',
    filter: darkSheet ? 'invert(1)' : 'none',
    maxWidth: 'none',
    height: 'auto'
  }), [zoom, darkSheet])

  return (
    <div className="w-full h-full overflow-auto flex justify-center">
      <img
        src={url}
        alt={title || 'Sheet Music'}
        style={imageStyle}
        className="block"
        loading="eager" // Critical for performance
        decoding="sync" // Synchronous decoding for immediate display
      />
    </div>
  )
})

// Memoized Lyrics display component
const MemoizedLyricsDisplay = memo(function LyricsDisplay({
  lyrics,
  zoom,
  darkSheet
}: {
  lyrics: string
  zoom: number
  darkSheet: boolean
}) {
  const textStyle = useMemo(() => ({
    fontSize: `${zoom}%`,
    color: darkSheet ? '#ffffff' : '#000000',
    backgroundColor: darkSheet ? '#000000' : 'transparent'
  }), [zoom, darkSheet])

  // Pre-process lyrics to avoid re-splitting on every render
  const lyricsLines = useMemo(() => 
    lyrics.split('\n'), 
    [lyrics]
  )

  return (
    <div 
      className="p-8 w-full h-full overflow-auto"
      style={textStyle}
    >
      <div className="max-w-2xl mx-auto font-mono leading-relaxed">
        {lyricsLines.map((line, index) => (
          <div key={index} className="mb-2">
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))}
      </div>
    </div>
  )
})

// Memoized empty state component
const MemoizedEmptyState = memo(function EmptyState({
  message,
  darkSheet
}: {
  message: string
  darkSheet: boolean
}) {
  const textColor = darkSheet ? 'text-white' : 'text-gray-600'
  
  return (
    <div className={cn("text-center py-8", textColor)}>
      <p className="text-xl">{message}</p>
    </div>
  )
})

export const OptimizedContentDisplay = memo(function OptimizedContentDisplay({
  renderInfo,
  currentSongData,
  darkSheet,
  zoom,
  className
}: OptimizedContentDisplayProps) {
  
  // Memoize render content to avoid unnecessary recalculations
  const renderedContent = useMemo(() => {
    switch (renderInfo.renderType) {
      case 'pdf':
        return (
          <MemoizedPDFDisplay 
            url={renderInfo.url!}
            zoom={zoom}
            darkSheet={darkSheet}
          />
        )

      case 'image':
        return (
          <MemoizedImageDisplay
            url={renderInfo.url!}
            zoom={zoom}
            darkSheet={darkSheet}
            title={currentSongData.title || undefined}
          />
        )

      case 'lyrics':
        return (
          <MemoizedLyricsDisplay
            lyrics={renderInfo.lyricsText!}
            zoom={zoom}
            darkSheet={darkSheet}
          />
        )

      case 'no-sheet':
        return (
          <MemoizedEmptyState
            message="No sheet music available"
            darkSheet={darkSheet}
          />
        )

      case 'no-lyrics':
        return (
          <MemoizedEmptyState
            message="No lyrics available for this song"
            darkSheet={darkSheet}
          />
        )

      case 'unsupported':
        return (
          <div className={cn("text-center py-8", darkSheet ? 'text-white' : 'text-gray-600')}>
            <p className="text-xl">Unsupported file format</p>
            <p className="text-sm mt-2">Please check that the file is a valid PDF or image</p>
            {renderInfo.errorInfo && (
              <p className="text-xs mt-2 text-gray-500">
                URL: {renderInfo.errorInfo.url.substring(0, 50)}... | 
                MIME: {renderInfo.errorInfo.mimeType || 'unknown'}
              </p>
            )}
          </div>
        )

      default:
        return (
          <MemoizedEmptyState
            message="Unable to display content"
            darkSheet={darkSheet}
          />
        )
    }
  }, [renderInfo, currentSongData.title, darkSheet, zoom])

  return (
    <div 
      className={cn("w-full h-full", className)}
      data-testid="optimized-content-display"
    >
      {renderedContent}
    </div>
  )
})

// Performance monitoring hook for content display
export const useContentDisplayPerformance = () => {
  const measureRenderTime = useCallback((operation: string) => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const duration = end - start
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Content Display ${operation}: ${duration.toFixed(2)}ms`)
      }
      
      // Track performance for analytics
      if ('gtag' in window) {
        // @ts-ignore
        gtag('event', 'performance_timing', {
          name: `content_display_${operation}`,
          value: Math.round(duration)
        })
      }
      
      return duration
    }
  }, [])

  return { measureRenderTime }
}