import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

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
      const testUrl = `http://localhost/api/content/${TEST_CONTENT.id}`
      const url = new URL(testUrl)
      const pathname = url.pathname
      const pathParts = pathname.split('/').filter(Boolean)
      const expectedId = pathParts[pathParts.length - 1]
      
      
      expect(expectedId).toBe(TEST_CONTENT.id)
    })
  })

  describe('GET /api/content/[id]', () => {
    it.skip('TODO: Fix GET ownership - returns specific content when user owns it', async () => {
      // Mock content retrieval - return TEST_CONTENT
      mockSingle.mockResolvedValue({ 
        data: TEST_CONTENT, 
        error: null 
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        `http://localhost/api/content/${TEST_CONTENT.id}`
      )

      const response = await GET(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data).toEqual(TEST_CONTENT)
    })

    it.skip('TODO: Fix 404 handling - returns 404 when content not found', async () => {
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

    it.skip('TODO: Fix auth rejection - rejects unauthenticated requests', async () => {
      const { GET } = await import('../route')
      
      const request = createMockRequest(`http://localhost/api/content/${TEST_CONTENT.id}`)

      const response = await GET(request)
      
      expectUnauthorized(response)
    })

    it.skip('TODO: Fix access control - prevents access to other users content', async () => {
      // Mock no content found due to user_id filter - return null data
      mockSingle.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const { GET } = await import('../route')
      
      const request = createValidAuthenticatedRequest(
        `http://localhost/api/content/${TEST_CONTENT.id}`
      )

      const response = await GET(request)
      
      expectNotFound(response)
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
        `http://localhost/api/content/${TEST_CONTENT.id}`,
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
      expect(mockEq).toHaveBeenCalledWith('id', TEST_CONTENT.id)
      expect(mockEq).toHaveBeenCalledWith('user_id', TEST_USER.uid)
    })

    it.skip('TODO: Fix auth rejection - rejects unauthenticated requests', async () => {
      const { DELETE } = await import('../route')
      
      const request = createMockRequest(`http://localhost/api/content/${TEST_CONTENT.id}`, {
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
      
      // B3 PR-2: 'nonexistent' é id MALFORMADO (hoje 400 field:"id");
      // o caso 404 exige uuid válido inexistente
      const request = createValidAuthenticatedRequest(
        'http://localhost/api/content/00000000-0000-4000-8000-000000000000',
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
        `http://localhost/api/content/${TEST_CONTENT.id}`,
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
// B3 PR-2 — shapes do contrato em /api/content/[id]. it.fails contra o
// código atual (controle negativo codificado); a migração remove o .fails.
describe('B3 contrato — /api/content/[id] (PR-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('401 GET sem credencial: envelope authRequired (hoje: {"error":"Unauthorized"} sem code)', async () => {
    const { GET } = await import('../route')
    const response = await GET(
      createMockRequest(`http://localhost/api/content/${TEST_CONTENT.id}`)
    )
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it('400 GET id malformado: VALIDATION_ERROR com field:"id" (emenda 4)', async () => {
    const { GET } = await import('../route')
    const response = await GET(
      createValidAuthenticatedRequest('http://localhost/api/content/not-a-uuid')
    )
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'id', message: 'Invalid ID format', code: 'invalid_string' },
    ])
  })

  it('404 GET uuid inexistente: literal NOVO "Content not found" (emenda 5)', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    })
    const { GET } = await import('../route')
    const response = await GET(
      createValidAuthenticatedRequest(
        'http://localhost/api/content/00000000-0000-4000-8000-000000000000'
      )
    )
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Content not found","code":"NOT_FOUND"}')
  })
})
