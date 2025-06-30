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
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
        },
        from: vi.fn()
      }
      vi.doMock('../supabase', () => ({
        isSupabaseConfigured: true,
        getSupabaseBrowserClient: () => mockClient,
        getSessionSafe: vi.fn().mockResolvedValue(null),
      }))
      
      // Mock Firebase auth to return no user
      vi.doMock('../firebase', () => ({
        auth: { currentUser: null }
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
        getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
      }))
      
      // Mock Firebase auth to return authenticated user
      vi.doMock('../firebase', () => ({
                  auth: { 
            currentUser: { 
              uid: 'user1', 
              email: 'test@example.com',
              getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
            } 
          }
      }))
      
      const { getUserContent } = await import('../content-service')
      const data = await getUserContent()
      expect(data).toEqual(mockData)
      vi.resetModules()
    })
  })

  describe('getUserContentPage - Search Functionality', () => {

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
          getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
        }))

        // Mock Firebase auth to return authenticated user
        vi.doMock('../firebase', () => ({
          auth: { 
            currentUser: { 
              uid: 'user1', 
              email: 'test@example.com',
              getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
            } 
          }
        }))

        const { getUserContentPage } = await import('../content-service')
        
        await getUserContentPage({ search: 'test search' }, mockClient as any, { id: 'user1' })
        
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
        }

        vi.doMock('../supabase', () => ({
          isSupabaseConfigured: true,
          getSupabaseBrowserClient: () => mockClient,
          getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
        }))

        vi.doMock('../firebase', () => ({
          auth: { 
            currentUser: { 
              uid: 'user1', 
              email: 'test@example.com',
              getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
            } 
          }
        }))

        const { getUserContentPage } = await import('../content-service')

        const result = await getUserContentPage({}, mockClient as any, { id: 'user1' })

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
          getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
        }))

        vi.doMock('../firebase', () => ({
          auth: null
        }))

        const { getUserContentPage } = await import('../content-service')

        await expect(getUserContentPage()).rejects.toThrow('User not authenticated')
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
                   abortSignal: vi.fn().mockReturnThis(),
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
           getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
         }))

         // Mock Firebase auth to return authenticated user
         vi.doMock('../firebase', () => ({
           auth: { 
             currentUser: { 
               uid: 'user1', 
               email: 'test@example.com',
               getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
             } 
           }
         }))

                 const { getUserContentPage } = await import('../content-service')

        const result = await getUserContentPage({}, mockClient as any, { id: 'user1' })
         
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
                    abortSignal: vi.fn().mockReturnThis(),
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
            getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
          }))

          // Mock Firebase auth to return authenticated user
          vi.doMock('../firebase', () => ({
            auth: { 
              currentUser: { 
                uid: 'user1', 
                email: 'test@example.com',
                getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
              } 
            }
          }))
          
          const { getUserContentPage } = await import('../content-service')
          
          await expect(getUserContentPage({}, mockClient as any, { id: 'user1' })).rejects.toThrow(testCase.expectedMessage)
          vi.resetModules()
        }
      })

      describe('Pagination', () => {
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
          }

          vi.doMock('../supabase', () => ({
            isSupabaseConfigured: true,
            getSupabaseBrowserClient: () => mockClient,
            getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
          }))

          // Mock Firebase auth to return authenticated user
          vi.doMock('../firebase', () => ({
            auth: { 
              currentUser: { 
                uid: 'user1', 
                email: 'test@example.com',
                getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
              } 
            }
          }))

          const { getUserContentPage } = await import('../content-service')
          
          // Test invalid page/pageSize bounds
          const result = await getUserContentPage({ page: -1, pageSize: 0 }, mockClient as any, { id: 'user1' })
          
          expect(result.page).toBe(1) // Should default to page 1
          expect(result.pageSize).toBe(1) // Should default to minimum pageSize 1
          
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
            getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
          }))

          // Mock Firebase auth to return authenticated user
          vi.doMock('../firebase', () => ({
            auth: { 
              currentUser: { 
                uid: 'user1', 
                email: 'test@example.com',
                getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
              } 
            }
          }))

          const { getUserContentPage } = await import('../content-service')
          
          await getUserContentPage({ 
            filters: { 
              contentType: ['Lyrics', 'Chord Chart', 'INVALID_TYPE'] 
            } 
          }, mockClient as any, { id: 'user1' })
          
          // Verify the filter was applied correctly, excluding invalid types
          const inCall = mockClient.from().select().eq().in
          expect(inCall).toHaveBeenCalledWith('content_type', ['Lyrics', 'Chord Chart'])
          
          vi.resetModules()
        })
      })

      describe('Sorting', () => {
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
          }

          vi.doMock('../supabase', () => ({
            isSupabaseConfigured: true,
            getSupabaseBrowserClient: () => mockClient,
            getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } }),
          }))

          // Mock Firebase auth to return authenticated user
          vi.doMock('../firebase', () => ({
            auth: { 
              currentUser: { 
                uid: 'user1', 
                email: 'test@example.com',
                getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
              } 
            }
          }))

          const { getUserContentPage } = await import('../content-service')
          
          // Test invalid sort option defaults to 'recent'
          await getUserContentPage({ sortBy: 'invalid_sort' as any }, mockClient as any, { id: 'user1' })
          
          const orderCall = mockClient.from().select().eq().order
          expect(orderCall).toHaveBeenCalledWith('created_at', { ascending: false })

          vi.resetModules()
        })

        it('passes abort signal to the query', async () => {
          const abortSignalFn = vi.fn().mockReturnThis()
          const rangeFn = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
          const mockClient = {
            auth: {
              getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user1' } }, error: null })
            },
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({ abortSignal: abortSignalFn, range: rangeFn })
                })
              })
            })
          }

          vi.doMock('../supabase', () => ({
            isSupabaseConfigured: true,
            getSupabaseBrowserClient: () => mockClient,
            getSessionSafe: vi.fn().mockResolvedValue({ user: { id: 'user1' } })
          }))

          vi.doMock('../firebase', () => ({
            auth: { 
              currentUser: { 
                uid: 'user1', 
                email: 'test@example.com',
                getIdToken: vi.fn().mockResolvedValue('mock-firebase-token')
              } 
            }
          }))

          const { getUserContentPage } = await import('../content-service')
          const controller = new AbortController()
          await getUserContentPage({}, mockClient as any, { id: 'user1' }, controller.signal)

          expect(abortSignalFn).toHaveBeenCalledWith(controller.signal)
          vi.resetModules()
        })
      })
    })
  })
})
