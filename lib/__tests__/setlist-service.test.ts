import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock fetch globally
const mockFetch = vi.fn()
;(global as any).fetch = mockFetch

describe('Setlist Service', () => {
      beforeEach(() => {
      // Reset all mocks
      vi.clearAllMocks()
      vi.resetModules()
      
      // Mock fetch to return successful responses
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([])
      })
      ;(global as any).fetch = mockFetch

    // Mock firebase server utils
    vi.doMock('../firebase-server-utils', () => ({
      getServerSideUser: vi.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      })
    }))

    // Mock firebase auth
    vi.doMock('../firebase', () => ({
      auth: {
        currentUser: {
          uid: 'test-user-id',
          email: 'test@example.com',
          getIdToken: vi.fn().mockResolvedValue('mock-token')
        }
      }
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserSetlists', () => {
    it('should return empty array when user is not authenticated', async () => {
      // Mock no authenticated user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: null }
      }))

      const { getUserSetlists } = await import('../setlist-service')
      const result = await getUserSetlists()
      expect(result).toEqual([])
      vi.resetModules()
    })

    it('should fetch setlists via API when authenticated', async () => {
      const mockSetlists: any[] = [
        { 
          id: 'setlist-1', 
          name: 'Test Setlist', 
          user_id: 'test-user-id',
          setlist_songs: [
            {
              id: 'song-1',
              content: {
                id: 'content-1',
                title: 'Test Song',
                artist: 'Test Artist'
              }
            }
          ]
        }
      ]

      // Mock successful API response
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSetlists)
      })
      ;(global as any).fetch = mockFetch

      const { getUserSetlists } = await import('../setlist-service')
      const result = await getUserSetlists()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Setlist')
      expect(result[0].setlist_songs).toHaveLength(1)
      expect(result[0].setlist_songs[0].content.title).toBe('Test Song')
      
      // Verify API call was made
      expect(fetch).toHaveBeenCalledWith('/api/setlists', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })
    })

    it('should throw on API error so callers can fall back to the offline cache', async () => {
      // Mock API error — SET-14: devolver [] aqui era indistinguível de
      // "sem setlists" e impedia o fallback de cache do caller
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'API Error' })
      })

      const { getUserSetlists } = await import('../setlist-service')
      await expect(getUserSetlists()).rejects.toThrow('Failed to load setlists')
    })

    it('should throw on network failure (fetch rejects)', async () => {
      (fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'))

      const { getUserSetlists } = await import('../setlist-service')
      await expect(getUserSetlists()).rejects.toThrow()
    })
  })
})
