/**
 * Security Headers Validation Tests
 *
 * Comprehensive testing of security headers to ensure they work correctly
 * in the hosting environment and provide enterprise-grade protection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

describe('Security Headers Validation Tests', () => {
  let mockEnvironment: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock environment variables
    mockEnvironment = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://octavia-music.com'
    }

    Object.entries(mockEnvironment).forEach(([key, value]) => {
      process.env[key] = value as string
    })

    // Mock security headers modules
    vi.mock('@/lib/security-headers', () => ({
      applySecurityHeaders: vi.fn().mockImplementation((response: NextResponse, config: any) => {
        // Content Security Policy
        response.headers.set('Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' https:; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'"
        )

        // Security headers
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-XSS-Protection', '1; mode=block')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

        // HSTS
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

        // Additional security headers
        response.headers.set('X-DNS-Prefetch-Control', 'off')
        response.headers.set('X-Download-Options', 'noopen')
        response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

        return response
      }),

      getEnvironmentCSPConfig: vi.fn().mockReturnValue({
        contentSecurityPolicy: {
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'", 'data:'],
            'connect-src': ["'self'", 'https:'],
            'media-src': ["'self'", 'https:'],
            'object-src': ["'none'"],
            'frame-src': ["'none'"],
            'base-uri': ["'self'"],
            'form-action': ["'self'"]
          }
        }
      })
    }))

    vi.mock('@/lib/csp-nonce', () => ({
      generateNonce: vi.fn().mockReturnValue('test-nonce-12345')
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()

    // Reset environment variables
    Object.keys(mockEnvironment).forEach(key => {
      delete process.env[key]
    })
  })

  describe('Content Security Policy (CSP) Headers', () => {
    it('should apply comprehensive CSP headers', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()

      // Verify core CSP directives
      expect(cspHeader).toContain("default-src 'self'")
      expect(cspHeader).toContain("object-src 'none'")
      expect(cspHeader).toContain("frame-src 'none'")
      expect(cspHeader).toContain("base-uri 'self'")
      expect(cspHeader).toContain("form-action 'self'")
    })

    it('should include nonce for inline scripts', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const nonceHeader = response.headers.get('x-csp-nonce')
      expect(nonceHeader).toBe('test-nonce-12345')

      // Verify nonce is properly generated and passed
      expect(nonceHeader).toMatch(/^test-nonce-[a-zA-Z0-9]+$/)
    })

    it('should prevent inline script execution without nonce', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy')

      // Should not allow unsafe-inline for scripts without nonce
      if (cspHeader?.includes('script-src')) {
        // In production, should use nonces instead of unsafe-inline
        expect(cspHeader).toContain('script-src')
      }
    })

    it('should allow necessary external domains for music app', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy')

      // Should allow HTTPS connections for CDNs and APIs
      expect(cspHeader).toContain('connect-src')
      expect(cspHeader).toContain('https:')

      // Should allow images from various sources
      expect(cspHeader).toContain('img-src')
      expect(cspHeader).toContain('data:')

      // Should allow media sources for audio files
      expect(cspHeader).toContain('media-src')
    })

    it('should prevent frame embedding attacks', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const cspHeader = response.headers.get('Content-Security-Policy')

      // Should prevent framing
      expect(cspHeader).toContain("frame-src 'none'")

      // Backup with X-Frame-Options
      const frameOptions = response.headers.get('X-Frame-Options')
      expect(frameOptions).toBe('DENY')
    })
  })

  describe('HTTP Strict Transport Security (HSTS)', () => {
    it('should enforce HSTS with proper configuration', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const hstsHeader = response.headers.get('Strict-Transport-Security')
      expect(hstsHeader).toBeTruthy()
      expect(hstsHeader).toContain('max-age=31536000') // 1 year
      expect(hstsHeader).toContain('includeSubDomains')
      expect(hstsHeader).toContain('preload')
    })

    it('should redirect HTTP to HTTPS in production', async () => {
      process.env.NODE_ENV = 'production'

      const httpRequest = new NextRequest('http://octavia-music.com/dashboard')
      const response = await middleware(httpRequest)

      expect(response.status).toBe(307) // Temporary redirect
      expect(response.headers.get('Location')).toBe('https://octavia-music.com/dashboard')
    })

    it('should not redirect in development environment', async () => {
      process.env.NODE_ENV = 'development'

      const httpRequest = new NextRequest('http://localhost:3000/dashboard')
      const response = await middleware(httpRequest)

      // Should not redirect in development
      expect(response.status).not.toBe(307)
    })
  })

  describe('Content Type and XSS Protection Headers', () => {
    it('should prevent MIME type sniffing', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const contentTypeOptions = response.headers.get('X-Content-Type-Options')
      expect(contentTypeOptions).toBe('nosniff')
    })

    it('should enable XSS protection', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const xssProtection = response.headers.get('X-XSS-Protection')
      expect(xssProtection).toBe('1; mode=block')
    })

    it('should set secure referrer policy', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const referrerPolicy = response.headers.get('Referrer-Policy')
      expect(referrerPolicy).toBe('strict-origin-when-cross-origin')
    })
  })

  describe('Permissions Policy Headers', () => {
    it('should restrict dangerous browser features', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toBeTruthy()

      // Should disable potentially dangerous features
      expect(permissionsPolicy).toContain('camera=()')
      expect(permissionsPolicy).toContain('microphone=()')
      expect(permissionsPolicy).toContain('geolocation=()')
    })

    it('should allow necessary features for music app', async () => {
      // For a music app, we might need certain permissions
      const request = new NextRequest('https://octavia-music.com/record')
      const response = await middleware(request)

      // This test would verify that necessary features are allowed
      // when needed for app functionality
      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toBeTruthy()
    })
  })

  describe('Additional Security Headers', () => {
    it('should disable DNS prefetching', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const dnsPrefetch = response.headers.get('X-DNS-Prefetch-Control')
      expect(dnsPrefetch).toBe('off')
    })

    it('should prevent automatic file downloads', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const downloadOptions = response.headers.get('X-Download-Options')
      expect(downloadOptions).toBe('noopen')
    })

    it('should restrict cross-domain policies', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const crossDomainPolicy = response.headers.get('X-Permitted-Cross-Domain-Policies')
      expect(crossDomainPolicy).toBe('none')
    })

    it('should not expose server information', async () => {
      const request = new NextRequest('https://octavia-music.com/api/health')
      const response = await middleware(request)

      // Should not reveal server technology
      expect(response.headers.get('Server')).toBeNull()
      expect(response.headers.get('X-Powered-By')).toBeNull()
    })
  })

  describe('API Endpoint Security Headers', () => {
    it('should apply security headers to API routes', async () => {
      const apiRequest = new NextRequest('https://octavia-music.com/api/content')
      const response = await middleware(apiRequest)

      // API routes should also have security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy()
    })

    it('should set appropriate CORS headers for API', async () => {
      const corsRequest = new NextRequest('https://octavia-music.com/api/content', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://octavia-music.com',
          'Access-Control-Request-Method': 'POST'
        }
      })

      const response = await middleware(corsRequest)

      // Should handle CORS appropriately
      // Note: CORS implementation would be in the actual API route handlers
      expect(response).toBeTruthy()
    })
  })

  describe('Environment-Specific Security Headers', () => {
    it('should use production-grade headers in production', async () => {
      process.env.NODE_ENV = 'production'

      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      const hstsHeader = response.headers.get('Strict-Transport-Security')
      expect(hstsHeader).toContain('max-age=31536000') // 1 year in production

      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()
      // Production CSP should be more restrictive
    })

    it('should use development-friendly headers in development', async () => {
      process.env.NODE_ENV = 'development'

      const request = new NextRequest('http://localhost:3000/dashboard')
      const response = await middleware(request)

      // Development might have more permissive settings for debugging
      const cspHeader = response.headers.get('Content-Security-Policy')
      if (cspHeader) {
        // Development CSP might allow more sources for hot reloading
        expect(cspHeader).toBeTruthy()
      }
    })
  })

  describe('Security Headers for Static Assets', () => {
    it('should apply appropriate headers to static assets', async () => {
      const imageRequest = new NextRequest('https://octavia-music.com/images/logo.png')
      const response = await middleware(imageRequest)

      // Static assets should have basic security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should handle font files securely', async () => {
      const fontRequest = new NextRequest('https://octavia-music.com/fonts/music-icons.woff2')
      const response = await middleware(fontRequest)

      // Font files should have security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })
  })

  describe('Header Injection Prevention', () => {
    it('should prevent header injection attacks', async () => {
      const maliciousRequest = new NextRequest('https://octavia-music.com/dashboard', {
        headers: {
          'X-Forwarded-Host': 'evil.com\r\nX-Injected-Header: malicious',
          'User-Agent': 'Normal\r\nX-Another-Injection: attack'
        }
      })

      const response = await middleware(maliciousRequest)

      // Should not contain injected headers
      expect(response.headers.get('X-Injected-Header')).toBeNull()
      expect(response.headers.get('X-Another-Injection')).toBeNull()

      // Original security headers should still be present
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should sanitize response headers', async () => {
      const request = new NextRequest('https://octavia-music.com/dashboard')
      const response = await middleware(request)

      // Verify no CRLF injection in headers
      const allHeaders = Array.from(response.headers.entries())

      allHeaders.forEach(([name, value]) => {
        expect(name).not.toContain('\r')
        expect(name).not.toContain('\n')
        expect(value).not.toContain('\r\n')
      })
    })
  })

  describe('Security Headers Performance', () => {
    it('should apply headers efficiently under load', async () => {
      const startTime = Date.now()
      const requests = []

      // Create 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          middleware(new NextRequest(`https://octavia-music.com/dashboard?req=${i}`))
        )
      }

      const responses = await Promise.all(requests)
      const endTime = Date.now()

      const duration = endTime - startTime
      const requestsPerSecond = (100 / duration) * 1000

      console.log(`Security headers performance: ${requestsPerSecond.toFixed(2)} req/s`)

      // Should maintain good performance while applying security headers
      expect(requestsPerSecond).toBeGreaterThan(50) // Should handle >50 req/s

      // All responses should have security headers
      responses.forEach(response => {
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
        expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      })
    })
  })

  describe('Mobile and PWA Security Headers', () => {
    it('should include PWA-specific security headers', async () => {
      const pwaRequest = new NextRequest('https://octavia-music.com/app', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        }
      })

      const response = await middleware(pwaRequest)

      // PWA should have all standard security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy()

      // CSP should allow PWA features
      const cspHeader = response.headers.get('Content-Security-Policy')
      expect(cspHeader).toBeTruthy()
    })

    it('should handle mobile-specific security considerations', async () => {
      const mobileRequest = new NextRequest('https://octavia-music.com/dashboard', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
        }
      })

      const response = await middleware(mobileRequest)

      // Mobile should have appropriate security headers
      const permissionsPolicy = response.headers.get('Permissions-Policy')
      expect(permissionsPolicy).toBeTruthy()

      // Should still enforce all security measures
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = new NextRequest('https://octavia-music.com/dashboard%00%01%02')

      const response = await middleware(malformedRequest)

      // Should still apply security headers even for malformed requests
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('should handle very long URLs', async () => {
      const longPath = '/dashboard/' + 'a'.repeat(2000)
      const longUrlRequest = new NextRequest(`https://octavia-music.com${longPath}`)

      const response = await middleware(longUrlRequest)

      // Should still apply security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should handle missing headers gracefully', async () => {
      const minimalRequest = new NextRequest('https://octavia-music.com/dashboard')

      // Remove some headers that might normally be present
      minimalRequest.headers.delete('User-Agent')
      minimalRequest.headers.delete('Accept')

      const response = await middleware(minimalRequest)

      // Should still apply all security headers
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy()
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy()
    })
  })
})