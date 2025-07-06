import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentRecord } from '../content-service'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }
}))

describe('Content Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserContent', () => {
    it('returns empty array when user not authenticated', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
      }
      
      // Mock Firebase server utils to return no user
      vi.doMock('../firebase-server-utils', () => ({
        getServerSideUser: vi.fn().mockResolvedValue(null)
      }))
      
      const { getUserContent } = await import('../content-service')
      const data = await getUserContent(mockClient as unknown as SupabaseClient)
      expect(data).toEqual([])
      vi.resetModules()
    })

    it('returns user content when authenticated', async () => {
      const mockData = [
        { id: '1', title: 'Test Song', artist: 'Test Artist', user_id: 'user1' }
      ]
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null
              })
            })
          })
        })
      }
      
      // Mock Firebase server utils to return authenticated user
      vi.doMock('../firebase-server-utils', () => ({
        getServerSideUser: vi.fn().mockResolvedValue({ 
          uid: 'user1', 
          email: 'test@example.com' 
        })
      }))
      
      const { getUserContent } = await import('../content-service')
      const data = await getUserContent(mockClient as unknown as SupabaseClient, { id: 'user1', email: 'test@example.com' })
      expect(data).toEqual(mockData)
      vi.resetModules()
    })
  })

  describe('getUserContentPage - Search Functionality', () => {
    describe('Server Mode', () => {
      it('constructs correct search query without array fields', async () => {
        const mockClient = {
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

        // Mock Firebase server utils to return authenticated user
        vi.doMock('../firebase-server-utils', () => ({
          getServerSideUser: vi.fn().mockResolvedValue({ 
            uid: 'user1', 
            email: 'test@example.com' 
          })
        }))

        const { getUserContentPage } = await import('../content-service')
        
        await getUserContentPage({ search: 'test search' }, mockClient as any, { id: 'user1', email: 'test@example.com' })
        
        // Verify the query was constructed correctly
        expect(mockClient.from).toHaveBeenCalledWith('content')
        
        // Check that the OR condition was called with the correct search pattern
        const orCall = mockClient.from().select().eq().or
        expect(orCall).toHaveBeenCalledWith(
          'title.ilike.%test search%,artist.ilike.%test search%,album.ilike.%test search%'
        )
        
        vi.resetModules()
      })

      it('handles database errors gracefully', async () => {
        const mockClient = {
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

        // Mock Firebase server utils to return authenticated user
        vi.doMock('../firebase-server-utils', () => ({
          getServerSideUser: vi.fn().mockResolvedValue({ 
            uid: 'user1', 
            email: 'test@example.com' 
          })
        }))

        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ search: 'test' }, mockClient as any, { id: 'user1', email: 'test@example.com' })
        
        expect(result.data).toEqual([])
        expect(result.total).toBe(0)
        
        vi.resetModules()
      })
    })
  })

  describe('Server-side operations', () => {
    it('getUserContentServer uses service role client', async () => {
      const mockServiceClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: '1', title: 'Test' }],
                error: null
              })
            })
          })
        })
      }

      vi.doMock('../supabase-service', () => ({
        getSupabaseServiceClient: vi.fn().mockReturnValue(mockServiceClient)
      }))

      vi.doMock('../firebase-server-utils', () => ({
        getServerSideUser: vi.fn().mockResolvedValue({ 
          uid: 'user1', 
          email: 'test@example.com' 
        })
      }))

      const { getUserContentServer } = await import('../content-service-server')
      
      // Mock cookie store
      const mockCookieStore = {} as any
      
      const result = await getUserContentServer(mockCookieStore)
      
      expect(result).toEqual([{ id: '1', title: 'Test' }])
      expect(mockServiceClient.from).toHaveBeenCalledWith('content')
      
      vi.resetModules()
    })

    it('getContentByIdServer uses service role client', async () => {
      const mockServiceClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: '1', title: 'Test Song' },
                  error: null
                })
              })
            })
          })
        })
      }

      vi.doMock('../supabase-service', () => ({
        getSupabaseServiceClient: vi.fn().mockReturnValue(mockServiceClient)
      }))

      vi.doMock('../firebase-server-utils', () => ({
        getServerSideUser: vi.fn().mockResolvedValue({ 
          uid: 'user1', 
          email: 'test@example.com' 
        })
      }))

      const { getContentByIdServer } = await import('../content-service-server')
      
      const mockCookieStore = {} as any
      
      const result = await getContentByIdServer('1', mockCookieStore)
      
      expect(result).toEqual({ id: '1', title: 'Test Song' })
      expect(mockServiceClient.from).toHaveBeenCalledWith('content')
      
      vi.resetModules()
    })
  })
})
