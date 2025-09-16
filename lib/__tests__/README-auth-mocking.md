# Authentication Mocking Guide for API Route Testing

This guide explains how to use the improved authentication mocking system in `api-test-helpers.ts` for testing API routes with Firebase Authentication.

## Quick Start

```typescript
import { describe, it, beforeEach, afterEach } from 'vitest'
import {
  setupApiTestMocks,
  cleanupApiTestMocks,
  createValidAuthenticatedRequest,
  expectSuccess,
  expectUnauthorized
} from '@/lib/__tests__/api-test-helpers'

describe('Your API Route', () => {
  let mocks: ReturnType<typeof setupApiTestMocks>

  beforeEach(() => {
    mocks = setupApiTestMocks()
  })

  afterEach(() => {
    cleanupApiTestMocks()
  })

  it('should authenticate valid requests', async () => {
    // Set up valid authentication
    mocks.setupValidAuth()

    // Create authenticated request
    const request = createValidAuthenticatedRequest('/api/your-route')

    // Test your API route
    const response = await yourApiRouteHandler(request)

    expectSuccess(response)
  })
})
```

## Available Token Types

The mocking system provides realistic token scenarios:

```typescript
import {
  VALID_FIREBASE_TOKEN,      // Valid, unexpired token
  EXPIRED_FIREBASE_TOKEN,    // Expired token
  INVALID_FIREBASE_TOKEN,    // Invalid/revoked token
  MALFORMED_FIREBASE_TOKEN   // Malformed token format
} from '@/lib/__tests__/api-test-helpers'
```

## Request Creation Helpers

### Bearer Token Authentication

```typescript
// Valid authentication
const request = createValidAuthenticatedRequest('/api/route', {
  method: 'POST',
  body: { data: 'test' }
})

// Expired token
const expiredRequest = createExpiredAuthenticatedRequest('/api/route')

// Invalid token
const invalidRequest = createInvalidAuthenticatedRequest('/api/route')

// Custom token
const customRequest = createAuthenticatedRequest('/api/route', 'custom-token')
```

### Session Cookie Authentication

```typescript
// Valid session cookie
const request = createValidSessionCookieRequest('/api/route')

// Custom session token
const customRequest = createSessionCookieRequest('/api/route', 'custom-token')
```

### Unauthenticated Requests

```typescript
const request = createMockRequest('/api/route', {
  method: 'POST',
  body: { data: 'test' },
  headers: { 'custom-header': 'value' }
})
```

## Mock Setup Utilities

### Quick Authentication Setup

```typescript
// Set up valid authentication for all requests
mocks.setupValidAuth()

// Set up invalid authentication (all requests fail)
mocks.setupInvalidAuth()
```

### Manual Mock Configuration

```typescript
// Configure specific behavior
mocks.firebase.mockVerifyIdToken.mockResolvedValue({
  uid: 'custom-user-id',
  email: 'custom@example.com',
  email_verified: true
})

mocks.firebaseServer.mockRequireAuthServer.mockResolvedValue({
  uid: 'custom-user-id',
  email: 'custom@example.com',
  emailVerified: true
})
```

## Realistic Firebase Admin Mocking

The mocking system simulates real Firebase Admin SDK behavior:

### Successful Token Verification

```typescript
mocks.firebase.mockVerifyIdToken.mockResolvedValue({
  // Realistic Firebase token payload
  uid: 'user-123',
  email: 'user@example.com',
  email_verified: true,
  iss: 'https://securetoken.google.com/project-id',
  aud: 'project-id',
  auth_time: 1234567890,
  iat: 1234567890,
  exp: 1234571490,
  firebase: {
    identities: { email: ['user@example.com'] },
    sign_in_provider: 'password'
  }
})
```

### Error Scenarios

```typescript
// Expired token error
mocks.firebase.mockVerifyIdToken.mockRejectedValue(
  createFirebaseError('auth/id-token-expired', 'Token has expired')
)

// Invalid token error
mocks.firebase.mockVerifyIdToken.mockRejectedValue(
  createFirebaseError('auth/id-token-revoked', 'Token has been revoked')
)

// Malformed token error
mocks.firebase.mockVerifyIdToken.mockRejectedValue(
  createFirebaseError('auth/argument-error', 'Invalid token format')
)
```

## Token Caching Simulation

The mocking system simulates the real token caching behavior:

```typescript
// Test cache behavior
const cache = mocks.firebaseServer.getTokenCache()
expect(cache.size).toBe(0)

// Make authenticated request (adds to cache)
const request = createValidAuthenticatedRequest('/api/route')
await yourApiRoute(request)

// Cache should now contain the token
expect(cache.size).toBe(1)

// Clear cache for testing cache miss scenarios
mocks.firebaseServer.clearTokenCache()
expect(cache.size).toBe(0)
```

## Response Assertion Helpers

