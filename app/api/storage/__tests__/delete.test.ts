import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Supabase service at the top level
const mockFrom = vi.fn()
const mockRemove = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({
    storage: { from: mockFrom }
  })
}))

// Mock Firebase server utils
const mockValidateFirebaseTokenServer = vi.fn(() => {
  // Always return valid authentication for tests
  return Promise.resolve({
    isValid: true,
    user: {
      uid: 'auvL2KKsYBVdvvnc83faOJM8rLi1',
      email: 'test-user@example.com',
      emailVerified: true,
    }
  })
})

vi.mock('@/lib/firebase-server-utils', () => ({
  validateFirebaseTokenServer: mockValidateFirebaseTokenServer
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
  createAuthenticatedRequest,
  expectUnauthorized,
  expectBadRequest,
  expectSuccess,
  expectNotFound,
  getJsonResponse,
  TEST_USER
} from '@/lib/__tests__/api-test-helpers'

describe('/api/storage/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default success mock for storage operations
    mockFrom.mockReturnValue({ remove: mockRemove })
    mockRemove.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/storage/delete', () => {
    it('deletes file when user owns it', async () => {
      const { POST } = await import('../delete/route')

      const request = createValidAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        { 
          method: 'POST', 
          body: { 
            filename: '1234567890-test-file.pdf'
          } 
        }
      )

      const response = await POST(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.filename).toBe('1234567890-test-file.pdf')
      
      expect(mockRemove).toHaveBeenCalledWith(['1234567890-test-file.pdf'])
    })

    it('rejects unauthenticated requests', async () => {
      const { POST } = await import('../delete/route')
      
      const request = createMockRequest('http://localhost/api/storage/delete', {
        method: 'POST',
        body: { filename: '1234567890-test-file.pdf' }
      })

      const response = await POST(request)
      
      expectUnauthorized(response)
    })

    it('rejects requests without filename', async () => {
      const { POST } = await import('../delete/route')

      const request = createAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        'valid-firebase-token',
        { method: 'POST', body: {} }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
      expect(data.details[0]).toContain('filename')
    })

    it('prevents deletion with invalid filename format', async () => {
      const { POST } = await import('../delete/route')

      const request = createAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        'valid-firebase-token',
        { 
          method: 'POST', 
          body: { filename: 'invalid-format.pdf' } 
        }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Invalid filename format')
    })

    it('prevents path traversal attacks', async () => {
      const { POST } = await import('../delete/route')

      const request = createAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        'valid-firebase-token',
        { 
          method: 'POST', 
          body: { filename: '../../../etc/passwd' } 
        }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
      expect(data.details[0]).toContain('path traversal detected')
    })

    it('G1/D6: erro do storage vira 500 genérico — a mensagem interna do Supabase NÃO vaza', async () => {
      // B3 PR-1/D6 (achado de segurança nº 5 do B3-PRECHECK): a rota
      // interpolava error.message do Supabase na resposta
      // (`Delete failed: ${error.message}`). Este teste ASSERTAVA o
      // vazamento (data.message contendo 'Delete failed') — invertido.
      // Controle negativo (regra nº 7) executado contra o código antigo:
      // falhou com a sentinela no corpo (registrado no relatório do PR-1).
      mockRemove.mockResolvedValue({
        data: null,
        error: { message: 'SENTINELA-interna-do-supabase' }
      })

      const { POST } = await import('../delete/route')

      const request = createAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        'valid-firebase-token',
        {
          method: 'POST',
          body: { filename: '1234567890-test-file.pdf' }
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(500)

      const raw = await response.clone().text()
      expect(raw).not.toContain('SENTINELA-interna-do-supabase')

      const data = await getJsonResponse(response)
      expect(data.error).toBe('File deletion failed')
      expect(data.code).toBe('INTERNAL_ERROR')
    })

    it('validates filename format for various invalid cases', async () => {
      const { POST } = await import('../delete/route')

      const invalidFilenames = [
        '',
        'no-timestamp.pdf',
        'invalid/path.pdf',
        'invalid\\path.pdf',
        '../traversal.pdf'
      ]

      for (const invalidFilename of invalidFilenames) {
        const request = createAuthenticatedRequest(
          'http://localhost/api/storage/delete',
          'valid-firebase-token',
          { 
            method: 'POST', 
            body: { filename: invalidFilename } 
          }
        )

        const response = await POST(request)
        
        expect(response.status).toBeGreaterThanOrEqual(400)
      }
    })

    it('prevents suspicious filename patterns', async () => {
      const { POST } = await import('../delete/route')

      const request = createAuthenticatedRequest(
        'http://localhost/api/storage/delete',
        'valid-firebase-token',
        { 
          method: 'POST', 
          body: { filename: '../../../etc/passwd' } 
        }
      )

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
      expect(data.details[0]).toContain('path traversal detected')
    })
  })
}) 
// B3 PR-2 — shapes do contrato em /api/storage/delete. it.fails contra o
// código atual; a migração remove o .fails.
describe('B3 contrato — /api/storage/delete (PR-2)', () => {
  it.fails('401 sem header: envelope authRequired (hoje: família {error,message,timestamp} do utils)', async () => {
    const { POST } = await import('../delete/route')
    const request = createMockRequest('http://localhost/api/storage/delete', {
      method: 'POST',
      body: { filename: '1234567890-b3.pdf' },
    })
    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it.fails('400 path traversal: details ESTRUTURADO com field:"filename" (hoje: details:string[])', async () => {
    const { POST } = await import('../delete/route')
    const request = createAuthenticatedRequest(
      'http://localhost/api/storage/delete',
      'valid-firebase-token',
      { method: 'POST', body: { filename: '../../../etc/passwd' } }
    )
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await getJsonResponse(response)
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details[0].field).toBe('filename')
    expect(data.details[0].message).toContain('path traversal')
  })
})
