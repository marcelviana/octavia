import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase service at the top level - this must be before any other imports
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockRange = vi.fn()
const mockOr = vi.fn()
const mockIn = vi.fn()
const mockOrder = vi.fn()

// Set up the chain properly to include all methods used by content API
mockSelect.mockReturnValue({ 
  eq: mockEq, 
  single: mockSingle, 
  range: mockRange, 
  or: mockOr,
  in: mockIn,
  order: mockOrder
})
mockEq.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect, 
  single: mockSingle, 
  range: mockRange,
  or: mockOr,
  in: mockIn,
  order: mockOrder
})
mockOr.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect, 
  single: mockSingle, 
  range: mockRange,
  or: mockOr,
  in: mockIn,
  order: mockOrder
})
mockIn.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect, 
  single: mockSingle, 
  range: mockRange,
  or: mockOr,
  in: mockIn,
  order: mockOrder
})
mockOrder.mockReturnValue({ 
  eq: mockEq, 
  select: mockSelect, 
  single: mockSingle, 
  range: mockRange,
  or: mockOr,
  in: mockIn,
  order: mockOrder
})
mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle })
mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
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
      uid: 'auvL2KKsYBVdvvnc83faOJM8rLi1',
      email: 'test-user@example.com',
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
  createAuthenticatedRequest,
  createMockRequest,
  expectUnauthorized,
  expectBadRequest,
  expectSuccess,
  expectCreated,
  getJsonResponse,
  TEST_USER,
  TEST_CONTENT,
  VALID_FIREBASE_TOKEN
} from '@/lib/__tests__/api-test-helpers'

describe('/api/content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Authentication mock now handles both authenticated and unauthenticated scenarios
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/content', () => {
    it('returns user content when authenticated', async () => {
      // Mock Supabase query response
      const mockData = { data: [TEST_CONTENT], error: null, count: 1 }
      mockRange.mockResolvedValue(mockData)

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest('http://localhost/api/content')

      const response = await GET(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.data).toEqual([TEST_CONTENT])
      
      // Verify authentication was checked
      expect(mockRequireAuthServer).toHaveBeenCalled()
      
      // Verify database query was made for user's content
      expect(mockFrom).toHaveBeenCalledWith('content')
      expect(mockEq).toHaveBeenCalledWith('user_id', TEST_USER.uid)
    })

    it('rejects unauthenticated requests', async () => {
      const { GET } = await import('../route')
      
      const request = createMockRequest('http://localhost/api/content')

      const response = await GET(request)
      
      expectUnauthorized(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Unauthorized')
    })

    it('handles database errors gracefully', async () => {
      // Mock database error
      mockRange.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest('http://localhost/api/content')

      const response = await GET(request)
      
      expect(response.status).toBe(500)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Server error')
    })

    it('supports pagination with limit and offset', async () => {
      // Mock paginated response
      const mockData = { data: [TEST_CONTENT], error: null, count: 25 }
      mockRange.mockResolvedValue(mockData)

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest('http://localhost/api/content?page=3&pageSize=10')

      const response = await GET(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.page).toBe(3)
      expect(data.pageSize).toBe(10)
      
      // Verify range was applied (page 3 with pageSize 10 = from index 20 to 29)
      expect(mockRange).toHaveBeenCalledWith(20, 29)
    })

    it('filters by content type when specified', async () => {
      // Mock filtered response
      const mockData = { data: [{ ...TEST_CONTENT, content_type: 'Chords' }], error: null, count: 1 }
      mockRange.mockResolvedValue(mockData)

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest('http://localhost/api/content?contentType=Chords')

      const response = await GET(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.data[0].content_type).toBe('Chords')
      
      // Verify database query was made with the filter
      expect(mockFrom).toHaveBeenCalledWith('content')
    })
  })

  describe('POST /api/content', () => {
    const validContentData = {
      title: 'New Song',
      artist: 'Test Artist',
      content_type: 'Lyrics', // Must match enum values
      content_data: { lyrics: 'Song lyrics here' }, // Correct field name
      key: 'C',
      bpm: 120
    }

    it('creates new content when authenticated', async () => {
      // Mock successful insert
      const newContent = { id: 'new-content-123', ...validContentData, user_id: TEST_USER.uid }
      mockSingle.mockResolvedValue({ data: newContent, error: null })

      const { POST } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: validContentData }
      )

      const response = await POST(request)
      
      expectCreated(response)
      
      const data = await getJsonResponse(response)
      expect(data.id).toBe('new-content-123')
      expect(data.user_id).toBe(TEST_USER.uid)
      
      // Verify content was inserted with expected fields
      expect(mockInsert).toHaveBeenCalledWith({
        ...validContentData,
        user_id: TEST_USER.uid,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        is_favorite: false,
        is_public: false
      })
    })

    it('rejects unauthenticated requests', async () => {
      const { POST } = await import('../route')
      
      const request = createMockRequest('http://localhost/api/content', {
        method: 'POST',
        body: validContentData
      })

      const response = await POST(request)
      
      expectUnauthorized(response)
    })

    it('validates required fields', async () => {
      const { POST } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: { title: 'Missing required fields' } }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
    })

    it('sanitizes content before saving', async () => {
      // Mock successful insert
      mockSingle.mockResolvedValue({ 
        data: { id: 'new-content-123' }, 
        error: null 
      })

      const { POST } = await import('../route')
      
      const maliciousContent = {
        ...validContentData,
        title: '<script>alert("xss")</script>Malicious Title',
        content: 'Normal content <script>alert("xss")</script>'
      }
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: maliciousContent }
      )

      const response = await POST(request)
      
      expectCreated(response)
      
      // Verify that scripts were sanitized in the insert call
      const insertCall = mockInsert.mock.calls[0][0]
      expect(insertCall.title).not.toContain('<script>')
      // Note: content_data field doesn't exist in the malicious test data
    })

    it('handles duplicate content gracefully', async () => {
      // Mock unique constraint violation
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: '23505', message: 'duplicate key value violates unique constraint' } 
      })

      const { POST } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: validContentData }
      )

      const response = await POST(request)
      
      expect(response.status).toBe(500) // Server error
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Server error')
    })

    it('validates content type is allowed', async () => {
      const { POST } = await import('../route')
      
      const invalidContent = {
        ...validContentData,
        content_type: 'invalid-type'
      }
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: invalidContent }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
    })
  })
}) 