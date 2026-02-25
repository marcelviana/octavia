import { renderHook, act } from '@testing-library/react'
import { usePerformanceControls } from '@/hooks/use-performance-controls'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRef } from 'react'

describe('usePerformanceControls - Memory Leak Detection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should clean up all timers on unmount after extended session', async () => {
    // Mock props for the hook
    const mockContentRef = createRef<HTMLDivElement>()
    const mockDiv = document.createElement('div')
    Object.defineProperty(mockDiv, 'scrollHeight', {
      writable: false,
      configurable: true,
      value: 1000
    })
    Object.defineProperty(mockDiv, 'clientHeight', {
      writable: false,
      configurable: true,
      value: 500
    })
    Object.defineProperty(mockContentRef, 'current', {
      writable: true,
      value: mockDiv
    })

    const mockLyricsData = Array(10).fill('Line 1\nLine 2\nLine 3\nLine 4')
    const mockSongData = { bpm: 120 }

    const { result, unmount } = renderHook(() =>
      usePerformanceControls({
        currentSong: 0,
        lyricsData: mockLyricsData,
        currentSongData: mockSongData,
        contentRef: mockContentRef as React.RefObject<HTMLDivElement>
      })
    )

    // Simulate 30-minute session with typical interactions
    // 10 songs × 3 minutes each = 30 minutes
    // 20 play/pause toggles
    // 15 BPM changes

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.handleTogglePlay()
      })
      // Advance timer to simulate 90 seconds between toggles
      act(() => {
        vi.advanceTimersByTime(90000)
      })
    }

    // Simulate BPM changes
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.changeBpm(5, '+5')
      })
      // Note: BPM feedback timer clears after 800ms, so we don't advance full time
    }

    // Start playing to ensure we have active timers before unmount
    act(() => {
      result.current.handleTogglePlay()
    })

    // Verify timers exist during active session
    const pendingTimersBefore = vi.getTimerCount()
    expect(pendingTimersBefore).toBeGreaterThan(0)

    // Unmount - should clean up all timers
    unmount()

    // Verify all timers cleaned up
    const pendingTimersAfter = vi.getTimerCount()
    expect(pendingTimersAfter).toBe(0)
  })

  it('should null refs after cleanup to prevent double-cleanup', () => {
    const mockContentRef = createRef<HTMLDivElement>()
    const mockDiv = document.createElement('div')
    Object.defineProperty(mockDiv, 'scrollHeight', {
      writable: false,
      configurable: true,
      value: 1000
    })
    Object.defineProperty(mockDiv, 'clientHeight', {
      writable: false,
      configurable: true,
      value: 500
    })
    Object.defineProperty(mockContentRef, 'current', {
      writable: true,
      value: mockDiv
    })

    const mockLyricsData = ['Line 1\nLine 2\nLine 3']
    const mockSongData = { bpm: 120 }

    const { result, unmount } = renderHook(() =>
      usePerformanceControls({
        currentSong: 0,
        lyricsData: mockLyricsData,
        currentSongData: mockSongData,
        contentRef: mockContentRef as React.RefObject<HTMLDivElement>
      })
    )

    // Start auto-scroll (creates animation frame)
    act(() => {
      result.current.handleTogglePlay()
    })

    // Start BPM press (creates timeout and potential interval)
    act(() => {
      result.current.startPress('inc')
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      result.current.endPress('inc', false)
    })

    // Unmount and verify no errors on cleanup
    // If refs not nulled, double cleanup could cause issues
    expect(() => unmount()).not.toThrow()

    // Verify all timers cleaned up
    expect(vi.getTimerCount()).toBe(0)
  })

  it('should handle rapid mount/unmount cycles without memory leak', () => {
    const mockContentRef = createRef<HTMLDivElement>()
    const mockDiv = document.createElement('div')
    Object.defineProperty(mockDiv, 'scrollHeight', {
      writable: false,
      configurable: true,
      value: 1000
    })
    Object.defineProperty(mockDiv, 'clientHeight', {
      writable: false,
      configurable: true,
      value: 500
    })
    Object.defineProperty(mockContentRef, 'current', {
      writable: true,
      value: mockDiv
    })

    const mockLyricsData = ['Line 1\nLine 2\nLine 3']
    const mockSongData = { bpm: 120 }

    // Simulate component rapidly mounting and unmounting
    // (e.g., user toggling performance mode on/off quickly)
    for (let i = 0; i < 50; i++) {
      const { result, unmount } = renderHook(() =>
        usePerformanceControls({
          currentSong: 0,
          lyricsData: mockLyricsData,
          currentSongData: mockSongData,
          contentRef: mockContentRef as React.RefObject<HTMLDivElement>
        })
      )

      // Trigger some activity before unmounting
      if (i % 3 === 0) {
        act(() => {
          result.current.handleTogglePlay()
        })
      }

      unmount()
    }

    // Verify no accumulated timers
    expect(vi.getTimerCount()).toBe(0)
  })

  it('should prevent state updates after unmount during auto-scroll', () => {
    const mockContentRef = createRef<HTMLDivElement>()
    const mockDiv = document.createElement('div')
    Object.defineProperty(mockDiv, 'scrollHeight', {
      writable: false,
      configurable: true,
      value: 100
    })
    Object.defineProperty(mockDiv, 'clientHeight', {
      writable: false,
      configurable: true,
      value: 50
    })
    Object.defineProperty(mockContentRef, 'current', {
      writable: true,
      value: mockDiv
    })

    const mockLyricsData = ['Line 1\nLine 2']
    const mockSongData = { bpm: 240 } // Fast BPM for quick scroll completion

    const { result, unmount } = renderHook(() =>
      usePerformanceControls({
        currentSong: 0,
        lyricsData: mockLyricsData,
        currentSongData: mockSongData,
        contentRef: mockContentRef as React.RefObject<HTMLDivElement>
      })
    )

    // Start playing
    act(() => {
      result.current.handleTogglePlay()
    })

    // Unmount while scrolling is active
    unmount()

    // Advance timers - should not cause state update errors
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // If isMountedRef check is working, no errors should be thrown
    expect(vi.getTimerCount()).toBe(0)
  })
})
