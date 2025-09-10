import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase service
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockIn = vi.fn()

// Set up the chain properly for all Supabase operations
mockSelect.mockReturnValue({ 
  eq: mockEq, 
  order: mockOrder,
  in: mockIn,
  single: mockSingle
})
mockEq.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect, 
  order: mockOrder,
  single: mockSingle
})
mockOrder.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect,
  single: mockSingle
})
mockIn.mockReturnValue({
  eq: mockEq,
  select: mockSelect
})
mockUpdate.mockReturnValue({
  eq: mockEq,
  select: mockSelect,
  single: mockSingle
})
mockDelete.mockReturnValue({
  eq: mockEq
})
mockFrom.mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  delete: mockDelete
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
  })

  describe('GET /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
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
      
      // Mock the setlist query (first call)
      mockSingle
        .mockResolvedValueOnce({ data: mockSetlist, error: null })
        
      // Mock the setlist_songs query (second call to mockOrder)  
      mockOrder.mockResolvedValueOnce({ data: mockSetlistSongs, error: null })
      
      // Mock the content query (call to mockSelect after mockIn)
      mockSelect.mockResolvedValueOnce({ data: mockContent, error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request)
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
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockEq).toHaveBeenCalledWith('id', setlistId)
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
    })

    it('returns setlist without songs when no songs exist', async () => {
      const mockSetlist = {
        id: setlistId,
        name: 'Empty Setlist',
        user_id: mockUser.uid
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValueOnce({ data: mockSetlist, error: null })
      mockOrder.mockResolvedValueOnce({ data: [], error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request)
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
      mockSingle.mockResolvedValueOnce({ data: mockSetlist, error: null })
      mockOrder.mockResolvedValueOnce({ data: mockSetlistSongs, error: null })
      mockSelect.mockResolvedValueOnce({ data: [], error: null }) // No content found

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request)
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
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Setlist not found' } })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('returns 400 when setlist ID is missing from URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/setlists/')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Setlist ID is required' })
    })
  })

  describe('PUT /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Setlist' })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('updates setlist successfully with valid data', async () => {
      const updateData = {
        name: 'Updated Setlist',
        description: 'Updated description',
        performance_date: '2024-06-15T20:00:00Z',
        venue: 'New Venue',
        notes: 'Updated notes'
      }

      const mockUpdatedSetlist = {
        id: setlistId,
        ...updateData,
        user_id: mockUser.uid,
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle
        .mockResolvedValueOnce({ data: mockUpdatedSetlist, error: null }) // Update response
      mockOrder.mockResolvedValueOnce({ data: [], error: null }) // Songs query

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: setlistId,
        name: 'Updated Setlist',
        description: 'Updated description',
        setlist_songs: []
      })
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Updated Setlist',
        description: 'Updated description',
        updated_at: expect.any(String)
      }))
      expect(mockEq).toHaveBeenCalledWith('id', setlistId)
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
    })

    it('handles partial updates correctly', async () => {
      const partialUpdate = { 
        name: 'Just Name Update',
        venue: 'New Venue Only'
      }

      const mockUpdatedSetlist = {
        id: setlistId,
        name: 'Just Name Update',
        description: 'Original description',
        venue: 'New Venue Only',
        user_id: mockUser.uid,
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValueOnce({ data: mockUpdatedSetlist, error: null })
      mockOrder.mockResolvedValueOnce({ data: [], error: null })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Just Name Update')
      expect(data.venue).toBe('New Venue Only')
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Just Name Update',
        venue: 'New Venue Only',
        description: null,
        performance_date: null,
        notes: null
      }))
    })

    it('handles database errors during update', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Update failed' } })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test Update' })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('handles invalid JSON gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'PUT',
        body: 'invalid json{'
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('returns 400 when setlist ID is missing from URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/setlists/', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Setlist ID is required' })
    })
  })

  describe('DELETE /api/setlists/[id]', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('deletes setlist and its songs successfully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockEq
        .mockResolvedValueOnce({ error: null }) // Delete setlist_songs
        .mockResolvedValueOnce({ error: null }) // Delete setlist

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      
      // Should delete from setlist_songs first, then setlists
      expect(mockFrom).toHaveBeenCalledWith('setlist_songs')
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockDelete).toHaveBeenCalledTimes(2)
      expect(mockEq).toHaveBeenCalledWith('setlist_id', setlistId)
      expect(mockEq).toHaveBeenCalledWith('id', setlistId)
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
    })

    it('handles errors when deleting setlist songs', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockEq.mockResolvedValueOnce({ error: { message: 'Failed to delete songs' } })

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting setlist songs:',
        expect.objectContaining({ message: 'Failed to delete songs' })
      )
    })

    it('handles errors when deleting setlist', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockEq
        .mockResolvedValueOnce({ error: null }) // Songs delete succeeds
        .mockResolvedValueOnce({ error: { message: 'Failed to delete setlist' } }) // Setlist delete fails

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Internal server error' })
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error deleting setlist:',
        expect.objectContaining({ message: 'Failed to delete setlist' })
      )
    })

    it('returns 400 when setlist ID is missing from URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/setlists/', {
        method: 'DELETE'
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Setlist ID is required' })
    })

    it('only deletes setlists owned by the authenticated user', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockEq
        .mockResolvedValueOnce({ error: null }) // Delete songs
        .mockResolvedValueOnce({ error: null }) // Delete setlist

      const request = new NextRequest(`http://localhost:3000/api/setlists/${setlistId}`, {
        method: 'DELETE'
      })
      await DELETE(request)

      // Verify that the user_id filter is applied
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
    })
  })
})