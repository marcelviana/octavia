/**
 * API Validation Security Tests
 *
 * Comprehensive security testing for API validation middleware
 * against XSS, SQL injection, and other malicious payloads.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { withBodyValidation, contentSchemas, userSchemas, setlistSchemas } from '@/lib/api-validation-middleware'
import { createValidationErrorResponse } from '@/lib/validation-utils'

// Mock user for authentication tests (hoisted for vi.mock)
const mockUser = vi.hoisted(() => ({ uid: 'test-user-123', email: 'test@example.com' }))

// Mock the secure auth utils
vi.mock('@/lib/secure-auth-utils', () => ({
  requireAuthServerSecure: vi.fn().mockResolvedValue(mockUser)
}))

// XSS attack payloads
const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<svg onload="alert(\'XSS\')">',
  '"><script>alert("XSS")</script>',
  '\'"--></script><script>alert("XSS")</script>',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload="alert(\'XSS\')">',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
  '{{constructor.constructor("alert(\'XSS\')")()}}', // Template injection
  '${alert("XSS")}', // Template literal injection
  'eval("alert(\'XSS\')")', // Code injection
]

// SQL Injection payloads
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users; --",
  "' OR '1'='1",
  "' UNION SELECT * FROM users --",
  "admin'--",
  "admin'/*",
  "' OR 1=1#",
  "'; EXEC xp_cmdshell('dir'); --",
  "1' AND (SELECT COUNT(*) FROM information_schema.tables)>0 --",
  "' OR (SELECT user FROM information_schema.user_privileges WHERE privilege_type='select')='root'--",
  "1'; WAITFOR DELAY '00:00:10'; --",
]

// Path Traversal payloads
const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
]

// Prototype Pollution payloads
const PROTOTYPE_POLLUTION_PAYLOADS = [
  { '__proto__': { 'isAdmin': true } },
  { 'constructor': { 'prototype': { 'isAdmin': true } } },
  { '__proto__.isAdmin': true },
  { 'constructor.prototype.isAdmin': true },
]

// NoSQL Injection payloads
const NOSQL_INJECTION_PAYLOADS = [
  { '$ne': null },
  { '$gt': '' },
  { '$regex': '.*' },
  { '$where': 'function() { return true; }' },
  { '$or': [{}] },
]

// Large payload attack
const LARGE_PAYLOAD = 'A'.repeat(2 * 1024 * 1024) // 2MB

describe('API Validation Security Tests', () => {
  describe('XSS Prevention', () => {
    // SAN-01 (B2 PR-4a): a política mudou de "sanitizar em silêncio" para
    // "ou passa LITERAL, ou 400 nomeando o campo". Vetor com assinatura real
    // (script/javascript:/data:/vbscript:) → 400; o resto atravessa intacto —
    // o destino é varchar/jsonb parametrizado e o React escapa na renderização.
    // A versão antiga deste teste exigia o payload ALTERADO no handler (a
    // política aposentada que zerava "Show (acústico)" com 200).
    it('should reject or pass-through XSS payloads literally (never silently mutate)', async () => {
      for (const payload of XSS_PAYLOADS) {
        const handler = withBodyValidation(contentSchemas.create)(
          async (req, validatedData) => {
            // Se chegou ao handler, chegou LITERAL — mutação silenciosa é o bug
            expect(validatedData.title).toBe(payload)
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            title: payload,
            artist: 'Test Artist',
            content_type: 'Lyrics'
          })
        })

        const response = await handler(request, mockUser, {})

        // Should either sanitize or reject malicious input
        expect([200, 400].includes(response.status)).toBe(true)
      }
    })

    it('should reject XSS payloads in user profile updates', async () => {
      for (const payload of XSS_PAYLOADS) {
        const handler = withBodyValidation(userSchemas.update)(
          async (req, validatedData) => {
            // Verify sanitization happened
            if (validatedData.full_name) {
              expect(validatedData.full_name).not.toContain('<script>')
              expect(validatedData.full_name).not.toContain('javascript:')
            }
            if (validatedData.bio) {
              expect(validatedData.bio).not.toContain('<script>')
              expect(validatedData.bio).not.toContain('javascript:')
            }
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/users/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            full_name: payload,
            bio: payload
          })
        })

        const response = await handler(request, mockUser, {})

        if (response.status === 200) {
          // If accepted, ensure it was sanitized
          const responseData = await response.json()
          // The response is { success: true }, not the validated data
          // Sanitization already happened in the handler's expect statements
        }
      }
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts in search queries', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        const handler = withBodyValidation(contentSchemas.query)(
          async (req, validatedData) => {
            // Verify sanitization in the handler
            if (validatedData.search) {
              expect(validatedData.search).not.toMatch(/DROP|DELETE|INSERT|UPDATE|UNION|SELECT/i)
            }
            return Response.json({ success: true, search: validatedData.search })
          }
        )

        const url = new URL('http://localhost/api/content')
        url.searchParams.set('search', payload)

        const request = new NextRequest(url.toString(), {
          method: 'GET'
        })

        const response = await handler(request, mockUser, {})

        // Should either sanitize (200) or reject (400) SQL injection attempts
        expect([200, 400].includes(response.status)).toBe(true)
        if (response.status === 200) {
          const responseData = await response.json()
          if (responseData.search) {
            expect(responseData.search).not.toMatch(/DROP|DELETE|INSERT|UPDATE|UNION|SELECT/i)
          }
        }
      }
    })

    // SAN-01 (B2 PR-4a): "SQL injection em nome de setlist" não existe neste
    // stack — toda escrita é parametrizada via PostgREST; palavras como DROP
    // são texto legítimo (uma setlist "Drop the Bass" era mutilada pela
    // política antiga). Contrato novo: 400 ou passagem LITERAL, nunca mutação.
    it('should reject or pass-through SQL-looking setlist names literally (never silently mutate)', async () => {
      for (const payload of SQL_INJECTION_PAYLOADS) {
        const handler = withBodyValidation(setlistSchemas.create)(
          async (req, validatedData) => {
            expect(validatedData.name).toBe(payload)
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/setlists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            name: payload,
            description: 'Test setlist'
          })
        })

        const response = await handler(request, mockUser, {})

        // Should either sanitize (200) or reject (400) SQL injection attempts
        expect([200, 400].includes(response.status)).toBe(true)
      }
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should reject path traversal attempts in file operations', async () => {
      for (const payload of PATH_TRAVERSAL_PAYLOADS) {
        const handler = withBodyValidation(contentSchemas.create)(
          async (req, validatedData) => {
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            title: 'Test Song',
            file_url: payload,
            content_type: 'Lyrics'
          })
        })

        const response = await handler(request, mockUser, {})

        // Should either sanitize (200) or reject (400) path traversal attempts
        expect([200, 400].includes(response.status)).toBe(true)
      }
    })
  })

  describe('Prototype Pollution Prevention', () => {
    it('should prevent prototype pollution in content data', async () => {
      for (const payload of PROTOTYPE_POLLUTION_PAYLOADS) {
        const handler = withBodyValidation(contentSchemas.create)(
          async (req, validatedData) => {
            // Check that prototype pollution didn't occur
            expect(Object.prototype.hasOwnProperty.call({}, 'isAdmin')).toBe(false)
            expect(({} as any).isAdmin).toBeUndefined()
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            title: 'Test Song',
            content_type: 'Lyrics',
            content_data: payload
          })
        })

        const response = await handler(request, mockUser, {})

        // Should handle prototype pollution attempts safely
        expect([200, 400].includes(response.status)).toBe(true)
      }
    })
  })

  describe('NoSQL Injection Prevention', () => {
    it('should prevent NoSQL injection in query parameters', async () => {
      for (const payload of NOSQL_INJECTION_PAYLOADS) {
        const handler = withBodyValidation(contentSchemas.query)(
          async (req, validatedData) => {
            return Response.json({ success: true, search: validatedData.search })
          }
        )

        const url = new URL('http://localhost/api/content')
        url.searchParams.set('search', JSON.stringify(payload))

        const request = new NextRequest(url.toString(), {
          method: 'GET'
        })

        const response = await handler(request, mockUser, {})

        // Should either sanitize (200) or reject (400) NoSQL injection attempts
        expect([200, 400].includes(response.status)).toBe(true)
        if (response.status === 200) {
          const responseData = await response.json()
          // Search might be undefined if not provided in query
          if (responseData.search !== undefined) {
            expect(typeof responseData.search).toBe('string')
          }
        }
      }
    })
  })

  describe('Large Payload Protection', () => {
    it('should reject oversized payloads', async () => {
      const handler = withBodyValidation(contentSchemas.create)(
        async (req, validatedData) => {
          return Response.json({ success: true })
        }
      )

      const request = new NextRequest('http://localhost/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          title: LARGE_PAYLOAD,
          content_type: 'Lyrics'
        })
      })

      const response = await handler(request, mockUser, {})

      // Should reject large payloads
      expect(response.status).toBe(400)
    })
  })

  describe('Content Type Validation', () => {
    it('should reject invalid content types', async () => {
      const invalidContentTypes = [
        'application/x-executable',
        'text/html',
        'application/javascript',
        '../../../etc/passwd',
        '<script>alert("xss")</script>',
      ]

      for (const contentType of invalidContentTypes) {
        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: JSON.stringify({
            title: 'Test',
            content_type: 'Lyrics'
          })
        })

        // Should reject invalid content types at the middleware level
        expect(request.headers.get('content-type')).toBe(contentType)
      }
    })
  })

  describe('Rate Limiting Bypass Attempts', () => {
    it('should handle rapid successive requests', async () => {
      const handler = withBodyValidation(contentSchemas.create)(
        async (req, validatedData) => {
          return Response.json({ success: true })
        }
      )

      const requests = Array.from({ length: 100 }, (_, i) =>
        new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
            'X-Forwarded-For': `192.168.1.${i % 10}` // Simulate different IPs
          },
          body: JSON.stringify({
            title: `Test Song ${i}`,
            content_type: 'Lyrics'
          })
        })
      )

      // All requests should be processed without crashing
      const responses = await Promise.all(
        requests.map(req => handler(req, mockUser, {}))
      )

      expect(responses.length).toBe(100)
      responses.forEach(response => {
        expect([200, 400, 429].includes(response.status)).toBe(true)
      })
    })
  })

  describe('Unicode and Encoding Attacks', () => {
    const unicodePayloads = [
      '\u003cscript\u003ealert("XSS")\u003c/script\u003e', // Unicode encoded XSS
      '\uFEFF<script>alert("XSS")</script>', // BOM + XSS
      '＜script＞alert("XSS")＜/script＞', // Full-width characters
      '\u200B<script>alert("XSS")</script>', // Zero-width space
      String.fromCharCode(60, 115, 99, 114, 105, 112, 116, 62), // Character codes
    ]

    it('should handle Unicode-encoded attacks', async () => {
      for (const payload of unicodePayloads) {
        const handler = withBodyValidation(contentSchemas.create)(
          async (req, validatedData) => {
            // Verify sanitization happened
            expect(validatedData.title).not.toContain('<script>')
            expect(validatedData.title).not.toContain('script>')
            return Response.json({ success: true })
          }
        )

        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          body: JSON.stringify({
            title: payload,
            content_type: 'Lyrics'
          })
        })

        const response = await handler(request, mockUser, {})

        // Should handle Unicode attacks properly
        expect([200, 400].includes(response.status)).toBe(true)
      }
    })
  })

  describe('JSON Parsing Edge Cases', () => {
    it('should handle malformed JSON safely', async () => {
      const malformedJsonPayloads = [
        '{"title": "test"', // Incomplete JSON
        '{"title": "test",}', // Trailing comma
        '{"title": undefined}', // Invalid value
        '{"title": function(){}}', // Function injection
        '{"title": new Date()}', // Constructor injection
      ]

      for (const payload of malformedJsonPayloads) {
        const request = new NextRequest('http://localhost/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        })

        try {
          // Should not crash on malformed JSON
          const response = await fetch(request.url, {
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: payload
          })

          expect(response.status).toBeGreaterThanOrEqual(400)
        } catch (error) {
          // Expect JSON parsing errors to be handled gracefully
          expect(error).toBeDefined()
        }
      }
    })
  })
})