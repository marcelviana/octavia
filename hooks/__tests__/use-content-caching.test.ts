/**
 * Content Caching Hook Tests
 * 
 * Tests file loading, caching, and URL management functionality.
 * Critical requirement: Fast cache lookup for live performance scenarios.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useContentCaching } from '../use-content-caching'

// Mock offline cache functions
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  cacheFilesForContent: vi.fn(),
  warmCache: vi.fn(() => Promise.resolve()),
  getCacheMetrics: vi.fn(() => ({
    hitRate: 0.8,
    missCount: 5,
    hitCount: 20,
    totalRequests: 25,
    hitRatePercent: 80
  }))
}))

// Mock URL.revokeObjectURL
global.URL.revokeObjectURL = vi.fn()

// Test data
const mockSongs = [
  {
    id: 'song-1',
    title: 'Test Song 1',
    artist: 'Test Artist',
    file_url: 'https://example.com/song1.pdf',
    content_data: { lyrics: 'Verse 1\nChorus 1\nVerse 2' }
  },
  {
    id: 'song-2', 
    title: 'Test Song 2',
    artist: 'Test Artist',
    file_url: 'https://example.com/song2.pdf',
    content_data: { lyrics: 'Different lyrics\nfor song 2' }
  },
  {
    id: 'song-3',
    title: 'Lyrics Only Song',
    artist: 'Test Artist',
    content_data: { 
      lyrics: 'This song has lyrics only\nNo file URL',
      file: 'local-file.txt'
    }
  }
]

const mockSongWithoutId = {
  title: 'Song Without ID',
  file_url: 'https://example.com/no-id.pdf',
  content_data: { lyrics: 'Song without ID lyrics' }
}

describe('useContentCaching', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    
    const { getCachedFileInfo, cacheFilesForContent } = await import('@/lib/offline-cache')
    vi.mocked(getCachedFileInfo).mockResolvedValue(null)
    vi.mocked(cacheFilesForContent).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.resetAllMocks()
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  })

  describe('Initialization', () => {
    it('should initialize with empty arrays when no songs provided', () => {
      const { result } = renderHook(() => 
        useContentCaching({ songs: [] })
      )

      expect(result.current.sheetUrls).toEqual([])
      expect(result.current.sheetMimeTypes).toEqual([])
      expect(result.current.lyricsData).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should extract lyrics data from songs immediately', () => {
      const { result } = renderHook(() => 
        useContentCaching({ songs: mockSongs })
      )

      expect(result.current.lyricsData).toEqual([
        'Verse 1\nChorus 1\nVerse 2',
        'Different lyrics\nfor song 2',
        'This song has lyrics only\nNo file URL'
      ])
    })

    it('should handle songs without lyrics data', () => {
      const songsWithoutLyrics = [
        { id: 'song-1', title: 'No Lyrics', file_url: 'test.pdf' },
        { id: 'song-2', title: 'Also No Lyrics' }
      ]

      const { result } = renderHook(() => 
        useContentCaching({ songs: songsWithoutLyrics })
      )

      expect(result.current.lyricsData).toEqual(['', ''])
    })
  })

  describe('Cache Loading', () => {
    it('should load cached files when available', async () => {
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo)
        .mockResolvedValueOnce({
          url: 'blob:cached-song-1',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce({
          url: 'blob:cached-song-2', 
          mimeType: 'image/png'
        })
        .mockResolvedValueOnce(null) // Third song not cached

      const { result } = renderHook(() => 
        useContentCaching({ songs: mockSongs })
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      }, { timeout: 1000 })

      expect(result.current.sheetUrls).toEqual([
        'blob:cached-song-1',
        'blob:cached-song-2',
        'local-file.txt' // Fallback to content_data.file
      ])

      expect(result.current.sheetMimeTypes).toEqual([
        'application/pdf',
        'image/png',
        null
      ])

      expect(getCachedFileInfo).toHaveBeenCalledTimes(3)
    })

    it('should fallback to original URLs when cache fails', async () => {
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockRejectedValue(new Error('Cache error'))

      const { result } = renderHook(() => 
        useContentCaching({ songs: mockSongs })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sheetUrls).toEqual([
        'https://example.com/song1.pdf',
        'https://example.com/song2.pdf', 
        'local-file.txt'
      ])

      expect(result.current.sheetMimeTypes).toEqual([null, null, null])
    })

    it('should handle songs without IDs gracefully', async () => {
      const songsWithoutIds = [mockSongWithoutId]

      const { result } = renderHook(() => 
        useContentCaching({ songs: songsWithoutIds })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sheetUrls).toEqual(['https://example.com/no-id.pdf'])
      expect(result.current.sheetMimeTypes).toEqual([null])

      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      expect(getCachedFileInfo).not.toHaveBeenCalled()
    })
  })

  describe('Background Caching', () => {
    it('should attempt to cache all songs in background', async () => {
      const { cacheFilesForContent } = await import('@/lib/offline-cache')
      
      renderHook(() => 
        useContentCaching({ songs: mockSongs })
      )

      // Wait briefly for the effect to run
      await new Promise(resolve => setTimeout(resolve, 50))
      
      expect(cacheFilesForContent).toHaveBeenCalledWith(mockSongs)
    })

    it('should handle caching errors gracefully', async () => {
      const { cacheFilesForContent } = await import('@/lib/offline-cache')
      vi.mocked(cacheFilesForContent).mockRejectedValue(new Error('Caching failed'))

      const { result } = renderHook(() => 
        useContentCaching({ songs: mockSongs })
      )

      // Wait for background caching to execute
      await new Promise(resolve => setTimeout(resolve, 50))

      // Should not throw error despite caching failure
      expect(result.current).toBeDefined()
      expect(cacheFilesForContent).toHaveBeenCalledWith(mockSongs)
    })

    it('should not attempt caching with empty song list', async () => {
      const { cacheFilesForContent } = await import('@/lib/offline-cache')
      vi.mocked(cacheFilesForContent).mockClear()
      
      renderHook(() => 
        useContentCaching({ songs: [] })
      )

      // Wait a bit to ensure no async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(cacheFilesForContent).not.toHaveBeenCalled()
    })
  })

  describe('Resource Management', () => {
    it('should revoke blob URLs on unmount', async () => {
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo)
        .mockResolvedValueOnce({
          url: 'blob:cached-song-1',
          mimeType: 'application/pdf'
        })
        .mockResolvedValueOnce({
          url: 'blob:cached-song-2',
          mimeType: 'image/png'
        })

      const { unmount } = renderHook(() => 
        useContentCaching({ songs: mockSongs.slice(0, 2) })
      )

      // Wait for cache loading
      await new Promise(resolve => setTimeout(resolve, 20))

      unmount()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:cached-song-1')
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:cached-song-2')
    })

    it('should handle blob URL revocation errors gracefully', async () => {
      global.URL.revokeObjectURL = vi.fn().mockImplementation(() => {
        throw new Error('Revoke failed')
      })

      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue({
        url: 'blob:test-url',
        mimeType: 'application/pdf'
      })

      const { unmount } = renderHook(() => 
        useContentCaching({ songs: mockSongs.slice(0, 1) })
      )

      // Wait for cache loading
      await new Promise(resolve => setTimeout(resolve, 20))

      // Should not throw despite revocation error
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Song List Changes', () => {
    it('should update URLs when song list changes', async () => {
      const { getCachedFileInfo } = await import('@/lib/offline-cache')
      vi.mocked(getCachedFileInfo).mockResolvedValue(null)

      const { result, rerender } = renderHook(
        ({ songs }) => useContentCaching({ songs }),
        { initialProps: { songs: mockSongs.slice(0, 2) } }
      )

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(result.current.sheetUrls).toHaveLength(2)

      // Change song list
      rerender({ songs: mockSongs })

      // Wait for rerender
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(result.current.sheetUrls).toHaveLength(3)
    })

    it('should clear URLs when songs become empty', async () => {
      const { result, rerender } = renderHook(
        ({ songs }) => useContentCaching({ songs }),
        { initialProps: { songs: mockSongs } }
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sheetUrls).toHaveLength(3)

      // Clear songs
      rerender({ songs: [] })

      await waitFor(() => {
        expect(result.current.sheetUrls).toEqual([])
        expect(result.current.sheetMimeTypes).toEqual([])
        expect(result.current.lyricsData).toEqual([])
      })
    })
  })

  describe('Performance Considerations', () => {
    it('should memoize lyrics data to prevent unnecessary recalculations', () => {
      const { result, rerender } = renderHook(
        ({ songs }) => useContentCaching({ songs }),
        { initialProps: { songs: mockSongs } }
      )

      const initialLyricsData = result.current.lyricsData

      // Rerender with same songs
      rerender({ songs: mockSongs })

      // Should return the same reference (memoized)
      expect(result.current.lyricsData).toBe(initialLyricsData)
    })

    it('should handle moderate song lists efficiently', () => {
      const songList = Array.from({ length: 10 }, (_, i) => ({
        id: `song-${i}`,
        title: `Song ${i}`,
        file_url: `https://example.com/song${i}.pdf`,
        content_data: { lyrics: `Lyrics for song ${i}` }
      }))

      const { result } = renderHook(() => 
        useContentCaching({ songs: songList })
      )

      // Should immediately provide lyrics data
      expect(result.current.lyricsData).toHaveLength(10)
      expect(result.current.lyricsData[0]).toBe('Lyrics for song 0')
      expect(result.current.lyricsData[9]).toBe('Lyrics for song 9')
    })
  })
})