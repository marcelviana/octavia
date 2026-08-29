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
vi.mock('@/lib/user-rate-limit', async () => {
  const actual = await vi.importActual('@/lib/user-rate-limit')
  return {
    ...(actual as object),
    // B1.3: limites neutralizados nos testes de rota (o contrato do
    // limiter tem suite propria em lib/__tests__/user-rate-limit.test.ts)
    enforceUserLimit: vi.fn(() => null),
    checkRateLimit: vi.fn(() => ({ ok: true, scope: 'user', limit: 999, remaining: 999, resetTime: Date.now() + 60000 })),
    authFailureLimited: vi.fn(() => false),
    recordAuthFailure: vi.fn(),
    getAuthFailureLimit: vi.fn(() => null)
  }
})

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
      const newContentId = '9d8e7c6b-5a4b-3c2d-1e0f-1a2b3c4d5e6f' // Valid UUID
      const newContent = { id: newContentId, ...validContentData, user_id: TEST_USER.uid }
      mockSingle.mockResolvedValue({ data: newContent, error: null })

      const { POST } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: validContentData }
      )

      const response = await POST(request)
      
      expectCreated(response)
      
      const data = await getJsonResponse(response)
      expect(data.id).toBe(newContentId)
      expect(data.user_id).toBe(TEST_USER.uid)
      
      // B2 PR-4b (política D1): o handler ENUMERA todas as colunas — campos
      // não enviados entram como null explícito, nunca por spread do body
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        ...validContentData,
        user_id: TEST_USER.uid,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        is_favorite: false,
        is_public: false,
        album: null,
        genre: null,
        capo: null,
        tuning: null,
        file_url: null,
      }))
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

    // SAN-01 (B2 PR-4a/4b): a política mudou — vetor real é REJEITADO com o
    // campo nomeado; nunca sanitizado em silêncio e gravado com 201.
    it('rejects XSS in title with 400 naming the field (never silently sanitize)', async () => {
      const { POST } = await import('../route')

      const maliciousContent = {
        ...validContentData,
        title: '<script>alert("xss")</script>Malicious Title',
      }

      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content',
        { method: 'POST', body: maliciousContent }
      )

      const response = await POST(request)

      expect(response.status).toBe(400)
      expect(mockInsert).not.toHaveBeenCalled()
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
// ————————————————————————————————————————————————————————————————
// B3 PR-2 — shapes do contrato (docs/api/CONTRATO-DE-ERRO.md) em
// /api/content. Nascem como it.fails contra o código ATUAL (controle
// negativo codificado, técnica do PR-1); o commit de migração remove os
// .fails sem tocar nenhum outro caractere. Falha esperada hoje: família
// {error,message,timestamp} e details:string[] do validation-utils
// (literais no B3-PRECHECK §2.1/2.2) e o 2MB parseado (§0.3 do desenho).
// ————————————————————————————————————————————————————————————————
describe('B3 contrato — /api/content (PR-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.fails('401 GET sem credencial: envelope authRequired + WWW-Authenticate', async () => {
    const { GET } = await import('../route')
    const response = await GET(createMockRequest('http://localhost/api/content'))
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it.fails('500 GET com erro de banco: envelope INTERNAL_ERROR', async () => {
    mockRange.mockResolvedValue({ data: null, error: { message: 'Database connection failed' } })
    const { GET } = await import('../route')
    const response = await GET(createValidAuthenticatedRequest('http://localhost/api/content'))
    expect(response.status).toBe(500)
    expect(await response.clone().text()).toBe(
      '{"error":"Failed to fetch content","code":"INTERNAL_ERROR"}'
    )
  })

  it.fails('400 POST título faltando: semente com field real', async () => {
    const { POST } = await import('../route')
    const response = await POST(
      createValidAuthenticatedRequest('http://localhost/api/content', {
        method: 'POST',
        body: { content_type: 'Lyrics' },
      })
    )
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([{ field: 'title', message: 'Required', code: 'invalid_type' }])
  })

  it.fails('400 POST com chaves desconhecidas: D7 — um detail POR CHAVE', async () => {
    const { POST } = await import('../route')
    const response = await POST(
      createValidAuthenticatedRequest('http://localhost/api/content', {
        method: 'POST',
        body: { title: 'b3', content_type: 'Lyrics', __b3_x__: 1, __b3_y__: 2 },
      })
    )
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: '__b3_x__', message: "Unrecognized key: '__b3_x__'", code: 'unrecognized_keys' },
      { field: '__b3_y__', message: "Unrecognized key: '__b3_y__'", code: 'unrecognized_keys' },
    ])
  })

  it.fails('G-guard (decisão B): corpo de 2MB no POST → 400 field:"" — hoje é PARSEADO', async () => {
    const big = 'x'.repeat(2 * 1024 * 1024)
    const { POST } = await import('../route')
    const response = await POST(
      createValidAuthenticatedRequest('http://localhost/api/content', {
        method: 'POST',
        body: { title: 'b3-guard', content_type: 'Lyrics', notes: big },
      })
    )
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: '', message: 'Invalid request body format', code: 'invalid_type' },
    ])
  })

  it.fails('404 PUT inexistente: literal NOVO "Content not found" (emenda 5)', async () => {
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    })
    const { PUT } = await import('../route')
    const response = await PUT(
      createValidAuthenticatedRequest('http://localhost/api/content', {
        method: 'PUT',
        body: { id: '00000000-0000-4000-8000-000000000000', title: 'x' },
      })
    )
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Content not found","code":"NOT_FOUND"}')
  })

  it.fails('400 DELETE id malformado: VALIDATION_ERROR com field:"id" (emenda 4)', async () => {
    const { DELETE } = await import('../route')
    const response = await DELETE(
      createValidAuthenticatedRequest('http://localhost/api/content?id=not-a-uuid', {
        method: 'DELETE',
      })
    )
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details[0].field).toBe('id')
  })
})
