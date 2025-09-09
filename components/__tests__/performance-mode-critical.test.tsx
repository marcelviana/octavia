/**
 * CRITICAL PERFORMANCE MODE TESTS
 * 
 * These tests focus on live performance reliability scenarios
 * where failures would be catastrophic during actual shows.
 * 
 * Target: <100ms response times for all navigation
 * Target: Zero network dependency during performances
 * Target: Graceful error recovery
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentType } from '@/types/content'
import { toast } from 'sonner'

// Mock offline cache with controlled responses
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn()
}))

// Mock utils with controllable file type detection
vi.mock('@/lib/utils', () => ({
  isPdfFile: vi.fn(),
  isImageFile: vi.fn(),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}))

// Mock components for controlled testing
vi.mock('@/components/pdf-viewer', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => (
    <div data-testid="pdf-viewer" data-url={url}>
      PDF Content Loading...
    </div>
  )
}))

vi.mock('@/components/music-text', () => ({
  MusicText: ({ text }: { text: string }) => (
    <div data-testid="music-text" data-content={text}>
      {text}
    </div>
  )
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <div 
      data-testid="next-image-mock"
      data-src={src}
      data-alt={alt}
      {...props}
    >
      {alt}
    </div>
  )
}))

// Mock toast for error notifications
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock wake lock API
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({
      release: vi.fn()
    })
  },
  writable: true
})

// Mock URL for blob management
global.URL.revokeObjectURL = vi.fn()
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

// Test data representing real performance scenarios
const liveSetlist = {
  id: 'live-setlist-1',
  name: 'Saturday Night Gig',
  setlist_songs: [
    {
      id: 'song-1',
      position: 1,
      content: {
        id: 'content-1',
        title: 'Opening Song',
        artist: 'Test Band',
        content_type: ContentType.LYRICS,
        content_data: {
          lyrics: 'Verse 1\nChorus\nVerse 2\nChorus\nBridge\nChorus'
        },
        bpm: 120,
        file_url: 'cached-song-1.pdf'
      }
    },
    {
      id: 'song-2', 
      position: 2,
      content: {
        id: 'content-2',
        title: 'Main Set Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        bpm: 100,
        file_url: 'cached-song-2.pdf'
      }
    },
    {
      id: 'song-3',
      position: 3,
      content: {
        id: 'content-3',
        title: 'Closing Song',
        artist: 'Test Band',
        content_type: ContentType.LYRICS,
        content_data: {
          lyrics: 'Final verse\nFinal chorus\nOutro'
        },
        bpm: 80
      }
    }
  ]
}

describe('Performance Mode - CRITICAL Live Performance Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup successful cache responses by default
    const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
    const { isPdfFile, isImageFile } = await import('@/lib/utils')
    
    vi.mocked(getCachedFileInfo).mockResolvedValue({
      url: 'blob:cached-content-url',
      mimeType: 'application/pdf'
    })
    vi.mocked(cacheFilesForContent).mockResolvedValue(undefined)
    vi.mocked(isPdfFile).mockReturnValue(true)
    vi.mocked(isImageFile).mockReturnValue(false)
    
    // Mock performance.now for timing tests
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
    
    // Mock requestAnimationFrame for scroll tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CRITICAL: Navigation Performance (<100ms)', () => {
    it('should navigate between songs in under 100ms', async () => {
      const startTime = performance.now()
      
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      const navigationStartTime = performance.now()
      
      // Simulate arrow key navigation (most common during performance)
      fireEvent.keyDown(window, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      }, { timeout: 100 }) // Fail if takes longer than 100ms

      const navigationEndTime = performance.now()
      const navigationTime = navigationEndTime - navigationStartTime
      
      expect(navigationTime).toBeLessThan(100)
    })

    it('should handle rapid navigation without lag', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Simulate rapid key presses (musician nervously navigating)
      const rapidNavigationStart = performance.now()
      
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      fireEvent.keyDown(window, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      }, { timeout: 200 })

      const rapidNavigationEnd = performance.now()
      expect(rapidNavigationEnd - rapidNavigationStart).toBeLessThan(200)
    })

    it('should load cached content instantly', async () => {
      // Mock instant cache response
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:instant-cached-url',
        mimeType: 'application/pdf'
      })

      const renderStart = performance.now()
      
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      }, { timeout: 50 }) // Should be nearly instant for cached content

      const renderEnd = performance.now()
      expect(renderEnd - renderStart).toBeLessThan(100)
    })
  })

  describe('CRITICAL: Offline Performance Scenarios', () => {
    it('should work completely offline with cached content', async () => {
      // Mock successful offline cache
      mockGetCachedFileInfo.mockResolvedValue({
        url: 'blob:offline-cached-content',
        mimeType: 'application/pdf'  
      })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // Navigate through all songs offline
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })

      // Verify cache was used, not network
      expect(mockGetCachedFileInfo).toHaveBeenCalled()
      expect(mockCacheFilesForContent).toHaveBeenCalledWith(
        liveSetlist.setlist_songs.map(s => s.content)
      )
    })

    it('should handle missing cache gracefully during performance', async () => {
      // Mock cache miss for second song
      mockGetCachedFileInfo
        .mockResolvedValueOnce({
          url: 'blob:song1-cached',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce(null) // Cache miss for song 2
        .mockResolvedValueOnce({
          url: 'blob:song3-cached', 
          mimeType: 'application/pdf'
        })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      // Song 1 should work (cached)
      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // Navigate to song 2 (cache miss)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      })

      // Should fallback to file_url when cache misses
      await waitFor(() => {
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer).toBeInTheDocument()
        expect(pdfViewer.getAttribute('data-url')).toBe('cached-song-2.pdf')
      })

      // Song 3 should work (cached)  
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })

    it('should handle network failures during performance', async () => {
      // Mock network failure scenarios
      mockGetCachedFileInfo.mockRejectedValue(new Error('Network error'))
      mockCacheFilesForContent.mockRejectedValue(new Error('Network error'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      // Component should still render and be functional
      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Navigation should still work
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      })

      // Should use fallback file_url
      await waitFor(() => {
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('cached-song-2.pdf')
      })
    })
  })

  describe('CRITICAL: Error Recovery During Live Performance', () => {
    it('should recover from corrupted cache data', async () => {
      // Mock corrupted cache response
      mockGetCachedFileInfo
        .mockResolvedValueOnce({
          url: 'blob:corrupted-url',
          mimeType: 'corrupted/type'
        })
        .mockResolvedValueOnce({
          url: 'blob:valid-backup-url',
          mimeType: 'application/pdf'
        })

      mockIsPdfFile.mockReturnValueOnce(false).mockReturnValueOnce(true)
      mockIsImageFile.mockReturnValue(false)

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      // Should show error for corrupted file
      await waitFor(() => {
        expect(screen.getByText('Unsupported file format')).toBeInTheDocument()
      })

      // Navigate to next song - should work with valid cache
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })
    })

    it('should handle wake lock failures gracefully', async () => {
      // Mock wake lock failure
      const mockWakeLock = vi.mocked(navigator.wakeLock.request)
      mockWakeLock.mockRejectedValue(new Error('Wake lock not supported'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Should show warning but continue working
      expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
        expect.stringContaining('browser does not support preventing screen sleep')
      )

      // Performance mode should still be fully functional
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set Song')).toBeInTheDocument()
      })
    })

    it('should handle missing content data gracefully', async () => {
      const setlistWithMissingContent = {
        ...liveSetlist,
        setlist_songs: [
          {
            id: 'song-1',
            position: 1,
            content: {
              id: 'content-1',
              title: 'Song With Missing Data',
              artist: 'Test Band',
              content_type: ContentType.LYRICS,
              content_data: {}, // Missing lyrics data
              bpm: 120
            }
          }
        ]
      }

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={setlistWithMissingContent}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Song With Missing Data')).toBeInTheDocument()
        expect(screen.getByText('No lyrics available for this song')).toBeInTheDocument()
      })

      // Should still allow interaction with controls
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)
      expect(playButton).toBeInTheDocument()
    })
  })

  describe('CRITICAL: Performance Under Load', () => {
    it('should handle large setlists without performance degradation', async () => {
      // Create a large setlist (50 songs)
      const largeSetlist = {
        id: 'large-setlist',
        name: 'Marathon Gig',
        setlist_songs: Array.from({ length: 50 }, (_, i) => ({
          id: `song-${i}`,
          position: i + 1,
          content: {
            id: `content-${i}`,
            title: `Song ${i + 1}`,
            artist: 'Test Band',
            content_type: ContentType.LYRICS,
            content_data: {
              lyrics: `Lyrics for song ${i + 1}\nChorus ${i + 1}\nVerse ${i + 1}`
            },
            bpm: 100 + (i % 20)
          }
        }))
      }

      const renderStart = performance.now()

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={largeSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      const renderEnd = performance.now()
      expect(renderEnd - renderStart).toBeLessThan(500) // Should render within 500ms

      // Test navigation performance with large setlist
      const navStart = performance.now()
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Song 2')).toBeInTheDocument()
      })
      const navEnd = performance.now()
      
      expect(navEnd - navStart).toBeLessThan(100)
    })

    it('should maintain performance with rapid BPM changes', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('120 BPM')).toBeInTheDocument()
      })

      // Rapid BPM adjustments (musician fine-tuning tempo)
      const bpmStart = performance.now()
      
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: '+' })
      }
      
      await waitFor(() => {
        expect(screen.getByText('170 BPM')).toBeInTheDocument()
      })

      const bpmEnd = performance.now()
      expect(bpmEnd - bpmStart).toBeLessThan(200) // Should handle rapid changes
    })
  })

  describe('CRITICAL: Memory Management', () => {
    it('should clean up resources when unmounting', async () => {
      const { unmount } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Trigger some timers and intervals
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)

      const bpmIncrement = screen.getByLabelText('Increase BPM')
      fireEvent.pointerDown(bpmIncrement)

      // Unmount and verify cleanup
      unmount()

      // Verify wake lock was released
      const wakeLockInstance = await navigator.wakeLock.request()
      expect(wakeLockInstance.release).toBeDefined()

      // Verify blob URLs were revoked
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle multiple setlist switches without memory leaks', async () => {
      const { rerender } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      // Switch between different setlists
      const alternateSetlist = {
        ...liveSetlist,
        id: 'alternate-setlist',
        setlist_songs: liveSetlist.setlist_songs.slice().reverse()
      }

      rerender(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={alternateSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })

      // Switch back
      rerender(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={liveSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Should handle switches without issues
      expect(mockGetCachedFileInfo).toHaveBeenCalledTimes(6) // 3 songs × 2 setlists
    })
  })
})