/**
 * Optimized Performance Controls
 * 
 * High-performance control components for live music performance
 * with debounced inputs and minimized re-renders.
 */

import React, { memo, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Moon,
  Sun,
  Volume2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PerformanceControlsState } from '@/types/performance'

interface OptimizedPerformanceControlsProps {
  state: PerformanceControlsState
  onZoomIn: () => void
  onZoomOut: () => void
  onTogglePlayPause: () => void
  onBPMIncrease: () => void
  onBPMDecrease: () => void
  onToggleDarkSheet: () => void
  onResetZoom: () => void
  className?: string
}

// Memoized Zoom Controls
const MemoizedZoomControls = memo(function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}) {
  // Debounce zoom operations for performance
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  
  const debouncedZoomIn = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(onZoomIn, 16) // ~60fps
  }, [onZoomIn])

  const debouncedZoomOut = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    debounceTimeoutRef.current = setTimeout(onZoomOut, 16) // ~60fps
  }, [onZoomOut])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={debouncedZoomOut}
        disabled={zoom <= 50}
        className="h-8 w-8 p-0"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetZoom}
        className="min-w-[60px] h-8 text-sm font-mono"
        aria-label={`Current zoom ${zoom}%, click to reset`}
      >
        {zoom}%
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={debouncedZoomIn}
        disabled={zoom >= 200}
        className="h-8 w-8 p-0"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  )
})

// Memoized BPM Controls
const MemoizedBPMControls = memo(function BPMControls({
  bpm,
  bpmFeedback,
  onBPMIncrease,
  onBPMDecrease
}: {
  bpm: number
  bpmFeedback: string | null
  onBPMIncrease: () => void
  onBPMDecrease: () => void
}) {
  // Use refs for rapid BPM adjustments
  const bpmTimeoutRef = useRef<NodeJS.Timeout>()
  const isAdjustingRef = useRef(false)

  const handleBPMIncrease = useCallback(() => {
    if (isAdjustingRef.current) return
    isAdjustingRef.current = true
    
    onBPMIncrease()
    
    if (bpmTimeoutRef.current) {
      clearTimeout(bpmTimeoutRef.current)
    }
    bpmTimeoutRef.current = setTimeout(() => {
      isAdjustingRef.current = false
    }, 100)
  }, [onBPMIncrease])

  const handleBPMDecrease = useCallback(() => {
    if (isAdjustingRef.current) return
    isAdjustingRef.current = true
    
    onBPMDecrease()
    
    if (bpmTimeoutRef.current) {
      clearTimeout(bpmTimeoutRef.current)
    }
    bpmTimeoutRef.current = setTimeout(() => {
      isAdjustingRef.current = false
    }, 100)
  }, [onBPMDecrease])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBPMDecrease}
        disabled={bpm <= 60}
        className="h-8 w-8 p-0"
        aria-label="Decrease BPM"
      >
        -
      </Button>
      
      <div className="min-w-[80px] text-center">
        <div className="text-sm font-mono">{bpm} BPM</div>
        {bpmFeedback && (
          <div className="text-xs text-gray-500 animate-fade-in">
            {bpmFeedback}
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleBPMIncrease}
        disabled={bpm >= 200}
        className="h-8 w-8 p-0"
        aria-label="Increase BPM"
      >
        +
      </Button>
    </div>
  )
})

// Memoized Play/Pause Control
const MemoizedPlayPauseControl = memo(function PlayPauseControl({
  isPlaying,
  onTogglePlayPause
}: {
  isPlaying: boolean
  onTogglePlayPause: () => void
}) {
  const icon = useMemo(() => 
    isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />,
    [isPlaying]
  )

  return (
    <Button
      variant={isPlaying ? "default" : "outline"}
      size="sm"
      onClick={onTogglePlayPause}
      className="h-10 w-16"
      data-testid="play-pause-button"
      aria-label={isPlaying ? "Pause metronome" : "Play metronome"}
    >
      <span data-testid={isPlaying ? "pause-icon" : "play-icon"}>
        {icon}
      </span>
    </Button>
  )
})

// Memoized Theme Toggle
const MemoizedThemeToggle = memo(function ThemeToggle({
  darkSheet,
  onToggleDarkSheet
}: {
  darkSheet: boolean
  onToggleDarkSheet: () => void
}) {
  const icon = useMemo(() => 
    darkSheet ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
    [darkSheet]
  )

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggleDarkSheet}
      className="h-8 w-8 p-0"
      aria-label={darkSheet ? "Switch to light mode" : "Switch to dark mode"}
    >
      {icon}
    </Button>
  )
})

export const OptimizedPerformanceControls = memo(function OptimizedPerformanceControls({
  state,
  onZoomIn,
  onZoomOut,
  onTogglePlayPause,
  onBPMIncrease,
  onBPMDecrease,
  onToggleDarkSheet,
  onResetZoom,
  className
}: OptimizedPerformanceControlsProps) {
  
  // Memoize the entire controls layout
  const controlsContent = useMemo(() => (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-4">
        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Zoom:</span>
          <MemoizedZoomControls
            zoom={state.zoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
          />
        </div>

        {/* Metronome Controls */}
        <div className="flex items-center gap-3">
          <MemoizedPlayPauseControl
            isPlaying={state.isPlaying}
            onTogglePlayPause={onTogglePlayPause}
          />
          
          <MemoizedBPMControls
            bpm={state.bpm}
            bpmFeedback={state.bpmFeedback}
            onBPMIncrease={onBPMIncrease}
            onBPMDecrease={onBPMDecrease}
          />
        </div>

        {/* Display Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Display:</span>
          <MemoizedThemeToggle
            darkSheet={state.darkSheet}
            onToggleDarkSheet={onToggleDarkSheet}
          />
        </div>
      </div>
    </Card>
  ), [
    state.zoom,
    state.isPlaying, 
    state.bpm,
    state.bpmFeedback,
    state.darkSheet,
    onZoomIn,
    onZoomOut,
    onTogglePlayPause,
    onBPMIncrease,
    onBPMDecrease,
    onToggleDarkSheet,
    onResetZoom
  ])

  return (
    <div className={cn("w-full", className)}>
      {controlsContent}
    </div>
  )
})

// Performance monitoring for controls
export const useControlsPerformance = () => {
  const interactionCountRef = useRef(0)
  const lastInteractionRef = useRef<number>(0)

  const trackInteraction = useCallback((type: string) => {
    const now = performance.now()
    interactionCountRef.current += 1
    
    const timeSinceLastInteraction = now - lastInteractionRef.current
    lastInteractionRef.current = now

    // Log rapid interactions that might cause performance issues
    if (timeSinceLastInteraction < 100 && interactionCountRef.current > 5) {
      console.warn(`Rapid ${type} interactions detected. Consider debouncing.`)
    }

    // Reset counter periodically
    if (interactionCountRef.current > 20) {
      interactionCountRef.current = 0
    }
  }, [])

  return { trackInteraction }
}