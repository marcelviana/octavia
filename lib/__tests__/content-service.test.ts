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
    it('returns mock content when Supabase is not configured', async () => {
      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: false,
        getSupabaseBrowserClient: vi.fn(),
      }))
      const { getUserContent } = await import('../content-service')
      const result = await getUserContent()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0].id).toBe('mock-1')
      expect(result[0].title).toBe('Wonderwall')
      vi.resetModules()
    })

    it('returns empty array when user not authenticated', async () => {
      const mockClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
        },
        from: vi.fn()
      }
      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))
      const { getUserContent } = await import('../content-service')
      const data = await getUserContent()
      expect(data).toEqual([])
      vi.resetModules()
    })

    it('returns user content when authenticated', async () => {
      const mockData = [
        { id: '1', title: 'Test Song', artist: 'Test Artist', user_id: 'user1' }
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
              order: vi.fn().mockResolvedValue({
                data: mockData,
                error: null
              })
            })
          })
        })
      }
      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
      }))
      const { getUserContent } = await import('../content-service')
      const data = await getUserContent()
      expect(data).toEqual(mockData)
      vi.resetModules()
    })
  })

  describe('getUserContentPage - Search Functionality', () => {
    describe('Demo Mode', () => {
      it('searches by title in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ search: 'wonderwall' })
        
        expect(result.data).toHaveLength(1)
        expect(result.data[0].title).toBe('Wonderwall')
        expect(result.total).toBe(1)
        vi.resetModules()
      })

      it('searches by artist in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ search: 'oasis' })
        
        expect(result.data).toHaveLength(1)
        expect(result.data[0].artist).toBe('Oasis')
        vi.resetModules()
      })

      it('performs case-insensitive search in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ search: 'WONDERWALL' })
        
        expect(result.data).toHaveLength(1)
        expect(result.data[0].title).toBe('Wonderwall')
        vi.resetModules()
      })

      it('returns empty results for non-matching search in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ search: 'nonexistent' })
        
        expect(result.data).toHaveLength(0)
        expect(result.total).toBe(0)
        vi.resetModules()
      })
    })

    describe('Database Mode', () => {
      it('constructs correct search query without array fields', async () => {
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

        const { getUserContentPage } = await import('../content-service')
        
        await getUserContentPage({ search: 'test search' })
        
        // Verify the query was constructed correctly
        expect(mockClient.from).toHaveBeenCalledWith('content')
        
        // Check that the OR condition was called with the correct search pattern
        const orCall = mockClient.from().select().eq().or
        expect(orCall).toHaveBeenCalledWith(
          'title.ilike.%test search%,artist.ilike.%test search%,album.ilike.%test search%'
        )
        
        vi.resetModules()
      })

      it('handles authentication retry logic', async () => {
        let authAttempts = 0
        const mockClient = {
          auth: {
            getUser: vi.fn().mockImplementation(() => {
              authAttempts++
              if (authAttempts <= 2) {
                return Promise.reject(new Error('Auth error'))
              }
              return Promise.resolve({ 
                data: { user: { id: 'user1' } }, 
                error: null 
              })
            })
          },
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
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

        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage()
        
        expect(mockClient.auth.getUser).toHaveBeenCalledTimes(3)
        expect(result.data).toEqual([])
        vi.resetModules()
      })

      it('throws error after max authentication attempts', async () => {
        const mockClient = {
          auth: {
            getUser: vi.fn().mockRejectedValue(new Error('Persistent auth error'))
          }
        }

        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: true,
          getSupabaseBrowserClient: () => mockClient,
        }))

        const { getUserContentPage } = await import('../content-service')
        
        await expect(getUserContentPage()).rejects.toThrow('Authentication failed. Please log in again.')
        expect(mockClient.auth.getUser).toHaveBeenCalledTimes(3)
        vi.resetModules()
      })

             it('handles database query timeout', async () => {
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
                 order: vi.fn().mockReturnValue({
                   range: vi.fn().mockImplementation(() => 
                     new Promise((resolve) => {
                       // Simulate a query that takes longer than the timeout (16 seconds > 15 second timeout)
                       setTimeout(() => resolve({ data: [], error: null, count: 0 }), 16000)
                     })
                   )
                 })
               })
             })
           })
         }

         vi.doMock('../supabase', () => ({
           isSupabaseConfigured: true,
           getSupabaseBrowserClient: () => mockClient,
         }))

         const { getUserContentPage } = await import('../content-service')
         
         const result = await getUserContentPage()
         
         expect(result.error).toBe('Request timed out - please try again')
         expect(result.data).toEqual([])
         vi.resetModules()
       }, 20000) // Set test timeout to 20 seconds

      it('handles specific database errors with helpful messages', async () => {
        const testCases = [
          {
            error: { message: 'relation "content" does not exist' },
            expectedMessage: 'Database tables not set up. Please run the setup process.'
          },
          {
            error: { message: 'permission denied for table content' },
            expectedMessage: 'Database access denied. Please check your permissions.'
          },
          {
            error: { message: 'operator does not exist: text[] ~~* unknown' },
            expectedMessage: 'Database error: operator does not exist: text[] ~~* unknown'
          }
        ]

        for (const testCase of testCases) {
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
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: null,
                      error: testCase.error,
                      count: null
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

          const { getUserContentPage } = await import('../content-service')
          
          await expect(getUserContentPage()).rejects.toThrow(testCase.expectedMessage)
          vi.resetModules()
        }
      })
    })

    describe('Pagination', () => {
      it('handles pagination correctly in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const page1 = await getUserContentPage({ page: 1, pageSize: 2 })
        const page2 = await getUserContentPage({ page: 2, pageSize: 2 })
        
        expect(page1.data).toHaveLength(2)
        expect(page2.data).toHaveLength(2)
        expect(page1.data[0].id).not.toBe(page2.data[0].id)
        expect(page1.hasMore).toBe(true)
        expect(page1.totalPages).toBeGreaterThan(1)
        vi.resetModules()
      })

      it('validates pagination bounds', async () => {
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
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
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

        const { getUserContentPage } = await import('../content-service')
        
        // Test negative page number
        await getUserContentPage({ page: -1, pageSize: 10 })
        
        // Test excessive page size
        await getUserContentPage({ page: 1, pageSize: 200 })
        
        // Verify the range was called with safe bounds
        const rangeCall = mockClient.from().select().eq().order().range
        expect(rangeCall).toHaveBeenCalledWith(0, 9) // page 1, size 10 (clamped from -1)
        expect(rangeCall).toHaveBeenCalledWith(0, 99) // page 1, size 100 (clamped from 200)
        
        vi.resetModules()
      })
    })

    describe('Filtering', () => {
      it('applies content type filters correctly', async () => {
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
                in: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
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

        const { getUserContentPage } = await import('../content-service')
        
        await getUserContentPage({ 
          filters: { 
            contentType: ['LYRICS', 'CHORDS', 'INVALID_TYPE'] 
          } 
        })
        
        // Verify only valid types are used
        expect(mockClient.from().select().eq().in).toHaveBeenCalledWith(
          'content_type', 
          ['LYRICS', 'CHORDS']
        )
        vi.resetModules()
      })

      it('applies difficulty filters correctly', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ 
          filters: { 
            difficulty: ['INTERMEDIATE'] 
          } 
        })
        
                 // In demo mode, this should filter the mock data
         expect(result.data.every((item: ContentRecord) => 
           item.content_data?.difficulty === 'Intermediate'
         )).toBe(true)
        vi.resetModules()
      })

      it('applies favorite filter correctly', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result = await getUserContentPage({ 
          filters: { 
            favorite: true 
          } 
        })
        
                 expect(result.data.every((item: ContentRecord) => item.is_favorite)).toBe(true)
        vi.resetModules()
      })
    })

    describe('Sorting', () => {
      it('applies sorting correctly in demo mode', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const titleSort = await getUserContentPage({ sortBy: 'title' })
        const artistSort = await getUserContentPage({ sortBy: 'artist' })
        
                 // Verify title sorting
         const titles = titleSort.data.map((item: ContentRecord) => item.title)
         const sortedTitles = [...titles].sort()
         expect(titles).toEqual(sortedTitles)
         
         // Verify artist sorting
         const artists = artistSort.data.map((item: ContentRecord) => item.artist || '')
         const sortedArtists = [...artists].sort()
         expect(artists).toEqual(sortedArtists)
        
        vi.resetModules()
      })

      it('validates sort options in database mode', async () => {
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
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
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

        const { getUserContentPage } = await import('../content-service')
        
        // Test valid sort option
        await getUserContentPage({ sortBy: 'title' })
        expect(mockClient.from().select().eq().order).toHaveBeenCalledWith('title', { ascending: true })
        
        // Test invalid sort option (should default to recent)
        await getUserContentPage({ sortBy: 'invalid' as any })
        expect(mockClient.from().select().eq().order).toHaveBeenCalledWith('created_at', { ascending: false })
        
        vi.resetModules()
      })
    })

    describe('Caching', () => {
      it('caches successful results', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        // First call
        const result1 = await getUserContentPage({ search: 'test' })
        
        // Second call with same params should use cache
        const result2 = await getUserContentPage({ search: 'test' })
        
        expect(result1).toEqual(result2)
        vi.resetModules()
      })

      it('respects cache disable option', async () => {
        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: false,
          getSupabaseBrowserClient: vi.fn(),
        }))
        const { getUserContentPage } = await import('../content-service')
        
        const result1 = await getUserContentPage({ search: 'test', useCache: false })
        const result2 = await getUserContentPage({ search: 'test', useCache: false })
        
        // Results should be the same but not from cache
        expect(result1).toEqual(result2)
        vi.resetModules()
      })
    })
  })
})
