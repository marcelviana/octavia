import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  setupApiTestMocks,
  cleanupApiTestMocks,
  createMockRequest,
  expectUnauthorized,
  expectBadRequest,
  expectSuccess,
  getJsonResponse,
  TEST_USER
} from '@/lib/__tests__/api-test-helpers'

describe('/api/auth/session', () => {
  let mocks: ReturnType<typeof setupApiTestMocks>

  beforeEach(() => {
    mocks = setupApiTestMocks()
  })

  afterEach(() => {
    cleanupApiTestMocks()
  })

  describe('POST /api/auth/session', () => {
    it('sets session cookie with valid Firebase token', async () => {
      // Mock successful token verification
      mocks.firebase.mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        name: TEST_USER.displayName,
        picture: 'https://example.com/avatar.png' 
      })

      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'valid-firebase-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      
      // Check that session cookie was set
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('firebase-session=valid-firebase-token')
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('Path=/')
      
      // Verify Firebase token was validated
      expect(mocks.firebase.mockVerifyIdToken).toHaveBeenCalledWith('valid-firebase-token')
    })

    it('rejects request without idToken', async () => {
      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: {}
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
    })

    it('rejects request with invalid idToken format', async () => {
      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 123 } // Invalid type
      })

      const response = await POST(request)
      
      expectBadRequest(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Validation failed')
    })

    it('rejects expired Firebase token', async () => {
      // Mock token verification failure
      mocks.firebase.mockVerifyIdToken.mockRejectedValue(
        new Error('Firebase ID token has expired')
      )

      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'expired-token' }
      })

      const response = await POST(request)
      
      expectUnauthorized(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid or expired token')
    })

    it('rejects invalid Firebase token', async () => {
      // Mock token verification failure
      mocks.firebase.mockVerifyIdToken.mockRejectedValue(
        new Error('Firebase ID token verification failed')
      )

      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'invalid-token' }
      })

      const response = await POST(request)
      
      expectUnauthorized(response)
      
      const data = await getJsonResponse(response)
      expect(data.error).toBe('Unauthorized')
      expect(data.message).toBe('Invalid or expired token')
    })

    it('sets secure flag in production environment', async () => {
      // Mock production environment
      vi.stubEnv('NODE_ENV', 'production')

      mocks.firebase.mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        name: TEST_USER.displayName,
        picture: 'https://example.com/avatar.png'
      })

      const { POST } = await import('../session/route')
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'valid-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('Secure')
      
      // Restore environment
      vi.unstubAllEnvs()
    })

    it('does not set secure flag in development', async () => {
      // Ensure development environment
      vi.stubEnv('NODE_ENV', 'development')

      mocks.firebase.mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        name: TEST_USER.displayName,
        picture: 'https://example.com/avatar.png'
      })

      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'valid-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).not.toContain('Secure')
      
      // Restore environment
      vi.unstubAllEnvs()
    })

    it('handles malformed JSON body', async () => {
      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: 'invalid-json{'
      })

      const response = await POST(request)
      
      // Should handle JSON parsing error gracefully
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('sets correct cookie expiration', async () => {
      mocks.firebase.mockVerifyIdToken.mockResolvedValue({
        uid: TEST_USER.uid,
        email: TEST_USER.email,
        name: TEST_USER.displayName,
        picture: 'https://example.com/avatar.png'
      })

      const { POST } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'POST',
        body: { idToken: 'valid-token' }
      })

      const response = await POST(request)
      
      expectSuccess(response)
      
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('Max-Age=604800') // 7 days
    })
  })

  describe('DELETE /api/auth/session', () => {
    it('clears session cookie', async () => {
      const { DELETE } = await import('../session/route')
      
      const request = createMockRequest('http://localhost/api/auth/session', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      
      expectSuccess(response)
      
      const data = await getJsonResponse(response)
      expect(data.success).toBe(true)
      
      // Check that session cookie was cleared
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('firebase-session=')
      expect(setCookieHeader).toContain('Max-Age=0')
    })
  })
}) 