/**
 * Optimized Content Display Component
 * 
 * High-performance version of content display for live performances
 * with comprehensive memoization and optimization strategies.
 */

import React, { memo, useMemo, useCallback } from 'react'
import Image from 'next/image'
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
      <div style={imageStyle} className="block">
        <Image
          src={url}
          alt={title || 'Sheet Music'}
          width={800}
          height={600}
          priority // Critical for performance
          unoptimized // For performance mode, skip optimization
          className="max-w-none h-auto"
        />
      </div>
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
      className="px-8 py-8 w-full h-full overflow-auto"
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

// Memoized Chords display component
const MemoizedChordsDisplay = memo(function ChordsDisplay({
  chordsData,
  zoom,
  darkSheet
}: {
  chordsData: any
  zoom: number
  darkSheet: boolean
}) {
  const containerStyle = useMemo(() => ({
    fontSize: `${zoom}%`,
    color: darkSheet ? '#ffffff' : '#000000',
    backgroundColor: darkSheet ? '#000000' : 'transparent'
  }), [zoom, darkSheet])

  const bgColor = darkSheet ? 'bg-gray-800' : 'bg-white/90'
  const borderColor = darkSheet ? 'border-purple-400' : 'border-purple-300'
  const textColor = darkSheet ? 'text-purple-300' : 'text-purple-600'
  const accentBg = darkSheet ? 'bg-gray-700' : 'bg-purple-50'

  return (
    <div 
      className="px-8 py-8 w-full h-full overflow-auto"
      style={containerStyle}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {Array.isArray(chordsData) ? (
          chordsData.map((section: any, index: number) => (
            <div 
              key={section.id || index} 
              className={cn(
                "p-6 backdrop-blur-sm border-2 rounded-2xl shadow-lg",
                bgColor,
                borderColor
              )}
            >
              {section.name && (
                <h3 className={cn("text-2xl font-bold mb-4", textColor)}>
                  {section.name}
                </h3>
              )}
              {section.chords && (
                <div className={cn("mb-4 p-4 rounded-lg", accentBg)}>
                  <span className={cn("text-lg font-semibold", textColor)}>Chords: </span>
                  <span className="font-mono text-lg font-medium">{section.chords}</span>
                </div>
              )}
              {section.lyrics && (
                <div className="font-mono leading-relaxed whitespace-pre-wrap">
                  {section.lyrics}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={cn("p-6 backdrop-blur-sm border-2 rounded-2xl shadow-lg", bgColor, borderColor)}>
            <div className="font-mono leading-relaxed whitespace-pre-wrap">
              {String(chordsData)}
            </div>
          </div>
        )}
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

      case 'chords':
        return (
          <MemoizedChordsDisplay
            chordsData={renderInfo.chordsData!}
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