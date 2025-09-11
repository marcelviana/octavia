/**
 * Offline/Online Integration Tests
 * 
 * Critical tests for offline functionality during live music performances.
 * These tests ensure the app remains functional when network connectivity
 * is unreliable, which is common during live performances.
 * 
 * Test Coverage:
 * - Performance mode offline functionality
 * - Content caching and retrieval
 * - Background sync when coming online
 * - Network failure recovery during performances
 * - Cache management and storage limits
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  server, 
  TEST_USER, 
  createTestContent, 
  createTestSetlist,
  networkSimulator,
  performanceMonitor 
} from './test-setup'
import { http, HttpResponse } from 'msw'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentCreator } from '@/components/content-creator'
import type { SetlistWithSongs } from '@/types/performance'

// Mock the offline cache module
const mockOfflineCache = {
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn(),
  warmCache: vi.fn(),
  preloadContent: vi.fn(),
  clearCache: vi.fn(),
  getCacheInfo: vi.fn(),
  cleanupOldCache: vi.fn(),
}

vi.mock('@/lib/offline-cache', () => ({
  ...mockOfflineCache
}))

// Mock service worker registration
const mockServiceWorkerRegistration = {
  sync: {
    register: vi.fn().mockResolvedValue(undefined)
  },
  showNotification: vi.fn()
}

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
    ready: Promise.resolve(mockServiceWorkerRegistration),
    controller: null
  },
  writable: true
})

describe('Offline/Online Integration Tests', () => {
  let testSetlist: SetlistWithSongs
  let mockOnExitPerformance: vi.Mock

  beforeEach(() => {
    networkSimulator.reset()
    performanceMonitor.clear()
    vi.clearAllMocks()

    testSetlist = {
      ...createTestSetlist({ name: 'Offline Test Setlist' }),
      setlist_songs: [
        {
          id: 'setlist-song-1',
          position: 1,
          notes: 'Cached song',
          content: createTestContent({
            id: 'cached-content-1',
            title: 'Cached Song 1',
            content_type: 'LYRICS',
            content_data: { lyrics: 'Cached lyrics content\nVerse 1\nChorus 1' }
          })
        },
        {
          id: 'setlist-song-2',
          position: 2,
          notes: 'PDF content',
          content: createTestContent({
            id: 'cached-content-2',
            title: 'Cached Song 2',
            content_type: 'CHORDS',
            file_url: 'https://example.com/cached-song.pdf'
          })
        },
        {
          id: 'setlist-song-3',
          position: 3,
          notes: 'Image content',
          content: createTestContent({
            id: 'cached-content-3',
            title: 'Cached Song 3',
            content_type: 'TABS',
            file_url: 'https://example.com/cached-tabs.jpg'
          })
        }
      ]
    }

    mockOnExitPerformance = vi.fn()

    // Setup default cache behavior
    mockOfflineCache.getCachedFileInfo.mockResolvedValue({
      url: 'blob:cached-file-url',
      mimeType: 'application/pdf'
    })
    mockOfflineCache.warmCache.mockResolvedValue(undefined)
    mockOfflineCache.preloadContent.mockResolvedValue(undefined)
  })

  afterEach(() => {
    networkSimulator.reset()
  })

  describe('Performance Mode Offline Functionality', () => {
    it('should function completely offline during performance', async () => {
      // Start online to load initial content
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Cached Song 1')).toBeInTheDocument()
      })

      performanceMonitor.start('offline-performance-test')

      // Go offline during performance
      networkSimulator.goOffline()

      // Should still navigate between songs
      const user = userEvent.setup()
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Cached Song 2')).toBeInTheDocument()
      })

      // Should display cached PDF content
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()

      // Navigate to third song
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Cached Song 3')).toBeInTheDocument()
      })

      // Should display cached image content
      expect(screen.getByRole('img')).toBeInTheDocument()

      // Controls should still work offline
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
      await user.click(zoomInButton)

      expect(screen.getByText('110%')).toBeInTheDocument()

      const offlineTestDuration = performanceMonitor.end('offline-performance-test')
      
      // Performance should not degrade offline
      expect(offlineTestDuration).toBeLessThan(1000)

      // Verify cache was used, not network
      expect(mockOfflineCache.getCachedFileInfo).toHaveBeenCalled()
    })

    it('should show offline indicator when network unavailable', async () => {
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Cached Song 1')).toBeInTheDocument()
      })

      // Go offline
      networkSimulator.goOffline()

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
      })

      // Should show offline status
      expect(screen.getByText(/offline/i)).toBeInTheDocument()

      // Go back online
      networkSimulator.goOnline()

      // Offline indicator should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument()
      })
    })

    it('should preload next songs for seamless offline navigation', async () => {
      const preloadSpy = vi.spyOn(mockOfflineCache, 'preloadContent')

      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // Should preload content for performance
      await waitFor(() => {
        expect(preloadSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'cached-content-1' }),
            expect.objectContaining({ id: 'cached-content-2' }),
            expect.objectContaining({ id: 'cached-content-3' })
          ])
        )
      })

      // Navigate to second song
      const user = userEvent.setup()
      await user.keyboard('{ArrowRight}')

      // Should have immediate transition due to preloading
      await waitFor(() => {
        expect(screen.getByText('Cached Song 2')).toBeInTheDocument()
      }, { timeout: 100 }) // Very fast due to caching
    })
  })

  describe('Content Caching and Retrieval', () => {
    it('should cache content when going offline', async () => {
      const testContent = createTestContent({
        title: 'Content to Cache',
        file_url: 'https://example.com/test-file.pdf'
      })

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: [testContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        })
      )

      render(<ContentCreator />)

      // Load content while online
      await waitFor(() => {
        expect(screen.getByText('Content to Cache')).toBeInTheDocument()
      })

      // Should automatically cache important content
      expect(mockOfflineCache.cacheFilesForContent).toHaveBeenCalledWith([testContent])

      // Go offline
      networkSimulator.goOffline()

      // Should still display cached content
      expect(screen.getByText('Content to Cache')).toBeInTheDocument()

      // Attempting to view should use cache
      const user = userEvent.setup()
      const contentCard = screen.getByTestId(`content-card-${testContent.id}`)
      await user.click(contentCard)

      // Should retrieve from cache
      expect(mockOfflineCache.getCachedFileInfo).toHaveBeenCalledWith(testContent.file_url)
    })

    it('should handle cache storage limits gracefully', async () => {
      const largeCacheInfo = {
        totalSize: 45 * 1024 * 1024, // 45MB (near 50MB limit)
        itemCount: 100,
        oldestItem: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
      }

      mockOfflineCache.getCacheInfo.mockResolvedValue(largeCacheInfo)
      mockOfflineCache.cleanupOldCache.mockResolvedValue({
        cleanedCount: 20,
        freedSpace: 10 * 1024 * 1024 // 10MB freed
      })

      const testContent = createTestContent({
        title: 'New Large Content',
        file_url: 'https://example.com/large-file.pdf'
      })

      render(<ContentCreator />)

      // Try to cache new content when near limit
      mockOfflineCache.cacheFilesForContent.mockImplementation(async (content) => {
        // Should trigger cleanup before caching
        expect(mockOfflineCache.cleanupOldCache).toHaveBeenCalled()
        return Promise.resolve()
      })

      // Should show cache management notification
      await waitFor(() => {
        expect(screen.getByText(/cache storage/i)).toBeInTheDocument()
      })

      // Should offer cache management options
      expect(screen.getByRole('button', { name: /manage cache/i })).toBeInTheDocument()
    })

    it('should sync cached changes when coming back online', async () => {
      const testContent = createTestContent({ 
        id: 'sync-test-content',
        title: 'Original Title'
      })

      let pendingUpdates: any[] = []

      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json({
            content: [testContent],
            total: 1,
            page: 1,
            hasMore: false
          })
        }),

        // Simulate background sync endpoint
        http.post('/api/sync/content', async ({ request }) => {
          const updates = await request.json()
          pendingUpdates.push(...updates)
          return HttpResponse.json({ success: true, syncedCount: updates.length })
        })
      )

      render(<ContentCreator />)

      await waitFor(() => {
        expect(screen.getByText('Original Title')).toBeInTheDocument()
      })

      // Go offline and make changes
      networkSimulator.goOffline()

      const user = userEvent.setup()
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      const titleInput = screen.getByDisplayValue('Original Title')
      await user.clear(titleInput)
      await user.type(titleInput, 'Offline Updated Title')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Should queue for sync
      expect(screen.getByText(/changes will sync when online/i)).toBeInTheDocument()

      // Come back online
      networkSimulator.goOnline()

      // Should trigger background sync
      await waitFor(() => {
        expect(screen.getByText(/syncing changes/i)).toBeInTheDocument()
      })

      // Should complete sync
      await waitFor(() => {
        expect(screen.getByText(/sync completed/i)).toBeInTheDocument()
      })

      // Verify sync was attempted
      expect(pendingUpdates).toHaveLength(1)
      expect(pendingUpdates[0]).toMatchObject({
        id: 'sync-test-content',
        title: 'Offline Updated Title'
      })
    })
  })

  describe('Network Failure Recovery', () => {
    it('should gracefully handle network failures during performance', async () => {
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Cached Song 1')).toBeInTheDocument()
      })

      // Simulate intermittent network issues
      networkSimulator.simulateSlowConnection()

      const user = userEvent.setup()
      
      performanceMonitor.start('network-failure-recovery')

      // Navigation should still work despite network issues
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Cached Song 2')).toBeInTheDocument()
      })

      // Should fall back to cached content without user disruption
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Cached Song 3')).toBeInTheDocument()
      })

      const recoveryDuration = performanceMonitor.end('network-failure-recovery')

      // Should maintain performance despite network issues
      expect(recoveryDuration).toBeLessThan(1000)

      // Should show appropriate network status
      expect(screen.getByText(/slow connection/i)).toBeInTheDocument()
    })

    it('should retry failed operations with exponential backoff', async () => {
      let attemptCount = 0
      const maxAttempts = 3

      server.use(
        http.post('/api/content', () => {
          attemptCount++
          
          if (attemptCount < maxAttempts) {
            return HttpResponse.json(
              { error: 'Network timeout' },
              { status: 408 }
            )
          }
          
          return HttpResponse.json(
            createTestContent({ title: 'Retry Success Content' }),
            { status: 201 }
          )
        })
      )

      render(<ContentCreator />)

      const user = userEvent.setup()
      
      // Attempt to create content
      const createButton = screen.getByRole('button', { name: /create content/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Retry Success Content')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      // Should show retry attempts
      await waitFor(() => {
        expect(screen.getByText(/retrying.*attempt 1/i)).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText(/retrying.*attempt 2/i)).toBeInTheDocument()
      })

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText('Content created successfully')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Verify all retry attempts were made
      expect(attemptCount).toBe(maxAttempts)
    })

    it('should handle partial sync failures gracefully', async () => {
      const pendingItems = [
        { id: 'item-1', title: 'Success Item' },
        { id: 'item-2', title: 'Fail Item' },
        { id: 'item-3', title: 'Success Item 2' }
      ]

      server.use(
        http.post('/api/sync/content', async ({ request }) => {
          const items = await request.json()
          
          const results = items.map((item: any) => {
            if (item.id === 'item-2') {
              return {
                id: item.id,
                success: false,
                error: 'Validation failed'
              }
            }
            return {
              id: item.id,
              success: true
            }
          })

          return HttpResponse.json({
            results,
            successCount: 2,
            failureCount: 1
          })
        })
      )

      render(<ContentCreator />)

      // Simulate having pending sync items
      networkSimulator.goOffline()
      // ... simulate offline changes ...
      networkSimulator.goOnline()

      // Should attempt sync
      await waitFor(() => {
        expect(screen.getByText(/syncing 3 items/i)).toBeInTheDocument()
      })

      // Should show partial success
      await waitFor(() => {
        expect(screen.getByText(/2 items synced successfully/i)).toBeInTheDocument()
        expect(screen.getByText(/1 item failed to sync/i)).toBeInTheDocument()
      })

      // Should offer retry for failed items
      expect(screen.getByRole('button', { name: /retry failed items/i })).toBeInTheDocument()
    })
  })

  describe('Cache Management and Storage', () => {
    it('should manage cache storage efficiently', async () => {
      const cacheInfo = {
        totalSize: 30 * 1024 * 1024, // 30MB
        itemCount: 50,
        oldestItem: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days old
      }

      mockOfflineCache.getCacheInfo.mockResolvedValue(cacheInfo)

      render(<ContentCreator />)

      // Open cache management
      const user = userEvent.setup()
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      const cacheButton = screen.getByRole('button', { name: /manage cache/i })
      await user.click(cacheButton)

      // Should show cache statistics
      expect(screen.getByText(/30 MB/i)).toBeInTheDocument()
      expect(screen.getByText(/50 items/i)).toBeInTheDocument()

      // Should offer cleanup options
      expect(screen.getByRole('button', { name: /clean old cache/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear all cache/i })).toBeInTheDocument()

      // Test cleanup
      mockOfflineCache.cleanupOldCache.mockResolvedValue({
        cleanedCount: 15,
        freedSpace: 8 * 1024 * 1024 // 8MB freed
      })

      const cleanButton = screen.getByRole('button', { name: /clean old cache/i })
      await user.click(cleanButton)

      // Should show cleanup results
      await waitFor(() => {
        expect(screen.getByText(/cleaned 15 items/i)).toBeInTheDocument()
        expect(screen.getByText(/freed 8 MB/i)).toBeInTheDocument()
      })
    })

    it('should prioritize caching for upcoming performances', async () => {
      const upcomingSetlist = {
        ...createTestSetlist({ 
          name: 'Tonight\'s Performance',
          performance_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        }),
        setlist_songs: [
          {
            id: 'urgent-song-1',
            position: 1,
            notes: '',
            content: createTestContent({ title: 'Urgent Song 1' })
          }
        ]
      }

      const distantSetlist = {
        ...createTestSetlist({
          name: 'Next Week\'s Performance',
          performance_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
        }),
        setlist_songs: [
          {
            id: 'distant-song-1',
            position: 1,
            notes: '',
            content: createTestContent({ title: 'Distant Song 1' })
          }
        ]
      }

      server.use(
        http.get('/api/setlists', () => {
          return HttpResponse.json([upcomingSetlist, distantSetlist])
        })
      )

      render(<ContentCreator />)

      // Should prioritize caching for upcoming performance
      await waitFor(() => {
        expect(mockOfflineCache.preloadContent).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ title: 'Urgent Song 1' })
          ]),
          { priority: 'high' }
        )
      })

      // Should cache distant performance with lower priority
      expect(mockOfflineCache.preloadContent).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Distant Song 1' })
        ]),
        { priority: 'low' }
      )
    })
  })
})