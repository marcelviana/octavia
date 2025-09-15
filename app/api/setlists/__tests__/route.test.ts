import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Create a comprehensive mock for Supabase query builder
let mockQueryResult = { data: [], error: null }

const createMockQueryBuilder = () => {
  const builder: any = {}
  
  builder.select = vi.fn().mockReturnValue(builder)
  builder.insert = vi.fn().mockReturnValue(builder)
  builder.update = vi.fn().mockReturnValue(builder)
  builder.delete = vi.fn().mockReturnValue(builder)
  builder.eq = vi.fn().mockReturnValue(builder)
  builder.neq = vi.fn().mockReturnValue(builder)
  builder.in = vi.fn().mockReturnValue(builder)
  builder.order = vi.fn().mockReturnValue(builder)
  builder.limit = vi.fn().mockReturnValue(builder)
  builder.single = vi.fn().mockResolvedValue(mockQueryResult)
  builder.maybeSingle = vi.fn().mockResolvedValue(mockQueryResult)
  
  // Make builder awaitable for direct await on queries
  builder.then = vi.fn().mockImplementation((resolve) => {
    return Promise.resolve(mockQueryResult).then(resolve)
  })
  
  return builder
}

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => createMockQueryBuilder())
}

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => mockSupabaseClient
}))

// Mock Firebase server utils
vi.mock('@/lib/firebase-server-utils', () => ({
  requireAuthServer: vi.fn()
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn()
  }
}))

// Import the actual route handlers after mocks
import { GET, POST } from '../route'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import logger from '@/lib/logger'

// Get mocked functions for type safety
const mockRequireAuthServer = vi.mocked(requireAuthServer)
const mockLogger = vi.mocked(logger)

describe('/api/setlists', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset default mock result
    mockQueryResult = { data: [], error: null }
  })

  describe('GET /api/setlists', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns empty array when user has no setlists', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockQueryResult = { data: [], error: null }

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('returns setlists with songs for authenticated user', async () => {
      const mockSetlist = {
        id: 'setlist-1',
        name: 'Test Setlist',
        description: 'A test setlist',
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockSetlistSongs = [
        {
          id: 'song-1',
          setlist_id: 'setlist-1',
          content_id: 'content-1',
          position: 1,
          notes: 'Opening song'
        }
      ]

      const mockContent = [
        {
          id: 'content-1',
          title: 'Wonderwall',
          artist: 'Oasis',
          content_type: 'Chords',
          key: 'Em',
          bpm: 87,
          file_url: 'http://example.com/wonderwall.pdf',
          content_data: null
        }
      ]

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Mock sequential query calls
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          // First call: setlists query
          builder.then.mockResolvedValue({ data: [mockSetlist], error: null })
        } else if (callCount === 1) {
          // Second call: setlist_songs query
          builder.then.mockResolvedValue({ data: mockSetlistSongs, error: null })
        } else {
          // Third call: content query
          builder.then.mockResolvedValue({ data: mockContent, error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: 'setlist-1',
        name: 'Test Setlist',
        setlist_songs: expect.arrayContaining([
          expect.objectContaining({
            id: 'song-1',
            position: 1,
            notes: 'Opening song',
            content: expect.objectContaining({
              title: 'Wonderwall',
              artist: 'Oasis'
            })
          })
        ])
      })
    })

    it('handles missing content gracefully', async () => {
      const mockSetlist = {
        id: 'setlist-1',
        name: 'Test Setlist',
        user_id: mockUser.uid
      }

      const mockSetlistSongs = [
        {
          id: 'song-1',
          setlist_id: 'setlist-1', 
          content_id: 'missing-content-id',
          position: 1,
          notes: null
        }
      ]

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.then.mockResolvedValue({ data: [mockSetlist], error: null })
        } else if (callCount === 1) {
          builder.then.mockResolvedValue({ data: mockSetlistSongs, error: null })
        } else {
          builder.then.mockResolvedValue({ data: [], error: null }) // No content found
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].setlist_songs[0].content).toEqual({
        id: 'missing-content-id',
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        content_type: 'Unknown Type',
        key: null,
        bpm: null,
        file_url: null,
        content_data: null
      })
    })

    it('handles database errors gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.then.mockResolvedValue({ data: null, error: { message: 'Database error' } })
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles setlist songs query errors gracefully', async () => {
      const mockSetlist = {
        id: 'setlist-1',
        name: 'Test Setlist',
        user_id: mockUser.uid
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.then.mockResolvedValue({ data: [mockSetlist], error: null })
        } else {
          builder.then.mockResolvedValue({ data: null, error: { message: 'Songs query error' } })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].setlist_songs).toEqual([])
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching songs for setlist'),
        expect.objectContaining({ message: 'Songs query error' })
      )
    })
  })

  describe('POST /api/setlists', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Setlist' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('creates a setlist successfully with minimal data', async () => {
      const mockSetlist = {
        id: 'setlist-123',
        name: 'New Setlist',
        description: null,
        performance_date: null,
        venue: null,
        notes: null,
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: mockSetlist, error: null })
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Setlist' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'setlist-123',
        name: 'New Setlist',
        setlist_songs: []
      })
    })

    it('creates a setlist successfully with full data', async () => {
      const setlistInput = {
        name: 'Concert Setlist',
        description: 'Main show setlist',
        performance_date: '2024-06-15T20:00:00Z',
        venue: 'Madison Square Garden',
        notes: 'Remember to tune down half step'
      }

      const mockSetlist = {
        id: 'setlist-456',
        ...setlistInput,
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: mockSetlist, error: null })
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify(setlistInput)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'setlist-456',
        name: 'Concert Setlist',
        description: 'Main show setlist',
        venue: 'Madison Square Garden',
        setlist_songs: []
      })
    })

    it('handles invalid JSON request body', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: 'invalid json{'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles database errors during creation', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: null, error: { message: 'Database error' } })
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Setlist' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating setlist:',
        expect.objectContaining({ message: 'Database error' })
      )
    })

    it('handles missing name field gracefully', async () => {
      const mockSetlist = { 
        id: 'test-id', 
        name: undefined, 
        user_id: mockUser.uid 
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: mockSetlist, error: null })
        return builder
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify({ description: 'No name provided' })
      })
      const response = await POST(request)
      
      expect(response.status).toBe(200)
    })
  })
})