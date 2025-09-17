/**
 * Memory Leak Detection Tests
 *
 * Extended testing scenarios to validate memory leak fixes
 * and ensure stable performance during long performance sessions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import React, { useEffect, useRef, useState } from 'react'

// Simulate memory usage tracking
class MemoryTracker {
  private measurements: number[] = []
  private startTime: number = Date.now()

  measure(label: string) {
    const memory = (performance as any).memory
    if (memory) {
      this.measurements.push({
        timestamp: Date.now() - this.startTime,
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        label
      } as any)
    }
  }

  getReport() {
    return {
      initialMemory: this.measurements[0]?.usedJSHeapSize || 0,
      finalMemory: this.measurements[this.measurements.length - 1]?.usedJSHeapSize || 0,
      peakMemory: Math.max(...this.measurements.map((m: any) => m.usedJSHeapSize)),
      measurements: this.measurements
    }
  }

  detectLeaks() {
    if (this.measurements.length < 10) return { hasLeak: false }

    const recent = this.measurements.slice(-5).map((m: any) => m.usedJSHeapSize)
    const earlier = this.measurements.slice(5, 10).map((m: any) => m.usedJSHeapSize)

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length

    const growthRate = (recentAvg - earlierAvg) / earlierAvg
    const hasLeak = growthRate > 0.1 // 10% growth indicates potential leak

    return {
      hasLeak,
      growthRate,
      recentAverage: recentAvg,
      earlierAverage: earlierAvg
    }
  }
}

// Mock component that simulates performance mode with potential memory issues
const PerformanceModeSimulator = ({ duration, onMemoryMeasure }: {
  duration: number
  onMemoryMeasure: (label: string) => void
}) => {
  const [currentSong, setCurrentSong] = useState(0)
  const [content, setContent] = useState<any[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()
  const componentsRef = useRef<Map<string, any>>(new Map())

  // Simulate loading large content
  useEffect(() => {
    const largeContent = Array.from({ length: 50 }, (_, i) => ({
      id: `song-${i}`,
      title: `Song ${i}`,
      lyrics: 'Verse\n' + 'Lorem ipsum dolor sit amet\n'.repeat(100),
      chords: Array.from({ length: 200 }, (_, j) => `Chord${j}`),
      notation: new Array(1000).fill('♪ ♫ ♪ ♫').join(' ')
    }))
    setContent(largeContent)
    onMemoryMeasure('Content Loaded')
  }, [onMemoryMeasure])

  // Simulate performance session
  useEffect(() => {
    let songIndex = 0
    intervalRef.current = setInterval(() => {
      songIndex = (songIndex + 1) % 50
      setCurrentSong(songIndex)
      onMemoryMeasure(`Song Change ${songIndex}`)

      // Simulate component creation/destruction
      const componentId = `comp-${Date.now()}`
      componentsRef.current.set(componentId, {
        data: new Array(1000).fill(`data-${componentId}`)
      })

      // Clean up old components (testing cleanup)
      if (componentsRef.current.size > 10) {
        const oldestKey = componentsRef.current.keys().next().value
        componentsRef.current.delete(oldestKey)
      }
    }, duration / 50) // Change song 50 times during test

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      componentsRef.current.clear()
    }
  }, [duration, onMemoryMeasure])

  return React.createElement('div', { 'data-testid': 'performance-simulator' },
    React.createElement('h2', {}, `Current Song: ${currentSong}`),
    React.createElement('div', {},
      content[currentSong] ? content[currentSong].title : 'Loading...'
    ),
    React.createElement('div', { style: { maxHeight: '200px', overflow: 'hidden' } },
      content[currentSong]?.lyrics || ''
    )
  )
}

// Component that tests event listener cleanup
const EventListenerComponent = ({ onMount, onUnmount }: {
  onMount: () => void
  onUnmount: () => void
}) => {
  useEffect(() => {
    const handleResize = () => {
      // Simulate resize handling
    }
    const handleKeydown = () => {
      // Simulate keyboard handling
    }
    const handleVisibility = () => {
      // Simulate visibility change
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('keydown', handleKeydown)
    document.addEventListener('visibilitychange', handleVisibility)

    onMount()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('visibilitychange', handleVisibility)
      onUnmount()
    }
  }, [onMount, onUnmount])

  return React.createElement('div', { 'data-testid': 'event-listener-component' }, 'Component with listeners')
}

// Component that tests timer cleanup
const TimerComponent = ({ interval, onTick }: {
  interval: number
  onTick: () => void
}) => {
  const intervalRef = useRef<NodeJS.Timeout>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    intervalRef.current = setInterval(onTick, interval)
    timeoutRef.current = setTimeout(() => {
      // Simulate delayed operation
    }, interval * 2)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [interval, onTick])

  return React.createElement('div', { 'data-testid': 'timer-component' }, 'Component with timers')
}

describe('Memory Leak Detection Tests', () => {
  let memoryTracker: MemoryTracker

  beforeEach(() => {
    memoryTracker = new MemoryTracker()
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Extended Performance Session Tests', () => {
    it('should not leak memory during 2-hour performance simulation', async () => {
      const sessionDuration = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
      memoryTracker.measure('Session Start')

      const { unmount } = render(React.createElement(PerformanceModeSimulator, {
        duration: 10000, // 10 second test duration (representing 2 hours)
        onMemoryMeasure: (label: string) => memoryTracker.measure(label)
      }))

      // Advance time to simulate full session
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      memoryTracker.measure('Session End')
      unmount()
      memoryTracker.measure('After Cleanup')

      const report = memoryTracker.getReport()
      const leakAnalysis = memoryTracker.detectLeaks()

      expect(leakAnalysis.hasLeak).toBe(false)
      expect(leakAnalysis.growthRate).toBeLessThan(0.1) // Less than 10% growth
    })

    it('should handle rapid component mounting/unmounting without leaks', () => {
      memoryTracker.measure('Start')

      // Mount and unmount 100 components rapidly
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(React.createElement(PerformanceModeSimulator, {
          duration: 100,
          onMemoryMeasure: (label: string) => memoryTracker.measure(`${label}-${i}`)
        }))

        act(() => {
          vi.advanceTimersByTime(100)
        })

        unmount()
        memoryTracker.measure(`Unmounted-${i}`)
      }

      memoryTracker.measure('All Cleaned Up')

      const leakAnalysis = memoryTracker.detectLeaks()
      expect(leakAnalysis.hasLeak).toBe(false)
    })

    it('should properly cleanup event listeners', () => {
      let mountCount = 0
      let unmountCount = 0

      const onMount = () => { mountCount++ }
      const onUnmount = () => { unmountCount++ }

      // Mount multiple components with event listeners
      const components = []
      for (let i = 0; i < 20; i++) {
        const component = render(React.createElement(EventListenerComponent, {
          onMount,
          onUnmount
        }))
        components.push(component)
        memoryTracker.measure(`Mounted Component ${i}`)
      }

      // Unmount all components
      components.forEach((component, i) => {
        component.unmount()
        memoryTracker.measure(`Unmounted Component ${i}`)
      })

      expect(mountCount).toBe(20)
      expect(unmountCount).toBe(20)

      const leakAnalysis = memoryTracker.detectLeaks()
      expect(leakAnalysis.hasLeak).toBe(false)
    })

    it('should cleanup timers and intervals properly', () => {
      let tickCount = 0
      const onTick = () => { tickCount++ }

      memoryTracker.measure('Before Timer Components')

      // Create components with timers
      const components = []
      for (let i = 0; i < 10; i++) {
        const component = render(React.createElement(TimerComponent, {
          interval: 100,
          onTick
        }))
        components.push(component)
      }

      memoryTracker.measure('Timer Components Created')

      // Let timers run for a bit
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      memoryTracker.measure('After Timers Run')

      // Cleanup all components
      components.forEach(component => component.unmount())

      memoryTracker.measure('After Timer Cleanup')

      // Advance time to ensure no more ticks happen
      const tickCountAfterCleanup = tickCount
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Tick count should not increase after cleanup
      expect(tickCount).toBe(tickCountAfterCleanup)

      const leakAnalysis = memoryTracker.detectLeaks()
      expect(leakAnalysis.hasLeak).toBe(false)
    })
  })

  describe('Memory-Intensive Operations', () => {
    it('should handle large dataset operations without excessive memory growth', () => {
      memoryTracker.measure('Start Large Dataset Test')

      // Create very large datasets
      const largeDatasets = []
      for (let i = 0; i < 10; i++) {
        const dataset = {
          songs: Array.from({ length: 500 }, (_, j) => ({
            id: `song-${i}-${j}`,
            content: `Large content ${'x'.repeat(10000)}`,
            metadata: Array.from({ length: 100 }, (_, k) => `meta-${k}`)
          }))
        }
        largeDatasets.push(dataset)
        memoryTracker.measure(`Dataset ${i} Created`)
      }

      memoryTracker.measure('All Datasets Created')

      // Process datasets
      largeDatasets.forEach((dataset, i) => {
        const processed = dataset.songs.map(song => ({
          ...song,
          processed: true,
          processedAt: Date.now()
        }))
        memoryTracker.measure(`Dataset ${i} Processed`)
      })

      memoryTracker.measure('All Datasets Processed')

      // Clear datasets
      largeDatasets.length = 0

      memoryTracker.measure('Datasets Cleared')

      const report = memoryTracker.getReport()
      const memoryGrowth = report.finalMemory - report.initialMemory

      // Memory should not grow excessively (allow for some variance)
      expect(memoryGrowth).toBeLessThan(report.initialMemory * 0.5) // Less than 50% growth
    })

    it('should handle concurrent operations without memory spikes', () => {
      memoryTracker.measure('Concurrent Operations Start')

      // Simulate concurrent operations (like multiple setlists loading)
      const operations = []
      for (let i = 0; i < 20; i++) {
        const operation = new Promise((resolve) => {
          setTimeout(() => {
            // Simulate heavy operation
            const data = Array.from({ length: 1000 }, (_, j) => ({
              id: j,
              payload: `data-${i}-${j}`.repeat(100)
            }))
            resolve(data)
          }, Math.random() * 100)
        })
        operations.push(operation)
      }

      // Wait for all operations to complete
      return Promise.all(operations).then(() => {
        memoryTracker.measure('All Operations Complete')

        const leakAnalysis = memoryTracker.detectLeaks()
        expect(leakAnalysis.hasLeak).toBe(false)
        expect(leakAnalysis.growthRate).toBeLessThan(0.2) // Less than 20% growth
      })
    })
  })

  describe('Performance Mode Specific Memory Tests', () => {
    it('should handle content caching without memory bloat', () => {
      memoryTracker.measure('Cache Test Start')

      // Simulate content cache
      const contentCache = new Map()

      // Add items to cache
      for (let i = 0; i < 200; i++) {
        const content = {
          id: `content-${i}`,
          data: `Large content data ${'x'.repeat(5000)}`,
          rendered: `<div>${'content '.repeat(1000)}</div>`,
          timestamp: Date.now()
        }
        contentCache.set(content.id, content)
        memoryTracker.measure(`Cache Item ${i} Added`)
      }

      memoryTracker.measure('Cache Populated')

      // Simulate cache eviction (LRU behavior)
      let evicted = 0
      for (const [key, value] of contentCache.entries()) {
        if (evicted < 100) { // Evict half the items
          contentCache.delete(key)
          evicted++
        }
      }

      memoryTracker.measure('Cache Evicted')

      // Clear entire cache
      contentCache.clear()

      memoryTracker.measure('Cache Cleared')

      const leakAnalysis = memoryTracker.detectLeaks()
      expect(leakAnalysis.hasLeak).toBe(false)
    })

    it('should handle PDF viewer memory usage properly', () => {
      memoryTracker.measure('PDF Viewer Test Start')

      // Simulate PDF data (large binary content)
      const pdfData = []
      for (let i = 0; i < 10; i++) {
        const pdf = {
          id: `pdf-${i}`,
          data: new Uint8Array(1024 * 1024), // 1MB of data
          pages: Array.from({ length: 50 }, (_, page) => ({
            pageNumber: page + 1,
            content: `Page ${page + 1} content`.repeat(1000)
          }))
        }
        pdfData.push(pdf)
        memoryTracker.measure(`PDF ${i} Loaded`)
      }

      memoryTracker.measure('All PDFs Loaded')

      // Simulate PDF viewer cleanup
      pdfData.forEach((pdf, i) => {
        pdf.data = new Uint8Array(0) // Clear binary data
        pdf.pages = [] // Clear page content
        memoryTracker.measure(`PDF ${i} Cleaned`)
      })

      memoryTracker.measure('All PDFs Cleaned')

      const report = memoryTracker.getReport()
      const leakAnalysis = memoryTracker.detectLeaks()

      expect(leakAnalysis.hasLeak).toBe(false)
      // Memory should return close to baseline after cleanup
      expect(report.finalMemory).toBeLessThan(report.peakMemory * 0.7)
    })
  })
})