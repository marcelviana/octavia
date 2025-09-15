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
import { POST } from '../route'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import logger from '@/lib/logger'

// Get mocked functions for type safety
const mockRequireAuthServer = vi.mocked(requireAuthServer)
const mockLogger = vi.mocked(logger)

describe('/api/setlists/[id]/songs', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
  }
  
  const setlistId = 'setlist-123'
  const contentId = 'content-456'

  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: null, error: null }
  })

  describe('POST /api/setlists/[id]/songs', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({ content_id: contentId, position: 1 })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('adds song to setlist successfully', async () => {
      const mockCreatedSong = {
        id: 'song-1',
        setlist_id: setlistId,
        content_id: contentId,
        position: 1,
        notes: 'Great opener!'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          // Setlist ownership verification
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          // Content ownership verification
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 2) {
          // Max position query
          builder.single.mockResolvedValue({ 
            data: null,
            error: null 
          })
        } else {
          // Insert song
          builder.single.mockResolvedValue({ 
            data: mockCreatedSong, 
            error: null 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1,
          notes: 'Great opener!'
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedSong)
    })

    it('handles missing notes by defaulting to empty string', async () => {
      const mockCreatedSong = {
        id: 'song-2',
        setlist_id: setlistId,
        content_id: contentId,
        position: 2,
        notes: ''
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 2) {
          builder.single.mockResolvedValue({ 
            data: { position: 1 },
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: mockCreatedSong, 
            error: null 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 2
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toBe('')
    })

    it('adjusts position when inserting beyond current max', async () => {
      const mockCreatedSong = {
        id: 'song-3',
        setlist_id: setlistId,
        content_id: contentId,
        position: 6, // Should use max + 1
        notes: ''
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 2) {
          // Current max position is 5
          builder.single.mockResolvedValue({ 
            data: { position: 5 },
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: mockCreatedSong, 
            error: null 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 10 // Requesting position beyond max
        })
      })
      const response = await POST(request, { params: { id: setlistId } })

      expect(response.status).toBe(200)
    })

    it('handles empty setlist (no existing songs)', async () => {
      const mockCreatedSong = {
        id: 'song-4',
        setlist_id: setlistId,
        content_id: contentId,
        position: 1,
        notes: ''
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 2) {
          // No existing songs
          builder.single.mockResolvedValue({ 
            data: null,
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: mockCreatedSong, 
            error: null 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.position).toBe(1)
    })

    it('returns 500 when setlist does not belong to user', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        builder.single.mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116' } 
        })
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error verifying setlist ownership:',
        expect.objectContaining({ code: 'PGRST116' })
      )
    })

    it('returns 500 when content does not belong to user', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST116' } 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error validating content:',
        expect.objectContaining({ code: 'PGRST116' })
      )
    })

    it('handles database errors during song creation', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 2) {
          builder.single.mockResolvedValue({ 
            data: null,
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: null, 
            error: { message: 'Failed to insert song' } 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error adding song to setlist:',
        expect.objectContaining({ message: 'Failed to insert song' })
      )
    })

    it('handles database errors during max position query', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      let callCount = 0
      mockSupabaseClient.from = vi.fn(() => {
        const builder = createMockQueryBuilder()
        
        if (callCount === 0) {
          builder.single.mockResolvedValue({ 
            data: { id: setlistId, user_id: mockUser.uid }, 
            error: null 
          })
        } else if (callCount === 1) {
          builder.single.mockResolvedValue({ 
            data: { id: contentId, user_id: mockUser.uid }, 
            error: null 
          })
        } else {
          builder.single.mockResolvedValue({ 
            data: null, 
            error: { code: 'PGRST500' } 
          })
        }
        
        callCount++
        return builder
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          content_id: contentId,
          position: 1
        })
      })
      const response = await POST(request, { params: { id: setlistId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting max position:',
        expect.objectContaining({ code: 'PGRST500' })
      )
    })
  })
})