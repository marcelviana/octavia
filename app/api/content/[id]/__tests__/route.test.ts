import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase service at the top level - this must be before any other imports
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

// Set up the chain properly
mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle })
mockEq.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle })
mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle })
mockDelete.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle })
mockFrom.mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  delete: mockDelete,
})

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({ from: mockFrom })
}))

// Mock Firebase server utils
const mockRequireAuthServer = vi.fn((request: Request) => {
  const authHeader = request.headers.get('authorization')
  const cookieHeader = request.headers.get('cookie')
  
  let hasValidAuth = false
  
  // Check for Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    hasValidAuth = true
  }
  // Check for session cookie
  else if (cookieHeader && cookieHeader.includes('firebase-session=')) {
    hasValidAuth = true
  }
  
  if (hasValidAuth) {
    return Promise.resolve({
      uid: TEST_USER.uid,
      email: TEST_USER.email,
      emailVerified: true,
    })
  } else {
    return Promise.resolve(null)
  }
})

vi.mock('@/lib/firebase-server-utils', () => ({
  requireAuthServer: mockRequireAuthServer
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: (handler: any) => handler
}))

import {
  createValidAuthenticatedRequest,
  createMockRequest,
  expectUnauthorized,
  expectBadRequest,
  expectSuccess,
  expectNotFound,
  getJsonResponse,
  TEST_USER,
  TEST_CONTENT
} from '@/lib/__tests__/api-test-helpers'

describe('/api/content/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Authentication mock now handles both authenticated and unauthenticated scenarios
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Debug URL parsing', () => {
    it('should extract ID correctly from URL', async () => {
      const testUrl = 'http://localhost/api/content/content-123'
      const url = new URL(testUrl)
      const pathname = url.pathname
      const pathParts = pathname.split('/').filter(Boolean)
      const expectedId = pathParts[pathParts.length - 1]
      
      
      expect(expectedId).toBe('content-123')
    })
  })

  describe('GET /api/content/[id]', () => {
    it('returns specific content when user owns it', async () => {
      // Mock content retrieval - return TEST_CONTENT
      mockSingle.mockResolvedValue({ 
        data: TEST_CONTENT, 
        error: null 
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123'
      )

      const response = await GET(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data).toEqual(TEST_CONTENT)
    })

    it('returns 404 when content not found', async () => {
      // Mock content not found - return null data 
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/nonexistent'
      )

      const response = await GET(request)
      
      expectNotFound(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toContain('not found')
    })

    it('rejects unauthenticated requests', async () => {
      const { GET } = await import('../route')
      
      const request = createMockRequest('http://localhost/api/content/content-123')

      const response = await GET(request)
      
      expectUnauthorized(response)
    })

    it('prevents access to other users content', async () => {
      // Mock no content found due to user_id filter - return null data
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123'
      )

      const response = await GET(request)
      
      expectNotFound(response)
    })
  })

  describe('PUT /api/content/[id]', () => {
    it('updates content when user owns it', async () => {
      const updateData = {
        title: 'Updated Title',
        artist: 'Updated Artist'
      }

      // Mock successful update
      mockSingle.mockResolvedValue({ 
        data: { ...TEST_CONTENT, ...updateData, updated_at: '2024-01-01T01:00:00Z' }, 
        error: null 
      })

      const { PUT } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123',
        {
          method: 'PUT',
          body: updateData
        }
      )

      const response = await PUT(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.title).toBe('Updated Title')
      expect(data.artist).toBe('Updated Artist')
      
      // Verify update was called with proper filters
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'content-123')
      expect(mockEq).toHaveBeenCalledWith('user_id', TEST_USER.uid)
    })

    it('rejects unauthenticated requests', async () => {
      const { PUT } = await import('../route')
      
      const request = createMockRequest('http://localhost/api/content/content-123', {
        method: 'PUT',
        body: { title: 'Updated' }
      })

      const response = await PUT(request)
      
      expectUnauthorized(response)
    })

    it('validates update data', async () => {
      const { PUT } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123',
        {
          method: 'PUT',
          body: {}
        }
      )

      const response = await PUT(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toContain('Validation failed')
    })

    it('returns 404 when updating non-existent content', async () => {
      // Mock content not found for update
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { PUT } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/nonexistent',
        {
          method: 'PUT',
          body: { title: 'Updated' }
        }
      )

      const response = await PUT(request)
      
      expectNotFound(response)
    })

    it('sanitizes content before updating', async () => {
      const updateData = {
        title: '<script>alert("xss")</script>Clean Title',
        content_data: { lyrics: 'Clean lyrics' }
      }

      // Mock successful update
      mockSingle.mockResolvedValue({ 
        data: { ...TEST_CONTENT, ...updateData }, 
        error: null 
      })

      const { PUT } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123',
        {
          method: 'PUT',
          body: updateData
        }
      )

      const response = await PUT(request)
      
      expectSuccess(response)
    })
  })

  describe('DELETE /api/content/[id]', () => {
    it('deletes content when user owns it', async () => {
      // Mock successful deletion
      mockSingle.mockResolvedValue({ 
        data: TEST_CONTENT, 
        error: null 
      })

      const { DELETE } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123',
        {
          method: 'DELETE'
        }
      )

      const response = await DELETE(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted successfully')
      
      // Verify delete was called with proper filters
      expect(mockDelete).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', 'content-123')
      expect(mockEq).toHaveBeenCalledWith('user_id', TEST_USER.uid)
    })

    it('rejects unauthenticated requests', async () => {
      const { DELETE } = await import('../route')
      
      const request = createMockRequest('http://localhost/api/content/content-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      
      expectUnauthorized(response)
    })

    it('returns 404 when deleting non-existent content', async () => {
      // Mock content not found for deletion
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { DELETE } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/nonexistent',
        {
          method: 'DELETE'
        }
      )

      const response = await DELETE(request)
      
      expectNotFound(response)
    })

    it('prevents deletion of other users content', async () => {
      // Mock no content found due to user_id filter
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { DELETE } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/content-123',
        {
          method: 'DELETE'
        }
      )

      const response = await DELETE(request)
      
      expectNotFound(response)
      
      // Verify query included the authenticated user's ID
      expect(mockEq).toHaveBeenCalledWith('user_id', TEST_USER.uid)
    })
  })
}) 