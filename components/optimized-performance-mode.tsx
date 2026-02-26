/**
 * Optimized Performance Mode
 * High-performance version integrating all optimization strategies for live performances.
 */

import React, { memo, useRef } from 'react'
import { OptimizedContentDisplay } from './performance-mode/optimized-content-display'
import { HeaderControls } from './performance-mode/header-controls'
import { NavigationControls } from './performance-mode/navigation-controls'
import { LoadingState } from './performance-mode/loading-state'
import { PerformanceWarning } from './performance-mode/performance-warning'
import { MemoryStats } from './performance-mode/memory-stats'
import { usePerformanceNavigation } from '@/hooks/use-performance-navigation'
import { usePerformanceControls } from '@/hooks/use-performance-controls'
import { useContentRenderer } from '@/hooks/use-content-renderer'
import { useContentLoading } from '@/hooks/use-content-loading'
import { usePerformanceMonitoringUI } from '@/hooks/use-performance-monitoring-ui'
import { useSongsTransformation } from '@/hooks/use-songs-transformation'
import { usePerformanceEffects } from '@/hooks/use-performance-effects'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { useMemoryManagement } from '@/lib/memory-management'
import { usePerformanceMonitoring } from '@/lib/performance-monitor'
import type {
  PerformanceModeProps,
  ContentRenderInfo
} from '@/types/performance'

// Memoized sub-components for maximum performance
const MemoizedHeaderControls = memo(HeaderControls)
const MemoizedOptimizedContentDisplay = memo(OptimizedContentDisplay)
const MemoizedNavigationControls = memo(NavigationControls)

export const OptimizedPerformanceMode = memo(function OptimizedPerformanceMode({
  onExitPerformance,
  selectedContent,
  selectedSetlist,
  startingSongIndex = 0,
}: PerformanceModeProps) {
  const { summary, alerts } = usePerformanceMonitoring()
  const { getMemoryStats } = useMemoryManagement()
  const { isActive: wakeLockActive } = useWakeLock()
  const containerRef = useRef<HTMLDivElement>(null)
  const contentScrollRef = useRef<HTMLDivElement>(null)

  const songs = useSongsTransformation({ selectedSetlist, selectedContent })

  const {
    currentSong,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    goToSong,
    currentSongData
  } = usePerformanceNavigation({
    songs,
    onExitPerformance,
    startingSongIndex,
    measureNavigation: true
  })

  const { sheetUrls, sheetMimeTypes, lyricsData, chordsData } = useContentLoading(songs)

  const controlsState = usePerformanceControls({
    currentSong,
    lyricsData,
    currentSongData,
    contentRef: contentScrollRef
  })

  const renderInfo: ContentRenderInfo = useContentRenderer({
    currentSong,
    currentSongData,
    sheetUrls,
    sheetMimeTypes,
    lyricsData,
    chordsData
  })

  usePerformanceEffects({
    songs,
    currentSong,
    isPlaying: controlsState.isPlaying,
    setIsPlaying: controlsState.setIsPlaying,
    changeBpm: controlsState.changeBpm,
    containerRef
  })

  const { showWarning, dismissWarning } = usePerformanceMonitoringUI(summary)

  if (!currentSongData) return <LoadingState />

  return (
    <div
      ref={containerRef}
      className="h-screen bg-white flex flex-col focus:outline-none"
      tabIndex={-1}
      data-testid="optimized-performance-mode"
    >
      {showWarning && (
        <PerformanceWarning summary={summary} onDismiss={dismissWarning} />
      )}

      <MemoizedHeaderControls
        currentSongData={currentSongData}
        onExitPerformance={onExitPerformance}
        darkSheet={controlsState.darkSheet}
        setDarkSheet={controlsState.setDarkSheet}
        zoom={controlsState.zoom}
        setZoom={controlsState.setZoom}
        isPlaying={controlsState.isPlaying}
        onTogglePlay={controlsState.handleTogglePlay}
        bpm={controlsState.bpm}
        bpmFeedback={controlsState.bpmFeedback}
        startPress={controlsState.startPress}
        endPress={controlsState.endPress}
      />

      <div className="flex-1 min-h-0 flex flex-col pt-[110px] pb-[60px]">
        <div className="flex-1 min-h-0 overflow-hidden">
          <MemoizedOptimizedContentDisplay
            renderInfo={renderInfo}
            currentSongData={currentSongData}
            darkSheet={controlsState.darkSheet}
            zoom={controlsState.zoom}
            contentRef={contentScrollRef}
          />
        </div>
      </div>

      <MemoizedNavigationControls
        showControls={controlsState.showControls}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        songs={songs}
        currentSong={currentSong}
        goToSong={goToSong}
      />

      <MemoryStats
        summary={summary}
        alerts={alerts}
        memoryStats={getMemoryStats()}
      />
    </div>
  )
})

export default OptimizedPerformanceMode
