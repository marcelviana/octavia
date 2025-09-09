/**
 * PERFORMANCE MODE OFFLINE INTEGRATION TESTS
 * 
 * Tests the complete offline flow including:
 * - IndexedDB cache integration
 * - Service worker interactions  
 * - Network failure recovery
 * - Authentication persistence
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentType } from '@/types/content'

// Mock the offline cache with realistic behavior
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn(),
  clearCache: vi.fn(),
  getCacheSize: vi.fn()
}))

// Mock service worker registration
const mockServiceWorker = {
  register: vi.fn(),
  getRegistration: vi.fn(),
  ready: Promise.resolve({
    active: {
      postMessage: vi.fn()
    }
  })
}

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
})

// Mock network connectivity
const mockNavigatorOnLine = vi.fn()
Object.defineProperty(navigator, 'onLine', {
  get: mockNavigatorOnLine,
  configurable: true
})

// Mock fetch for network requests
global.fetch = vi.fn()

// Mock Firebase auth for authentication tests
const mockFirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn()
}

vi.mock('@/lib/firebase', () => ({
  auth: mockFirebaseAuth
}))

// Standard mocks
vi.mock('@/lib/utils', () => ({
  isPdfFile: vi.fn(() => true),
  isImageFile: vi.fn(() => false),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}))

vi.mock('@/components/pdf-viewer', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => (
    <div data-testid="pdf-viewer" data-url={url}>
      PDF Content
    </div>
  )
}))

vi.mock('@/components/music-text', () => ({
  MusicText: ({ text }: { text: string }) => (
    <div data-testid="music-text">{text}</div>
  )
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => (
    <div data-testid="next-image-mock" data-src={src}>
      {alt}
    </div>
  )
}))

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Test data
const performanceSetlist = {
  id: 'performance-setlist',
  name: 'Live Gig Setlist',
  setlist_songs: [
    {
      id: 'song-1',
      position: 1,
      content: {
        id: 'content-1',
        title: 'Internet Required Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        file_url: 'https://external-storage.com/song1.pdf',
        bpm: 120
      }
    },
    {
      id: 'song-2', 
      position: 2,
      content: {
        id: 'content-2',
        title: 'Cached Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        file_url: 'https://external-storage.com/song2.pdf',
        bpm: 100
      }
    },
    {
      id: 'song-3',
      position: 3,
      content: {
        id: 'content-3', 
        title: 'Lyrics Only Song',
        artist: 'Test Band',
        content_type: ContentType.LYRICS,
        content_data: {
          lyrics: 'Local lyrics content\nNo network required'
        },
        bpm: 90
      }
    }
  ]
}

describe('Performance Mode - Offline Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Default to online
    mockNavigatorOnLine.mockReturnValue(true)
    
    // Mock successful authentication by default
    mockFirebaseAuth.currentUser = {
      uid: 'test-user-123',
      email: 'test@example.com'
    }
    
    // Get mock functions and setup defaults
    const { getCachedFileInfo, cacheFilesForContent, getCacheSize } = await import('@/lib/offline-cache')
    
    vi.mocked(getCachedFileInfo).mockResolvedValue({
      url: 'blob:cached-content',
      mimeType: 'application/pdf',
      size: 1024000
    })
    
    vi.mocked(cacheFilesForContent).mockResolvedValue(undefined)
    vi.mocked(getCacheSize).mockResolvedValue(25000000) // 25MB used
    
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['pdf content'], { type: 'application/pdf' }))
    })
    
    // Mock animation frame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Online → Offline Transition', () => {
    it('should cache content proactively when online', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Should attempt to cache all songs in setlist
      const { cacheFilesForContent } = await import('@/lib/offline-cache')
      expect(vi.mocked(cacheFilesForContent)).toHaveBeenCalledWith(
        performanceSetlist.setlist_songs.map(s => s.content)
      )
    })

    it('should transition gracefully from online to offline', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Start online - should load content
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // Simulate going offline
      mockNavigatorOnLine.mockReturnValue(false)
      
      // Simulate network failure for new requests
      mockOfflineCache.getCachedFileInfo.mockRejectedValueOnce(new Error('Network unavailable'))
      
      // Navigate to next song - should use cached version
      mockOfflineCache.getCachedFileInfo.mockResolvedValueOnce({
        url: 'blob:offline-cached-song2',
        mimeType: 'application/pdf'
      })

      fireEvent.keyDown(window, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // Should use cached version, not attempt network request
      const pdfViewer = screen.getByTestId('pdf-viewer')
      expect(pdfViewer.getAttribute('data-url')).toBe('blob:offline-cached-song2')
    })

    it('should handle partial cache scenarios', async () => {
      // Song 1: Not cached, Song 2: Cached, Song 3: Lyrics (no cache needed)
      mockOfflineCache.getCachedFileInfo
        .mockResolvedValueOnce(null) // Song 1 not cached
        .mockResolvedValueOnce({ // Song 2 cached
          url: 'blob:cached-song2',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce(null) // Song 3 doesn't need cache

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Song 1: Should fallback to file_url when not cached
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('https://external-storage.com/song1.pdf')
      })

      // Song 2: Should use cached version  
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('blob:cached-song2')
      })

      // Song 3: Should work with local lyrics data
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Lyrics Only Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })
  })

  describe('Offline Performance Reliability', () => {
    it('should work completely offline with full cache', async () => {
      // Simulate offline environment
      mockNavigatorOnLine.mockReturnValue(false)
      
      // Mock all content as cached
      mockOfflineCache.getCachedFileInfo.mockResolvedValue({
        url: 'blob:offline-content',
        mimeType: 'application/pdf'
      })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should work through entire setlist offline
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Navigate through all songs
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Lyrics Only Song')).toBeInTheDocument()
      })

      // All functionality should work offline
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)
      
      const bpmIncrement = screen.getByLabelText('Increase BPM')
      await userEvent.click(bpmIncrement)
      
      await waitFor(() => {
        expect(screen.getByText(/95 BPM/)).toBeInTheDocument()
      })
    })

    it('should handle cache storage limits', async () => {
      // Mock cache near capacity
      mockOfflineCache.getCacheSize.mockResolvedValue(48000000) // 48MB of 50MB limit
      
      mockOfflineCache.cacheFilesForContent.mockRejectedValue(
        new Error('QuotaExceededError: Cache storage quota exceeded')
      )

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Should still function even if caching fails
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })
    })

    it('should recover when network comes back online', async () => {
      // Start offline
      mockNavigatorOnLine.mockReturnValue(false)
      mockOfflineCache.getCachedFileInfo.mockResolvedValue(null)

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should use fallback URLs when offline
      await waitFor(() => {
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('https://external-storage.com/song1.pdf')
      })

      // Simulate coming back online
      act(() => {
        mockNavigatorOnLine.mockReturnValue(true)
        fireEvent(window, new Event('online'))
      })

      // Should attempt to re-cache content
      await waitFor(() => {
        expect(mockOfflineCache.cacheFilesForContent).toHaveBeenCalled()
      })
    })
  })

  describe('Authentication Persistence During Offline', () => {
    it('should maintain authentication state when offline', async () => {
      // Start authenticated and online
      mockFirebaseAuth.currentUser = {
        uid: 'test-user-123',
        email: 'test@example.com'
      }

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Go offline
      mockNavigatorOnLine.mockReturnValue(false)

      // Should still function with cached auth state
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Performance mode should remain functional
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)
      expect(playButton).toBeInTheDocument()
    })

    it('should handle auth token refresh failures gracefully', async () => {
      // Mock auth token refresh failure
      mockFirebaseAuth.currentUser = null
      mockFirebaseAuth.onAuthStateChanged.mockImplementation((callback) => {
        setTimeout(() => callback(null), 100)
        return () => {}
      })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should still render performance mode (cached content doesn't require auth)
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Core functionality should work even without active auth
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })
    })
  })

  describe('Cache Management Under Load', () => {
    it('should prioritize performance mode content in cache', async () => {
      const largeCacheResponse = {
        url: 'blob:priority-cached-content',
        mimeType: 'application/pdf',
        size: 2000000, // 2MB file
        lastAccessed: Date.now()
      }

      mockOfflineCache.getCachedFileInfo.mockResolvedValue(largeCacheResponse)

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // Navigate through setlist - should maintain priority caching
      for (let i = 0; i < 2; i++) {
        fireEvent.keyDown(window, { key: 'ArrowRight' })
        await waitFor(() => {
          expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
        })
      }

      // Should have attempted to cache all performance content
      expect(mockOfflineCache.cacheFilesForContent).toHaveBeenCalledWith(
        performanceSetlist.setlist_songs.map(s => s.content)
      )
    })

    it('should handle concurrent cache operations', async () => {
      // Mock multiple setlists being loaded simultaneously
      const concurrentSetlists = Array.from({ length: 3 }, (_, i) => ({
        ...performanceSetlist,
        id: `setlist-${i}`,
        setlist_songs: performanceSetlist.setlist_songs.map(song => ({
          ...song,
          id: `${song.id}-${i}`,
          content: { ...song.content, id: `${song.content.id}-${i}` }
        }))
      }))

      // Render multiple performance modes
      const { rerender } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={concurrentSetlists[0]}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Rapidly switch between setlists
      for (const setlist of concurrentSetlists.slice(1)) {
        rerender(
          <PerformanceMode
            onExitPerformance={vi.fn()}
            selectedSetlist={setlist}
          />
        )
        
        await waitFor(() => {
          expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
        })
      }

      // Should handle concurrent cache requests without issues
      expect(mockOfflineCache.cacheFilesForContent).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from IndexedDB failures', async () => {
      // Mock IndexedDB failure
      mockOfflineCache.getCachedFileInfo.mockRejectedValue(
        new Error('InvalidStateError: Failed to access IndexedDB')
      )

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should fallback gracefully
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('https://external-storage.com/song1.pdf')
      })

      // Navigation should still work
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })
    })

    it('should handle corrupted cache gracefully', async () => {
      // Mock corrupted cache responses
      mockOfflineCache.getCachedFileInfo
        .mockResolvedValueOnce({
          url: 'blob:corrupted-content',
          mimeType: 'application/octet-stream' // Unexpected MIME type
        })
        .mockResolvedValueOnce({
          url: null, // Corrupted URL
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce({
          url: 'blob:valid-content',
          mimeType: 'application/pdf'
        })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should handle corrupted cache entries
      await waitFor(() => {
        expect(screen.getByText('Internet Required Song')).toBeInTheDocument()
      })

      // Navigate to song with corrupted cache
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Navigate to song with valid cache
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Lyrics Only Song')).toBeInTheDocument()
      })
    })
  })
})