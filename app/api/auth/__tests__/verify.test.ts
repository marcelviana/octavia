import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock Firebase admin at the top level
const mockVerifyIdToken = vi.fn()

vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: mockVerifyIdToken,
  getUserByUid: vi.fn(),
  createUser: vi.fn(),
  initializeFirebaseAdmin: vi.fn()
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
  createMockRequest,
  createAuthenticatedRequest,
  expectUnauthorized,
  expectBadRequest,
  expectSuccess,
  getJsonResponse,
  TEST_USER,
  TEST_UNVERIFIED_USER
} from '@/lib/__tests__/api-test-helpers'

describe('/api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/verify', () => {
    it('verifies valid Firebase token', async () => {
      // Mock successful token verification
      mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        email_verified: TEST_USER.emailVerified
      })

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'valid-firebase-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        emailVerified: TEST_USER.emailVerified,
        displayName: undefined
      })
      
      // Verify Firebase token was validated
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token')
    })

    it('rejects request without token', async () => {
      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: {}
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('rejects request with invalid token format', async () => {
      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 123 } // Invalid type
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('rejects expired token', async () => {
      // Mock token verification failure
      mockVerifyIdToken.mockRejectedValue(
        new Error('Firebase ID token has expired')
      )

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'expired-token' }
      })

      const response = await POST(request)
      
      expectUnauthorized(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid or expired token')
    })

    it('rejects invalid token', async () => {
      // Mock token verification failure
      mockVerifyIdToken.mockRejectedValue(
        new Error('Firebase ID token verification failed')
      )

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'invalid-token' }
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Token verification failed')
    })

    it('handles malformed request body', async () => {
      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { invalidField: 'test' }
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('handles empty request body', async () => {
      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: {}
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid request data')
    })

    it('returns user with emailVerified status', async () => {
      // Mock unverified user
      mockVerifyIdToken.mockResolvedValue({
        uid: TEST_UNVERIFIED_USER.uid,
        email: TEST_UNVERIFIED_USER.email,
        email_verified: TEST_UNVERIFIED_USER.emailVerified
      })

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'valid-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.user.emailVerified).toBe(false)
    })

    it('handles Firebase service unavailable', async () => {
      // Mock service error
      mockVerifyIdToken.mockRejectedValue(
        new Error('Firebase service temporarily unavailable')
      )

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'valid-token' }
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Token verification failed')
    })

    it('handles token with missing required claims', async () => {
      // Mock token with missing claims
      mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        // Missing email and email_verified
      })

      const { POST } = await import('../verify/route')
      
      const request = createMockRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: { token: 'token-missing-claims' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.user.uid).toBe(TEST_USER.uid)
      expect(data.user.email).toBeUndefined()
      expect(data.user.emailVerified).toBeUndefined()
    })
  })
}) 