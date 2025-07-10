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
vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: (handler: any) => handler
}))

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

    it('handles storage service errors gracefully', async () => {
      // Mock storage service error
      mockRemove.mockResolvedValue({ 
        data: null, 
        error: { message: 'Storage service unavailable' } 
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
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Server error')
      expect(data.message).toContain('Delete failed')
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