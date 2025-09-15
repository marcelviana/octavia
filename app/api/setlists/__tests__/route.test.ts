import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase service at the top level - this must be before any other imports
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()
const mockIn = vi.fn()

// Set up the chain properly to include all methods used by setlists API
const createChainedQuery = () => ({
  eq: mockEq,
  order: mockOrder,
  in: mockIn,
  select: mockSelect,
  single: mockSingle,
  then: vi.fn().mockResolvedValue({ data: [], error: null })
})

mockSelect.mockReturnValue(createChainedQuery())
mockEq.mockReturnValue(createChainedQuery())
mockOrder.mockReturnValue(createChainedQuery())
mockIn.mockReturnValue(createChainedQuery())
mockInsert.mockReturnValue(createChainedQuery())
mockSingle.mockResolvedValue({ data: null, error: null })

mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert
})

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({ from: mockFrom })
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

// Import the actual route handlers
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
      mockOrder.mockResolvedValue({ data: [], error: null })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.uid)
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
        },
        {
          id: 'song-2', 
          setlist_id: 'setlist-1',
          content_id: 'content-2',
          position: 2,
          notes: null
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
        },
        {
          id: 'content-2',
          title: 'Black',
          artist: 'Pearl Jam', 
          content_type: 'Lyrics',
          key: 'E',
          bpm: 85,
          file_url: null,
          content_data: 'Song lyrics here'
        }
      ]

      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Mock the setlists query (first call to mockOrder)
      mockOrder
        .mockResolvedValueOnce({ data: [mockSetlist], error: null })
        // Mock the setlist_songs query (second call to mockOrder)  
        .mockResolvedValueOnce({ data: mockSetlistSongs, error: null })
      
      // Mock the content query (call to mockSelect after mockIn)
      mockSelect.mockResolvedValueOnce({ data: mockContent, error: null })

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
      mockOrder
        .mockResolvedValueOnce({ data: [mockSetlist], error: null })
        .mockResolvedValueOnce({ data: mockSetlistSongs, error: null })
      mockSelect.mockResolvedValueOnce({ data: [], error: null }) // No content found

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
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Database error' } })

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
      mockOrder
        .mockResolvedValueOnce({ data: [mockSetlist], error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Songs query error' } })

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
      mockSingle.mockResolvedValue({ data: mockSetlist, error: null })

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
      expect(mockFrom).toHaveBeenCalledWith('setlists')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Setlist',
        user_id: mockUser.uid,
        description: null
      }))
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
      mockSingle.mockResolvedValue({ data: mockSetlist, error: null })

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
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Database error' } })

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
      mockRequireAuthServer.mockResolvedValue(mockUser)
      mockSingle.mockResolvedValue({ 
        data: { id: 'test-id', name: undefined, user_id: mockUser.uid }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        body: JSON.stringify({ description: 'No name provided' })
      })
      const response = await POST(request)
      
      // The route doesn't validate input, so it will pass undefined name to DB
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: undefined,
        description: 'No name provided'
      }))
    })
  })
})