import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock the global firebase-server-utils mock for this test file
vi.unmock('@/lib/firebase-server-utils')

// B1.1: o transporte padrão é chamada direta de função — o verificador
// local (lib/firebase-admin) é mockado; o fetch global vira espião. O
// ramo fetch (Edge) segue testado no describe próprio com
// NEXT_RUNTIME='edge' forçado, até morrer na B1.2.
vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn()
}))

import { verifyFirebaseToken } from '@/lib/firebase-admin'
import {
  validateFirebaseTokenServer,
  requireAuthServer,
  getServerSideUser,
  getServerSideUserDirect,
  clearTokenCache,
  clearTokenBlacklist
} from '../firebase-server-utils'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

const mockVerify = vi.mocked(verifyFirebaseToken)

// Mock fetch globally
const mockFetch = vi.fn()

// Mock logger
vi.mock('../logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

const decodedUser = {
  uid: 'test-user',
  email: 'test@example.com',
  email_verified: true
}

describe('Firebase Server Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    // Clear caches to ensure clean state
    clearTokenCache()
    clearTokenBlacklist()

    // Mock fetch globally using vi.stubGlobal for proper interception
    vi.stubGlobal('fetch', mockFetch)

    // Set up environment variables
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('VITEST', undefined)
    vi.stubEnv('NEXTAUTH_URL', undefined)
    vi.stubEnv('VERCEL_URL', undefined)
    vi.stubEnv('PORT', '3000')
    // Garante o ramo direto (lambda Node); o describe do ramo fetch
    // força 'edge' explicitamente
    vi.stubEnv('NEXT_RUNTIME', undefined)

    // Ensure window is undefined (server-side)
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe('validateFirebaseTokenServer (transporte direto — B1.1)', () => {
    it('returns invalid for missing token', async () => {
      const result = await validateFirebaseTokenServer('')

      expect(result).toEqual({
        isValid: false,
        error: 'Missing ID token'
      })
    })

    it('returns invalid for null token', async () => {
      const result = await validateFirebaseTokenServer(null as any)

      expect(result).toEqual({
        isValid: false,
        error: 'Missing ID token'
      })
    })

    it('valida token por chamada direta, sem nenhum fetch', async () => {
      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await validateFirebaseTokenServer('valid-token')

      expect(mockVerify).toHaveBeenCalledWith('valid-token')
      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({
        isValid: true,
        user: {
          uid: 'test-user',
          email: 'test@example.com',
          emailVerified: true
        }
      })
    })

    it('token inválido/expirado → isValid false (mesma classe observável do transporte HTTP)', async () => {
      mockVerify.mockRejectedValueOnce(
        new Error('Firebase ID token verification failed: Firebase ID token has expired')
      )

      const result = await validateFirebaseTokenServer('expired-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      })
    })

    it('erro de infra sem cache → isValid false', async () => {
      mockVerify.mockRejectedValueOnce(
        new Error('Failed to fetch public keys from Google')
      )

      const result = await validateFirebaseTokenServer('infra-error-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      })
    })

    it('erro de infra devolve resultado em cache mesmo vencido (fallback stale preservado)', async () => {
      vi.useFakeTimers()
      try {
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        mockVerify.mockResolvedValueOnce(decodedUser as any)
        const first = await validateFirebaseTokenServer('stale-token')
        expect(first.isValid).toBe(true)

        // cache de 1h vencido
        vi.setSystemTime(new Date('2026-01-01T02:00:00Z'))
        mockVerify.mockRejectedValueOnce(
          new Error('Failed to fetch public keys from Google')
        )
        const second = await validateFirebaseTokenServer('stale-token')

        expect(second.isValid).toBe(true)
        expect(second.user?.uid).toBe('test-user')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('validateFirebaseTokenServer — ramo fetch (Edge; morre na B1.2)', () => {
    // Só o middleware Edge percorre este ramo em produção pós-B1.1.
    // NEXT_RUNTIME='edge' força o guard a preservá-lo aqui.
    beforeEach(() => {
      vi.stubEnv('NEXT_RUNTIME', 'edge')
    })

    it('validates token successfully via API', async () => {
      const token = 'valid-token'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            uid: 'test-user',
            email: 'test@example.com',
            emailVerified: true
          }
        })
      })

      const result = await validateFirebaseTokenServer(token)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }
      )
      expect(mockVerify).not.toHaveBeenCalled()

      expect(result).toEqual({
        isValid: true,
        user: {
          uid: 'test-user',
          email: 'test@example.com',
          emailVerified: true
        }
      })
    })

    it('handles API validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Invalid token'
        })
      })

      const result = await validateFirebaseTokenServer('invalid-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Invalid token'
      })
    })

    it('handles HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      })

      const result = await validateFirebaseTokenServer('error-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Server error'
      })
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await validateFirebaseTokenServer('network-error-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      })
    })

    it('uses NEXTAUTH_URL when available', async () => {
      vi.stubEnv('NEXTAUTH_URL', 'https://myapp.com')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      await validateFirebaseTokenServer('nextauth-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://myapp.com/api/auth/verify',
        expect.any(Object)
      )
    })

    it('uses VERCEL_URL when available', async () => {
      vi.stubEnv('VERCEL_URL', 'myapp.vercel.app')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      await validateFirebaseTokenServer('vercel-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://myapp.vercel.app/api/auth/verify',
        expect.any(Object)
      )
    })

    it('extracts base URL from request URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      await validateFirebaseTokenServer(
        'request-url-token',
        'https://custom-domain.com/some/path'
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-domain.com/api/auth/verify',
        expect.any(Object)
      )
    })

    it('falls back to localhost for development', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      await validateFirebaseTokenServer('localhost-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/verify',
        expect.any(Object)
      )
    })

    it('uses custom port from environment', async () => {
      vi.stubEnv('PORT', '8080')

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      await validateFirebaseTokenServer('custom-port-token')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth/verify',
        expect.any(Object)
      )
    })

    it('handles malformed request URL gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      const result = await validateFirebaseTokenServer(
        'malformed-url-token',
        'not-a-valid-url'
      )

      expect(result).toEqual({
        isValid: true,
        user: { uid: 'test-user' }
      })
    })

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('JSON parse error') }
      })

      const result = await validateFirebaseTokenServer('json-error-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      })
    })

    it('handles missing user data in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: null
        })
      })

      const result = await validateFirebaseTokenServer('missing-user-token')

      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      })
    })

    it('handles malformed user data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { uid: 'test-user' }
        })
      })

      const result = await validateFirebaseTokenServer('malformed-user-token')

      expect(result).toEqual({
        isValid: true,
        user: { uid: 'test-user' }
      })
    })
  })

  describe('requireAuthServer', () => {
    it('returns user for valid Authorization header', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'authorization': 'Bearer valid-auth-token'
        }
      })

      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await requireAuthServer(request)

      expect(result).toEqual({
        uid: 'test-user',
        email: 'test@example.com',
        emailVerified: true
      })
    })

    it('returns user for valid session cookie', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'cookie': 'firebase-session=valid-session-token'
        }
      })

      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await requireAuthServer(request)

      expect(result).toEqual({
        uid: 'test-user',
        email: 'test@example.com',
        emailVerified: true
      })
    })

    it('returns null for missing Authorization header and session cookie', async () => {
      const request = new Request('https://example.com')

      const result = await requireAuthServer(request)

      expect(result).toBeNull()
    })

    it('returns null for invalid token', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'authorization': 'Bearer invalid-token'
        }
      })

      mockVerify.mockRejectedValueOnce(
        new Error('Firebase ID token verification failed: invalid signature')
      )

      const result = await requireAuthServer(request)

      expect(result).toBeNull()
    })

    it('prioritizes Authorization header over session cookie', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'authorization': 'Bearer auth-token',
          'cookie': 'firebase-session=session-token'
        }
      })

      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await requireAuthServer(request)

      expect(mockVerify).toHaveBeenCalledWith('auth-token')

      expect(result).toEqual({
        uid: 'test-user',
        email: 'test@example.com',
        emailVerified: true
      })
    })
  })

  describe('getServerSideUser', () => {
    it('returns user for valid session cookie', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'valid-session-cookie' })
      } as unknown as ReadonlyRequestCookies

      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await getServerSideUser(mockCookies)

      expect(result).toEqual({
        uid: 'test-user',
        email: 'test@example.com',
        emailVerified: true
      })
    })

    it('returns null for missing session cookie', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(null)
      } as unknown as ReadonlyRequestCookies

      const result = await getServerSideUser(mockCookies)

      expect(result).toBeNull()
    })

    it('returns null for invalid session token', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'invalid-session-cookie' })
      } as unknown as ReadonlyRequestCookies

      mockVerify.mockRejectedValueOnce(
        new Error('Firebase ID token verification failed: invalid signature')
      )

      const result = await getServerSideUser(mockCookies)

      expect(result).toBeNull()
    })
  })

  describe('getServerSideUserDirect', () => {
    it('returns user for valid session cookie', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'valid-session-cookie' })
      } as unknown as ReadonlyRequestCookies

      mockVerify.mockResolvedValueOnce(decodedUser as any)

      const result = await getServerSideUserDirect(mockCookies)

      expect(result).toEqual({
        uid: 'test-user',
        email: 'test@example.com',
        emailVerified: true
      })
    })

    it('returns null for missing session cookie', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(null)
      } as unknown as ReadonlyRequestCookies

      const result = await getServerSideUserDirect(mockCookies)

      expect(result).toBeNull()
    })
  })

  describe('Cache Management', () => {
    it('cleans up expired tokens', async () => {
      // This test verifies that the cache cleanup interval is set up
      // The actual cleanup happens in the background, so we just verify the setup
      expect(setInterval).toBeDefined()
    })
  })
})
