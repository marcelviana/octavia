/**
 * Optimized Performance Mode
 * 
 * High-performance version of the performance mode component integrating
 * all optimization strategies for production-ready live music performances.
 */

import React, { memo, useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { OptimizedContentDisplay } from './performance-mode/optimized-content-display'
import { OptimizedPerformanceControls } from './performance-mode/optimized-performance-controls'
import { HeaderControls } from './performance-mode/header-controls'
import { NavigationControls } from './performance-mode/navigation-controls'
import { usePerformanceNavigation } from '@/hooks/use-performance-navigation'
import { usePerformanceControls } from '@/hooks/use-performance-controls'
import { useContentRenderer } from '@/hooks/use-content-renderer'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { useMemoryManagement } from '@/lib/memory-management'
import { usePerformanceMonitoring, useNavigationTiming } from '@/lib/performance-monitor'
import { useAdvancedContentCache } from '@/lib/advanced-content-cache'
import { Card } from '@/components/ui/card'
import type { 
  PerformanceModeProps, 
  SongData, 
  PerformanceControlsState,
  ContentRenderInfo
} from '@/types/performance'

// Memoized sub-components for maximum performance
const MemoizedHeaderControls = memo(HeaderControls)
const MemoizedOptimizedContentDisplay = memo(OptimizedContentDisplay)
const MemoizedOptimizedPerformanceControls = memo(OptimizedPerformanceControls)
const MemoizedNavigationControls = memo(NavigationControls)

export const OptimizedPerformanceMode = memo(function OptimizedPerformanceMode({
  onExitPerformance,
  selectedContent,
  selectedSetlist,
  startingSongIndex = 0,
}: PerformanceModeProps) {
  // Performance monitoring
  const { measureNavigation, measureRender, summary, alerts } = usePerformanceMonitoring()
  const { measureNavigation: measureNav } = useNavigationTiming()
  
  // Memory management
  const { trackResource, getMemoryStats } = useMemoryManagement()
  
  // Advanced caching
  const { preloadForCurrentSetlist, getCachedContent } = useAdvancedContentCache()
  
  // Wake lock to prevent screen from sleeping
  const { isSupported: wakeLockSupported, isActive: wakeLockActive } = useWakeLock()
  
  // Container ref for focus management
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Memoized songs array with performance optimization
  const songs: SongData[] = useMemo(() => {
    if (selectedSetlist?.setlist_songs) {
      return selectedSetlist.setlist_songs.map(s => ({
        id: s.content.id,
        title: s.content.title,
        artist: s.content.artist,
        key: s.content.key,
        bpm: s.content.bpm,
        content_type: s.content.content_type,
        file_url: s.content.file_url,
        content_data: s.content.content_data ? {
          lyrics: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'lyrics' in s.content.content_data 
            ? s.content.content_data.lyrics as string 
            : undefined,
          file: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'file' in s.content.content_data 
            ? s.content.content_data.file as string 
            : undefined
        } : null
      }))
    }
    if (selectedContent) {
      return [{
        id: selectedContent.id,
        title: selectedContent.title,
        artist: selectedContent.artist,
        key: selectedContent.key,
        bpm: selectedContent.bpm,
        content_type: selectedContent.content_type,
        file_url: selectedContent.file_url,
        content_data: selectedContent.content_data ? {
          lyrics: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'lyrics' in selectedContent.content_data 
            ? selectedContent.content_data.lyrics as string 
            : undefined,
          file: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'file' in selectedContent.content_data 
            ? selectedContent.content_data.file as string 
            : undefined
        } : null
      }]
    }
    return []
  }, [selectedSetlist, selectedContent])

  // Navigation with performance measurement
  const navigation = usePerformanceNavigation({ 
    songs, 
    onExitPerformance, 
    startingSongIndex 
  })

  const { 
    currentSong, 
    canGoNext, 
    canGoPrevious, 
    goToNext, 
    goToPrevious, 
    goToSong, 
    currentSongData 
  } = navigation

  // Performance controls
  const controlsState = usePerformanceControls()
  
  // Content rendering with caching
  const [sheetUrls, setSheetUrls] = useState<(string | null)[]>([])
  const [sheetMimeTypes, setSheetMimeTypes] = useState<(string | null)[]>([])
  const [lyricsData, setLyricsData] = useState<string[]>([])
  
  // Content renderer
  const renderInfo: ContentRenderInfo = useContentRenderer({
    currentSong,
    currentSongData,
    sheetUrls,
    sheetMimeTypes,
    lyricsData
  })

  // Optimized navigation handlers with measurement
  const handleGoToNext = useCallback(() => {
    measureNav('next-song', () => {
      goToNext()
    })
  }, [measureNav, goToNext])

  const handleGoToPrevious = useCallback(() => {
    measureNav('previous-song', () => {
      goToPrevious()
    })
  }, [measureNav, goToPrevious])

  const handleGoToSong = useCallback((index: number) => {
    measureNav('jump-to-song', () => {
      goToSong(index)
    })
  }, [measureNav, goToSong])

  // Preload content when song changes
  useEffect(() => {
    if (songs.length > 0) {
      preloadForCurrentSetlist(songs, currentSong)
    }
  }, [songs, currentSong, preloadForCurrentSetlist])

  // Load content with caching
  useEffect(() => {
    let isMounted = true
    
    const loadContent = async () => {
      const newSheetUrls: (string | null)[] = []
      const newMimeTypes: (string | null)[] = []
      const newLyricsData: string[] = []

      for (let i = 0; i < songs.length; i++) {
        const song = songs[i]
        
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
      }

      if (isMounted) {
        setSheetUrls(newSheetUrls)
        setSheetMimeTypes(newMimeTypes)
        setLyricsData(newLyricsData)
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [songs, getCachedContent, trackResource])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNext: handleGoToNext,
    onPrevious: handleGoToPrevious,
    onExit: onExitPerformance,
    onTogglePlay: controlsState.togglePlayPause,
    enabled: true,
  })

  // Focus management
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus()
    }
  }, [])

  // Performance alerts handling
  const [showPerformanceWarning, setShowPerformanceWarning] = useState(false)
  
  useEffect(() => {
    if (summary && (summary.overall === 'poor' || summary.overall === 'fair')) {
      setShowPerformanceWarning(true)
      
      // Auto-hide warning after 10 seconds
      const timer = setTimeout(() => setShowPerformanceWarning(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [summary])

  // Measure render performance for this component
  useEffect(() => {
    measureRender('OptimizedPerformanceMode', () => {
      // Component rendered
    })
  })

  // Loading state
  if (!currentSongData) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">
            Loading performance mode...
          </div>
          <div className="text-sm text-gray-600">
            Optimizing for best performance
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="h-screen bg-white flex flex-col focus:outline-none"
      tabIndex={-1}
      data-testid="optimized-performance-mode"
    >
      {/* Performance Warning */}
      {showPerformanceWarning && (
        <Card className="mx-4 mt-4 p-3 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-orange-600 font-medium">Performance Notice</div>
              <div className="text-sm text-orange-700">
                {summary?.recommendations[0] || 'Performance could be improved'}
              </div>
            </div>
            <button 
              onClick={() => setShowPerformanceWarning(false)}
              className="text-orange-600 hover:text-orange-800 px-2 py-1 text-sm"
            >
              Dismiss
            </button>
          </div>
        </Card>
      )}

      {/* Header Controls */}
      <MemoizedHeaderControls
        currentSongData={currentSongData}
        songs={songs}
        currentSong={currentSong}
        onExitPerformance={onExitPerformance}
        wakeLockActive={wakeLockActive && wakeLockSupported}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          <MemoizedOptimizedContentDisplay
            renderInfo={renderInfo}
            currentSongData={currentSongData}
            darkSheet={controlsState.state.darkSheet}
            zoom={controlsState.state.zoom}
          />
        </div>

        {/* Performance Controls */}
        <div className="flex-shrink-0 p-4">
          <MemoizedOptimizedPerformanceControls
            state={controlsState.state}
            onZoomIn={controlsState.zoomIn}
            onZoomOut={controlsState.zoomOut}
            onTogglePlayPause={controlsState.togglePlayPause}
            onBPMIncrease={controlsState.increaseBPM}
            onBPMDecrease={controlsState.decreaseBPM}
            onToggleDarkSheet={controlsState.toggleDarkSheet}
            onResetZoom={controlsState.resetZoom}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <MemoizedNavigationControls
        currentSong={currentSong}
        totalSongs={songs.length}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNext={handleGoToNext}
        onPrevious={handleGoToPrevious}
        onGoToSong={handleGoToSong}
        songs={songs}
      />

      {/* Memory Stats (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
          <div>Performance: {summary?.overall || 'measuring...'}</div>
          <div>Score: {summary?.score || 0}/100</div>
          <div>Alerts: {alerts.length}</div>
          <div>Memory: {getMemoryStats().trackedResources} resources</div>
        </div>
      )}
    </div>
  )
})

export default OptimizedPerformanceMode