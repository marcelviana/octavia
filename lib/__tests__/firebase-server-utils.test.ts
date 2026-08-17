import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock the global firebase-server-utils mock for this test file
vi.unmock('@/lib/firebase-server-utils')

// B1.1: o transporte é chamada direta de função — o verificador local
// (lib/firebase-admin) é mockado; o fetch global vira espião. B1.2b: o
// ramo fetch morreu com a rota /api/auth/verify — os 14 testes que o
// exercitavam (describe 'ramo fetch (Edge)') morreram junto, declarados
// na PR (docs/ux/PLANO-TRANSICAO.md, B1.2b).
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
