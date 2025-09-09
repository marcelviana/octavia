/**
 * Performance Navigation Hook Tests
 * 
 * Critical requirement: Navigation must complete in <100ms for live performance
 * This test suite validates timing, reliability, and edge cases.
 */

import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { usePerformanceNavigation } from '../use-performance-navigation'

// Mock songs for testing
const mockSongs = [
  { id: 1, title: 'Song 1', artist: 'Artist 1', bpm: 120 },
  { id: 2, title: 'Song 2', artist: 'Artist 2', bpm: 100 },
  { id: 3, title: 'Song 3', artist: 'Artist 3', bpm: 80 },
  { id: 4, title: 'Song 4', artist: 'Artist 4', bpm: 90 },
  { id: 5, title: 'Song 5', artist: 'Artist 5', bpm: 110 }
]

const mockOnExitPerformance = vi.fn()

describe('usePerformanceNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock performance.now for timing tests
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with first song by default', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      expect(result.current.currentSong).toBe(0)
      expect(result.current.currentSongData).toEqual(mockSongs[0])
      expect(result.current.totalSongs).toBe(5)
      expect(result.current.canGoPrevious).toBe(false)
      expect(result.current.canGoNext).toBe(true)
    })

    it('should initialize with specified starting song index', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 2
        })
      )

      expect(result.current.currentSong).toBe(2)
      expect(result.current.currentSongData).toEqual(mockSongs[2])
      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(true)
    })

    it('should handle invalid starting song index gracefully', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 10 // Out of bounds
        })
      )

      expect(result.current.currentSong).toBe(0) // Should default to first song
      expect(result.current.currentSongData).toEqual(mockSongs[0])
    })

    it('should handle empty song list', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: [],
          onExitPerformance: mockOnExitPerformance
        })
      )

      expect(result.current.currentSong).toBe(0)
      expect(result.current.currentSongData).toBe(null)
      expect(result.current.totalSongs).toBe(0)
      expect(result.current.canGoPrevious).toBe(false)
      expect(result.current.canGoNext).toBe(false)
    })
  })

  describe('CRITICAL: Navigation Performance (<100ms)', () => {
    it('should navigate next in under 100ms', async () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const startTime = performance.now()
      
      await act(async () => {
        result.current.goToNext()
      })

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      expect(navigationTime).toBeLessThan(100)
      expect(result.current.currentSong).toBe(1)
      expect(result.current.currentSongData).toEqual(mockSongs[1])
    })

    it('should navigate previous in under 100ms', async () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 2
        })
      )

      const startTime = performance.now()
      
      await act(async () => {
        result.current.goToPrevious()
      })

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      expect(navigationTime).toBeLessThan(100)
      expect(result.current.currentSong).toBe(1)
      expect(result.current.currentSongData).toEqual(mockSongs[1])
    })

    it('should handle rapid navigation without performance degradation', async () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      expect(result.current.currentSong).toBe(0) // Start at first song

      const startTime = performance.now()
      
      // Simulate rapid navigation (nervous performer scenario)
      await act(async () => {
        result.current.goToNext()    // 0 -> 1
      })
      
      await act(async () => {
        result.current.goToNext()    // 1 -> 2  
      })
      
      await act(async () => {
        result.current.goToPrevious() // 2 -> 1
      })
      
      await act(async () => {
        result.current.goToNext()    // 1 -> 2
      })

      const endTime = performance.now()
      const totalNavigationTime = endTime - startTime

      // Multiple navigations should still complete quickly
      expect(totalNavigationTime).toBeLessThan(200)
      expect(result.current.currentSong).toBe(2)
    })

    it('should handle direct song navigation efficiently', async () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const startTime = performance.now()
      
      await act(async () => {
        result.current.goToSong(3)
      })

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      expect(navigationTime).toBeLessThan(100)
      expect(result.current.currentSong).toBe(3)
      expect(result.current.currentSongData).toEqual(mockSongs[3])
    })
  })

  describe('Navigation Actions', () => {
    it('should navigate to next song correctly', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      act(() => {
        result.current.goToNext()
      })

      expect(result.current.currentSong).toBe(1)
      expect(result.current.currentSongData).toEqual(mockSongs[1])
      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(true)
    })

    it('should navigate to previous song correctly', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 2
        })
      )

      act(() => {
        result.current.goToPrevious()
      })

      expect(result.current.currentSong).toBe(1)
      expect(result.current.currentSongData).toEqual(mockSongs[1])
    })

    it('should navigate to specific song correctly', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      act(() => {
        result.current.goToSong(3)
      })

      expect(result.current.currentSong).toBe(3)
      expect(result.current.currentSongData).toEqual(mockSongs[3])
    })

    it('should not go beyond bounds', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 4 // Last song
        })
      )

      // Try to go beyond last song
      act(() => {
        result.current.goToNext()
      })

      expect(result.current.currentSong).toBe(4) // Should stay at last song
      expect(result.current.canGoNext).toBe(false)

      // Test beginning boundary
      const { result: result2 } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      // Try to go before first song
      act(() => {
        result2.current.goToPrevious()
      })

      expect(result2.current.currentSong).toBe(0) // Should stay at first song
      expect(result2.current.canGoPrevious).toBe(false)
    })

    it('should handle invalid song index gracefully', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const originalSong = result.current.currentSong

      act(() => {
        result.current.goToSong(-1) // Invalid index
      })

      expect(result.current.currentSong).toBe(originalSong) // Should not change

      act(() => {
        result.current.goToSong(10) // Out of bounds
      })

      expect(result.current.currentSong).toBe(originalSong) // Should not change
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 1
        })
      )

      expect(result.current.currentSong).toBe(1)

      // Test right arrow
      act(() => {
        const rightKeyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
        const rightHandled = result.current.handleKeyNavigation(rightKeyEvent)
        expect(rightHandled).toBe(true)
      })

      expect(result.current.currentSong).toBe(2)

      // Test left arrow
      act(() => {
        const leftKeyEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' })  
        const leftHandled = result.current.handleKeyNavigation(leftKeyEvent)
        expect(leftHandled).toBe(true)
      })

      expect(result.current.currentSong).toBe(1)
    })

    it('should handle escape key', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      const handled = result.current.handleKeyNavigation(escapeEvent)

      expect(handled).toBe(true)
      expect(mockOnExitPerformance).toHaveBeenCalled()
    })

    it('should not handle non-navigation keys', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
      const handled = result.current.handleKeyNavigation(spaceEvent)

      expect(handled).toBe(false) // Space key should not be handled by navigation
    })
  })

  describe('State Management', () => {
    it('should update navigation state correctly', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      // At first song
      expect(result.current.canGoPrevious).toBe(false)
      expect(result.current.canGoNext).toBe(true)

      // Navigate to middle
      act(() => {
        result.current.goToSong(2)
      })

      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(true)

      // Navigate to last song
      act(() => {
        result.current.goToSong(4)
      })

      expect(result.current.canGoPrevious).toBe(true)
      expect(result.current.canGoNext).toBe(false)
    })

    it('should handle song list changes', () => {
      const { result, rerender } = renderHook(
        ({ songs }) => usePerformanceNavigation({
          songs,
          onExitPerformance: mockOnExitPerformance
        }),
        { initialProps: { songs: mockSongs } }
      )

      // Start at song 3
      act(() => {
        result.current.goToSong(3)
      })

      expect(result.current.currentSong).toBe(3)

      // Change to shorter song list
      const shorterSongs = mockSongs.slice(0, 2)
      rerender({ songs: shorterSongs })

      // Should reset to valid index
      expect(result.current.currentSong).toBe(0)
      expect(result.current.totalSongs).toBe(2)
    })
  })

  describe('Performance Metrics', () => {
    it('should provide performance metrics for testing', () => {
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: mockSongs,
          onExitPerformance: mockOnExitPerformance,
          startingSongIndex: 2
        })
      )

      const metrics = result.current._performanceMetrics

      expect(metrics).toEqual({
        songsCount: 5,
        currentIndex: 2,
        lastNavigationTime: expect.any(Number)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle single song setlist', () => {
      const singleSong = [mockSongs[0]]
      
      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: singleSong,
          onExitPerformance: mockOnExitPerformance
        })
      )

      expect(result.current.currentSong).toBe(0)
      expect(result.current.canGoPrevious).toBe(false)
      expect(result.current.canGoNext).toBe(false)

      // Navigation should not change song
      act(() => {
        result.current.goToNext()
      })

      expect(result.current.currentSong).toBe(0)

      act(() => {
        result.current.goToPrevious()
      })

      expect(result.current.currentSong).toBe(0)
    })

    it('should maintain performance with large setlists', () => {
      // Create large setlist (50 songs)
      const largeSongs = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Song ${i + 1}`,
        artist: `Artist ${i + 1}`,
        bpm: 100 + (i % 20)
      }))

      const { result } = renderHook(() => 
        usePerformanceNavigation({
          songs: largeSongs,
          onExitPerformance: mockOnExitPerformance
        })
      )

      const startTime = performance.now()
      
      // Test navigation through large setlist
      act(() => {
        result.current.goToSong(25)
      })

      const endTime = performance.now()
      const navigationTime = endTime - startTime

      expect(navigationTime).toBeLessThan(100)
      expect(result.current.currentSong).toBe(25)
      expect(result.current.totalSongs).toBe(50)
    })
  })
})