import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Performance Navigation Hook
 * 
 * Handles all song navigation logic for live performance mode.
 * Critical requirement: Navigation must complete in <100ms for live shows.
 * 
 * Features:
 * - Song index management with bounds checking
 * - Keyboard shortcuts (Arrow keys, Escape)
 * - Button navigation (Previous/Next)
 * - Song indicator dots navigation
 * - Starting song index support
 * - Performance-optimized state updates
 */

export interface UsePerformanceNavigationProps {
  songs: any[]
  onExitPerformance: () => void
  startingSongIndex?: number
}

export interface NavigationState {
  currentSong: number
  canGoNext: boolean
  canGoPrevious: boolean
  totalSongs: number
}

export interface NavigationActions {
  goToNext: () => void
  goToPrevious: () => void
  goToSong: (index: number) => void
  handleKeyNavigation: (e: KeyboardEvent) => boolean // Returns true if key was handled
}

export function usePerformanceNavigation({
  songs,
  onExitPerformance,
  startingSongIndex
}: UsePerformanceNavigationProps) {
  const [currentSong, setCurrentSong] = useState(0)

  // Memoize computed navigation state for performance
  const navigationState: NavigationState = useMemo(() => ({
    currentSong,
    canGoNext: currentSong < songs.length - 1,
    canGoPrevious: currentSong > 0,
    totalSongs: songs.length
  }), [currentSong, songs.length])

  // Performance-optimized navigation functions
  const navigationActions: NavigationActions = useMemo(() => {
    const goToNext = () => {
      if (currentSong < songs.length - 1) {
        setCurrentSong(prev => prev + 1)
      }
    }

    const goToPrevious = () => {
      if (currentSong > 0) {
        setCurrentSong(prev => prev - 1)
      }
    }

    const goToSong = (index: number) => {
      if (index >= 0 && index < songs.length) {
        setCurrentSong(index)
      }
    }

    const handleKeyNavigation = (e: KeyboardEvent): boolean => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious()
          return true
        case "ArrowRight":
          goToNext()
          return true
        case "Escape":
          onExitPerformance()
          return true
        default:
          return false // Key not handled by navigation
      }
    }

    return {
      goToNext,
      goToPrevious,
      goToSong,
      handleKeyNavigation
    }
  }, [currentSong, songs.length, onExitPerformance])

  // Set initial song based on startingSongIndex
  useEffect(() => {
    if (startingSongIndex !== undefined && songs.length > 0 && startingSongIndex < songs.length) {
      setCurrentSong(startingSongIndex)
    }
  }, [startingSongIndex, songs.length])

  // Ensure currentSong index is valid when songs change
  useEffect(() => {
    if (songs.length > 0 && currentSong >= songs.length) {
      setCurrentSong(0)
    }
  }, [songs.length, currentSong])

  // Global keyboard event listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const wasHandled = navigationActions.handleKeyNavigation(e)
      // Prevent default behavior for handled keys
      if (wasHandled && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [navigationActions])

  return {
    // State
    ...navigationState,
    
    // Actions  
    ...navigationActions,
    
    // Current song data
    currentSongData: songs[currentSong] || null,
    
    // Performance metrics (for testing)
    _performanceMetrics: {
      songsCount: songs.length,
      currentIndex: currentSong,
      lastNavigationTime: Date.now() // Could be used for timing validation
    }
  }
}