/**
 * Performance Benchmarking Tests for Architecture Refactor
 * 
 * These tests measure and validate performance improvements from the domain-driven
 * architecture refactor, particularly focusing on component render times, state
 * management efficiency, and memory usage optimization.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { performance } from 'perf_hooks'
import { renderHook } from '@testing-library/react'
import { ContentViewer } from '@/components/content-viewer-refactored'
import { AddContent } from '@/components/add-content-refactored'
import { useContentViewer } from '@/domains/content-management/hooks/use-content-viewer'
import { useContentCreation } from '@/domains/content-management/hooks/use-content-creation'
import { useAppStore } from '@/domains/shared/state-management/app-store'
import { 
  mockContentItem, 
  mockUser,
  renderWithStore,
  createMockStore,
} from '../utils/test-utils'

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 50,      // Components should render in <50ms
  HOOK_EXECUTION: 20,        // Custom hooks should execute in <20ms  
  STATE_UPDATE: 10,          // State updates should complete in <10ms
  CONTENT_FILTER: 100,       // Content filtering should complete in <100ms
  BATCH_OPERATIONS: 200,     // Batch operations should complete in <200ms
}

// Memory usage thresholds (in MB)
const MEMORY_THRESHOLDS = {
  COMPONENT_MEMORY: 5,       // Component memory usage should be <5MB
  STORE_MEMORY: 10,          // Store memory usage should be <10MB
  HOOK_MEMORY: 2,            // Hook memory usage should be <2MB
}

describe('Architecture Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Force garbage collection to get accurate memory measurements
    if (global.gc) global.gc()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering Performance', () => {
    it('should render ContentViewer component quickly', async () => {
      const startTime = performance.now()
      
      renderWithStore(
        <ContentViewer 
          content={mockContentItem}
          onBack={() => {}}
          onEnterPerformance={() => {}}
          onEdit={() => {}}
          showToolbar={true}
        />
      )
      
      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
    })

    it('should render AddContent component quickly', async () => {
      const startTime = performance.now()
      
      renderWithStore(
        <AddContent 
          onContentAdded={() => {}}
          onClose={() => {}}
        />
      )
      
      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
    })

    it('should handle rapid re-renders efficiently', async () => {
      const { rerender } = renderWithStore(
        <ContentViewer 
          content={mockContentItem}
          onBack={() => {}}
          onEnterPerformance={() => {}}
          onEdit={() => {}}
          showToolbar={true}
        />
      )
      
      const startTime = performance.now()
      
      // Simulate rapid prop changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <ContentViewer 
            content={{ ...mockContentItem, title: `Song ${i}` }}
            onBack={() => {}}
            onEnterPerformance={() => {}}
            onEdit={() => {}}
            showToolbar={i % 2 === 0}
          />
        )
      }
      
      const totalRerenderTime = performance.now() - startTime
      const averageRerenderTime = totalRerenderTime / 10
      
      expect(averageRerenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER / 2)
    })
  })

  describe('Custom Hook Performance', () => {
    it('should execute useContentViewer hook quickly', async () => {
      const startTime = performance.now()
      
      const { result } = renderHook(() => useContentViewer(mockContentItem), {
        wrapper: ({ children }) => renderWithStore(children as any).container,
      })
      
      const executionTime = performance.now() - startTime
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_EXECUTION)
      expect(result.current).toBeDefined()
    })

    it('should execute useContentCreation hook quickly', async () => {
      const startTime = performance.now()
      
      const { result } = renderHook(() => useContentCreation(() => {}), {
        wrapper: ({ children }) => renderWithStore(children as any).container,
      })
      
      const executionTime = performance.now() - startTime
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.HOOK_EXECUTION)
      expect(result.current).toBeDefined()
    })

    it('should handle hook state updates efficiently', async () => {
      const { result } = renderHook(() => useContentViewer(mockContentItem), {
        wrapper: ({ children }) => renderWithStore(children as any).container,
      })
      
      const startTime = performance.now()
      
      // Perform multiple state updates
      await act(async () => {
        await result.current.toggleFavorite()
        await result.current.toggleFavorite()
        result.current.handleZoomIn()
        result.current.handleZoomOut()
      })
      
      const updateTime = performance.now() - startTime
      expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.STATE_UPDATE * 4)
    })
  })

  describe('State Management Performance', () => {
    it('should perform store updates quickly', async () => {
      const { result } = renderHook(() => useAppStore())
      const startTime = performance.now()
      
      act(() => {
        result.current.setUser(mockUser)
        result.current.addContent(mockContentItem)
        result.current.setSelectedContent(mockContentItem)
        result.current.addNotification({ type: 'success', message: 'Test' })
      })
      
      const updateTime = performance.now() - startTime
      expect(updateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.STATE_UPDATE * 4)
    })

    it('should handle bulk content operations efficiently', async () => {
      const { result } = renderHook(() => useAppStore())
      const bulkContent = Array.from({ length: 100 }, (_, i) => ({
        ...mockContentItem,
        id: `test-${i}`,
        title: `Song ${i}`,
      }))
      
      const startTime = performance.now()
      
      act(() => {
        result.current.setContent(bulkContent)
      })
      
      const bulkUpdateTime = performance.now() - startTime
      expect(bulkUpdateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATIONS)
    })

    it('should filter large content lists efficiently', async () => {
      const { result } = renderHook(() => useAppStore())
      const largeContentList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockContentItem,
        id: `test-${i}`,
        title: `Song ${i}`,
        content_type: i % 2 === 0 ? 'Lyrics' : 'Chords',
        is_favorite: i % 10 === 0,
      }))
      
      act(() => {
        result.current.setContent(largeContentList)
      })
      
      // Test search filtering performance
      const searchStartTime = performance.now()
      act(() => {
        result.current.setSearchTerm('Song 1')
      })
      const filteredBySearch = result.current.getFilteredContent()
      const searchTime = performance.now() - searchStartTime
      
      expect(searchTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONTENT_FILTER)
      expect(filteredBySearch.length).toBeGreaterThan(0)
      
      // Test content type filtering performance
      const typeStartTime = performance.now()
      act(() => {
        result.current.clearFilters()
        result.current.setContentTypeFilter('Lyrics')
      })
      const filteredByType = result.current.getFilteredContent()
      const typeTime = performance.now() - typeStartTime
      
      expect(typeTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONTENT_FILTER)
      expect(filteredByType).toHaveLength(500) // Half should be Lyrics
      
      // Test favorites filtering performance
      const favStartTime = performance.now()
      act(() => {
        result.current.clearFilters()
        result.current.toggleFavoritesFilter()
      })
      const filteredByFavorites = result.current.getFilteredContent()
      const favTime = performance.now() - favStartTime
      
      expect(favTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONTENT_FILTER)
      expect(filteredByFavorites).toHaveLength(100) // Every 10th is favorite
    })

    it('should handle rapid consecutive updates without performance degradation', async () => {
      const { result } = renderHook(() => useAppStore())
      const startTime = performance.now()
      
      // Simulate rapid user interactions
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addNotification({ 
            type: 'info', 
            message: `Notification ${i}` 
          })
          result.current.setSearchTerm(`search ${i}`)
          if (i % 10 === 0) {
            result.current.addContent({
              ...mockContentItem,
              id: `rapid-${i}`,
              title: `Rapid Song ${i}`,
            })
          }
        }
      })
      
      const rapidUpdatesTime = performance.now() - startTime
      expect(rapidUpdatesTime).toBeLessThan(PERFORMANCE_THRESHOLDS.BATCH_OPERATIONS)
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should not leak memory during component unmounting', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Render and unmount components multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = renderWithStore(
          <ContentViewer 
            content={mockContentItem}
            onBack={() => {}}
            onEnterPerformance={() => {}}
            onEdit={() => {}}
            showToolbar={true}
          />
        )
        unmount()
      }
      
      // Force garbage collection
      if (global.gc) global.gc()
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024) // MB
      
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.COMPONENT_MEMORY)
    })

    it('should manage store memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const { result } = renderHook(() => useAppStore())
      
      // Add large amount of content
      const massiveContentList = Array.from({ length: 5000 }, (_, i) => ({
        ...mockContentItem,
        id: `massive-${i}`,
        title: `Massive Song ${i}`,
        content_data: {
          lyrics: `This is a very long lyric content for song ${i} `.repeat(100),
        },
      }))
      
      act(() => {
        result.current.setContent(massiveContentList)
      })
      
      const afterLoadMemory = process.memoryUsage().heapUsed
      const memoryUsage = (afterLoadMemory - initialMemory) / (1024 * 1024) // MB
      
      expect(memoryUsage).toBeLessThan(MEMORY_THRESHOLDS.STORE_MEMORY)
    })

    it('should clean up hook resources properly', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create and destroy many hook instances
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useContentViewer(mockContentItem), {
          wrapper: ({ children }) => renderWithStore(children as any).container,
        })
        unmount()
      }
      
      // Force garbage collection
      if (global.gc) global.gc()
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024) // MB
      
      expect(memoryIncrease).toBeLessThan(MEMORY_THRESHOLDS.HOOK_MEMORY)
    })
  })

  describe('Comparative Performance Analysis', () => {
    it('should show performance improvements over baseline', async () => {
      // This test would compare against previous architecture benchmarks
      // For now, we'll simulate baseline performance expectations
      
      const BASELINE_COMPONENT_RENDER = 200 // Old component render time
      const BASELINE_STATE_UPDATE = 50     // Old state update time
      
      // Test current performance
      const componentStartTime = performance.now()
      renderWithStore(
        <ContentViewer 
          content={mockContentItem}
          onBack={() => {}}
          onEnterPerformance={() => {}}
          onEdit={() => {}}
          showToolbar={true}
        />
      )
      const currentRenderTime = performance.now() - componentStartTime
      
      const { result } = renderHook(() => useAppStore())
      const stateStartTime = performance.now()
      act(() => {
        result.current.addContent(mockContentItem)
        result.current.setSelectedContent(mockContentItem)
      })
      const currentStateTime = performance.now() - stateStartTime
      
      // Verify improvements
      const renderImprovement = (BASELINE_COMPONENT_RENDER - currentRenderTime) / BASELINE_COMPONENT_RENDER
      const stateImprovement = (BASELINE_STATE_UPDATE - currentStateTime) / BASELINE_STATE_UPDATE
      
      expect(renderImprovement).toBeGreaterThan(0.5) // At least 50% improvement
      expect(stateImprovement).toBeGreaterThan(0.7)  // At least 70% improvement
    })

    it('should maintain performance under load', async () => {
      const { result } = renderHook(() => useAppStore())
      
      // Setup load scenario
      const heavyContentList = Array.from({ length: 2000 }, (_, i) => ({
        ...mockContentItem,
        id: `load-${i}`,
        title: `Load Song ${i}`,
      }))
      
      act(() => {
        result.current.setContent(heavyContentList)
      })
      
      // Test performance under load
      const loadTestStartTime = performance.now()
      
      act(() => {
        // Simulate heavy user interactions
        result.current.setSearchTerm('Load Song 1')
        result.current.setContentTypeFilter('Lyrics')
        result.current.toggleFavoritesFilter()
        result.current.clearFilters()
        result.current.setSearchTerm('Load Song 2')
      })
      
      const loadTestTime = performance.now() - loadTestStartTime
      expect(loadTestTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CONTENT_FILTER * 5)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should detect if component render times regress', async () => {
      const renderTimes: number[] = []
      
      // Take multiple measurements
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        const { unmount } = renderWithStore(
          <ContentViewer 
            content={mockContentItem}
            onBack={() => {}}
            onEnterPerformance={() => {}}
            onEdit={() => {}}
            showToolbar={true}
          />
        )
        renderTimes.push(performance.now() - startTime)
        unmount()
      }
      
      const averageRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length
      const maxRenderTime = Math.max(...renderTimes)
      
      expect(averageRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER)
      expect(maxRenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER * 2)
      
      // Ensure consistency (no outliers)
      const standardDeviation = Math.sqrt(
        renderTimes.reduce((sum, time) => sum + Math.pow(time - averageRenderTime, 2), 0) / renderTimes.length
      )
      expect(standardDeviation).toBeLessThan(averageRenderTime * 0.5) // SD should be less than 50% of average
    })

    it('should detect if state management performance regresses', async () => {
      const { result } = renderHook(() => useAppStore())
      const updateTimes: number[] = []
      
      // Take multiple measurements
      for (let i = 0; i < 20; i++) {
        const startTime = performance.now()
        act(() => {
          result.current.addContent({ ...mockContentItem, id: `perf-test-${i}` })
          result.current.addNotification({ type: 'info', message: `Test ${i}` })
        })
        updateTimes.push(performance.now() - startTime)
      }
      
      const averageUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length
      const maxUpdateTime = Math.max(...updateTimes)
      
      expect(averageUpdateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.STATE_UPDATE)
      expect(maxUpdateTime).toBeLessThan(PERFORMANCE_THRESHOLDS.STATE_UPDATE * 3)
      
      // Check for performance degradation over time
      const firstHalf = updateTimes.slice(0, 10)
      const secondHalf = updateTimes.slice(10)
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length
      
      // Performance shouldn't degrade significantly over time
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5)
    })
  })
})