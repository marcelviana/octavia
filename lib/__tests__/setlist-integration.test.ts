import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Setlist Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    
    // Create comprehensive mock Supabase client
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
          uid: 'integration-test-user',
          email: 'test@integration.com'
        }
      }
    }))
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('End-to-End Setlist Operations', () => {
    it('should handle complete setlist workflow with proper content resolution', async () => {
      const { getUserSetlists } = await import('../setlist-service')
      // Mock data representing a real scenario
      const mockSetlists = [
        { 
          id: 'setlist-123', 
          name: 'My Concert Setlist', 
          user_id: 'integration-test-user',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
      
      const mockSetlistSongs = [
        { 
          id: 'song-1', 
          setlist_id: 'setlist-123', 
          content_id: 'content-abc', 
          position: 1, 
          notes: 'Opening song' 
        },
        { 
          id: 'song-2', 
          setlist_id: 'setlist-123', 
          content_id: 'content-def', 
          position: 2, 
          notes: null 
        }
      ]
      
      const mockContent = [
        { 
          id: 'content-abc', 
          title: 'Amazing Grace', 
          artist: 'Traditional',
          content_type: 'Lyrics',
          key: 'G',
          bpm: 80
        },
        { 
          id: 'content-def', 
          title: 'How Great Thou Art', 
          artist: 'Carl Boberg',
          content_type: 'Chord Chart',
          key: 'C',
          bpm: 72
        }
      ]

      // Mock the sequential database calls that getUserSetlists makes
      mockSupabase.from
        // First call: get setlists
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
        // Second call: get setlist_songs
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
        // Third call: get content
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

      const result = await getUserSetlists()

      // Verify the complete workflow
      expect(result).toHaveLength(1)
      
      const setlist = result[0]
      expect(setlist.name).toBe('My Concert Setlist')
      expect(setlist.setlist_songs).toHaveLength(2)
      
      // Verify first song has correct content
      const firstSong = setlist.setlist_songs[0]
      expect(firstSong.content.title).toBe('Amazing Grace')
      expect(firstSong.content.artist).toBe('Traditional')
      expect(firstSong.content.key).toBe('G')
      expect(firstSong.notes).toBe('Opening song')
      
      // Verify second song has correct content
      const secondSong = setlist.setlist_songs[1]
      expect(secondSong.content.title).toBe('How Great Thou Art')
      expect(secondSong.content.artist).toBe('Carl Boberg')
      expect(secondSong.content.key).toBe('C')
      
      // Verify no "Unknown" fallbacks were used
      expect(firstSong.content.title).not.toBe('Unknown Title')
      expect(firstSong.content.artist).not.toBe('Unknown Artist')
      expect(secondSong.content.title).not.toBe('Unknown Title')
      expect(secondSong.content.artist).not.toBe('Unknown Artist')
    })

    it('should gracefully handle missing content and use fallbacks', async () => {
      const { getUserSetlists } = await import('../setlist-service')
      const mockSetlists = [
        { 
          id: 'setlist-456', 
          name: 'Problematic Setlist', 
          user_id: 'integration-test-user'
        }
      ]
      
      const mockSetlistSongs = [
        { 
          id: 'song-orphaned', 
          setlist_id: 'setlist-456', 
          content_id: 'missing-content-id', 
          position: 1, 
          notes: null 
        }
      ]

      // Mock calls where content is missing
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

      const result = await getUserSetlists()

      expect(result).toHaveLength(1)
      
      const setlist = result[0]
      expect(setlist.setlist_songs).toHaveLength(1)
      
      const orphanedSong = setlist.setlist_songs[0]
      expect(orphanedSong.content.title).toBe('Unknown Title')
      expect(orphanedSong.content.artist).toBe('Unknown Artist')
      expect(orphanedSong.content.content_type).toBe('Unknown Type')
      expect(orphanedSong.content_id).toBe('missing-content-id')
    })
  })

  describe('Data Integrity Validation', () => {
    it('should detect and report orphaned songs correctly', async () => {
      const { validateSetlistIntegrity } = await import('../setlist-validation')
      const mockSetlistSongs = [
        { 
          id: 'valid-song', 
          content_id: 'existing-content',
          setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
        },
        { 
          id: 'orphaned-song-1', 
          content_id: 'deleted-content-1',
          setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
        },
        { 
          id: 'orphaned-song-2', 
          content_id: 'deleted-content-2',
          setlists: { id: 'setlist-2', user_id: 'integration-test-user' }
        }
      ]
      
      const mockExistingContent = [
        { id: 'existing-content' }
        // Note: deleted-content-1 and deleted-content-2 are missing
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

      const validation = await validateSetlistIntegrity('integration-test-user')

      expect(validation.isValid).toBe(false)
      expect(validation.orphanedSongs).toHaveLength(2)
      expect(validation.missingContent).toHaveLength(2)
      expect(validation.missingContent).toContain('deleted-content-1')
      expect(validation.missingContent).toContain('deleted-content-2')
      expect(validation.errors).toHaveLength(0)
    })

    it('should successfully clean up orphaned songs', async () => {
      const { cleanupOrphanedSongs } = await import('../setlist-validation')
      // First, mock the validation call
      const mockOrphanedSongs = [
        { 
          id: 'orphaned-1', 
          content_id: 'missing-1',
          setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
        },
        { 
          id: 'orphaned-2', 
          content_id: 'missing-2',
          setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
        }
      ]

      mockSupabase.from
        // Validation calls
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockResolvedValueOnce({
              data: mockOrphanedSongs,
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
                data: [], // No existing content
                error: null
              })
            })
          })
        })
        // Cleanup call
        .mockReturnValueOnce({
          ...mockSupabase,
          delete: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            in: vi.fn().mockResolvedValueOnce({
              error: null
            })
          })
        })

      const cleanup = await cleanupOrphanedSongs('integration-test-user')

      expect(cleanup.success).toBe(true)
      expect(cleanup.removedCount).toBe(2)
      expect(cleanup.errors).toHaveLength(0)
    })
  })

  describe('Content Validation Before Adding to Setlist', () => {
    it('should prevent adding non-existent content to setlist', async () => {
      const { addSongToSetlist } = await import('../setlist-service')
      // Mock content validation to return false
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

      // Attempt to add non-existent content should fail
      await expect(
        addSongToSetlist('setlist-123', 'non-existent-content', 1)
      ).rejects.toThrow('Content with ID non-existent-content does not exist or does not belong to user')
    })

    it('should successfully add existing content to setlist', async () => {
      const { addSongToSetlist } = await import('../setlist-service')
      const mockSetlist = { id: 'setlist-123' }
      const mockNewSong = { 
        id: 'new-song-id', 
        setlist_id: 'setlist-123', 
        content_id: 'valid-content', 
        position: 1 
      }

      mockSupabase.from
        // Content validation
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              eq: vi.fn().mockReturnValueOnce({
                ...mockSupabase,
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: 'valid-content' },
                  error: null
                })
              })
            })
          })
        })
        // Setlist ownership verification
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
        // Position shifting queries
        .mockReturnValueOnce({
          ...mockSupabase,
          select: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            eq: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              gte: vi.fn().mockReturnValueOnce({
                ...mockSupabase,
                order: vi.fn().mockResolvedValueOnce({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
        // Insert new song
        .mockReturnValueOnce({
          ...mockSupabase,
          insert: vi.fn().mockReturnValueOnce({
            ...mockSupabase,
            select: vi.fn().mockReturnValueOnce({
              ...mockSupabase,
              single: vi.fn().mockResolvedValueOnce({
                data: mockNewSong,
                error: null
              })
            })
          })
        })

      const result = await addSongToSetlist('setlist-123', 'valid-content', 1)

      expect(result.id).toBe('new-song-id')
      expect(result.content_id).toBe('valid-content')
      expect(result.position).toBe(1)
    })
  })
})
