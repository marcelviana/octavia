import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase service
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockSingle = vi.fn()

// Set up the chain properly for all Supabase operations
mockSelect.mockReturnValue({ 
  eq: mockEq,
  order: mockOrder,
  limit: mockLimit,
  single: mockSingle
})
mockEq.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect,
  single: mockSingle
})
mockOrder.mockReturnValue({
  limit: mockLimit,
  single: mockSingle
})
mockLimit.mockReturnValue({
  single: mockSingle
})
mockInsert.mockReturnValue({ 
  select: mockSelect, 
  single: mockSingle 
})
mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert
})

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({ from: mockFrom })
}))

// Mock Firebase auth
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

// Import the actual route handlers
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
  })

  describe('POST /api/setlists/[id]/songs', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          contentId,
          position: 1,
          notes: 'Test song'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('returns 400 when required fields are missing', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify({
          notes: 'Missing contentId and position'
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Content ID and position are required' })
    })

    it('adds song to setlist successfully', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'Opening song'
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }
      const mockMaxPosition = { position: 0 }
      const mockCreatedSong = {
        id: 'setlist-song-789',
        setlist_id: setlistId,
        content_id: contentId,
        position: 1,
        notes: 'Opening song'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Mock setlist verification
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        // Mock content verification
        .mockResolvedValueOnce({ data: mockContent, error: null })
        // Mock max position query
        .mockResolvedValueOnce({ data: mockMaxPosition, error: null })
        // Mock song creation
        .mockResolvedValueOnce({ data: mockCreatedSong, error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedSong)
      
      // Verify all validation calls
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockFrom).toHaveBeenCalledWith('content')
      expect(mockFrom).toHaveBeenCalledWith('setlist_songs')
      
      expect(mockEq).toHaveBeenCalledWith('id', setlistId)
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
      expect(mockEq).toHaveBeenCalledWith('id', contentId)
      
      expect(mockInsert).toHaveBeenCalledWith({
        setlist_id: setlistId,
        content_id: contentId,
        position: 1,
        notes: 'Opening song'
      })
    })

    it('handles missing notes by defaulting to empty string', async () => {
      const songData = {
        contentId,
        position: 2
        // notes omitted
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }
      const mockMaxPosition = { position: 1 }
      const mockCreatedSong = {
        id: 'setlist-song-790',
        setlist_id: setlistId,
        content_id: contentId,
        position: 2,
        notes: ''
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ data: mockContent, error: null })
        .mockResolvedValueOnce({ data: mockMaxPosition, error: null })
        .mockResolvedValueOnce({ data: mockCreatedSong, error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notes).toBe('')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        notes: ''
      }))
    })

    it('adjusts position when inserting beyond current max', async () => {
      const songData = {
        contentId,
        position: 1, // Requesting position 1
        notes: 'Test song'
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }
      const mockMaxPosition = { position: 5 } // Current max is 5
      const mockCreatedSong = {
        id: 'setlist-song-791',
        setlist_id: setlistId,
        content_id: contentId,
        position: 6, // Should be placed at position 6 (max + 1)
        notes: 'Test song'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ data: mockContent, error: null })
        .mockResolvedValueOnce({ data: mockMaxPosition, error: null })
        .mockResolvedValueOnce({ data: mockCreatedSong, error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        position: 6 // Should use max + 1, not the requested position
      }))
    })

    it('handles empty setlist (no existing songs)', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'First song'
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }
      const mockCreatedSong = {
        id: 'setlist-song-792',
        setlist_id: setlistId,
        content_id: contentId,
        position: 1,
        notes: 'First song'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ data: mockContent, error: null })
        // Mock no existing songs (PGRST116 error)
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockCreatedSong, error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.position).toBe(1)
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        position: 1
      }))
    })

    it('returns 500 when setlist does not belong to user', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'Test song'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Setlist not found' } 
      })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error verifying setlist ownership:',
        expect.objectContaining({ message: 'Setlist not found' })
      )
    })

    it('returns 500 when content does not belong to user', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'Test song'
      }

      const mockSetlist = { id: setlistId }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ 
          data: null, 
          error: { message: 'Content not found' } 
        })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error validating content:',
        expect.objectContaining({ message: 'Content not found' })
      )
    })

    it('handles database errors during song creation', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'Test song'
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }
      const mockMaxPosition = { position: 0 }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ data: mockContent, error: null })
        .mockResolvedValueOnce({ data: mockMaxPosition, error: null })
        .mockResolvedValueOnce({ 
          data: null, 
          error: { message: 'Failed to insert song' } 
        })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error adding song to setlist:',
        expect.objectContaining({ message: 'Failed to insert song' })
      )
    })

    it('handles invalid JSON gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: 'invalid json{'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('returns 400 when setlist ID is missing from URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/setlists//songs', {
        method: 'POST',
        body: JSON.stringify({
          contentId,
          position: 1
        })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Setlist ID is required' })
    })

    it('handles database errors during max position query', async () => {
      const songData = {
        contentId,
        position: 1,
        notes: 'Test song'
      }

      const mockSetlist = { id: setlistId }
      const mockContent = { id: contentId }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        .mockResolvedValueOnce({ data: mockContent, error: null })
        .mockResolvedValueOnce({ 
          data: null, 
          error: { code: 'PGRST500', message: 'Database error' } 
        })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}/songs`, {
        method: 'POST',
        body: JSON.stringify(songData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting max position:',
        expect.objectContaining({ message: 'Database error' })
      )
    })
  })
})