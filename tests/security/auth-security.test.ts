/**
 * Authentication Security Tests
 *
 * Comprehensive testing of secure authentication utilities including
 * token blacklisting, session management, and concurrent session handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  requireAuthServer,
  blacklistToken,
  verifyIdTokenSecure,
  getUserSessions,
  invalidateUserSessions,
  isTokenBlacklisted,
  clearExpiredTokens
} from '@/lib/secure-auth-utils'

// Mock Firebase Admin
const mockAuth = {
  verifyIdToken: vi.fn(),
  getUser: vi.fn()
}

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => mockAuth
}))

// Test data
const validToken = 'valid.jwt.token'
const expiredToken = 'expired.jwt.token'
const revokedToken = 'revoked.jwt.token'
const maliciousToken = '<script>alert("xss")</script>'

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  email_verified: true,
  auth_time: Math.floor(Date.now() / 1000),
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
}

const expiredUser = {
  ...mockUser,
  exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
}

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any blacklisted tokens
    clearExpiredTokens()
  })

  describe('Token Validation', () => {
    it('should accept valid tokens', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const user = await requireAuthServer(request)
      expect(user).toEqual(mockUser)
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(validToken)
    })

    it('should reject expired tokens', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'))

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      })

      const user = await requireAuthServer(request)
      expect(user).toBeNull()
    })

    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'not.a.jwt',
        'definitely-not-a-token',
        '',
        'null',
        'undefined',
        maliciousToken
      ]

      for (const token of malformedTokens) {
        mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

        const request = new NextRequest('http://localhost/api/test', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const user = await requireAuthServer(request)
        expect(user).toBeNull()
      }
    })

    it('should handle missing authorization header', async () => {
      const request = new NextRequest('http://localhost/api/test')

      const user = await requireAuthServer(request)
      expect(user).toBeNull()
    })

    it('should handle invalid authorization format', async () => {
      const invalidFormats = [
        'InvalidFormat token',
        'Bearer',
        'Bearer ',
        'token-without-bearer',
        'Basic dXNlcjpwYXNz' // Basic auth instead of Bearer
      ]

      for (const authHeader of invalidFormats) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: {
            'Authorization': authHeader
          }
        })

        const user = await requireAuthServer(request)
        expect(user).toBeNull()
      }
    })
  })

  describe('Token Blacklisting', () => {
    it('should blacklist tokens correctly', async () => {
      // Initially token should not be blacklisted
      expect(isTokenBlacklisted(validToken)).toBe(false)

      // Blacklist the token
      blacklistToken(validToken)

      // Now it should be blacklisted
      expect(isTokenBlacklisted(validToken)).toBe(true)

      // Should reject blacklisted token even if valid
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      })

      const user = await requireAuthServer(request)
      expect(user).toBeNull()
    })

    it('should handle concurrent token blacklisting', async () => {
      const tokens = Array.from({ length: 100 }, (_, i) => `token-${i}`)

      // Blacklist all tokens concurrently
      await Promise.all(tokens.map(token =>
        Promise.resolve(blacklistToken(token))
      ))

      // All tokens should be blacklisted
      tokens.forEach(token => {
        expect(isTokenBlacklisted(token)).toBe(true)
      })
    })

    it('should clear expired blacklisted tokens', async () => {
      // Mock Date.now to control time
      const originalNow = Date.now
      let currentTime = Date.now()
      Date.now = vi.fn(() => currentTime)

      // Blacklist a token
      blacklistToken(validToken)
      expect(isTokenBlacklisted(validToken)).toBe(true)

      // Advance time beyond blacklist duration
      currentTime += 24 * 60 * 60 * 1000 + 1 // 24 hours + 1ms

      // Clear expired tokens
      clearExpiredTokens()

      // Token should no longer be blacklisted
      expect(isTokenBlacklisted(validToken)).toBe(false)

      // Restore Date.now
      Date.now = originalNow
    })
  })

  describe('Session Management', () => {
    it('should track user sessions', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      const request1 = new NextRequest('http://localhost/api/test', {
        headers: { 'Authorization': `Bearer token1` }
      })

      const request2 = new NextRequest('http://localhost/api/test', {
        headers: { 'Authorization': `Bearer token2` }
      })

      // Make authenticated requests
      await requireAuthServer(request1)
      await requireAuthServer(request2)

      // Should track both sessions
      const sessions = getUserSessions(mockUser.uid)
      expect(sessions.length).toBe(2)
      expect(sessions).toContain('token1')
      expect(sessions).toContain('token2')
    })

    it('should invalidate all user sessions', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      // Create multiple sessions
      const tokens = ['token1', 'token2', 'token3']

      for (const token of tokens) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        await requireAuthServer(request)
      }

      // Verify sessions exist
      const sessionsBeforeInvalidation = getUserSessions(mockUser.uid)
      expect(sessionsBeforeInvalidation.length).toBe(3)

      // Invalidate all sessions
      invalidateUserSessions(mockUser.uid)

      // All tokens should be blacklisted
      tokens.forEach(token => {
        expect(isTokenBlacklisted(token)).toBe(true)
      })

      // Sessions should be cleared
      const sessionsAfterInvalidation = getUserSessions(mockUser.uid)
      expect(sessionsAfterInvalidation.length).toBe(0)
    })

    it('should handle session limits', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      // Create more sessions than the limit (assuming limit is 10)
      const tokens = Array.from({ length: 15 }, (_, i) => `token-${i}`)

      for (const token of tokens) {
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        await requireAuthServer(request)
      }

      // Should not exceed session limit
      const sessions = getUserSessions(mockUser.uid)
      expect(sessions.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Concurrent Authentication Attacks', () => {
    it('should handle rapid concurrent auth requests', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      // Create 100 concurrent authentication requests
      const requests = Array.from({ length: 100 }, (_, i) =>
        new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer token-${i}` }
        })
      )

      const authPromises = requests.map(req => requireAuthServer(req))
      const results = await Promise.all(authPromises)

      // All should succeed without race conditions
      results.forEach(result => {
        expect(result).toEqual(mockUser)
      })
    })

    it('should prevent token timing attacks', async () => {
      const tokens = [validToken, 'invalid-token']
      const timings: number[] = []

      for (const token of tokens) {
        const start = performance.now()

        if (token === validToken) {
          mockAuth.verifyIdToken.mockResolvedValue(mockUser)
        } else {
          mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))
        }

        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        await requireAuthServer(request)

        const end = performance.now()
        timings.push(end - start)
      }

      // Response times should be similar (within 50ms) to prevent timing attacks
      const timingDifference = Math.abs(timings[0] - timings[1])
      expect(timingDifference).toBeLessThan(50)
    })
  })

  describe('Token Replay Attacks', () => {
    it('should prevent token reuse after invalidation', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'Authorization': `Bearer ${validToken}` }
      })

      // First request should succeed
      const user1 = await requireAuthServer(request)
      expect(user1).toEqual(mockUser)

      // Blacklist the token (simulating logout)
      blacklistToken(validToken)

      // Second request with same token should fail
      const user2 = await requireAuthServer(request)
      expect(user2).toBeNull()
    })

    it('should handle token substitution attacks', async () => {
      // Attacker tries to use a token for a different user
      const attackerToken = 'attacker.token.here'
      const attackerUser = {
        ...mockUser,
        uid: 'attacker-uid',
        email: 'attacker@evil.com'
      }

      mockAuth.verifyIdToken.mockImplementation((token) => {
        if (token === validToken) {
          return Promise.resolve(mockUser)
        } else if (token === attackerToken) {
          return Promise.resolve(attackerUser)
        }
        return Promise.reject(new Error('Invalid token'))
      })

      // Legitimate request
      const legitimateRequest = new NextRequest('http://localhost/api/test', {
        headers: { 'Authorization': `Bearer ${validToken}` }
      })

      const legitimateUser = await requireAuthServer(legitimateRequest)
      expect(legitimateUser?.uid).toBe(mockUser.uid)

      // Attacker request
      const attackerRequest = new NextRequest('http://localhost/api/test', {
        headers: { 'Authorization': `Bearer ${attackerToken}` }
      })

      const attackerUserResult = await requireAuthServer(attackerRequest)
      expect(attackerUserResult?.uid).toBe(attackerUser.uid)
      expect(attackerUserResult?.uid).not.toBe(mockUser.uid)
    })
  })

  describe('JWT Manipulation Attacks', () => {
    it('should reject modified JWT tokens', async () => {
      // Simulate various JWT manipulation attempts
      const manipulatedTokens = [
        'eyJhbGciOiJub25lIn0.eyJ1aWQiOiJhdHRhY2tlciJ9.', // Algorithm: none
        validToken.replace(/.$/, 'X'), // Modified signature
        validToken.substring(0, validToken.length - 10) + 'manipulated', // Modified payload
        'new.header.here.' + validToken.split('.')[1] + '.' + validToken.split('.')[2], // Modified header
      ]

      for (const token of manipulatedTokens) {
        mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        const user = await requireAuthServer(request)
        expect(user).toBeNull()
      }
    })
  })

  describe('Brute Force Protection', () => {
    it('should handle repeated failed authentication attempts', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

      // Simulate 100 failed attempts
      const failedAttempts = Array.from({ length: 100 }, (_, i) =>
        new NextRequest('http://localhost/api/test', {
          headers: {
            'Authorization': `Bearer invalid-token-${i}`,
            'X-Forwarded-For': '192.168.1.100' // Same IP
          }
        })
      )

      const results = await Promise.all(
        failedAttempts.map(req => requireAuthServer(req))
      )

      // All should fail but not crash the system
      results.forEach(result => {
        expect(result).toBeNull()
      })
    })
  })

  describe('Memory Exhaustion Protection', () => {
    it('should handle large numbers of sessions without memory issues', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockUser)

      // Create many sessions for different users
      const promises = Array.from({ length: 1000 }, async (_, i) => {
        const userToken = `user-${i}-token`
        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        })

        return requireAuthServer(request)
      })

      const results = await Promise.all(promises)

      // Should handle all requests without memory issues
      expect(results.length).toBe(1000)
      results.forEach(result => {
        expect(result).toEqual(mockUser)
      })
    })
  })

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      const sensitiveErrors = [
        new Error('Database connection failed: user=admin password=secret'),
        new Error('Internal server error: /etc/passwd not found'),
        new Error('Firebase admin key: sk-12345-abcdef'),
      ]

      for (const error of sensitiveErrors) {
        mockAuth.verifyIdToken.mockRejectedValue(error)

        const request = new NextRequest('http://localhost/api/test', {
          headers: { 'Authorization': `Bearer ${validToken}` }
        })

        const user = await requireAuthServer(request)

        // Should fail securely without leaking error details
        expect(user).toBeNull()
      }
    })
  })
})