import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Setlist Service', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    vi.resetModules()
    
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis()
    }

    // Mock supabase module
    vi.doMock('../supabase', () => ({
      getSupabaseBrowserClient: () => mockSupabase
    }))

    // Mock firebase module
    vi.doMock('../firebase', () => ({
      auth: {
        currentUser: {
          uid: 'test-user-id',
          email: 'test@example.com'
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

    it('should fetch setlists and content separately to avoid RLS issues', async () => {
      const mockSetlists = [
        { id: 'setlist-1', name: 'Test Setlist', user_id: 'test-user-id' }
      ]
      
      const mockSetlistSongs = [
        { 
          id: 'song-1', 
          setlist_id: 'setlist-1', 
          content_id: 'content-1', 
          position: 1, 
          notes: null 
        }
      ]
      
      const mockContent = [
        { 
          id: 'content-1', 
          title: 'Test Song', 
          artist: 'Test Artist',
          content_type: 'Lyrics'
        }
      ]

      // Mock the database calls
      mockSupabase.from
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              order: vi.fn().mockResolvedValueOnce({
                data: mockSetlists,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              order: vi.fn().mockResolvedValueOnce({
                data: mockSetlistSongs,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockResolvedValueOnce({
                data: mockContent,
                error: null
              })
            })
          })
        })

      const { getUserSetlists } = await import('../setlist-service')
      const result = await getUserSetlists()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Setlist')
      expect(result[0].setlist_songs).toHaveLength(1)
      expect(result[0].setlist_songs[0].content.title).toBe('Test Song')
      expect(result[0].setlist_songs[0].content.artist).toBe('Test Artist')
    })

    it('should handle missing content gracefully', async () => {
      const mockSetlists = [
        { id: 'setlist-1', name: 'Test Setlist', user_id: 'test-user-id' }
      ]
      
      const mockSetlistSongs = [
        { 
          id: 'song-1', 
          setlist_id: 'setlist-1', 
          content_id: 'missing-content', 
          position: 1, 
          notes: null 
        }
      ]

      // Mock the database calls - content query returns empty
      mockSupabase.from
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              order: vi.fn().mockResolvedValueOnce({
                data: mockSetlists,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              order: vi.fn().mockResolvedValueOnce({
                data: mockSetlistSongs,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockResolvedValueOnce({
                data: [], // No content found
                error: null
              })
            })
          })
        })

      const { getUserSetlists } = await import('../setlist-service')
      const result = await getUserSetlists()

      expect(result).toHaveLength(1)
      expect(result[0].setlist_songs).toHaveLength(1)
      expect(result[0].setlist_songs[0].content.title).toBe('Unknown Title')
      expect(result[0].setlist_songs[0].content.artist).toBe('Unknown Artist')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockSupabase,
        select: vi.fn().mockReturnValueOnce({
          ...mockSupabase,
          eq: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            order: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })

      const { getUserSetlists } = await import('../setlist-service')
      const result = await getUserSetlists()
      expect(result).toEqual([])
    })
  })

  describe('getSetlistById', () => {
    it('should fetch a single setlist with songs using robust approach', async () => {
      const mockSetlist = { 
        id: 'setlist-1', 
        name: 'Test Setlist', 
        user_id: 'test-user-id' 
      }
      
      const mockSetlistSongs = [
        { 
          id: 'song-1', 
          setlist_id: 'setlist-1', 
          content_id: 'content-1', 
          position: 1, 
          notes: null 
        }
      ]
      
      const mockContent = [
        { 
          id: 'content-1', 
          title: 'Test Song', 
          artist: 'Test Artist',
          content_type: 'Lyrics'
        }
      ]

      // Mock the database calls
      mockSupabase.from
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockReturnValueOnce({
                ...mockSupabase,
                single: vi.fn().mockResolvedValueOnce({
                  data: mockSetlist,
                  error: null
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              order: vi.fn().mockResolvedValueOnce({
                data: mockSetlistSongs,
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockResolvedValueOnce({
                data: mockContent,
                error: null
              })
            })
          })
        })

      const { getSetlistById } = await import('../setlist-service')
      const result = await getSetlistById('setlist-1')

      expect(result.id).toBe('setlist-1')
      expect(result.name).toBe('Test Setlist')
      expect(result.setlist_songs).toHaveLength(1)
      expect(result.setlist_songs[0].content.title).toBe('Test Song')
    })

    it('should throw error when setlist not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockSupabase,
        select: vi.fn().mockReturnValueOnce({
          ...mockSupabase,
          eq: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        })
      })

      const { getSetlistById } = await import('../setlist-service')
      await expect(getSetlistById('nonexistent')).rejects.toThrow()
    })
  })

  describe('createSetlist', () => {
    it('should create a new setlist successfully', async () => {
      const newSetlist = { name: 'New Setlist', description: 'Test description' }
      const createdSetlist = { 
        id: 'new-setlist-id', 
        ...newSetlist, 
        user_id: 'test-user-id' 
      }

      mockSupabase.from.mockReturnValueOnce({
        ...mockSupabase,
        insert: vi.fn().mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            single: vi.fn().mockResolvedValueOnce({
              data: createdSetlist,
              error: null
            })
          })
        })
      })

      const { createSetlist } = await import('../setlist-service')
      const result = await createSetlist(newSetlist)

      expect(result.id).toBe('new-setlist-id')
      expect(result.name).toBe('New Setlist')
      expect(result.setlist_songs).toEqual([])
    })

    it('should throw error when creation fails', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockSupabase,
        insert: vi.fn().mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Creation failed' }
            })
          })
        })
      })

      const { createSetlist } = await import('../setlist-service')
      await expect(createSetlist({ name: 'Test' })).rejects.toThrow()
    })
  })

  describe('addSongToSetlist (with validateContentExists mocked)', () => {
    afterEach(() => {
      vi.resetModules()
      vi.unmock('../setlist-validation')
    })
    it('should add a song to setlist with proper position handling', async () => {
      vi.resetModules()
      vi.doMock('../setlist-validation', async () => {
        const actual = await vi.importActual('../setlist-validation')
        return {
          ...actual,
          validateContentExists: vi.fn().mockResolvedValue(true)
        }
      })
      // Mock for .from('setlists').select().eq().eq().single()
      const singleMock = vi.fn().mockResolvedValue({ data: { id: 'setlist-1', user_id: 'test-user-id' }, error: null })
      const eq2Mock = vi.fn().mockReturnValue({ single: singleMock })
      const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock })
      const selectMockSetlist = vi.fn().mockReturnValue({ eq: eq1Mock })
      // Mock for .from('setlist_songs').select().eq().gte().order()
      const orderMock = vi.fn().mockResolvedValue({ data: [], error: null })
      const gteMock = vi.fn().mockReturnValue({ order: orderMock })
      const eqSongsMock = vi.fn().mockReturnValue({ gte: gteMock })
      const selectMockSongs = vi.fn().mockReturnValue({ eq: eqSongsMock })
      // Mock for .from('setlist_songs').insert().select().single()
      const singleInsertMock = vi.fn().mockResolvedValue({ data: { id: 'new-song-id', position: 1 }, error: null })
      const selectInsertMock = vi.fn().mockReturnValue({ single: singleInsertMock })
      const insertMock = vi.fn().mockReturnValue({ select: selectInsertMock })
      // Setup mockSupabase.from to return the correct chain based on table name
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'setlists') {
          return { select: selectMockSetlist }
        } else if (table === 'setlist_songs') {
          return { select: selectMockSongs, insert: insertMock }
        }
        return {}
      })

      const { addSongToSetlist } = await import('../setlist-service')
      const result = await addSongToSetlist('setlist-1', 'content-1', 1)
      expect(result.id).toBe('new-song-id')
      expect(result.position).toBe(1)
    })
  })

  describe('addSongToSetlist', () => {
    it('should validate content exists before adding to setlist', async () => {
      vi.resetModules()
      vi.doMock('../supabase', async () => {
        const singleMock = vi.fn().mockResolvedValue({ data: { id: 'content-1' }, error: null })
        const eq2Mock = vi.fn().mockReturnValue({ single: singleMock })
        const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock })
        const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock })
        const mockSupabase = { from: vi.fn((table: string) => {
          if (table === 'content') {
            return { select: selectMock }
          }
          return {}
        }) }
        return { getSupabaseBrowserClient: () => mockSupabase }
      })
      const { validateContentExists } = await import('../setlist-validation')
      const exists = await validateContentExists('content-1', 'test-user-id')
      expect(exists).toBe(true)
    })

    it('should return false for non-existent content', async () => {
      vi.resetModules()
      vi.doMock('../supabase', async () => {
        const singleMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
        const eq2Mock = vi.fn().mockReturnValue({ single: singleMock })
        const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock })
        const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock })
        const mockSupabase = { from: vi.fn((table: string) => {
          if (table === 'content') {
            return { select: selectMock }
          }
          return {}
        }) }
        return { getSupabaseBrowserClient: () => mockSupabase }
      })
      const { validateContentExists } = await import('../setlist-validation')
      const exists = await validateContentExists('nonexistent', 'test-user-id')
      expect(exists).toBe(false)
    })
  })

  describe('Integrity Validation', () => {
    it('should detect orphaned setlist songs', async () => {
      vi.resetModules()
      // Mock setlist songs: one with valid content, one orphaned
      const mockSetlistSongs = [
        {
          id: 'song-1',
          content_id: 'content-1',
          setlists: { id: 'setlist-1', user_id: 'test-user-id' }
        },
        {
          id: 'song-2',
          content_id: 'missing-content',
          setlists: { id: 'setlist-1', user_id: 'test-user-id' }
        }
      ]
      const mockExistingContent = [
        { id: 'content-1' }
      ]
      mockSupabase.from
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockResolvedValueOnce({
              data: mockSetlistSongs,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockResolvedValueOnce({
                data: mockExistingContent,
                error: null
              })
            })
          })
        })
      const { validateSetlistIntegrity } = await import('../setlist-validation')
      const result = await validateSetlistIntegrity('test-user-id')
      expect(result.isValid).toBe(false)
      expect(result.orphanedSongs).toHaveLength(1)
      expect(result.orphanedSongs[0].id).toBe('song-2')
      expect(result.missingContent).toContain('missing-content')
    })

    it('should return valid result when no orphaned songs exist', async () => {
      vi.resetModules()
      const mockSetlistSongs = [
        {
          id: 'song-1',
          content_id: 'content-1',
          setlists: { id: 'setlist-1', user_id: 'test-user-id' }
        }
      ]
      const mockExistingContent = [
        { id: 'content-1' }
      ]
      mockSupabase.from
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockResolvedValueOnce({
              data: mockSetlistSongs,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockResolvedValueOnce({
                data: mockExistingContent,
                error: null
              })
            })
          })
        })
      const { validateSetlistIntegrity } = await import('../setlist-validation')
      const result = await validateSetlistIntegrity('test-user-id')
      expect(result.isValid).toBe(true)
      expect(result.orphanedSongs).toHaveLength(0)
      expect(result.missingContent).toHaveLength(0)
    })
  })
})
