/**
 * useContentFile Hook Tests
 *
 * Tests for the extracted useContentFile hook to ensure proper
 * file loading, offline support, and error handling functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useContentFile } from '@/hooks/useContentFile'

// Mock dependencies
const mockGetOfflineUrl = vi.fn()
const mockStoreOfflineContent = vi.fn()
const mockCreateObjectURL = vi.fn()
const mockRevokeObjectURL = vi.fn()

// Mock URL object
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
  }
})

// Mock offline cache
vi.mock('@/lib/offline-cache', () => ({
  getOfflineUrl: mockGetOfflineUrl,
  storeOfflineContent: mockStoreOfflineContent
}))

// Mock fetch
global.fetch = vi.fn()

const mockContent = {
  id: 'test-content-123',
  title: 'Test Song',
  file_url: 'https://example.com/test-file.pdf',
  content_type: 'Sheet',
  user_id: 'test-user'
}

describe('useContentFile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetOfflineUrl.mockResolvedValue(null)
    mockStoreOfflineContent.mockResolvedValue(true)
    mockCreateObjectURL.mockReturnValue('blob:test-url')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() =>
        useContentFile({ content: mockContent })
      )

      expect(result.current.offlineUrl).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.loadOfflineUrl).toBe('function')
    })

    it('should not auto-load when autoLoad is false', () => {
      renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: false })
      )

      expect(mockGetOfflineUrl).not.toHaveBeenCalled()
    })

    it('should auto-load when autoLoad is true', async () => {
      renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(mockGetOfflineUrl).toHaveBeenCalledWith(mockContent.id)
      })
    })
  })

  describe('Offline URL Loading', () => {
    it('should load existing offline URL from cache', async () => {
      const cachedUrl = 'blob:cached-url'
      mockGetOfflineUrl.mockResolvedValue(cachedUrl)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.offlineUrl).toBe(cachedUrl)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should fetch and cache new content when not in cache', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(new Blob(['test content']), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' }
      })
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(mockContent.file_url)
        expect(mockStoreOfflineContent).toHaveBeenCalled()
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(result.current.offlineUrl).toBe('blob:test-url')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle fetch errors gracefully', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load content file')
        expect(result.current.isLoading).toBe(false)
        expect(result.current.offlineUrl).toBeNull()
      })
    })

    it('should handle non-200 response status', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(null, { status: 404 })
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load content file')
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Manual Loading', () => {
    it('should allow manual loading via loadOfflineUrl function', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(new Blob(['test content']))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: false })
      )

      await act(async () => {
        await result.current.loadOfflineUrl()
      })

      expect(fetch).toHaveBeenCalledWith(mockContent.file_url)
      expect(result.current.offlineUrl).toBe('blob:test-url')
    })

    it('should prevent concurrent loading requests', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(new Blob(['test content']))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: false })
      )

      // Start multiple concurrent loads
      const promises = [
        result.current.loadOfflineUrl(),
        result.current.loadOfflineUrl(),
        result.current.loadOfflineUrl()
      ]

      await act(async () => {
        await Promise.all(promises)
      })

      // Should only fetch once
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Content Changes', () => {
    it('should reload when content changes', async () => {
      const newContent = {
        ...mockContent,
        id: 'new-content-456',
        file_url: 'https://example.com/new-file.pdf'
      }

      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(new Blob(['test content']))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result, rerender } = renderHook(
        ({ content }) => useContentFile({ content, autoLoad: true }),
        { initialProps: { content: mockContent } }
      )

      await waitFor(() => {
        expect(result.current.offlineUrl).toBe('blob:test-url')
      })

      // Change content
      rerender({ content: newContent })

      await waitFor(() => {
        expect(mockGetOfflineUrl).toHaveBeenCalledWith(newContent.id)
      })
    })

    it('should handle null content gracefully', () => {
      const { result } = renderHook(() =>
        useContentFile({ content: null, autoLoad: true })
      )

      expect(result.current.offlineUrl).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle content without file_url', async () => {
      const contentWithoutFile = {
        ...mockContent,
        file_url: null
      }

      const { result } = renderHook(() =>
        useContentFile({ content: contentWithoutFile, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.offlineUrl).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(mockGetOfflineUrl).not.toHaveBeenCalled()
      })
    })
  })

  describe('Memory Management', () => {
    it('should cleanup blob URLs on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useContentFile({ content: mockContent })
      )

      // Set a blob URL
      act(() => {
        result.current.offlineUrl = 'blob:test-url'
      })

      unmount()

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })

    it('should cleanup blob URLs when content changes', async () => {
      const newContent = { ...mockContent, id: 'new-id' }

      mockGetOfflineUrl.mockResolvedValue('blob:cached-url')

      const { rerender } = renderHook(
        ({ content }) => useContentFile({ content, autoLoad: true }),
        { initialProps: { content: mockContent } }
      )

      await waitFor(() => {
        expect(mockGetOfflineUrl).toHaveBeenCalledWith(mockContent.id)
      })

      // Change content
      rerender({ content: newContent })

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:cached-url')
    })

    it('should not revoke URLs that are not blob URLs', () => {
      const { result, unmount } = renderHook(() =>
        useContentFile({ content: mockContent })
      )

      // Set a non-blob URL
      act(() => {
        result.current.offlineUrl = 'https://example.com/file.pdf'
      })

      unmount()

      expect(mockRevokeObjectURL).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      mockGetOfflineUrl.mockRejectedValue(new Error('Cache error'))

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load content file')
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle storage errors gracefully', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      mockStoreOfflineContent.mockRejectedValue(new Error('Storage error'))

      const mockResponse = new Response(new Blob(['test content']))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        // Should still create blob URL even if storage fails
        expect(result.current.offlineUrl).toBe('blob:test-url')
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle blob creation errors', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('Blob creation failed')
      })

      const mockResponse = new Response(new Blob(['test content']))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load content file')
        expect(result.current.offlineUrl).toBeNull()
      })
    })
  })

  describe('Performance', () => {
    it('should debounce rapid content changes', async () => {
      const contents = Array.from({ length: 5 }, (_, i) => ({
        ...mockContent,
        id: `content-${i}`,
        file_url: `https://example.com/file-${i}.pdf`
      }))

      const { rerender } = renderHook(
        ({ content }) => useContentFile({ content, autoLoad: true }),
        { initialProps: { content: contents[0] } }
      )

      // Rapidly change content
      for (let i = 1; i < contents.length; i++) {
        rerender({ content: contents[i] })
      }

      await waitFor(() => {
        // Should only call for the final content
        expect(mockGetOfflineUrl).toHaveBeenLastCalledWith(contents[4].id)
      })
    })

    it('should handle large files efficiently', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)

      // Simulate large file
      const largeBlob = new Blob(['x'.repeat(50 * 1024 * 1024)]) // 50MB
      const mockResponse = new Response(largeBlob)
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      const startTime = performance.now()

      await waitFor(() => {
        expect(result.current.offlineUrl).toBe('blob:test-url')
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle large files in reasonable time
      expect(duration).toBeLessThan(5000) // 5 seconds
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed URLs', async () => {
      const contentWithBadUrl = {
        ...mockContent,
        file_url: 'not-a-valid-url'
      }

      const { result } = renderHook(() =>
        useContentFile({ content: contentWithBadUrl, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load content file')
      })
    })

    it('should handle empty responses', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      const mockResponse = new Response(new Blob([]))
      ;(global.fetch as any).mockResolvedValue(mockResponse)

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(() => {
        expect(result.current.offlineUrl).toBe('blob:test-url')
        expect(result.current.error).toBeNull()
      })
    })

    it('should handle network timeouts', async () => {
      mockGetOfflineUrl.mockResolvedValue(null)
      ;(global.fetch as any).mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      const { result } = renderHook(() =>
        useContentFile({ content: mockContent, autoLoad: true })
      )

      await waitFor(
        () => {
          expect(result.current.error).toBe('Failed to load content file')
        },
        { timeout: 1000 }
      )
    })
  })
})