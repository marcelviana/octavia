import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock logger to avoid console output during tests
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

// Mock fetch globally for any remaining API calls
const mockFetch = vi.fn()
;(global as any).fetch = mockFetch

describe('Setlist Integration Tests', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    
    // Create comprehensive mock Supabase client for service role operations
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

    // Mock supabase service module (server-side)
    vi.doMock('../supabase-service', () => ({
      getSupabaseServiceClient: () => mockSupabase
    }))

    // Mock firebase server utils
    vi.doMock('../firebase-server-utils', () => ({
      getServerSideUser: vi.fn().mockResolvedValue({
        uid: 'integration-test-user',
        email: 'test@integration.com'
      })
    }))

    // Mock firebase client for any remaining client-side calls
    vi.doMock('../firebase', () => ({
      auth: {
        currentUser: {
          uid: 'integration-test-user',
          email: 'test@integration.com',
          getIdToken: vi.fn().mockResolvedValue('mock-token')
        }
      }
    }))

    // Mock fetch to return successful responses by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([])
    })
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('End-to-End Setlist Operations', () => {
    it('should handle complete setlist workflow with proper content resolution', async () => {
      const { getUserSetlists } = await import('../setlist-service')
      
      // Mock successful API response for the service layer
      const mockSetlists = [
        { 
          id: 'setlist-123', 
          name: 'My Concert Setlist', 
          user_id: 'integration-test-user',
          created_at: '2024-01-01T00:00:00Z',
          setlist_songs: [
            {
              id: 'song-1',
              content: {
                id: 'content-abc',
                title: 'Amazing Grace',
                artist: 'Traditional',
                content_type: 'Lyrics',
                key: 'G',
                bpm: 80
              },
              notes: 'Opening song'
            },
            {
              id: 'song-2',
              content: {
                id: 'content-def',
                title: 'How Great Thou Art',
                artist: 'Carl Boberg',
                content_type: 'Chord Chart',
                key: 'C',
                bpm: 72
              },
              notes: null
            }
          ]
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSetlists)
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
          user_id: 'integration-test-user',
          setlist_songs: [
            {
              id: 'song-orphaned',
              content: {
                id: 'missing-content-id',
                title: 'Unknown Title',
                artist: 'Unknown Artist',
                content_type: 'Unknown Type'
              },
              notes: null
            }
          ]
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSetlists)
      })

      const result = await getUserSetlists()

      expect(result).toHaveLength(1)
      const setlist = result[0]
      expect(setlist.setlist_songs).toHaveLength(1)
      
      // Verify fallback content is used
      const orphanedSong = setlist.setlist_songs[0]
      expect(orphanedSong.content.title).toBe('Unknown Title')
      expect(orphanedSong.content.artist).toBe('Unknown Artist')
      expect(orphanedSong.content.content_type).toBe('Unknown Type')
    })
  })

  describe('Data Integrity Validation', () => {
    it('should detect and report orphaned songs correctly', async () => {
      const { validateSetlistIntegrity } = await import('../setlist-validation')
      
      // Mock the database calls for validation
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'song-1',
                  content_id: 'deleted-content-1',
                  setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
                },
                {
                  id: 'song-2',
                  content_id: 'deleted-content-2',
                  setlists: { id: 'setlist-1', user_id: 'integration-test-user' }
                }
              ],
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [], // No content found for the orphaned songs
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
    })

    it('should successfully clean up orphaned songs', async () => {
      const { cleanupOrphanedSongs } = await import('../setlist-validation')
      
      // Mock successful cleanup operations
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { id: 'song-1', content_id: 'deleted-content-1' },
                { id: 'song-2', content_id: 'deleted-content-2' }
              ],
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: null,
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
      
      // Mock API error for non-existent content
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: 'Content with ID non-existent-content does not exist or does not belong to user'
        })
      })

      // Attempt to add non-existent content should fail
      await expect(
        addSongToSetlist('setlist-123', 'non-existent-content', 1)
      ).rejects.toThrow('Content with ID non-existent-content does not exist or does not belong to user')
    })

    it('should successfully add existing content to setlist', async () => {
      const { addSongToSetlist } = await import('../setlist-service')
      
      const mockResponse = {
        id: 'new-song-id',
        setlist_id: 'setlist-123',
        content_id: 'existing-content',
        position: 1,
        notes: ''
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      })

      const result = await addSongToSetlist('setlist-123', 'existing-content', 1)

      expect(result.id).toBe('new-song-id')
      expect(result.setlist_id).toBe('setlist-123')
      expect(result.content_id).toBe('existing-content')
      expect(result.position).toBe(1)
    })
  })
})
