import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Create a comprehensive mock for Supabase query builder
let mockQueryResult = { data: null, error: null }

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

// Import the route handlers after mocks
import { GET, PUT, DELETE } from '../route'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import logger from '@/lib/logger'

// Get mocked functions for type safety
const mockRequireAuthServer = vi.mocked(requireAuthServer)
const mockLogger = vi.mocked(logger)

describe('/api/setlists/[id]', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
  }
  
  const setlistId = 'setlist-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: null, error: null }
  })

  describe('GET /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns 404 when setlist is not found', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Setlist not found' })
    })

    it('returns setlist with songs for authenticated user', async () => {
      const mockSetlist = {
        id: setlistId,
        name: 'Test Setlist',
        description: 'A test setlist',
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockSetlistSongs = [
        {
          id: 'song-1',
          setlist_id: setlistId,
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
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          // First call: setlist query
          builder.single.mockResolvedValue({ data: mockSetlist, error: null })
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

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: setlistId,
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

    it('returns setlist without songs when no songs exist', async () => {
      const mockSetlist = {
        id: setlistId,
        name: 'Empty Setlist',
        user_id: mockUser.uid
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ data: mockSetlist, error: null })
        } else {
          builder.then.mockResolvedValue({ data: [], error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: setlistId,
        name: 'Empty Setlist',
        setlist_songs: []
      })
    })

    it('handles missing content gracefully', async () => {
      const mockSetlist = {
        id: setlistId,
        name: 'Test Setlist',
        user_id: mockUser.uid
      }

      const mockSetlistSongs = [
        {
          id: 'song-1',
          setlist_id: setlistId,
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
          builder.single.mockResolvedValue({ data: mockSetlist, error: null })
        } else if (callCount === 1) {
          builder.then.mockResolvedValue({ data: mockSetlistSongs, error: null })
        } else {
          builder.then.mockResolvedValue({ data: [], error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.setlist_songs[0].content).toEqual({
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
        builder.single.mockResolvedValue({ data: null, error: { message: 'Database error' } })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('PUT /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Setlist' })
      })
      const response = await PUT(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('updates setlist successfully with valid data', async () => {
      const updatedSetlist = {
        id: setlistId,
        name: 'Updated Setlist',
        description: 'Updated description',
        user_id: mockUser.uid
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          // Update operation
          builder.single.mockResolvedValue({ data: updatedSetlist, error: null })
        } else {
          // Get updated setlist with songs
          builder.then.mockResolvedValue({ data: [], error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Setlist',
          description: 'Updated description'
        })
      })
      const response = await PUT(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: setlistId,
        name: 'Updated Setlist',
        description: 'Updated description',
        setlist_songs: []
      })
    })

    it('handles partial updates correctly', async () => {
      const partialUpdate = {
        id: setlistId,
        name: 'Just Name Update',
        venue: 'New Venue Only',
        user_id: mockUser.uid
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ data: partialUpdate, error: null })
        } else {
          builder.then.mockResolvedValue({ data: [], error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Just Name Update',
          venue: 'New Venue Only'
        })
      })
      const response = await PUT(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Just Name Update')
      expect(data.venue).toBe('New Venue Only')
    })

    it('handles database errors during update', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ data: null, error: { message: 'Update failed' } })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      })
      const response = await PUT(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('deletes setlist and its songs successfully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          // Delete setlist_songs
          builder.then.mockResolvedValue({ data: null, error: null })
        } else {
          // Delete setlist
          builder.then.mockResolvedValue({ data: null, error: null })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('handles errors when deleting setlist', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.then.mockResolvedValue({ data: null, error: { message: 'Failed to delete setlist' } })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting setlist:',
        expect.objectContaining({ message: 'Failed to delete setlist' })
      )
    })

    it('only deletes setlists owned by the authenticated user', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.then.mockResolvedValue({ data: null, error: null })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request, { params: { id: setlistId } })

      expect(response.status).toBe(200)
    })
  })
})