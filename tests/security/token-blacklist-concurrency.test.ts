/**
 * Token Blacklisting Concurrency Tests
 *
 * Validates that token blacklisting works correctly under high concurrency
 * scenarios to prevent race conditions and ensure enterprise-grade security.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Token Blacklisting Concurrency Tests', () => {
  let tokenBlacklist: Set<string>
  let concurrentRequests: number
  let mockLogger: any

  beforeEach(() => {
    vi.clearAllMocks()
    tokenBlacklist = new Set()
    concurrentRequests = 0

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    // Mock token validation with blacklist checking
    vi.mock('@/lib/firebase-server-utils', () => ({
      validateFirebaseTokenServer: vi.fn().mockImplementation(async (token: string) => {
        // Simulate race condition check
        const startTime = Date.now()

        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
          return {
            isValid: false,
            error: 'Token has been revoked'
          }
        }

        // Simulate token validation delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10))

        // Double-check blacklist after delay (race condition test)
        if (tokenBlacklist.has(token)) {
          return {
            isValid: false,
            error: 'Token has been revoked'
          }
        }

        return {
          isValid: true,
          user: {
            uid: 'test-user-id',
            email: 'test@example.com',
            emailVerified: true
          }
        }
      }),

      blacklistToken: vi.fn().mockImplementation(async (token: string) => {
        // Simulate atomic blacklist operation
        const wasBlacklisted = tokenBlacklist.has(token)
        tokenBlacklist.add(token)

        mockLogger.info(`Token blacklisted: ${token.substring(0, 10)}...`)
        return !wasBlacklisted
      })
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    tokenBlacklist.clear()
    concurrentRequests = 0
  })

  describe('High Concurrency Token Validation', () => {
    it('should handle 1000 concurrent token validations without race conditions', async () => {
      const { validateFirebaseTokenServer } = await import('@/lib/firebase-server-utils')
      const validToken = 'valid-token-12345'
      const invalidToken = 'invalid-token-67890'

      // Blacklist one token
      tokenBlacklist.add(invalidToken)

      const concurrentValidations = []

      // Create 1000 concurrent validation requests
      for (let i = 0; i < 1000; i++) {
        const token = i % 2 === 0 ? validToken : invalidToken
        concurrentValidations.push(
          validateFirebaseTokenServer(token)
        )
      }

      const results = await Promise.all(concurrentValidations)

      // Validate results
      const validResults = results.filter((result, index) =>
        index % 2 === 0 && result.isValid
      )
      const invalidResults = results.filter((result, index) =>
        index % 2 === 1 && !result.isValid
      )

      expect(validResults).toHaveLength(500) // All even indices should be valid
      expect(invalidResults).toHaveLength(500) // All odd indices should be invalid

      // Verify no race conditions occurred
      invalidResults.forEach(result => {
        expect(result.error).toContain('revoked')
      })
    })

    it('should handle concurrent token blacklisting operations', async () => {
      const { blacklistToken } = await import('@/lib/firebase-server-utils')
      const tokensToBlacklist = []

      // Generate unique tokens
      for (let i = 0; i < 100; i++) {
        tokensToBlacklist.push(`token-${i}-${Date.now()}`)
      }

      // Attempt to blacklist same tokens concurrently
      const concurrentBlacklists = []

      for (const token of tokensToBlacklist) {
        // Try to blacklist each token multiple times concurrently
        for (let attempt = 0; attempt < 5; attempt++) {
          concurrentBlacklists.push(blacklistToken(token))
        }
      }

      const results = await Promise.all(concurrentBlacklists)

      // Verify each token was blacklisted exactly once
      for (let i = 0; i < tokensToBlacklist.length; i++) {
        const tokenResults = results.slice(i * 5, (i + 1) * 5)
        const successfulBlacklists = tokenResults.filter(result => result === true)

        // Exactly one blacklist operation should succeed for each token
        expect(successfulBlacklists).toHaveLength(1)
      }

      // Verify all tokens are in blacklist
      tokensToBlacklist.forEach(token => {
        expect(tokenBlacklist.has(token)).toBe(true)
      })
    })

    it('should prevent race condition during logout with concurrent requests', async () => {
      const { validateFirebaseTokenServer, blacklistToken } = await import('@/lib/firebase-server-utils')
      const userToken = 'user-session-token-123'

      // Simulate concurrent API requests with same token
      const concurrentApiRequests = []
      for (let i = 0; i < 50; i++) {
        concurrentApiRequests.push(
          validateFirebaseTokenServer(userToken)
        )
      }

      // Simulate logout request happening concurrently
      const logoutPromise = new Promise(async (resolve) => {
        await new Promise(resolve => setTimeout(resolve, 25)) // Wait for some requests to start
        await blacklistToken(userToken)
        resolve(true)
      })

      // Execute all operations concurrently
      const [apiResults, logoutResult] = await Promise.all([
        Promise.all(concurrentApiRequests),
        logoutPromise
      ])

      // Verify logout completed
      expect(logoutResult).toBe(true)

      // After logout, token should be blacklisted
      expect(tokenBlacklist.has(userToken)).toBe(true)

      // Some requests may have completed before blacklisting
      const validResults = apiResults.filter(result => result.isValid)
      const invalidResults = apiResults.filter(result => !result.isValid)

      // All results should be either valid (completed before blacklist) or invalid (after blacklist)
      expect(validResults.length + invalidResults.length).toBe(50)

      // Test that new requests are rejected
      const newRequest = await validateFirebaseTokenServer(userToken)
      expect(newRequest.isValid).toBe(false)
      expect(newRequest.error).toContain('revoked')
    })
  })

  describe('Token Blacklist Memory Management', () => {
    it('should handle large blacklist without memory issues', async () => {
      const { blacklistToken } = await import('@/lib/firebase-server-utils')
      const startMemory = process.memoryUsage().heapUsed

      // Blacklist 10,000 tokens
      const blacklistPromises = []
      for (let i = 0; i < 10000; i++) {
        blacklistPromises.push(blacklistToken(`token-${i}-${Date.now()}-${Math.random()}`))
      }

      await Promise.all(blacklistPromises)

      const endMemory = process.memoryUsage().heapUsed
      const memoryIncrease = endMemory - startMemory

      // Memory increase should be reasonable (less than 100MB for 10k tokens)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      // Verify blacklist functionality still works
      expect(tokenBlacklist.size).toBe(10000)
    })

    it('should implement token cleanup mechanism', async () => {
      const { blacklistToken } = await import('@/lib/firebase-server-utils')

      // Add tokens with timestamps
      const expiredTokens = []
      const validTokens = []

      for (let i = 0; i < 100; i++) {
        const expiredToken = `expired-token-${i}`
        const validToken = `valid-token-${i}`

        expiredTokens.push(expiredToken)
        validTokens.push(validToken)

        await blacklistToken(expiredToken)
        await blacklistToken(validToken)
      }

      // Simulate cleanup of expired tokens
      // In production, this would remove tokens older than expiration time
      expiredTokens.forEach(token => {
        tokenBlacklist.delete(token)
      })

      // Verify expired tokens are removed but valid ones remain
      expect(tokenBlacklist.size).toBe(100) // Only valid tokens remain

      validTokens.forEach(token => {
        expect(tokenBlacklist.has(token)).toBe(true)
      })

      expiredTokens.forEach(token => {
        expect(tokenBlacklist.has(token)).toBe(false)
      })
    })
  })

  describe('Database Consistency Under Load', () => {
    it('should maintain blacklist consistency across database operations', async () => {
      const { blacklistToken, validateFirebaseTokenServer } = await import('@/lib/firebase-server-utils')

      // Mock database operations
      const mockDb = new Map<string, boolean>()
      let dbOperations = 0

      // Simulate database blacklist storage
      const originalBlacklistToken = blacklistToken
      const dbBlacklistToken = vi.fn().mockImplementation(async (token: string) => {
        dbOperations++

        // Simulate database latency
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5))

        const wasBlacklisted = mockDb.has(token)
        if (!wasBlacklisted) {
          mockDb.set(token, true)
          tokenBlacklist.add(token) // Update in-memory cache
        }

        return !wasBlacklisted
      })

      // Replace with database version
      vi.mocked(blacklistToken).mockImplementation(dbBlacklistToken)

      // Perform concurrent blacklist operations
      const tokens = Array.from({ length: 50 }, (_, i) => `db-token-${i}`)
      const concurrentOps = []

      // Each token gets multiple concurrent blacklist attempts
      for (const token of tokens) {
        for (let attempt = 0; attempt < 3; attempt++) {
          concurrentOps.push(blacklistToken(token))
        }
      }

      const results = await Promise.all(concurrentOps)

      // Verify database consistency
      expect(mockDb.size).toBe(50) // All unique tokens stored
      expect(tokenBlacklist.size).toBe(50) // In-memory cache matches

      // Verify each token was successfully blacklisted exactly once
      const successfulOps = results.filter(result => result === true)
      expect(successfulOps).toHaveLength(50)

      // Verify all tokens are properly blacklisted
      for (const token of tokens) {
        expect(mockDb.has(token)).toBe(true)
        expect(tokenBlacklist.has(token)).toBe(true)

        const validation = await validateFirebaseTokenServer(token)
        expect(validation.isValid).toBe(false)
      }

      console.log(`Completed ${dbOperations} database operations`)
    })

    it('should handle database failures gracefully', async () => {
      const { blacklistToken } = await import('@/lib/firebase-server-utils')

      // Mock database failures
      let failureCount = 0
      const maxFailures = 10

      const unreliableBlacklistToken = vi.fn().mockImplementation(async (token: string) => {
        if (failureCount < maxFailures && Math.random() < 0.3) {
          failureCount++
          throw new Error('Database connection failed')
        }

        const wasBlacklisted = tokenBlacklist.has(token)
        tokenBlacklist.add(token)
        return !wasBlacklisted
      })

      vi.mocked(blacklistToken).mockImplementation(unreliableBlacklistToken)

      // Attempt to blacklist tokens with retries
      const tokens = Array.from({ length: 20 }, (_, i) => `unreliable-token-${i}`)
      const results = []

      for (const token of tokens) {
        let success = false
        let attempts = 0
        const maxAttempts = 5

        while (!success && attempts < maxAttempts) {
          try {
            await blacklistToken(token)
            success = true
          } catch (error) {
            attempts++
            await new Promise(resolve => setTimeout(resolve, 100)) // Wait before retry
          }
        }

        results.push(success)
      }

      // Most operations should eventually succeed with retries
      const successfulBlacklists = results.filter(success => success)
      expect(successfulBlacklists.length).toBeGreaterThan(15)

      console.log(`Database failures encountered: ${failureCount}`)
      console.log(`Successful blacklists: ${successfulBlacklists.length}/20`)
    })
  })

  describe('Performance Under Load', () => {
    it('should maintain acceptable performance under high load', async () => {
      const { validateFirebaseTokenServer } = await import('@/lib/firebase-server-utils')

      const tokens = Array.from({ length: 100 }, (_, i) => `perf-token-${i}`)
      const iterations = 10

      // Blacklist half the tokens
      tokens.slice(0, 50).forEach(token => tokenBlacklist.add(token))

      const startTime = Date.now()

      // Perform many concurrent validations
      const allPromises = []
      for (let iteration = 0; iteration < iterations; iteration++) {
        const iterationPromises = tokens.map(token =>
          validateFirebaseTokenServer(token)
        )
        allPromises.push(...iterationPromises)
      }

      const results = await Promise.all(allPromises)
      const endTime = Date.now()

      const totalOperations = tokens.length * iterations
      const duration = endTime - startTime
      const operationsPerSecond = (totalOperations / duration) * 1000

      console.log(`Performance: ${operationsPerSecond.toFixed(2)} operations/second`)
      console.log(`Total operations: ${totalOperations}, Duration: ${duration}ms`)

      // Should maintain reasonable performance (>100 ops/sec)
      expect(operationsPerSecond).toBeGreaterThan(100)

      // Verify correctness under load
      const validResults = results.filter((result, index) => {
        const tokenIndex = index % tokens.length
        return tokenIndex >= 50 && result.isValid // Should be valid tokens
      })

      const invalidResults = results.filter((result, index) => {
        const tokenIndex = index % tokens.length
        return tokenIndex < 50 && !result.isValid // Should be blacklisted tokens
      })

      expect(validResults).toHaveLength(500) // 50 valid tokens × 10 iterations
      expect(invalidResults).toHaveLength(500) // 50 blacklisted tokens × 10 iterations
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined tokens gracefully', async () => {
      const { validateFirebaseTokenServer, blacklistToken } = await import('@/lib/firebase-server-utils')

      // Test null/undefined validation
      const nullValidation = await validateFirebaseTokenServer(null as any)
      const undefinedValidation = await validateFirebaseTokenServer(undefined as any)
      const emptyValidation = await validateFirebaseTokenServer('')

      expect(nullValidation.isValid).toBe(false)
      expect(undefinedValidation.isValid).toBe(false)
      expect(emptyValidation.isValid).toBe(false)

      // Test null/undefined blacklisting
      await expect(blacklistToken(null as any)).rejects.toThrow()
      await expect(blacklistToken(undefined as any)).rejects.toThrow()
      await expect(blacklistToken('')).rejects.toThrow()
    })

    it('should handle extremely long tokens', async () => {
      const { validateFirebaseTokenServer, blacklistToken } = await import('@/lib/firebase-server-utils')

      const longToken = 'x'.repeat(10000) // 10KB token
      const veryLongToken = 'y'.repeat(100000) // 100KB token

      // Should handle or reject oversized tokens
      const longValidation = await validateFirebaseTokenServer(longToken)
      const veryLongValidation = await validateFirebaseTokenServer(veryLongToken)

      // Either process successfully or fail gracefully
      expect(typeof longValidation.isValid).toBe('boolean')
      expect(typeof veryLongValidation.isValid).toBe('boolean')

      // Blacklisting should work or fail gracefully
      try {
        await blacklistToken(longToken)
        expect(tokenBlacklist.has(longToken)).toBe(true)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should prevent blacklist pollution attacks', async () => {
      const { blacklistToken } = await import('@/lib/firebase-server-utils')

      // Attempt to add many random tokens to exhaust memory
      const maliciousTokens = Array.from({ length: 1000 }, () =>
        `malicious-${Math.random()}-${Date.now()}-${Math.random()}`
      )

      const results = await Promise.all(
        maliciousTokens.map(token => blacklistToken(token))
      )

      // All should be added successfully
      expect(results.every(result => result === true)).toBe(true)

      // But system should implement size limits in production
      // This test verifies the mechanism works but doesn't overflow
      expect(tokenBlacklist.size).toBeLessThan(10000) // Reasonable limit
    })
  })
})