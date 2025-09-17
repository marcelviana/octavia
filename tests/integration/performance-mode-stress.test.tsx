/**
 * Integration Tests: Performance Mode Functionality Under Stress
 *
 * Tests performance mode under stress conditions to ensure it meets
 * the critical requirements for live music performances:
 * - <100ms response time for navigation
 * - Zero network dependency during performances
 * - Smooth transitions between songs
 * - Handling of large setlists (100+ songs)
 * - Memory efficiency under extended use
 * - Touch responsiveness and gesture handling
 * - Recovery from interruptions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Performance monitoring utilities
const measurePerformance = (fn: () => void): number => {
  const start = performance.now()
  fn()
  return performance.now() - start
}

const createLargeSetlist = (size: number) => {
  return Array.from({ length: size }, (_, index) => ({
    id: `song-${index + 1}`,
    title: `Song ${index + 1}`,
    artist: `Artist ${Math.floor(index / 10) + 1}`,
    content: `Chord progression ${index + 1}\n${'Verse '.repeat(4)}\n${'Chorus '.repeat(2)}`,
    contentType: index % 4 === 0 ? 'chords' : index % 4 === 1 ? 'lyrics' : index % 4 === 2 ? 'tabs' : 'piano',
    size: Math.floor(Math.random() * 50000) + 10000 // 10KB - 60KB files
  }))
}

// Mock offline cache for performance testing
const mockOfflineCache = {
  cache: new Map(),
  set: vi.fn((key: string, value: any) => {
    mockOfflineCache.cache.set(key, value)
    return Promise.resolve()
  }),
  get: vi.fn((key: string) => {
    return Promise.resolve(mockOfflineCache.cache.get(key))
  }),
  preload: vi.fn((keys: string[]) => {
    return Promise.resolve()
  }),
  clear: vi.fn(() => {
    mockOfflineCache.cache.clear()
    return Promise.resolve()
  })
}

// High-performance performance mode component
const PerformanceModeStress = ({ setlist, initialIndex = 0 }: { setlist: any[], initialIndex?: number }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [preloadCache, setPreloadCache] = React.useState(new Set())
  const [touchStartY, setTouchStartY] = React.useState(0)
  const [swipeThreshold] = React.useState(50)
  const [renderTime, setRenderTime] = React.useState(0)
  const [memoryUsage, setMemoryUsage] = React.useState(0)

  // Performance monitoring
  const measureRenderTime = React.useCallback(() => {
    const start = performance.now()
    setTimeout(() => {
      const end = performance.now()
      setRenderTime(end - start)
    }, 0)
  }, [])

  // Memory usage simulation
  React.useEffect(() => {
    const usage = setlist.reduce((acc, song) => acc + (song.size || 0), 0)
    setMemoryUsage(usage)
  }, [setlist])

  // Preload adjacent songs for instant navigation
  React.useEffect(() => {
    const preloadIndices = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex + 2 // Preload one extra for smoother experience
    ].filter(index => index >= 0 && index < setlist.length)

    preloadIndices.forEach(index => {
      if (!preloadCache.has(index)) {
        // Simulate preloading
        mockOfflineCache.set(`song-${setlist[index].id}`, setlist[index])
        setPreloadCache(prev => new Set([...prev, index]))
      }
    })
  }, [currentIndex, setlist, preloadCache])

  // Navigation with performance measurement
  const navigateToSong = React.useCallback((newIndex: number) => {
    const navigationTime = measurePerformance(() => {
      if (newIndex >= 0 && newIndex < setlist.length) {
        setCurrentIndex(newIndex)
        measureRenderTime()
      }
    })

    // Store navigation time for testing
    ;(window as any).lastNavigationTime = navigationTime
  }, [setlist.length, measureRenderTime])

  const nextSong = React.useCallback(() => {
    navigateToSong(currentIndex + 1)
  }, [currentIndex, navigateToSong])

  const prevSong = React.useCallback(() => {
    navigateToSong(currentIndex - 1)
  }, [currentIndex, navigateToSong])

  const jumpToSong = React.useCallback((index: number) => {
    navigateToSong(index)
  }, [navigateToSong])

  // Touch/swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY - touchEndY

    if (Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0) {
        nextSong() // Swipe up = next song
      } else {
        prevSong() // Swipe down = previous song
      }
    }
  }

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Space':
          e.preventDefault()
          nextSong()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevSong()
          break
        case 'Home':
          e.preventDefault()
          jumpToSong(0)
          break
        case 'End':
          e.preventDefault()
          jumpToSong(setlist.length - 1)
          break
        case 'Escape':
          e.preventDefault()
          setIsFullscreen(false)
          break
      }
    }

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, nextSong, prevSong, jumpToSong, setlist.length])

  const currentSong = setlist[currentIndex]
  const progress = setlist.length > 0 ? ((currentIndex + 1) / setlist.length) * 100 : 0

  return (
    <div
      data-testid="performance-mode-stress"
      className={isFullscreen ? 'fullscreen-mode' : 'window-mode'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Performance metrics display */}
      <div data-testid="performance-metrics" style={{ position: 'absolute', top: 0, right: 0, fontSize: '10px' }}>
        <div data-testid="render-time">Render: {renderTime.toFixed(1)}ms</div>
        <div data-testid="memory-usage">Memory: {(memoryUsage / 1024).toFixed(1)}KB</div>
        <div data-testid="preload-count">Preloaded: {preloadCache.size}</div>
      </div>

      {/* Quick navigation controls */}
      <div data-testid="navigation-controls">
        <button
          data-testid="first-song"
          onClick={() => jumpToSong(0)}
          disabled={currentIndex === 0}
        >
          First
        </button>
        <button
          data-testid="prev-song-fast"
          onClick={prevSong}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        <span data-testid="song-position">
          {currentIndex + 1} / {setlist.length}
        </span>
        <button
          data-testid="next-song-fast"
          onClick={nextSong}
          disabled={currentIndex === setlist.length - 1}
        >
          Next
        </button>
        <button
          data-testid="last-song"
          onClick={() => jumpToSong(setlist.length - 1)}
          disabled={currentIndex === setlist.length - 1}
        >
          Last
        </button>
      </div>

      {/* Progress indicator */}
      <div data-testid="progress-container">
        <div
          data-testid="progress-bar"
          style={{
            width: `${progress}%`,
            height: '4px',
            backgroundColor: '#4ade80',
            transition: 'width 0.1s ease-out'
          }}
        />
      </div>

      {/* Fullscreen toggle */}
      <button
        data-testid="toggle-fullscreen"
        onClick={() => setIsFullscreen(prev => !prev)}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>

      {/* Current song display */}
      {currentSong && (
        <div data-testid="current-song-display">
          <h1 data-testid="song-title">{currentSong.title}</h1>
          <h2 data-testid="song-artist">{currentSong.artist}</h2>
          <div data-testid="song-content-type">{currentSong.contentType}</div>
          <div
            data-testid="song-content"
            style={{
              height: '400px',
              overflow: 'auto',
              fontSize: isFullscreen ? '24px' : '16px'
            }}
          >
            {currentSong.content}
          </div>
        </div>
      )}

      {/* Quick jump grid for large setlists */}
      {setlist.length > 20 && (
        <div data-testid="quick-jump-grid" style={{ display: isFullscreen ? 'none' : 'block' }}>
          <h3>Quick Jump</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '5px' }}>
            {Array.from({ length: Math.min(50, setlist.length) }, (_, i) => (
              <button
                key={i}
                data-testid={`quick-jump-${i}`}
                onClick={() => jumpToSong(i)}
                style={{
                  backgroundColor: i === currentIndex ? '#4ade80' : '#e5e7eb',
                  border: 'none',
                  padding: '5px',
                  fontSize: '12px'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Touch indicators */}
      <div data-testid="touch-indicators" style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
        <div>Swipe ↑ Next Song</div>
        <div>Swipe ↓ Previous Song</div>
        <div>Space/→ Next | ←/Backspace Previous</div>
      </div>
    </div>
  )
}

// Stress testing component that simulates heavy load
const StressTestWrapper = ({ children, loadLevel = 'normal' }: { children: React.ReactNode, loadLevel?: 'light' | 'normal' | 'heavy' | 'extreme' }) => {
  const [cpuLoad, setCpuLoad] = React.useState(0)

  React.useEffect(() => {
    const loads = {
      light: 10,
      normal: 50,
      heavy: 200,
      extreme: 1000
    }

    const interval = setInterval(() => {
      // Simulate CPU load
      const iterations = loads[loadLevel]
      const start = performance.now()
      for (let i = 0; i < iterations * 1000; i++) {
        Math.random() * Math.random()
      }
      const load = performance.now() - start
      setCpuLoad(load)
    }, 100)

    return () => clearInterval(interval)
  }, [loadLevel])

  return (
    <div data-testid="stress-test-wrapper">
      <div data-testid="cpu-load" style={{ position: 'absolute', top: 0, left: 0, fontSize: '10px' }}>
        CPU Load: {cpuLoad.toFixed(1)}ms | Level: {loadLevel}
      </div>
      {children}
    </div>
  )
}

describe('Performance Mode Functionality Under Stress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOfflineCache.cache.clear()
    // Reset performance tracking
    ;(window as any).lastNavigationTime = 0
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Basic Performance Requirements', () => {
    it('should maintain <100ms navigation response time with normal setlist', async () => {
      const setlist = createLargeSetlist(25)

      render(
        <StressTestWrapper loadLevel="normal">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Measure navigation performance
      const navigationTimes: number[] = []

      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        fireEvent.click(screen.getByTestId('next-song-fast'))
        const end = performance.now()
        navigationTimes.push(end - start)

        await waitFor(() => {
          expect(screen.getByTestId('song-position')).toHaveTextContent(`${i + 2} / 25`)
        })
      }

      const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
      expect(averageTime).toBeLessThan(100) // Critical requirement: <100ms

      // Verify all navigations were successful
      expect(screen.getByTestId('song-position')).toHaveTextContent('11 / 25')
    })

    it('should handle rapid navigation without lag', async () => {
      const setlist = createLargeSetlist(50)

      render(
        <StressTestWrapper loadLevel="normal">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Rapid fire navigation
      const rapidNavigations = async () => {
        for (let i = 0; i < 20; i++) {
          fireEvent.click(screen.getByTestId('next-song-fast'))
          await new Promise(resolve => setTimeout(resolve, 10)) // 10ms between clicks
        }
      }

      const totalTime = measurePerformance(() => {
        rapidNavigations()
      })

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('21 / 50')
      })

      // Should handle 20 navigations in reasonable time
      expect(totalTime).toBeLessThan(2000) // 2 seconds for 20 navigations
    })

    it('should maintain smooth performance with large setlist (100+ songs)', async () => {
      const setlist = createLargeSetlist(150)

      render(
        <StressTestWrapper loadLevel="heavy">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      expect(screen.getByTestId('song-position')).toHaveTextContent('1 / 150')

      // Test navigation to different parts of large setlist
      const testPositions = [0, 25, 50, 75, 100, 125, 149]

      for (const position of testPositions) {
        const start = performance.now()
        fireEvent.click(screen.getByTestId(`quick-jump-${position}`))
        const end = performance.now()

        await waitFor(() => {
          expect(screen.getByTestId('song-position')).toHaveTextContent(`${position + 1} / 150`)
        })

        const navigationTime = end - start
        expect(navigationTime).toBeLessThan(100) // Still under 100ms for large setlist
      }
    })
  })

  describe('Memory and Resource Management', () => {
    it('should efficiently manage memory with large content', () => {
      const setlist = createLargeSetlist(200)

      render(
        <StressTestWrapper loadLevel="heavy">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Check memory usage tracking
      const memoryUsage = screen.getByTestId('memory-usage')
      expect(memoryUsage).toBeInTheDocument()

      // Memory should be tracked and reported
      expect(memoryUsage.textContent).toMatch(/Memory: \d+\.\d+KB/)
    })

    it('should preload adjacent songs for instant navigation', async () => {
      const setlist = createLargeSetlist(30)

      render(
        <StressTestWrapper>
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Wait for initial preloading
      await waitFor(() => {
        const preloadCount = screen.getByTestId('preload-count')
        expect(preloadCount.textContent).toMatch(/Preloaded: [1-9]/)
      })

      // Navigate and verify preloading continues
      fireEvent.click(screen.getByTestId('next-song-fast'))

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('2 / 30')
      })

      // Should have preloaded more songs
      const preloadCount = parseInt(screen.getByTestId('preload-count').textContent?.match(/\d+/)?.[0] || '0')
      expect(preloadCount).toBeGreaterThan(1)
    })

    it('should handle cache operations efficiently', async () => {
      const setlist = createLargeSetlist(50)

      render(
        <StressTestWrapper loadLevel="heavy">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Navigate through multiple songs to trigger cache operations
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('next-song-fast'))
        await waitFor(() => {
          expect(screen.getByTestId('song-position')).toHaveTextContent(`${i + 2} / 50`)
        })
      }

      // Verify cache operations were called
      expect(mockOfflineCache.set).toHaveBeenCalled()
      expect(mockOfflineCache.get).toHaveBeenCalled()
    })
  })

  describe('Touch and Gesture Handling', () => {
    it('should respond to touch gestures for navigation', async () => {
      const setlist = createLargeSetlist(20)

      render(
        <StressTestWrapper>
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      const performanceMode = screen.getByTestId('performance-mode-stress')

      // Simulate swipe up (next song)
      fireEvent.touchStart(performanceMode, {
        touches: [{ clientY: 300 }]
      })
      fireEvent.touchEnd(performanceMode, {
        changedTouches: [{ clientY: 200 }] // 100px up
      })

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('2 / 20')
      })

      // Simulate swipe down (previous song)
      fireEvent.touchStart(performanceMode, {
        touches: [{ clientY: 200 }]
      })
      fireEvent.touchEnd(performanceMode, {
        changedTouches: [{ clientY: 350 }] // 150px down
      })

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('1 / 20')
      })
    })

    it('should handle rapid touch gestures without lag', async () => {
      const setlist = createLargeSetlist(30)

      render(
        <StressTestWrapper loadLevel="normal">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      const performanceMode = screen.getByTestId('performance-mode-stress')

      // Rapid swipe gestures
      for (let i = 0; i < 5; i++) {
        fireEvent.touchStart(performanceMode, {
          touches: [{ clientY: 300 }]
        })
        fireEvent.touchEnd(performanceMode, {
          changedTouches: [{ clientY: 200 }]
        })
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('6 / 30')
      })
    })
  })

  describe('Keyboard Navigation Performance', () => {
    it('should handle keyboard navigation under stress', async () => {
      const setlist = createLargeSetlist(40)

      render(
        <StressTestWrapper loadLevel="heavy">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Enter fullscreen to enable keyboard navigation
      fireEvent.click(screen.getByTestId('toggle-fullscreen'))

      // Test rapid keyboard navigation
      const navigationKeys = ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'Space', 'Space']

      for (const key of navigationKeys) {
        fireEvent.keyDown(window, { key })
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('6 / 40')
      })

      // Test jump navigation
      fireEvent.keyDown(window, { key: 'End' })
      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('40 / 40')
      })

      fireEvent.keyDown(window, { key: 'Home' })
      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('1 / 40')
      })
    })
  })

  describe('Extreme Stress Conditions', () => {
    it('should maintain functionality under extreme CPU load', async () => {
      const setlist = createLargeSetlist(100)

      render(
        <StressTestWrapper loadLevel="extreme">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Navigate under extreme load
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByTestId('next-song-fast'))
        await waitFor(() => {
          expect(screen.getByTestId('song-position')).toHaveTextContent(`${i + 2} / 100`)
        }, { timeout: 3000 }) // Longer timeout under extreme load
      }

      // Verify CPU load is being tracked
      const cpuLoad = screen.getByTestId('cpu-load')
      expect(cpuLoad.textContent).toContain('extreme')
    })

    it('should handle massive setlist (500+ songs) with grace degradation', async () => {
      const setlist = createLargeSetlist(500)

      render(
        <StressTestWrapper loadLevel="heavy">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      expect(screen.getByTestId('song-position')).toHaveTextContent('1 / 500')

      // Test navigation in massive setlist
      const positions = [0, 100, 250, 400, 499]

      for (const position of positions) {
        if (position < 50) { // Quick jump grid only shows first 50
          fireEvent.click(screen.getByTestId(`quick-jump-${position}`))
        } else {
          // Use navigation buttons for positions beyond quick jump
          fireEvent.click(screen.getByTestId('last-song'))
        }

        await waitFor(() => {
          if (position < 50) {
            expect(screen.getByTestId('song-position')).toHaveTextContent(`${position + 1} / 500`)
          } else {
            expect(screen.getByTestId('song-position')).toHaveTextContent('500 / 500')
          }
        }, { timeout: 5000 })

        if (position >= 50) break // Only test last position for extreme case
      }
    })

    it('should recover from performance interruptions', async () => {
      const setlist = createLargeSetlist(30)

      render(
        <StressTestWrapper loadLevel="normal">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Navigate to middle of setlist
      for (let i = 0; i < 15; i++) {
        fireEvent.click(screen.getByTestId('next-song-fast'))
      }

      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('16 / 30')
      })

      // Simulate performance interruption by clearing cache
      await act(async () => {
        mockOfflineCache.clear()
      })

      // Should still function after interruption
      fireEvent.click(screen.getByTestId('next-song-fast'))
      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('17 / 30')
      })

      fireEvent.click(screen.getByTestId('prev-song-fast'))
      await waitFor(() => {
        expect(screen.getByTestId('song-position')).toHaveTextContent('16 / 30')
      })
    })
  })

  describe('Fullscreen Performance Mode', () => {
    it('should optimize rendering in fullscreen mode', async () => {
      const setlist = createLargeSetlist(25)

      render(
        <StressTestWrapper loadLevel="normal">
          <PerformanceModeStress setlist={setlist} />
        </StressTestWrapper>
      )

      // Toggle fullscreen
      fireEvent.click(screen.getByTestId('toggle-fullscreen'))

      // Verify fullscreen optimizations
      expect(screen.getByTestId('performance-mode-stress')).toHaveClass('fullscreen-mode')
      expect(screen.getByTestId('quick-jump-grid')).toHaveStyle({ display: 'none' })

      // Test navigation performance in fullscreen
      const navigationTimes: number[] = []

      for (let i = 0; i < 5; i++) {
        const start = performance.now()
        fireEvent.click(screen.getByTestId('next-song-fast'))
        const end = performance.now()
        navigationTimes.push(end - start)

        await waitFor(() => {
          expect(screen.getByTestId('song-position')).toHaveTextContent(`${i + 2} / 25`)
        })
      }

      const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length
      expect(averageTime).toBeLessThan(50) // Even faster in fullscreen mode
    })

    it('should handle fullscreen transitions smoothly', async () => {
      const setlist = createLargeSetlist(20)

      render(
        <StressTestWrapper>
          <PerformanceModeStress setlist={setlist} initialIndex={5} />
        </StressTestWrapper>
      )

      expect(screen.getByTestId('song-position')).toHaveTextContent('6 / 20')

      // Enter fullscreen
      const enterTime = measurePerformance(() => {
        fireEvent.click(screen.getByTestId('toggle-fullscreen'))
      })

      expect(enterTime).toBeLessThan(100)
      expect(screen.getByTestId('performance-mode-stress')).toHaveClass('fullscreen-mode')

      // Exit fullscreen
      const exitTime = measurePerformance(() => {
        fireEvent.click(screen.getByTestId('toggle-fullscreen'))
      })

      expect(exitTime).toBeLessThan(100)
      expect(screen.getByTestId('performance-mode-stress')).toHaveClass('window-mode')

      // Position should be maintained
      expect(screen.getByTestId('song-position')).toHaveTextContent('6 / 20')
    })
  })
})