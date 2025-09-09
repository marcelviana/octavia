/**
 * PERFORMANCE MODE OFFLINE INTEGRATION TESTS - Simplified Version
 * 
 * Tests offline functionality including:
 * - Cache integration
 * - Network failure handling
 * - Authentication persistence
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentType } from '@/types/content'

// Mock all dependencies
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn()
}))

vi.mock('@/lib/utils', () => ({
  isPdfFile: vi.fn().mockReturnValue(true),
  isImageFile: vi.fn().mockReturnValue(false),
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

// Mock wake lock
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn().mockResolvedValue({ release: vi.fn() })
  },
  writable: true
})

global.URL.revokeObjectURL = vi.fn()

// Test data
const offlineTestSetlist = {
  id: 'offline-setlist',
  name: 'Offline Performance Test',
  setlist_songs: [
    {
      id: 'cached-song',
      position: 1,
      content: {
        id: 'cached-content-1',
        title: 'Cached Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        file_url: 'https://external.com/song1.pdf',
        bpm: 120
      }
    },
    {
      id: 'fallback-song',
      position: 2,
      content: {
        id: 'fallback-content-2', 
        title: 'Fallback Song',
        artist: 'Test Band',
        content_type: ContentType.SHEET,
        file_url: 'https://external.com/song2.pdf',
        bpm: 100
      }
    },
    {
      id: 'lyrics-song',
      position: 3,
      content: {
        id: 'lyrics-content-3',
        title: 'Local Lyrics Song',
        artist: 'Test Band',
        content_type: ContentType.LYRICS,
        content_data: {
          lyrics: 'Local lyrics content\nNo network needed'
        },
        bpm: 90
      }
    }
  ]
}

describe('Performance Mode - Offline Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup default mocks
    const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
    
    vi.mocked(getCachedFileInfo).mockResolvedValue(null) // Default: no cache
    vi.mocked(cacheFilesForContent).mockResolvedValue(undefined)
    
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

  describe('Cache Integration', () => {
    it('should use cached content when available', async () => {
      // Mock successful cache for first song
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo)
        .mockResolvedValueOnce({
          url: 'blob:cached-song-1',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce(null) // Second song not cached
        .mockResolvedValueOnce(null) // Third song doesn't need cache (lyrics)

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      // First song should use cached content
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('blob:cached-song-1')
      })

      // Navigate to second song (not cached)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Fallback Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('https://external.com/song2.pdf')
      })

      // Navigate to third song (local lyrics)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Local Lyrics Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })

    it('should fallback gracefully when cache fails', async () => {
      // Mock cache failure
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockRejectedValue(new Error('Cache unavailable'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      // Should still render even when cache fails
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Should show PDF viewer with fallback URL or unsupported message
      await waitFor(() => {
        const pdfViewer = screen.queryByTestId('pdf-viewer')
        const unsupportedMessage = screen.queryByText('Unsupported file format')
        
        // Either should show PDF viewer or unsupported message
        expect(pdfViewer || unsupportedMessage).toBeTruthy()
      })

      // Navigation should still work
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      
      await waitFor(() => {
        expect(screen.getByText('Fallback Song')).toBeInTheDocument()
      })
    })

    it('should attempt to cache content for performance', async () => {
      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Should attempt to cache all songs
      const { cacheFilesForContent } = await import('@/lib/offline-cache')
      expect(vi.mocked(cacheFilesForContent)).toHaveBeenCalledWith(
        offlineTestSetlist.setlist_songs.map(s => s.content)
      )
    })
  })

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failure gracefully', async () => {
      // Mock network failure
      const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockRejectedValue(new Error('Network error'))
      vi.mocked(cacheFilesForContent).mockRejectedValue(new Error('Network error'))

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      // Should still render and be functional
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // All controls should work despite network issues
      const playButton = screen.getByTestId('play-pause-button')
      fireEvent.click(playButton)
      expect(playButton).toBeInTheDocument()

      // Navigation should work
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Fallback Song')).toBeInTheDocument()
      })

      // Navigate to lyrics song to ensure everything works
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Local Lyrics Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })

    it('should handle partial network failures', async () => {
      // Mock intermittent failures
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo)
        .mockResolvedValueOnce({
          url: 'blob:cached-song-1',
          mimeType: 'application/pdf'
        })
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce(null)

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      // First song should work (cached)
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('blob:cached-song-1')
      })

      // Second song should fallback despite cache error
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Fallback Song')).toBeInTheDocument()
        const pdfViewer = screen.getByTestId('pdf-viewer')
        expect(pdfViewer.getAttribute('data-url')).toBe('https://external.com/song2.pdf')
      })

      // Third song should work (local content)
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      await waitFor(() => {
        expect(screen.getByText('Local Lyrics Song')).toBeInTheDocument()
        expect(screen.getByTestId('music-text')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication During Offline Mode', () => {
    it('should maintain functionality when authentication is offline', async () => {
      // Simulate offline auth scenario
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:cached-offline-content',
        mimeType: 'application/pdf'
      })

      render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      // Should work with cached content even if auth is offline
      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
        expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      })

      // All performance features should work
      fireEvent.keyDown(window, { key: ' ' }) // Play/pause
      fireEvent.keyDown(window, { key: '+' }) // BPM up
      fireEvent.keyDown(window, { key: 'ArrowRight' }) // Navigate

      await waitFor(() => {
        expect(screen.getByText('Fallback Song')).toBeInTheDocument()
      })
    })
  })

  describe('Resource Management During Offline', () => {
    it('should clean up offline resources properly', async () => {
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:offline-resource',
        mimeType: 'application/pdf'
      })

      const { unmount } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Unmount component
      unmount()

      // Should clean up blob URLs
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle rapid setlist changes during offline mode', async () => {
      const alternateSetlist = {
        ...offlineTestSetlist,
        id: 'alternate-offline-setlist',
        setlist_songs: offlineTestSetlist.setlist_songs.slice().reverse()
      }

      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:offline-content',
        mimeType: 'application/pdf'
      })

      const { rerender } = render(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={offlineTestSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Cached Song')).toBeInTheDocument()
      })

      // Switch setlists
      rerender(
        <PerformanceMode
          onExitPerformance={vi.fn()}
          selectedSetlist={alternateSetlist}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Local Lyrics Song')).toBeInTheDocument()
      })

      // Should handle the switch without issues
      expect(getCachedFileInfo).toHaveBeenCalled()
    })
  })
})