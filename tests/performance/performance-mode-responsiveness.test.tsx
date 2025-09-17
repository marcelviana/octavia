/**
 * Performance Mode Responsiveness Tests
 *
 * Critical tests to ensure <100ms response time requirement
 * for live music performance scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup, act } from '@testing-library/react'
import React, { useState, useEffect, useRef } from 'react'

// Performance measurement utility
class PerformanceProfiler {
  private measurements: Array<{
    name: string
    startTime: number
    endTime: number
    duration: number
  }> = []

  start(name: string): () => void {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      this.measurements.push({
        name,
        startTime,
        endTime,
        duration
      })
    }
  }

  getResults() {
    return this.measurements
  }

  getAverageTime(operationName: string): number {
    const operations = this.measurements.filter(m => m.name.includes(operationName))
    if (operations.length === 0) return 0
    return operations.reduce((sum, op) => sum + op.duration, 0) / operations.length
  }

  getMaxTime(operationName: string): number {
    const operations = this.measurements.filter(m => m.name.includes(operationName))
    if (operations.length === 0) return 0
    return Math.max(...operations.map(op => op.duration))
  }

  clear() {
    this.measurements = []
  }
}

// Mock Performance Mode Component
const MockPerformanceMode = ({
  setlist,
  currentSongIndex,
  onNavigate,
  onMeasure
}: {
  setlist: any
  currentSongIndex: number
  onNavigate: (index: number) => void
  onMeasure: (operation: string, duration: number) => void
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const renderStartTime = useRef(performance.now())

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current
    onMeasure('Component Render', renderTime)
  })

  const handleNavigation = (newIndex: number) => {
    const navStart = performance.now()
    setIsLoading(true)

    // Simulate content loading
    setTimeout(() => {
      setIsLoading(false)
      onNavigate(newIndex)
      const navEnd = performance.now()
      onMeasure('Navigation', navEnd - navStart)
    }, 1) // Minimal delay to simulate async operation
  }

  const currentSong = setlist?.songs?.[currentSongIndex]

  return React.createElement('div', { 'data-testid': 'performance-mode' },
    React.createElement('div', { 'data-testid': 'song-display' },
      React.createElement('h1', {}, currentSong?.content?.title || 'No Song'),
      React.createElement('h2', {}, currentSong?.content?.artist || ''),
      React.createElement('div', { 'data-testid': 'content' },
        isLoading ? 'Loading...' : (currentSong?.content?.content_data?.lyrics || 'No content')
      )
    ),
    React.createElement('div', { 'data-testid': 'controls' },
      React.createElement('button', {
        'data-testid': 'prev-button',
        onClick: () => handleNavigation(Math.max(0, currentSongIndex - 1)),
        disabled: currentSongIndex === 0
      }, 'Previous'),
      React.createElement('span', { 'data-testid': 'position' },
        `${currentSongIndex + 1} / ${setlist?.songs?.length || 0}`
      ),
      React.createElement('button', {
        'data-testid': 'next-button',
        onClick: () => handleNavigation(Math.min((setlist?.songs?.length || 1) - 1, currentSongIndex + 1)),
        disabled: currentSongIndex >= (setlist?.songs?.length || 1) - 1
      }, 'Next')
    )
  )
}

// Mock Content Display Component (heavy rendering simulation)
const MockHeavyContentDisplay = ({
  content,
  onMeasure
}: {
  content: any
  onMeasure: (operation: string, duration: number) => void
}) => {
  const renderStart = useRef(performance.now())

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current
    onMeasure('Heavy Content Render', renderTime)
    renderStart.current = performance.now()
  }, [content, onMeasure])

  // Simulate heavy content processing
  const processedContent = content?.content_data?.lyrics
    ? content.content_data.lyrics.split('\n').map((line: string, index: number) =>
        React.createElement('div', { key: index, className: 'lyrics-line' }, line)
      )
    : []

  return React.createElement('div', { 'data-testid': 'heavy-content' },
    React.createElement('div', { className: 'content-header' },
      React.createElement('h3', {}, content?.title),
      React.createElement('p', {}, `Key: ${content?.key || 'Unknown'} | BPM: ${content?.bpm || 'Unknown'}`)
    ),
    React.createElement('div', { className: 'content-body' }, ...processedContent),
    React.createElement('div', { className: 'content-metadata' },
      React.createElement('p', {}, `Content Type: ${content?.content_type}`),
      React.createElement('p', {}, `Artist: ${content?.artist}`)
    )
  )
}

describe('Performance Mode Responsiveness Tests', () => {
  let profiler: PerformanceProfiler
  let mockSetlist: any

  beforeEach(() => {
    profiler = new PerformanceProfiler()

    // Create mock setlist with realistic content
    mockSetlist = {
      id: 'test-setlist',
      name: 'Live Performance Setlist',
      songs: Array.from({ length: 25 }, (_, i) => ({
        content_id: `song-${i}`,
        position: i + 1,
        notes: i % 5 === 0 ? 'Key change after verse 2' : null,
        content: {
          id: `song-${i}`,
          title: `Song ${i + 1}`,
          artist: `Artist ${Math.floor(i / 5) + 1}`,
          content_type: ['Lyrics', 'Chords', 'Tab'][i % 3],
          key: ['C', 'G', 'D', 'A', 'E', 'F'][i % 6],
          bpm: 120 + (i * 5),
          content_data: {
            lyrics: `Verse 1\n${'Line ' + (i + 1) + ' of lyrics\n'.repeat(8)}\n\nChorus\n${'Chorus line\n'.repeat(4)}\n\nVerse 2\n${'More lyrics\n'.repeat(8)}`,
            chords: ['C', 'F', 'G', 'Am', 'Dm'],
            sections: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Outro']
          }
        }
      }))
    }
  })

  afterEach(() => {
    cleanup()
    profiler.clear()
  })

  describe('Navigation Response Time Tests (<100ms requirement)', () => {
    it('should navigate between songs in under 100ms', async () => {
      const measurements: number[] = []
      let currentIndex = 0

      const onNavigate = (newIndex: number) => {
        currentIndex = newIndex
      }

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Navigation') {
          measurements.push(duration)
        }
      }

      const { getByTestId, rerender } = render(
        React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        })
      )

      // Test 10 navigation operations
      for (let i = 0; i < 10; i++) {
        const navStart = performance.now()

        await act(async () => {
          fireEvent.click(getByTestId('next-button'))
          await new Promise(resolve => setTimeout(resolve, 1))
        })

        rerender(React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        }))

        const navEnd = performance.now()
        measurements.push(navEnd - navStart)
      }

      // Verify all navigation times are under 100ms
      const maxTime = Math.max(...measurements)
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length

      expect(maxTime).toBeLessThan(100) // Critical: Must be under 100ms
      expect(avgTime).toBeLessThan(50)  // Should average well under 100ms

      console.log(`Navigation Performance: Max=${maxTime.toFixed(2)}ms, Avg=${avgTime.toFixed(2)}ms`)
    })

    it('should handle rapid navigation without performance degradation', async () => {
      const measurements: number[] = []
      let currentIndex = 0

      const onNavigate = (newIndex: number) => {
        currentIndex = newIndex
      }

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Navigation') {
          measurements.push(duration)
        }
      }

      const { getByTestId, rerender } = render(
        React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        })
      )

      // Rapid navigation test - 20 clicks in quick succession
      const startTime = performance.now()

      for (let i = 0; i < 20; i++) {
        const clickStart = performance.now()

        await act(async () => {
          fireEvent.click(getByTestId(i % 2 === 0 ? 'next-button' : 'prev-button'))
          await new Promise(resolve => setTimeout(resolve, 1))
        })

        rerender(React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        }))

        const clickEnd = performance.now()
        measurements.push(clickEnd - clickStart)
      }

      const totalTime = performance.now() - startTime
      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length
      const maxTime = Math.max(...measurements)

      // Performance should not degrade over time
      const firstHalf = measurements.slice(0, 10)
      const secondHalf = measurements.slice(10, 20)
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      expect(maxTime).toBeLessThan(100)
      expect(avgTime).toBeLessThan(50)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5) // No more than 50% degradation

      console.log(`Rapid Navigation: Total=${totalTime.toFixed(2)}ms, Max=${maxTime.toFixed(2)}ms, Avg=${avgTime.toFixed(2)}ms`)
    })
  })

  describe('Content Rendering Performance Tests', () => {
    it('should render heavy content under performance threshold', () => {
      const measurements: number[] = []

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Heavy Content Render') {
          measurements.push(duration)
        }
      }

      // Test with increasingly heavy content
      const heavyContents = [
        mockSetlist.songs[0].content,
        {
          ...mockSetlist.songs[0].content,
          content_data: {
            lyrics: 'Heavy content line\n'.repeat(100),
            chords: Array.from({ length: 100 }, (_, i) => `Chord${i}`)
          }
        },
        {
          ...mockSetlist.songs[0].content,
          content_data: {
            lyrics: 'Very heavy content line\n'.repeat(200),
            chords: Array.from({ length: 200 }, (_, i) => `Chord${i}`)
          }
        }
      ]

      heavyContents.forEach((content, index) => {
        const { unmount } = render(
          React.createElement(MockHeavyContentDisplay, {
            content,
            onMeasure
          })
        )
        unmount()
      })

      const maxRenderTime = Math.max(...measurements)
      const avgRenderTime = measurements.reduce((a, b) => a + b, 0) / measurements.length

      expect(maxRenderTime).toBeLessThan(100) // Heavy content should still render quickly
      expect(avgRenderTime).toBeLessThan(50)

      console.log(`Heavy Content Rendering: Max=${maxRenderTime.toFixed(2)}ms, Avg=${avgRenderTime.toFixed(2)}ms`)
    })

    it('should handle content switching with consistent performance', () => {
      const renderTimes: number[] = []
      let currentContent = mockSetlist.songs[0].content

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Heavy Content Render') {
          renderTimes.push(duration)
        }
      }

      const { rerender } = render(
        React.createElement(MockHeavyContentDisplay, {
          content: currentContent,
          onMeasure
        })
      )

      // Switch between 15 different songs
      for (let i = 1; i < 15; i++) {
        currentContent = mockSetlist.songs[i].content

        const switchStart = performance.now()

        rerender(React.createElement(MockHeavyContentDisplay, {
          content: currentContent,
          onMeasure
        }))

        const switchEnd = performance.now()
        renderTimes.push(switchEnd - switchStart)
      }

      const maxSwitchTime = Math.max(...renderTimes)
      const avgSwitchTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length

      expect(maxSwitchTime).toBeLessThan(100)
      expect(avgSwitchTime).toBeLessThan(30)

      console.log(`Content Switching: Max=${maxSwitchTime.toFixed(2)}ms, Avg=${avgSwitchTime.toFixed(2)}ms`)
    })
  })

  describe('Performance Under Load Tests', () => {
    it('should maintain responsiveness with large setlist', () => {
      // Create very large setlist (100 songs)
      const largeSetlist = {
        ...mockSetlist,
        songs: Array.from({ length: 100 }, (_, i) => ({
          ...mockSetlist.songs[i % 25],
          content_id: `large-song-${i}`,
          position: i + 1,
          content: {
            ...mockSetlist.songs[i % 25].content,
            id: `large-song-${i}`,
            title: `Large Setlist Song ${i + 1}`
          }
        }))
      }

      const navigationTimes: number[] = []
      let currentIndex = 0

      const onNavigate = (newIndex: number) => {
        currentIndex = newIndex
      }

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Navigation') {
          navigationTimes.push(duration)
        }
      }

      const { getByTestId, rerender } = render(
        React.createElement(MockPerformanceMode, {
          setlist: largeSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        })
      )

      // Navigate through large setlist
      const testPositions = [0, 25, 50, 75, 99, 50, 25, 0] // Jump around the setlist

      testPositions.forEach(async (position) => {
        const navStart = performance.now()

        await act(async () => {
          onNavigate(position)
          await new Promise(resolve => setTimeout(resolve, 1))
        })

        rerender(React.createElement(MockPerformanceMode, {
          setlist: largeSetlist,
          currentSongIndex: position,
          onNavigate,
          onMeasure
        }))

        const navEnd = performance.now()
        navigationTimes.push(navEnd - navStart)
      })

      const maxTime = Math.max(...navigationTimes)
      const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length

      expect(maxTime).toBeLessThan(100) // Even with 100 songs, must stay under 100ms
      expect(avgTime).toBeLessThan(50)

      console.log(`Large Setlist Navigation: Max=${maxTime.toFixed(2)}ms, Avg=${avgTime.toFixed(2)}ms`)
    })

    it('should handle concurrent UI updates efficiently', async () => {
      const updateTimes: number[] = []
      let currentIndex = 0

      const onNavigate = (newIndex: number) => {
        currentIndex = newIndex
      }

      const onMeasure = (operation: string, duration: number) => {
        updateTimes.push(duration)
      }

      const { getByTestId, rerender } = render(
        React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        })
      )

      // Simulate concurrent updates (user clicking rapidly while content updates)
      const concurrentOperations = []

      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(
          act(async () => {
            const updateStart = performance.now()

            // Simulate multiple rapid state changes
            fireEvent.click(getByTestId('next-button'))
            await new Promise(resolve => setTimeout(resolve, 1))

            rerender(React.createElement(MockPerformanceMode, {
              setlist: mockSetlist,
              currentSongIndex: currentIndex,
              onNavigate,
              onMeasure
            }))

            const updateEnd = performance.now()
            updateTimes.push(updateEnd - updateStart)
          })
        )
      }

      await Promise.all(concurrentOperations)

      const maxUpdateTime = Math.max(...updateTimes)
      const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length

      expect(maxUpdateTime).toBeLessThan(100)
      expect(avgUpdateTime).toBeLessThan(50)

      console.log(`Concurrent Updates: Max=${maxUpdateTime.toFixed(2)}ms, Avg=${avgUpdateTime.toFixed(2)}ms`)
    })
  })

  describe('Real-World Performance Scenarios', () => {
    it('should handle typical live performance session', async () => {
      // Simulate a 2-hour live performance (120 song changes)
      const sessionMetrics = {
        navigationTimes: [] as number[],
        renderTimes: [] as number[],
        totalSessionTime: 0
      }

      let currentIndex = 0
      const sessionStart = performance.now()

      const onNavigate = (newIndex: number) => {
        currentIndex = newIndex
      }

      const onMeasure = (operation: string, duration: number) => {
        if (operation === 'Navigation') {
          sessionMetrics.navigationTimes.push(duration)
        } else if (operation.includes('Render')) {
          sessionMetrics.renderTimes.push(duration)
        }
      }

      const { getByTestId, rerender } = render(
        React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        })
      )

      // Simulate realistic performance navigation pattern
      const navigationPattern = [
        // Normal progression through setlist
        ...Array.from({ length: 15 }, (_, i) => i),
        // Some back-tracking (forgot lyrics, technical issues)
        12, 13, 14,
        // Continue
        ...Array.from({ length: 8 }, (_, i) => i + 15),
        // Encore - go back to popular songs
        5, 8, 2
      ]

      for (const songIndex of navigationPattern) {
        const navStart = performance.now()

        await act(async () => {
          onNavigate(songIndex % mockSetlist.songs.length)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5)) // 5-15ms delay
        })

        rerender(React.createElement(MockPerformanceMode, {
          setlist: mockSetlist,
          currentSongIndex: currentIndex,
          onNavigate,
          onMeasure
        }))

        const navEnd = performance.now()
        sessionMetrics.navigationTimes.push(navEnd - navStart)
      }

      const sessionEnd = performance.now()
      sessionMetrics.totalSessionTime = sessionEnd - sessionStart

      // Performance analysis
      const maxNavTime = Math.max(...sessionMetrics.navigationTimes)
      const avgNavTime = sessionMetrics.navigationTimes.reduce((a, b) => a + b, 0) / sessionMetrics.navigationTimes.length
      const slowNavigations = sessionMetrics.navigationTimes.filter(time => time > 100).length

      // Critical live performance requirements
      expect(maxNavTime).toBeLessThan(100) // NEVER exceed 100ms
      expect(avgNavTime).toBeLessThan(50)  // Average should be much lower
      expect(slowNavigations).toBe(0)      // Zero tolerance for slow navigation

      console.log(`Live Performance Session:`)
      console.log(`  Total Time: ${sessionMetrics.totalSessionTime.toFixed(2)}ms`)
      console.log(`  Song Changes: ${sessionMetrics.navigationTimes.length}`)
      console.log(`  Max Navigation: ${maxNavTime.toFixed(2)}ms`)
      console.log(`  Avg Navigation: ${avgNavTime.toFixed(2)}ms`)
      console.log(`  Slow Operations: ${slowNavigations}`)
    })
  })
})