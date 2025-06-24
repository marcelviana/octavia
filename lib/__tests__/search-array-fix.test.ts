import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}))

describe('Search Array Field Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Array Field Search Query Prevention', () => {
    it('should not include array fields in search query to prevent PostgreSQL operator errors', async () => {
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: { id: 'user1' } }, 
            error: null 
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  abortSignal: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
                  })
                })
              })
            })
          })
        })
      }

      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))

      // Mock Firebase auth to return authenticated user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: { uid: 'user1', email: 'test@example.com' } }
      }))

      const { getUserContentPage } = await import('../content-service')
      
      await getUserContentPage({ search: 'test search' })
      
      // Verify the OR query does NOT include tags field (which is an array)
      const orCall = mockClient.from().select().eq().or
      expect(orCall).toHaveBeenCalledWith(
        'title.ilike.%test search%,artist.ilike.%test search%,album.ilike.%test search%'
      )
      
      // Ensure tags field is NOT included in the search query
      const orCallArgs = orCall.mock.calls[0][0]
      expect(orCallArgs).not.toContain('tags')
      
      vi.resetModules()
    })

    it('should handle the specific array operator error gracefully', async () => {
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: { id: 'user1' } }, 
            error: null 
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  abortSignal: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'operator does not exist: text[] ~~* unknown' },
                    count: null
                  })
                })
              })
            })
          })
        })
      }

      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))

      // Mock Firebase auth to return authenticated user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: { uid: 'user1', email: 'test@example.com' } }
      }))

      const { getUserContentPage } = await import('../content-service')
      
      await expect(getUserContentPage({ search: 'test' })).rejects.toThrow(
        'Database error: operator does not exist: text[] ~~* unknown'
      )
      
      vi.resetModules()
    })

    it('should provide helpful error message for array operator issues', async () => {
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: { id: 'user1' } }, 
            error: null 
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  abortSignal: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'operator does not exist: text[] ~~* text' },
                    count: null
                  })
                })
              })
            })
          })
        })
      }

      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))

      // Mock Firebase auth to return authenticated user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: { uid: 'user1', email: 'test@example.com' } }
      }))

      const { getUserContentPage } = await import('../content-service')
      
      try {
        await getUserContentPage({ search: 'test' })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Database error:')
        expect((error as Error).message).toContain('operator does not exist')
      }
      
      vi.resetModules()
    })
  })

  describe('Search Functionality Without Array Fields', () => {
    it('should successfully search across title, artist, and album fields', async () => {
      const mockData = [
        {
          id: '1',
          title: 'Test Song',
          artist: 'Test Artist',
          album: 'Test Album',
          tags: ['rock', 'classic'],
          user_id: 'user1'
        }
      ]

      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: { id: 'user1' } }, 
            error: null 
          })
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  abortSignal: vi.fn().mockReturnThis(),
                  range: vi.fn().mockResolvedValue({
                    data: mockData,
                    error: null,
                    count: 1
                  })
                })
              })
            })
          })
        })
      }

      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))

      // Mock Firebase auth to return authenticated user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: { uid: 'user1', email: 'test@example.com' } }
      }))

      const { getUserContentPage } = await import('../content-service')
      
      const result = await getUserContentPage({ search: 'test' })
      
      expect(result.data).toEqual(mockData)
      expect(result.total).toBe(1)
      
      // Verify the search query excluded array fields
      const orCall = mockClient.from().select().eq().or
      expect(orCall).toHaveBeenCalledWith(
        'title.ilike.%test%,artist.ilike.%test%,album.ilike.%test%'
      )
      
      vi.resetModules()
    })
  })
}) 