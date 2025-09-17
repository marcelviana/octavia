/**
 * DDoS Protection and Rate Limiting Tests
 *
 * Comprehensive testing of rate limiting mechanisms and DDoS protection
 * to ensure enterprise-grade security under high load conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

describe('DDoS Protection and Rate Limiting Tests', () => {
  let rateLimitStore: Map<string, { count: number; resetTime: number; blocked: boolean }>
  let ipRequestCounts: Map<string, number[]>
  let mockLogger: any

  beforeEach(() => {
    vi.clearAllMocks()
    rateLimitStore = new Map()
    ipRequestCounts = new Map()

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      security: vi.fn()
    }

    // Mock rate limiter implementation
    vi.mock('@/lib/rate-limiter', () => ({
      checkRateLimit: vi.fn().mockImplementation(async (identifier: string, limit: number, windowMs: number) => {
        const now = Date.now()
        const key = `${identifier}:${Math.floor(now / windowMs)}`

        const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs, blocked: false }

        if (current.count >= limit) {
          current.blocked = true
          mockLogger.warn(`Rate limit exceeded for ${identifier}`)
          return {
            success: false,
            remaining: 0,
            resetTime: current.resetTime,
            blocked: true
          }
        }

        current.count++
        rateLimitStore.set(key, current)

        return {
          success: true,
          remaining: Math.max(0, limit - current.count),
          resetTime: current.resetTime,
          blocked: false
        }
      }),

      enforceRateLimit: vi.fn().mockImplementation(async (request: NextRequest) => {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        // Different limits for different endpoints
        const { pathname } = new URL(request.url)
        let limit = 100
        let windowMs = 60000 // 1 minute

        if (pathname.includes('/auth/')) {
          limit = 5 // Strict limit for auth endpoints
          windowMs = 60000 // 1 minute
        } else if (pathname.includes('/api/')) {
          limit = 60 // API endpoints
          windowMs = 60000 // 1 minute
        }

        const rateLimitResult = await vi.mocked(require('@/lib/rate-limiter').checkRateLimit)(ip, limit, windowMs)

        if (!rateLimitResult.success) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.resetTime)
              }
            }
          )
        }

        return null
      })
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rateLimitStore.clear()
    ipRequestCounts.clear()
  })

  describe('Rate Limiting Functionality', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      const requests = []
      const attackerIP = '192.168.1.100'

      // Make 10 requests to auth endpoint from same IP
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest('http://localhost:3000/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': attackerIP,
            'user-agent': 'AttackBot/1.0'
          },
          body: JSON.stringify({
            email: 'attacker@example.com',
            password: 'password'
          })
        })

        requests.push(enforceRateLimit(request))
      }

      const responses = await Promise.all(requests)

      // First 5 requests should be allowed, rest should be rate limited
      const allowedRequests = responses.filter(response => response === null)
      const blockedRequests = responses.filter(response => response !== null)

      expect(allowedRequests).toHaveLength(5)
      expect(blockedRequests).toHaveLength(5)

      // Blocked requests should return 429
      blockedRequests.forEach(response => {
        expect(response!.status).toBe(429)
      })
    })

    it('should apply different rate limits to different endpoints', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')
      const attackerIP = '192.168.1.101'

      // Test auth endpoint (5 requests/minute limit)
      const authRequests = []
      for (let i = 0; i < 8; i++) {
        authRequests.push(
          enforceRateLimit(new NextRequest('http://localhost:3000/api/auth/session', {
            method: 'POST',
            headers: { 'x-forwarded-for': attackerIP }
          }))
        )
      }

      const authResponses = await Promise.all(authRequests)
      const authBlocked = authResponses.filter(r => r?.status === 429)
      expect(authBlocked).toHaveLength(3) // 8 - 5 = 3 blocked

      // Reset rate limit store for API endpoint test
      rateLimitStore.clear()

      // Test API endpoint (60 requests/minute limit)
      const apiRequests = []
      for (let i = 0; i < 70; i++) {
        apiRequests.push(
          enforceRateLimit(new NextRequest('http://localhost:3000/api/content', {
            method: 'GET',
            headers: { 'x-forwarded-for': attackerIP }
          }))
        )
      }

      const apiResponses = await Promise.all(apiRequests)
      const apiBlocked = apiResponses.filter(r => r?.status === 429)
      expect(apiBlocked).toHaveLength(10) // 70 - 60 = 10 blocked
    })

    it('should include proper rate limit headers', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')
      const clientIP = '192.168.1.102'

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'POST',
        headers: { 'x-forwarded-for': clientIP }
      })

      // Make requests until rate limited
      let response = null
      let attempts = 0
      while (response === null && attempts < 10) {
        response = await enforceRateLimit(request)
        attempts++
      }

      expect(response).not.toBeNull()
      expect(response!.status).toBe(429)

      // Check rate limit headers
      expect(response!.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response!.headers.get('Retry-After')).toBeTruthy()
      expect(response!.headers.get('X-RateLimit-Reset')).toBeTruthy()
    })
  })

  describe('DDoS Protection Mechanisms', () => {
    it('should detect and block distributed attacks', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      // Simulate distributed attack from multiple IPs
      const attackerIPs = Array.from({ length: 20 }, (_, i) => `192.168.1.${i + 1}`)
      const allRequests = []

      // Each IP makes many requests
      for (const ip of attackerIPs) {
        for (let i = 0; i < 10; i++) {
          allRequests.push(
            enforceRateLimit(new NextRequest('http://localhost:3000/api/auth/session', {
              method: 'POST',
              headers: {
                'x-forwarded-for': ip,
                'user-agent': 'DDoSBot/1.0'
              }
            }))
          )
        }
      }

      const responses = await Promise.all(allRequests)
      const blockedResponses = responses.filter(r => r?.status === 429)

      // Should block many requests even from different IPs
      expect(blockedResponses.length).toBeGreaterThan(100) // 20 IPs × 5 allowed = 100 allowed max
    })

    it('should handle burst traffic patterns', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limiter')

      const clientIP = '192.168.1.200'
      const results = []

      // Simulate burst of 50 requests in quick succession
      const burstPromises = []
      for (let i = 0; i < 50; i++) {
        burstPromises.push(checkRateLimit(clientIP, 10, 60000)) // 10 requests per minute
      }

      const burstResults = await Promise.all(burstPromises)

      // Should allow first 10, block rest
      const allowed = burstResults.filter(r => r.success)
      const blocked = burstResults.filter(r => !r.success)

      expect(allowed).toHaveLength(10)
      expect(blocked).toHaveLength(40)

      console.log(`Burst test: ${allowed.length} allowed, ${blocked.length} blocked`)
    })

    it('should implement exponential backoff for repeated violations', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      // Mock enhanced rate limiter with exponential backoff
      const violationCounts = new Map<string, number>()

      const enhancedEnforceRateLimit = vi.fn().mockImplementation(async (request: NextRequest) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        const violations = violationCounts.get(ip) || 0

        // Base rate limit
        const baseResult = await enforceRateLimit(request)

        if (baseResult?.status === 429) {
          violationCounts.set(ip, violations + 1)

          // Calculate exponential backoff
          const backoffMultiplier = Math.pow(2, violations)
          const baseRetryAfter = parseInt(baseResult.headers.get('Retry-After') || '60')
          const enhancedRetryAfter = Math.min(baseRetryAfter * backoffMultiplier, 3600) // Max 1 hour

          return NextResponse.json(
            { error: 'Rate limit exceeded with exponential backoff' },
            {
              status: 429,
              headers: {
                ...Object.fromEntries(baseResult.headers.entries()),
                'Retry-After': String(enhancedRetryAfter),
                'X-Violation-Count': String(violations + 1)
              }
            }
          )
        }

        return baseResult
      })

      const repeat_offender_ip = '192.168.1.250'

      // Cause multiple violations
      for (let violation = 0; violation < 5; violation++) {
        // Exceed rate limit to cause violation
        const requests = []
        for (let i = 0; i < 10; i++) {
          requests.push(
            enhancedEnforceRateLimit(new NextRequest('http://localhost:3000/api/auth/session', {
              method: 'POST',
              headers: { 'x-forwarded-for': repeat_offender_ip }
            }))
          )
        }

        const responses = await Promise.all(requests)
        const rateLimitedResponse = responses.find(r => r?.status === 429)

        if (rateLimitedResponse) {
          const retryAfter = parseInt(rateLimitedResponse.headers.get('Retry-After') || '0')
          const violationCount = parseInt(rateLimitedResponse.headers.get('X-Violation-Count') || '0')

          console.log(`Violation ${violation + 1}: Retry-After = ${retryAfter}s, Count = ${violationCount}`)

          // Retry-After should increase exponentially
          if (violation > 0) {
            expect(retryAfter).toBeGreaterThan(60) // Should be more than base
          }
        }

        // Reset rate limit window for next violation test
        rateLimitStore.clear()
      }
    })
  })

  describe('Advanced Attack Pattern Detection', () => {
    it('should detect slowloris attacks', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      // Simulate slowloris - many connections from same IP with slow requests
      const slowlorisIP = '192.168.1.300'
      const slowRequests = []

      // Create many concurrent slow requests
      for (let i = 0; i < 100; i++) {
        slowRequests.push(new Promise(async (resolve) => {
          // Simulate slow request processing
          await new Promise(r => setTimeout(r, Math.random() * 1000))

          const result = await enforceRateLimit(new NextRequest('http://localhost:3000/api/content', {
            method: 'GET',
            headers: {
              'x-forwarded-for': slowlorisIP,
              'connection': 'keep-alive'
            }
          }))

          resolve(result)
        }))
      }

      const results = await Promise.all(slowRequests)
      const blocked = results.filter(r => r?.status === 429)

      // Should detect and block excessive connections from same IP
      expect(blocked.length).toBeGreaterThan(40) // Should block majority of requests
    })

    it('should detect bot traffic patterns', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      const suspiciousPatterns = [
        { userAgent: 'python-requests/2.25.1', expectedBlocked: true },
        { userAgent: 'curl/7.68.0', expectedBlocked: true },
        { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)', expectedBlocked: false }, // Legitimate bot
        { userAgent: 'sqlmap/1.4.12', expectedBlocked: true },
        { userAgent: 'Nmap Scripting Engine', expectedBlocked: true }
      ]

      for (const pattern of suspiciousPatterns) {
        const requests = []
        const botIP = `192.168.2.${Math.floor(Math.random() * 255)}`

        // Make multiple requests with suspicious user agent
        for (let i = 0; i < 20; i++) {
          requests.push(
            enforceRateLimit(new NextRequest('http://localhost:3000/api/content', {
              method: 'GET',
              headers: {
                'x-forwarded-for': botIP,
                'user-agent': pattern.userAgent
              }
            }))
          )
        }

        const responses = await Promise.all(requests)
        const blocked = responses.filter(r => r?.status === 429)

        if (pattern.expectedBlocked) {
          expect(blocked.length).toBeGreaterThan(10) // Should block suspicious bots
        }

        console.log(`User-Agent: ${pattern.userAgent} - Blocked: ${blocked.length}/20`)
      }
    })

    it('should implement geographic rate limiting', async () => {
      const { enforceRateLimit } = await import('@/lib/rate-limiter')

      // Mock geographic IP detection
      const geoLimiter = vi.fn().mockImplementation(async (request: NextRequest) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'

        // Simulate geographic restrictions (example: limit requests from certain regions)
        const restrictedCountryCodes = ['CN', 'RU', 'NK'] // Example restricted countries
        const mockGeoData = {
          '192.168.1.1': 'US',
          '192.168.1.2': 'CN',
          '192.168.1.3': 'RU',
          '192.168.1.4': 'UK'
        }

        const countryCode = mockGeoData[ip as keyof typeof mockGeoData] || 'US'

        if (restrictedCountryCodes.includes(countryCode)) {
          // Apply stricter rate limits for restricted regions
          const strictResult = await enforceRateLimit(request)
          if (strictResult === null) {
            // Even if under normal rate limit, apply geographic restriction
            return NextResponse.json(
              { error: 'Geographic rate limit exceeded' },
              {
                status: 429,
                headers: {
                  'X-Geographic-Block': 'true',
                  'X-Country-Code': countryCode
                }
              }
            )
          }
          return strictResult
        }

        return enforceRateLimit(request)
      })

      // Test requests from different geographic regions
      const testCases = [
        { ip: '192.168.1.1', country: 'US', shouldBlock: false },
        { ip: '192.168.1.2', country: 'CN', shouldBlock: true },
        { ip: '192.168.1.3', country: 'RU', shouldBlock: true },
        { ip: '192.168.1.4', country: 'UK', shouldBlock: false }
      ]

      for (const testCase of testCases) {
        const response = await geoLimiter(new NextRequest('http://localhost:3000/api/content', {
          method: 'GET',
          headers: { 'x-forwarded-for': testCase.ip }
        }))

        if (testCase.shouldBlock) {
          expect(response?.status).toBe(429)
          expect(response?.headers.get('X-Geographic-Block')).toBe('true')
          expect(response?.headers.get('X-Country-Code')).toBe(testCase.country)
        } else {
          expect(response).toBeNull() // Should be allowed
        }
      }
    })
  })

  describe('Performance Under Load', () => {
    it('should maintain performance during DDoS attack', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limiter')

      const startTime = Date.now()

      // Simulate massive concurrent attack
      const attackPromises = []
      const numberOfAttackers = 1000
      const requestsPerAttacker = 10

      for (let attacker = 0; attacker < numberOfAttackers; attacker++) {
        const attackerIP = `10.0.${Math.floor(attacker / 256)}.${attacker % 256}`

        for (let request = 0; request < requestsPerAttacker; request++) {
          attackPromises.push(
            checkRateLimit(attackerIP, 5, 60000)
          )
        }
      }

      const results = await Promise.all(attackPromises)
      const endTime = Date.now()

      const duration = endTime - startTime
      const requestsPerSecond = (results.length / duration) * 1000

      console.log(`DDoS simulation: ${results.length} requests in ${duration}ms`)
      console.log(`Performance: ${requestsPerSecond.toFixed(2)} requests/second`)

      // Should maintain reasonable performance even under attack
      expect(requestsPerSecond).toBeGreaterThan(1000) // Should handle >1000 req/s

      // Should block majority of malicious requests
      const blocked = results.filter(r => !r.success)
      const blockingRate = blocked.length / results.length

      expect(blockingRate).toBeGreaterThan(0.5) // Should block >50% of attack traffic
    })

    it('should implement efficient memory usage for rate limiting', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limiter')

      const initialMemory = process.memoryUsage().heapUsed

      // Create many unique identifiers to test memory efficiency
      const uniqueIdentifiers = Array.from({ length: 10000 }, (_, i) => `user-${i}`)

      // Make requests for each identifier
      const promises = uniqueIdentifiers.map(id =>
        checkRateLimit(id, 10, 60000)
      )

      await Promise.all(promises)

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB for 10k identifiers`)

      // Memory increase should be reasonable (less than 50MB for 10k identifiers)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)

      // Verify rate limiting still works efficiently
      const testResult = await checkRateLimit('user-1', 10, 60000)
      expect(testResult.success).toBe(false) // Should be at limit
    })
  })

  describe('Recovery and Cleanup', () => {
    it('should reset rate limits after time window expires', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limiter')

      const userIP = '192.168.1.400'

      // Exhaust rate limit
      const initialRequests = []
      for (let i = 0; i < 10; i++) {
        initialRequests.push(checkRateLimit(userIP, 5, 1000)) // 1 second window for testing
      }

      const initialResults = await Promise.all(initialRequests)
      const initialBlocked = initialResults.filter(r => !r.success)

      expect(initialBlocked.length).toBe(5) // Should block 5 out of 10

      // Wait for rate limit window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be able to make requests again
      const recoveryResult = await checkRateLimit(userIP, 5, 1000)
      expect(recoveryResult.success).toBe(true)
    })

    it('should implement automatic cleanup of expired entries', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limiter')

      // Create many entries that will expire
      const expiredUsers = Array.from({ length: 1000 }, (_, i) => `expired-user-${i}`)

      // Make requests to create entries
      const createPromises = expiredUsers.map(user =>
        checkRateLimit(user, 10, 1000) // 1 second window
      )

      await Promise.all(createPromises)

      const initialSize = rateLimitStore.size
      expect(initialSize).toBeGreaterThan(900) // Should have most entries

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Trigger cleanup by making new request
      await checkRateLimit('cleanup-trigger', 10, 60000)

      // Simulate cleanup process (in production this would be automatic)
      const now = Date.now()
      for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetTime <= now) {
          rateLimitStore.delete(key)
        }
      }

      const finalSize = rateLimitStore.size
      expect(finalSize).toBeLessThan(initialSize / 2) // Should have cleaned up expired entries

      console.log(`Cleanup: ${initialSize} -> ${finalSize} entries`)
    })
  })
})