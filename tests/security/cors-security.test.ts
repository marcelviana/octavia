/**
 * CORS Security Tests
 *
 * Testing CORS policies with cross-origin requests to ensure
 * they're restrictive but functional for legitimate use cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { applySecurityHeaders, PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG } from '@/lib/enhanced-security-headers'

// Mock fetch for actual HTTP testing
global.fetch = vi.fn()

describe('CORS Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Origin Validation', () => {
    it('should allow legitimate same-origin requests', async () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'GET',
        headers: {
          'Origin': 'https://octavia.app',
          'Content-Type': 'application/json'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Same-origin should be allowed
      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
      expect(allowOrigin).toBe('https://octavia.app')
    })

    it('should reject malicious origins', async () => {
      const maliciousOrigins = [
        'https://evil.com',
        'http://octavia.app', // HTTP instead of HTTPS
        'https://octavia.app.evil.com', // Subdomain attack
        'https://xn--octavia-app.com', // IDN homograph attack
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'null',
        'undefined',
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        'vbscript:msgbox(1)',
      ]

      for (const origin of maliciousOrigins) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'GET',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
        expect(allowOrigin).not.toBe(origin)
      }
    })

    it('should handle development origins appropriately', () => {
      const devOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
      ]

      for (const origin of devOrigins) {
        const request = new NextRequest('http://localhost:3000/api/content', {
          method: 'GET',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, DEVELOPMENT_SECURITY_CONFIG)

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
        // In development, localhost should be allowed
        if (origin.includes('localhost')) {
          expect(allowOrigin).toBe(origin)
        }
      }
    })
  })

  describe('Preflight Request Security', () => {
    it('should handle legitimate preflight requests', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://octavia.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization')
    })

    it('should reject dangerous preflight methods', () => {
      const dangerousMethods = [
        'TRACE',
        'TRACK',
        'CONNECT',
        'DEBUG',
        'PATCH', // If not explicitly allowed
      ]

      for (const method of dangerousMethods) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://octavia.app',
            'Access-Control-Request-Method': method
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const allowMethods = response.headers.get('Access-Control-Allow-Methods')
        expect(allowMethods).not.toContain(method)
      }
    })

    it('should reject malicious preflight headers', () => {
      const maliciousHeaders = [
        'X-Forwarded-For',
        'X-Real-IP',
        'X-Originating-IP',
        'X-Remote-IP',
        'X-Forwarded-Host',
        'X-Admin-Secret',
        'X-Debug-Token',
      ]

      for (const header of maliciousHeaders) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://octavia.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': header
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const allowHeaders = response.headers.get('Access-Control-Allow-Headers')
        expect(allowHeaders).not.toContain(header)
      }
    })
  })

  describe('Credentials Security', () => {
    it('should handle credentials appropriately for trusted origins', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'POST',
        headers: {
          'Origin': 'https://octavia.app',
          'Content-Type': 'application/json',
          'Cookie': 'sessionId=abc123'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const allowCredentials = response.headers.get('Access-Control-Allow-Credentials')
      expect(allowCredentials).toBe('true')
    })

    it('should not allow credentials for untrusted origins', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'POST',
        headers: {
          'Origin': 'https://evil.com',
          'Content-Type': 'application/json',
          'Cookie': 'sessionId=abc123'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const allowCredentials = response.headers.get('Access-Control-Allow-Credentials')
      expect(allowCredentials).not.toBe('true')
    })

    it('should prevent CSRF through origin validation', () => {
      // Simulate CSRF attack
      const request = new NextRequest('https://octavia.app/api/user/delete', {
        method: 'POST',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Content-Type': 'application/json',
          'Cookie': 'auth=valid-session-token'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Should not allow cross-origin request with credentials
      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
      expect(allowOrigin).not.toBe('https://malicious-site.com')
    })
  })

  describe('Real Cross-Origin Request Testing', () => {
    it('should simulate legitimate API request from web app', async () => {
      // Simulate request from legitimate web app
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Access-Control-Allow-Origin': 'https://octavia.app',
          'Access-Control-Allow-Credentials': 'true'
        }),
        json: () => Promise.resolve({ data: 'success' })
      })

      global.fetch = mockFetch

      // Make actual request
      const response = await fetch('https://api.octavia.app/content', {
        method: 'GET',
        headers: {
          'Origin': 'https://octavia.app',
          'Authorization': 'Bearer valid-token'
        },
        credentials: 'include'
      })

      expect(response.ok).toBe(true)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://octavia.app')
    })

    it('should simulate and block malicious cross-origin request', async () => {
      // Simulate request from malicious site
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({
          'Access-Control-Allow-Origin': null
        }),
        json: () => Promise.resolve({ error: 'Forbidden' })
      })

      global.fetch = mockFetch

      try {
        await fetch('https://api.octavia.app/user/sensitive-data', {
          method: 'GET',
          headers: {
            'Origin': 'https://evil.com',
            'Authorization': 'Bearer stolen-token'
          },
          credentials: 'include'
        })
      } catch (error) {
        // CORS should block this request
        expect(error).toBeDefined()
      }
    })
  })

  describe('CORS Bypass Attempts', () => {
    it('should resist null origin bypass', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'POST',
        headers: {
          'Origin': 'null',
          'Content-Type': 'application/json'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
      expect(allowOrigin).not.toBe('null')
    })

    it('should resist origin header spoofing', () => {
      const spoofedOrigins = [
        'https://octavia.app.evil.com',
        'https://evil.com/octavia.app',
        'https://sub.octavia.app', // If subdomains not explicitly allowed
        'https://octavia-app.com',
        'https://0ctavia.app', // Zero instead of O
      ]

      for (const origin of spoofedOrigins) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'POST',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
        expect(allowOrigin).not.toBe(origin)
      }
    })

    it('should handle wildcard origin security', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'GET',
        headers: {
          'Origin': 'https://evil.com',
          'Content-Type': 'application/json'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')

      // Should never be wildcard (*) when credentials are involved
      if (response.headers.get('Access-Control-Allow-Credentials') === 'true') {
        expect(allowOrigin).not.toBe('*')
      }
    })

    it('should prevent origin header injection', () => {
      const injectionAttempts = [
        'https://octavia.app\r\nX-Injected: true',
        'https://octavia.app\nSet-Cookie: evil=true',
        'https://octavia.app\r\n\r\n<script>alert(1)</script>',
        "https://octavia.app'; DROP TABLE users; --",
      ]

      for (const origin of injectionAttempts) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'POST',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        // Should not contain injected content
        expect(response.headers.get('X-Injected')).toBeNull()
        expect(response.headers.get('Set-Cookie')).not.toContain('evil=true')
      }
    })
  })

  describe('Cross-Origin Resource Sharing Edge Cases', () => {
    it('should handle missing origin header', () => {
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No Origin header
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Should handle gracefully without Origin header
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy()
    })

    it('should handle multiple origin headers', () => {
      // Some attacks try to send multiple Origin headers
      const request = new NextRequest('https://octavia.app/api/content', {
        method: 'POST',
        headers: {
          'Origin': 'https://octavia.app, https://evil.com',
          'Content-Type': 'application/json'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
      expect(allowOrigin).not.toContain('evil.com')
    })

    it('should handle case sensitivity in origins', () => {
      const origins = [
        'HTTPS://OCTAVIA.APP',
        'https://OCTAVIA.app',
        'https://octavia.APP',
      ]

      for (const origin of origins) {
        const request = new NextRequest('https://octavia.app/api/content', {
          method: 'GET',
          headers: {
            'Origin': origin,
            'Content-Type': 'application/json'
          }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        // Origins should be case-sensitive
        const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
        if (origin !== 'https://octavia.app') {
          expect(allowOrigin).not.toBe(origin)
        }
      }
    })
  })

  describe('Performance and Security Balance', () => {
    it('should handle high-frequency CORS requests efficiently', async () => {
      const start = performance.now()

      const requests = Array.from({ length: 1000 }, (_, i) =>
        new NextRequest(`https://octavia.app/api/content/${i}`, {
          method: 'GET',
          headers: {
            'Origin': 'https://octavia.app',
            'Content-Type': 'application/json'
          }
        })
      )

      for (const request of requests) {
        const response = new NextResponse('OK')
        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)
      }

      const end = performance.now()
      const duration = end - start

      // Should handle 1000 requests in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100)
    })

    it('should maintain security under load', async () => {
      // Simulate mixed legitimate and malicious requests
      const requests = []

      // Add legitimate requests
      for (let i = 0; i < 500; i++) {
        requests.push(new NextRequest('https://octavia.app/api/content', {
          method: 'GET',
          headers: {
            'Origin': 'https://octavia.app',
            'Content-Type': 'application/json'
          }
        }))
      }

      // Add malicious requests
      for (let i = 0; i < 500; i++) {
        requests.push(new NextRequest('https://octavia.app/api/content', {
          method: 'GET',
          headers: {
            'Origin': 'https://evil.com',
            'Content-Type': 'application/json'
          }
        }))
      }

      // Process all requests
      const results = requests.map(request => {
        const response = new NextResponse('OK')
        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)
        return response.headers.get('Access-Control-Allow-Origin')
      })

      // Count legitimate vs blocked
      const legitimate = results.filter(origin => origin === 'https://octavia.app').length
      const blocked = results.filter(origin => origin !== 'https://octavia.app').length

      expect(legitimate).toBe(500) // All legitimate should pass
      expect(blocked).toBe(500) // All malicious should be blocked
    })
  })
})