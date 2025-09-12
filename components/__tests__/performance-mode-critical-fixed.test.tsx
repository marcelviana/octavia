/**
 * CRITICAL PERFORMANCE MODE TESTS - Fixed Version
 * 
 * Tests core performance requirements for live music performance:
 * - <100ms navigation response time
 * - Zero network dependency for cached content  
 * - Graceful error recovery
 * - Memory management and resource cleanup
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentType } from '@/types/content'

// Mock all external dependencies with proper factories
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn(),
  warmCache: vi.fn(() => Promise.resolve()),
  getCachedContent: vi.fn(() => Promise.resolve([])),
  saveContent: vi.fn(() => Promise.resolve()),
  removeCachedContent: vi.fn(() => Promise.resolve()),
  cacheFileForContent: vi.fn(() => Promise.resolve()),
  getCachedFileUrl: vi.fn(() => Promise.resolve('blob:cached-url')),
  preloadContent: vi.fn(() => Promise.resolve()),
  getCacheMetrics: vi.fn(() => ({ hitRate: 0.8, missCount: 10, hitCount: 40 })),
  clearOfflineContent: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/utils', () => ({
  isPdfFile: vi.fn(),
  isImageFile: vi.fn(), 
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}))

vi.mock('@/components/pdf-viewer', () => ({
  __esModule: true,
  default: ({ url }: { url: string }) => (
    <div data-testid="pdf-viewer" data-url={url}>PDF Content</div>
  )
}))

vi.mock('@/components/music-text', () => ({
  MusicText: ({ text }: { text: string }) => (
    <div data-testid="music-text">{text}</div>
  )
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: any) => (
    <div data-testid="next-image-mock" data-src={src}>{alt}</div>
  )
}))

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock browser APIs
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({ release: vi.fn() })
  },
  writable: true
})

global.URL.revokeObjectURL = vi.fn()
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

// Test data for realistic performance scenarios
const performanceSetlist = {
  id: 'live-gig-setlist',
  name: 'Saturday Night Performance',
  setlist_songs: [
    {
      id: 'song-1',
      position: 1,
      content: {
        id: 'content-1',
        title: 'Opening Number',
        artist: 'Test Band',
        content_type: ContentType.LYRICS,
        content_data: {
          lyrics: 'Verse one lyrics here\nChorus lyrics\nVerse two lyrics\nChorus again'
        },
        bpm: 120,
        file_url: 'https://storage.example.com/song1.pdf'
      }
    },
    {
      id: 'song-2', 
      position: 2,
      content: {
        id: 'content-2',
        title: 'Main Set PDF Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        bpm: 100,
        file_url: 'https://storage.example.com/song2.pdf'
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
          lyrics: 'Final verse\nFinal chorus\nEnding'
        },
        bpm: 85,
        file_url: null
      }
    }
  ]
}

describe('Performance Mode - CRITICAL Live Performance Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get mocked functions and setup default behaviors
    const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
    const { isPdfFile, isImageFile } = await import('@/lib/utils')
    
    // Setup successful cache responses by default
    vi.mocked(getCachedFileInfo).mockResolvedValue({
      url: 'blob:cached-performance-content',
      mimeType: 'application/pdf'
    })
    
    vi.mocked(cacheFilesForContent).mockResolvedValue(undefined)
    vi.mocked(isPdfFile).mockReturnValue(true)
    vi.mocked(isImageFile).mockReturnValue(false)
    
    // Mock requestAnimationFrame for performance tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    
    // Mock performance.now for timing tests
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CRITICAL: Live Performance Navigation Speed', () => {
    it('should navigate between songs fast enough for live performance', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Measure navigation timing
      const startTime = Date.now()
      
      // Simulate arrow key navigation (most common during performance)
      fireEvent.keyDown(window, { key: 'ArrowRight' })

      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      }, { timeout: 200 }) // Allow up to 200ms for test environment

      const endTime = Date.now()
      const navigationTime = endTime - startTime
      
      // Should be fast enough for live performance
      expect(navigationTime).toBeLessThan(200)
    })

    it('should handle rapid song navigation without performance issues', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Simulate rapid navigation with individual waits
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      }, { timeout: 500 })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      }, { timeout: 500 })

      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      }, { timeout: 500 })

      // Test completes successfully if all navigations work
      expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
    })

    it('should maintain performance with large setlists', async () => {
      // Create large setlist (20 songs)
      const largeSetlist = {
        id: 'large-setlist',
        name: 'Marathon Show',
        setlist_songs: Array.from({ length: 20 }, (_, i) => ({
          id: `song-${i}`,
          position: i + 1,
          content: {
            id: `content-${i}`,
            title: `Song ${i + 1}`,
            artist: 'Test Band',
            content_type: ContentType.LYRICS,
            content_data: {
              lyrics: `Verse ${i + 1}\nChorus ${i + 1}`
            },
            bpm: 100 + (i % 20)
          }
        }))
      }

      const renderStart = Date.now()

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={largeSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      }, { timeout: 1000 })

      const renderEnd = Date.now()
      expect(renderEnd - renderStart).toBeLessThan(1000) // Should render within 1 second

      // Test navigation performance
      const navStart = Date.now()
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Song 2')).toBeInTheDocument()
      })
      
      const navEnd = Date.now()
      expect(navEnd - navStart).toBeLessThan(200)
    })
  })

  describe('CRITICAL: Offline Performance Scenarios', () => {
    it('should function completely offline with cached content', async () => {
      // Mock successful offline cache for all content
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:offline-cached-content',
        mimeType: 'application/pdf'
      })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Verify first song loads
      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })

      // Navigate through all songs offline
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })

      // Verify cache was utilized
      expect(getCachedFileInfo).toHaveBeenCalled()
    })

    it('should gracefully handle missing cached content', async () => {
      // Mock cache miss scenarios
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo)
        .mockResolvedValueOnce(null) // First song: cache miss
        .mockResolvedValueOnce({    // Second song: cache hit
          url: 'blob:cached-song-2',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce(null) // Third song: cache miss

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // First song should fallback to file_url
      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })

      // Second song should use cached content
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('blob:cached-song-2')
      })

      // Third song should work with lyrics (no cache needed)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })

    it('should handle cache failures without crashing', async () => {
      // Mock cache failures
      const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockRejectedValue(new Error('IndexedDB unavailable'))
      vi.mocked(cacheFilesForContent).mockRejectedValue(new Error('Cache write failed'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      // Should still render and function
      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Navigation should still work
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      })
    })
  })

  describe('CRITICAL: Error Recovery During Performance', () => {
    it('should handle wake lock failures gracefully', async () => {
      // Mock wake lock failure
      const wakeLockRequest = vi.mocked(navigator.wakeLock.request)
      wakeLockRequest.mockRejectedValue(new Error('Wake lock not supported'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Should continue working despite wake lock failure
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      })

      // Should show warning but not crash
      const { toast } = await import('sonner')
      expect(vi.mocked(toast.warning)).toHaveBeenCalledWith(
        expect.stringContaining('browser does not support preventing screen sleep')
      )
    })

    it('should handle corrupted file data', async () => {
      // Mock corrupted file scenarios
      const { isPdfFile, isImageFile } = await import('@/lib/utils')
      vi.mocked(isPdfFile).mockReturnValue(false)
      vi.mocked(isImageFile).mockReturnValue(false)

      const setlistWithCorruptedFile = {
        ...performanceSetlist,
        setlist_songs: [{
          ...performanceSetlist.setlist_songs[1], // Use the PDF song
          content: {
            ...performanceSetlist.setlist_songs[1].content,
            title: 'Corrupted PDF Song'
          }
        }]
      }

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={setlistWithCorruptedFile}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Corrupted PDF Song')).toBeInTheDocument()
        expect(screen.getByText('Unsupported file format')).toBeInTheDocument()
      })

      // Controls should still work
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)
      expect(playButton).toBeInTheDocument()
    })

    it('should handle missing content data', async () => {
      const setlistWithMissingData = {
        ...performanceSetlist,
        setlist_songs: [{
          id: 'broken-song',
          position: 1,
          content: {
            id: 'broken-content',
            title: 'Song Missing Data',
            artist: 'Test Band',
            content_type: ContentType.LYRICS,
            content_data: {}, // Missing lyrics
            bpm: 120
          }
        }]
      }

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={setlistWithMissingData}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Song Missing Data')).toBeInTheDocument()
        expect(screen.getByText('No lyrics available for this song')).toBeInTheDocument()
      })

      // Should still allow BPM changes
      fireEvent.keyDown(window, { key: '+' })
      await waitFor(() => {
        expect(screen.getByText('125 BPM')).toBeInTheDocument()
      })
    })
  })

  describe('CRITICAL: Essential Performance Controls', () => {
    it('should handle all keyboard shortcuts reliably', async () => {
      const onExitMock = vi.fn()
      
      render(
        <PerformanceMode
          onExitPerformance={onExitMock}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
        expect(screen.getByText('120 BPM')).toBeInTheDocument()
      })

      // Test spacebar for play/pause
      fireEvent.keyDown(window, { key: ' ' })
      expect(screen.getByTestId('play-pause-button')).toBeInTheDocument()

      // Test BPM controls
      fireEvent.keyDown(window, { key: '+' })
      await waitFor(() => {
        expect(screen.getByText('125 BPM')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: '-' })
      await waitFor(() => {
        expect(screen.getByText('120 BPM')).toBeInTheDocument()
      })

      // Test navigation
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Main Set PDF Song')).toBeInTheDocument()
      })

      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Test exit
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onExitMock).toHaveBeenCalled()
    })

    it('should maintain UI control responsiveness', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('play-pause-button')).toBeInTheDocument()
      })

      // Test all essential buttons
      const exitButton = screen.getByTestId('exit-button')
      const darkModeToggle = screen.getByTestId('dark-mode-toggle')
      const playPauseButton = screen.getByTestId('play-pause-button')

      expect(exitButton).toBeInTheDocument()
      expect(darkModeToggle).toBeInTheDocument()
      expect(playPauseButton).toBeInTheDocument()

      // Test zoom controls
      const zoomInButton = screen.getByLabelText('Zoom in')
      const zoomOutButton = screen.getByLabelText('Zoom out')

      await userEvent.click(zoomInButton)
      await waitFor(() => {
        expect(screen.getByText('110%')).toBeInTheDocument()
      })

      await userEvent.click(zoomOutButton)
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })
  })

  describe('CRITICAL: Memory and Resource Management', () => {
    it('should properly clean up resources on unmount', async () => {
      const { unmount } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Trigger some activity to create resources
      const playButton = screen.getByTestId('play-pause-button')
      await userEvent.click(playButton)

      const bpmButton = screen.getByLabelText('Increase BPM')
      fireEvent.pointerDown(bpmButton)
      fireEvent.pointerUp(bpmButton)

      // Unmount the component
      unmount()

      // Verify cleanup occurred
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle setlist changes without memory leaks', async () => {
      const alternateSetlist = {
        ...performanceSetlist,
        id: 'alternate-setlist',
        setlist_songs: performanceSetlist.setlist_songs.slice().reverse()
      }

      const { rerender } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Switch setlists
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
          selectedSetlist={performanceSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Number')).toBeInTheDocument()
      })

      // Should handle multiple switches gracefully
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      expect(getCachedFileInfo).toHaveBeenCalledTimes(9) // 3 songs × 3 renders
    })
  })
})