```typescript
import {
  expectSuccess,        // 200 status
  expectCreated,        // 201 status
  expectBadRequest,     // 400 status
  expectUnauthorized,   // 401 status
  expectNotFound,       // 404 status
  expectServerError,    // 500 status
  expectSuccessResponse,
  expectErrorResponse
} from '@/lib/__tests__/api-test-helpers'

// Basic status checks
expectSuccess(response)
expectUnauthorized(response)

// Response content validation
const data = await expectSuccessResponse(response, {
  message: 'Success',
  user: { uid: 'user-123' }
})

// Error response validation
await expectErrorResponse(response, 'Unauthorized')
```

## Complete Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  setupApiTestMocks,
  cleanupApiTestMocks,
  createValidAuthenticatedRequest,
  createInvalidAuthenticatedRequest,
  expectSuccess,
  expectUnauthorized,
  expectSuccessResponse,
  TEST_USER
} from '@/lib/__tests__/api-test-helpers'
import { POST as contentRoute } from '@/app/api/content/route'

describe('/api/content', () => {
  let mocks: ReturnType<typeof setupApiTestMocks>

  beforeEach(() => {
    mocks = setupApiTestMocks()
  })

  afterEach(() => {
    cleanupApiTestMocks()
  })

  describe('POST /api/content', () => {
    it('should create content for authenticated user', async () => {
      // Arrange
      mocks.setupValidAuth()
      mocks.supabase.mockInsert.mockResolvedValue({
        data: [{ id: 'content-123', title: 'Test Song' }],
        error: null
      })

      const request = createValidAuthenticatedRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: {
          title: 'Test Song',
          artist: 'Test Artist',
          content_type: 'Lyrics'
        }
      })

      // Act
      const response = await contentRoute(request)

      // Assert
      expectSuccess(response)
      const data = await expectSuccessResponse(response)

      expect(data).toMatchObject({
        message: 'Content created successfully',
        content: { id: 'content-123', title: 'Test Song' }
      })

      // Verify database was called correctly
      expect(mocks.supabase.mockInsert).toHaveBeenCalledWith({
        title: 'Test Song',
        artist: 'Test Artist',
        content_type: 'Lyrics',
        user_id: TEST_USER.uid
      })
    })

    it('should reject unauthenticated requests', async () => {
      // Arrange
      mocks.setupInvalidAuth()

      const request = createInvalidAuthenticatedRequest('http://localhost:3000/api/content', {
        method: 'POST',
        body: { title: 'Test Song' }
      })

      // Act
      const response = await contentRoute(request)

      // Assert
      expectUnauthorized(response)
      await expectErrorResponse(response, 'Unauthorized')
    })
  })
})
```

## Advanced Features

### Testing Different User Types

```typescript
// Test with unverified user
mocks.firebaseServer.mockRequireAuthServer.mockResolvedValue({
  uid: 'unverified-user',
  email: 'unverified@example.com',
  emailVerified: false
})

// Test with admin user
mocks.firebaseServer.mockRequireAuthServer.mockResolvedValue({
  uid: 'admin-user',
  email: 'admin@example.com',
  emailVerified: true,
  customClaims: { admin: true }
})
```

### Testing Rate Limiting

Rate limiting is automatically mocked to pass through, but you can override:

```typescript
vi.doMock('@/lib/rate-limit', () => ({
  withRateLimit: (handler: any) => {
    return async (request: Request) => {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429
      })
    }
  }
}))
```

### Testing Database Errors

```typescript
// Simulate database connection error
mocks.supabase.mockSelect.mockResolvedValue({
  data: null,
  error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
})

// Simulate validation error
mocks.supabase.mockInsert.mockResolvedValue({
  data: null,
  error: { message: 'Invalid input', code: 'VALIDATION_ERROR' }
})
```

## Best Practices

1. **Always use `setupApiTestMocks()` and `cleanupApiTestMocks()`** to ensure clean test environment
2. **Use appropriate request creators** for your authentication scenario
3. **Test both success and failure cases** with realistic error conditions
4. **Verify mock calls** to ensure your API routes use the expected services
5. **Use realistic test data** that matches your production schemas
6. **Test edge cases** like malformed tokens, expired sessions, etc.

## Migration from Old Mocking

If you have existing tests using the old mocking pattern:

**Old Pattern:**
```typescript
const mockVerifyIdToken = vi.fn()
vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: mockVerifyIdToken
}))

mockVerifyIdToken.mockResolvedValue({ uid: 'user-123' })
```

**New Pattern:**
```typescript
const mocks = setupApiTestMocks()
mocks.setupValidAuth()
// or
mocks.firebase.mockVerifyIdToken.mockResolvedValue(MOCK_FIREBASE_TOKEN_PAYLOAD)
```

The new pattern provides:
- ✅ Realistic Firebase Admin behavior
- ✅ Proper token caching simulation
- ✅ Consistent mock setup across tests
- ✅ Better error handling and edge cases
- ✅ Session cookie support
- ✅ Comprehensive request creation helpers