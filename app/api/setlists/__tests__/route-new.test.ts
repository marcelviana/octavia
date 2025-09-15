import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Firebase server utils
vi.mock('@/lib/firebase-server-utils', () => ({
  requireAuthServer: vi.fn()
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock Supabase service - will be configured in beforeEach
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn()
}))

// Import the actual route handlers and utilities after mocks
import { GET, POST } from '../route'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { createAPIMockData, createErrorScenarios } from '@/lib/test-utils/api-test-helpers'

// Get mocked functions for type safety
const mockRequireAuthServer = vi.mocked(requireAuthServer)
const mockGetSupabaseServiceClient = vi.mocked(getSupabaseServiceClient)
const mockLogger = vi.mocked(logger)

// Create the smart mock data
const { 
  factory, 
  mockUser, 
  mockSetlists, 
  mockSetlistSongs, 
  mockContent,
  supabaseMock 
} = createAPIMockData()

describe('/api/setlists', () => {
  beforeEach(() => {
    // Clear all mocks first
    vi.clearAllMocks()
    
    // Configure the Supabase mock
    mockGetSupabaseServiceClient.mockReturnValue(supabaseMock)
    
    // Clear previous test state
    factory.clear()
    
    // Reset to default test data
    factory
      .setMockData('setlists', mockSetlists)
      .setMockData('setlist_songs', mockSetlistSongs)
      .setMockData('content', mockContent)
  })

  describe('GET /api/setlists', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockRequireAuthServer.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('returns empty array when user has no setlists', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Setup empty setlists scenario
      factory.setMockData('setlists', [])

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('returns setlists with songs for authenticated user', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('setlist-1')
      expect(data[0].name).toBe('Test Setlist')
      expect(data[0].setlist_songs).toHaveLength(2)
      expect(data[0].setlist_songs[0].content.title).toBe('Wonderwall')
      expect(data[0].setlist_songs[1].content.title).toBe('Champagne Supernova')
    })

    it('handles missing content gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Setup scenario where content is missing
      factory.setMockData('content', [])

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].setlist_songs).toHaveLength(2)
      // Content should have default values when missing (API creates placeholder content)
      expect(data[0].setlist_songs[0].content.title).toBe('Unknown Title')
    })

    it('handles database errors gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Setup database error scenario
      const errorScenarios = createErrorScenarios(factory)
      errorScenarios.databaseError()

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })

    it('handles setlist songs query errors gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Setup scenario where setlist_songs query fails
      factory.setMockError('setlist_songs', {
        code: 'DATABASE_ERROR',
        message: 'Songs query failed'
      })

      const request = new NextRequest('http://localhost:3000/api/setlists')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      // Should return setlist with empty songs array when songs query fails
      expect(data[0].setlist_songs).toEqual([])
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

      expect(response.status).toBe(401)
    })

    it('creates a setlist successfully with minimal data', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      // Setup mock to return created setlist
      const createdSetlist = {
        id: 'new-setlist-id',
        name: 'Minimal Setlist',
        description: null,
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z'
      }
      factory.setMockData('setlists', [createdSetlist])

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Minimal Setlist' })
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Minimal Setlist')
    })

    it('creates a setlist successfully with full data', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const fullSetlistData = {
        name: 'Full Setlist',
        description: 'A complete setlist',
        performance_date: '2024-02-01',
        venue: 'Test Venue',
        notes: 'Test notes'
      }

      // Setup mock to return created setlist
      const createdSetlist = {
        id: 'full-setlist-id',
        ...fullSetlistData,
        user_id: mockUser.uid,
        created_at: '2024-01-01T00:00:00Z'
      }
      factory.setMockData('setlists', [createdSetlist])

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullSetlistData)
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Full Setlist')
      expect(data.description).toBe('A complete setlist')
      expect(data.venue).toBe('Test Venue')
    })

    it('handles invalid JSON request body', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('handles database errors during creation', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)
      
      // Setup database error scenario
      factory.setMockError('setlists', {
        code: 'DATABASE_ERROR',
        message: 'Failed to create setlist'
      })

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Setlist' })
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('handles missing name field gracefully', async () => {
      mockRequireAuthServer.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/setlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: 'No name provided' })
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
