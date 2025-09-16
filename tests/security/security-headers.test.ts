/**
 * Security Headers Tests
 *
 * Comprehensive testing of security headers implementation
 * in both development and production environments.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  applySecurityHeaders,
  generateCSPNonce,
  DEVELOPMENT_SECURITY_CONFIG,
  PRODUCTION_SECURITY_CONFIG,
  createSecurityHeadersMiddleware
} from '@/lib/enhanced-security-headers'

// Mock environment variables
const originalEnv = process.env

describe('Security Headers Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Content Security Policy (CSP)', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateCSPNonce()
      const nonce2 = generateCSPNonce()

      expect(nonce1).toMatch(/^[A-Za-z0-9+/]{32}={0,2}$/) // Base64 pattern
      expect(nonce2).toMatch(/^[A-Za-z0-9+/]{32}={0,2}$/)
      expect(nonce1).not.toBe(nonce2) // Should be unique
    })

    it('should apply strict CSP in production', () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self' 'nonce-")
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
      expect(csp).not.toContain("'unsafe-eval'")
      expect(csp).not.toContain("'unsafe-inline'")
    })

    it('should allow development sources in development', () => {
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, DEVELOPMENT_SECURITY_CONFIG)

      const csp = response.headers.get('Content-Security-Policy')
      expect(csp).toContain('localhost:3000')
      expect(csp).toContain("'unsafe-eval'") // Needed for dev tools
    })

    it('should prevent XSS through CSP', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const csp = response.headers.get('Content-Security-Policy')

      // Should block inline scripts
      expect(csp).not.toContain("'unsafe-inline'")
      // Should block eval
      expect(csp).not.toContain("'unsafe-eval'")
      // Should require nonce for scripts
      expect(csp).toContain("'nonce-")
    })

    it('should handle CSP bypass attempts', () => {
      const maliciousRequests = [
        'https://example.com/test?callback=alert(1)',
        'https://example.com/test#<script>alert(1)</script>',
        'https://example.com/test?redirect=javascript:alert(1)',
      ]

      for (const url of maliciousRequests) {
        const request = new NextRequest(url)
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const csp = response.headers.get('Content-Security-Policy')
        expect(csp).toContain("default-src 'self'")
        expect(csp).not.toContain('javascript:')
        expect(csp).not.toContain('data:')
      }
    })
  })

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should enforce HSTS in production', () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const hsts = response.headers.get('Strict-Transport-Security')
      expect(hsts).toBe('max-age=31536000; includeSubDomains; preload')
    })

    it('should not apply HSTS to HTTP in development', () => {
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, DEVELOPMENT_SECURITY_CONFIG)

      const hsts = response.headers.get('Strict-Transport-Security')
      expect(hsts).toBeNull()
    })

    it('should prevent protocol downgrade attacks', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const hsts = response.headers.get('Strict-Transport-Security')
      expect(hsts).toContain('max-age=31536000')
      expect(hsts).toContain('includeSubDomains')
    })
  })

  describe('Cross-Origin Policies', () => {
    it('should apply restrictive CORS policies', () => {
      const request = new NextRequest('https://example.com/api/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      expect(response.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp')
      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
    })

    it('should prevent clickjacking', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const frameOptions = response.headers.get('X-Frame-Options')
      expect(frameOptions).toBe('DENY')
    })

    it('should prevent MIME type sniffing', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })
  })

  describe('Permissions Policy', () => {
    it('should restrict dangerous features', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toContain('camera=()') // Deny camera
      expect(permissionsPolicy).toContain('microphone=()') // Deny microphone
      expect(permissionsPolicy).toContain('geolocation=()') // Deny geolocation
      expect(permissionsPolicy).toContain('payment=()') // Deny payment
    })

    it('should allow necessary features for music app', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toContain('autoplay=(self)') // Allow autoplay
      expect(permissionsPolicy).toContain('fullscreen=(self)') // Allow fullscreen
    })
  })

  describe('Referrer Policy', () => {
    it('should limit referrer information', () => {
      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('CORS Security', () => {
    it('should handle preflight requests securely', () => {
      const request = new NextRequest('https://example.com/api/test', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Should not include malicious origin in CORS headers
      const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
      expect(allowOrigin).not.toBe('https://malicious.com')
    })

    it('should validate allowed origins', () => {
      const maliciousOrigins = [
        'https://evil.com',
        'http://localhost:3000', // HTTP in production
        'null',
        'file://',
        'data:text/html,<script>alert(1)</script>'
      ]

      for (const origin of maliciousOrigins) {
        const request = new NextRequest('https://example.com/api/test', {
          headers: { 'Origin': origin }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        const allowOrigin = response.headers.get('Access-Control-Allow-Origin')
        expect(allowOrigin).not.toBe(origin)
      }
    })

    it('should handle CORS credential attacks', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'Origin': 'https://malicious.com',
          'Cookie': 'sessionId=abc123'
        }
      })
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Should not allow credentials for untrusted origins
      const allowCredentials = response.headers.get('Access-Control-Allow-Credentials')
      expect(allowCredentials).not.toBe('true')
    })
  })

  describe('Security Headers Bypass Attempts', () => {
    it('should resist header injection attempts', () => {
      const maliciousHeaders = {
        'X-Forwarded-Proto': 'http\r\nX-Evil: malicious',
        'Host': 'example.com\r\nX-Injected: true',
        'User-Agent': 'Normal\r\n\r\n<script>alert(1)</script>'
      }

      for (const [name, value] of Object.entries(maliciousHeaders)) {
        const request = new NextRequest('https://example.com/test', {
          headers: { [name]: value }
        })
        const response = new NextResponse('OK')

        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

        // Security headers should still be applied correctly
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.get('X-Frame-Options')).toBe('DENY')

        // Should not contain injected headers
        expect(response.headers.get('X-Evil')).toBeNull()
        expect(response.headers.get('X-Injected')).toBeNull()
      }
    })

    it('should handle malformed requests', () => {
      const request = new NextRequest('https://example.com/test/../../../etc/passwd')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      // Should still apply security headers for malformed requests
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('Middleware Integration', () => {
    it('should create proper middleware function', () => {
      const middleware = createSecurityHeadersMiddleware()
      expect(typeof middleware).toBe('function')
    })

    it('should apply headers through middleware', async () => {
      const middleware = createSecurityHeadersMiddleware()

      const request = new NextRequest('https://example.com/test')
      const response = await middleware(request)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should handle middleware errors gracefully', async () => {
      // Mock a failing request
      const request = new NextRequest('invalid-url')

      const middleware = createSecurityHeadersMiddleware()

      try {
        await middleware(request)
      } catch (error) {
        // Should handle errors without crashing
        expect(error).toBeDefined()
      }
    })
  })

  describe('Environment-Specific Configuration', () => {
    it('should use stricter policies in production', () => {
      const prodConfig = PRODUCTION_SECURITY_CONFIG
      const devConfig = DEVELOPMENT_SECURITY_CONFIG

      // Production should be stricter
      expect(prodConfig.contentSecurityPolicy.directives['script-src']).not.toContain("'unsafe-eval'")
      expect(devConfig.contentSecurityPolicy.directives['script-src']).toContain("'unsafe-eval'")

      expect(prodConfig.hsts.maxAge).toBeGreaterThan(devConfig.hsts.maxAge)
    })

    it('should handle missing environment variables', () => {
      delete process.env.NODE_ENV

      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      // Should not throw error with missing env vars
      expect(() => {
        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)
      }).not.toThrow()
    })
  })

  describe('Performance Impact', () => {
    it('should apply headers quickly', () => {
      const start = performance.now()

      const request = new NextRequest('https://example.com/test')
      const response = new NextResponse('OK')

      applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)

      const end = performance.now()
      const duration = end - start

      // Should complete in less than 10ms
      expect(duration).toBeLessThan(10)
    })

    it('should handle concurrent header applications', async () => {
      const requests = Array.from({ length: 100 }, (_, i) =>
        new NextRequest(`https://example.com/test${i}`)
      )

      const start = performance.now()

      const promises = requests.map(request => {
        const response = new NextResponse('OK')
        applySecurityHeaders(response, request, PRODUCTION_SECURITY_CONFIG)
        return response
      })

      await Promise.all(promises)

      const end = performance.now()
      const duration = end - start

      // Should handle 100 concurrent operations in reasonable time
      expect(duration).toBeLessThan(100)
    })
  })
})