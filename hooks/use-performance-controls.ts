import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Performance Controls Hook
 * 
 * Manages all control states and actions for performance mode.
 * Critical requirement: Responsive controls for live performance scenarios.
 * 
 * Features:
 * - BPM control with press-and-hold functionality
 * - Zoom level management
 * - Play/Pause state for auto-scroll
 * - Dark mode toggle for sheet visibility
 * - Auto-scroll functionality with BPM synchronization
 * - Control visibility management
 */

export interface UsePerformanceControlsProps {
  currentSong: number
  lyricsData: string[]
  currentSongData: any
  contentRef: React.RefObject<HTMLDivElement | null>
}

export interface PerformanceControlsState {
  zoom: number
  isPlaying: boolean
  bpm: number
  darkSheet: boolean
  bpmFeedback: string | null
  showControls: boolean
}

export interface PerformanceControlsActions {
  setZoom: (zoom: number) => void
  setIsPlaying: (playing: boolean) => void
  handleTogglePlay: () => void
  setBpm: (bpm: number) => void
  setDarkSheet: (dark: boolean) => void
  setShowControls: (show: boolean) => void
  changeBpm: (delta: number, label: string) => void
  startPress: (type: "inc" | "dec") => void
  endPress: (type: "inc" | "dec", trigger?: boolean) => void
  handleMouseMove: () => void
}

export function usePerformanceControls({
  currentSong,
  lyricsData,
  currentSongData,
  contentRef
}: UsePerformanceControlsProps) {
  // Control states
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(80)
  const [darkSheet, setDarkSheet] = useState(false)
  const [bpmFeedback, setBpmFeedback] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)

  // Stable toggle handler - never changes reference
  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)  // Functional update avoids closure
  }, [])  // Empty deps - function logic doesn't depend on any variables

  // Refs for BPM control and scroll management
  const pressTimeout = useRef<NodeJS.Timeout | null>(null)
  const pressInterval = useRef<NodeJS.Timeout | null>(null)
  const isPressing = useRef(false)
  const scrollRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)

  // BPM change function
  const changeBpm = (delta: number, label: string) => {
    setBpm((prev) => {
      const val = Math.max(20, prev + delta)
      setBpmFeedback(`${val} BPM (${label})`)
      return val
    })
  }

  // BPM press-and-hold functionality
  const startPress = (type: "inc" | "dec") => {
    isPressing.current = true
    pressTimeout.current = setTimeout(() => {
      pressInterval.current = setInterval(() => {
        changeBpm(type === "inc" ? 1 : -1, type === "inc" ? "+1" : "-1")
      }, 100)
    }, 400)
  }

  const endPress = (type: "inc" | "dec", trigger: boolean = true) => {
    if (!isPressing.current) return
    isPressing.current = false
    if (pressTimeout.current) {
      clearTimeout(pressTimeout.current)
      pressTimeout.current = null
    }
    if (pressInterval.current) {
      clearInterval(pressInterval.current)
      pressInterval.current = null
    } else if (trigger) {
      changeBpm(type === "inc" ? 5 : -5, type === "inc" ? "+5" : "-5")
    }
  }

  // Control visibility management
  const handleMouseMove = () => {
    setShowControls(true)
  }

  // Auto-scroll functionality with BPM synchronization
  useEffect(() => {
    if (!isPlaying) {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current)
      return
    }

    const el = contentRef.current
    if (!el) return

    const total = el.scrollHeight - el.clientHeight
    const lines = lyricsData[currentSong]?.split("\n").length || 1

    // More realistic calculation: assume each line spans 2 measures (8 beats)
    // This provides smoother, more natural scrolling that respects song tempo
    const beatsPerLine = 8  // 2 measures per line
    const beats = lines * beatsPerLine
    const beatDuration = 60 / bpm  // seconds per beat
    const totalDuration = beats * beatDuration  // total song duration in seconds
    const scrollSpeed = total / totalDuration  // pixels per second

    const start = performance.now() - (el.scrollTop / scrollSpeed) * 1000

    const step = (now: number) => {
      const elapsed = (now - start) / 1000
      const y = scrollSpeed * elapsed
      el.scrollTop = y
      if (y < total && isPlaying) {
        scrollRef.current = requestAnimationFrame(step)
      } else {
        el.scrollTop = total
        scrollRef.current = null
        // Use a timeout to ensure component is still mounted before state update
        setTimeout(() => {
          if (isMountedRef.current) { // Component still mounted
            setIsPlaying(false)
          }
        }, 0)
      }
    }

    scrollRef.current = requestAnimationFrame(step)

    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current)
    }
  }, [isPlaying, bpm, currentSong, lyricsData])

  // Update BPM when song changes
  useEffect(() => {
    setBpm(currentSongData.bpm || 80)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [currentSong, currentSongData.bpm])

  // Clear BPM feedback after delay
  useEffect(() => {
    if (!bpmFeedback) return
    const t = setTimeout(() => setBpmFeedback(null), 800)
    return () => clearTimeout(t)
  }, [bpmFeedback])

  /**
   * Consolidated cleanup effect to prevent memory leaks
   *
   * Pattern: Single cleanup hook with ref nulling (Research Pattern 1)
   * - Prevents race conditions from duplicate cleanup attempts
   * - Nulls refs after cleanup to prevent double-cleanup errors
   * - Manages isMountedRef to prevent state updates after unmount
   *
   * Cleans up:
   * - Animation frames (scrollRef)
   * - Timeouts (pressTimeout)
   * - Intervals (pressInterval)
   */
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Cancel animation frame
      if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current)
        scrollRef.current = null
      }
      // Clear timeout
      if (pressTimeout.current) {
        clearTimeout(pressTimeout.current)
        pressTimeout.current = null
      }
      // Clear interval
      if (pressInterval.current) {
        clearInterval(pressInterval.current)
        pressInterval.current = null
      }
    }
  }, [])

  return {
    // State
    zoom,
    isPlaying,
    bpm,
    darkSheet,
    bpmFeedback,
    showControls,

    // Actions
    setZoom,
    setIsPlaying,
    handleTogglePlay,
    setBpm,
    setDarkSheet,
    setShowControls,
    changeBpm,
    startPress,
    endPress,
    handleMouseMove
  }
}