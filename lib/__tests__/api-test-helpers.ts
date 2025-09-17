import { vi, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Use variáveis de ambiente para token e email reais
export const VALID_FIREBASE_TOKEN = process.env.FIREBASE_TEST_USER_TOKEN || 'valid-token'
export const EXPIRED_FIREBASE_TOKEN = 'expired-token-12345'
export const INVALID_FIREBASE_TOKEN = 'invalid-token-12345'
export const MALFORMED_FIREBASE_TOKEN = 'malformed'

const TEST_USER_EMAIL = process.env.FIREBASE_TEST_USER_EMAIL || 'test-user@example.com'
const TEST_USER_ID = 'auvL2KKsYBVdvvnc83faOJM8rLi1'

// Realistic Firebase ID token payload structure
export const MOCK_FIREBASE_TOKEN_PAYLOAD = {
  iss: `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID || 'test-project'}`,
  aud: process.env.FIREBASE_PROJECT_ID || 'test-project',
  auth_time: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
  user_id: TEST_USER_ID,
  sub: TEST_USER_ID,
  iat: Math.floor(Date.now() / 1000) - 300,
  exp: Math.floor(Date.now() / 1000) + 3300, // 55 minutes from now (1 hour tokens)
  email: TEST_USER_EMAIL,
  email_verified: true,
  firebase: {
    identities: {
      email: [TEST_USER_EMAIL]
    },
    sign_in_provider: 'password'
  },
  uid: TEST_USER_ID,
  name: 'Test User',
  picture: 'https://example.com/avatar.png'
}

// Create realistic Firebase Admin error with proper error codes
const createFirebaseError = (code: string, message: string) => {
  const error = new Error(message) as any
  error.code = code
  error.codePrefix = 'auth'
  return error
}

export const mockFirebaseAdmin = () => {
  const mockVerifyIdToken = vi.fn((token: string) => {
    // Simulate realistic token verification with proper error handling
    switch (token) {
      case VALID_FIREBASE_TOKEN:
        return Promise.resolve({
          ...MOCK_FIREBASE_TOKEN_PAYLOAD,
          // Additional Firebase Admin specific fields
          uid: TEST_USER_ID,
          email: TEST_USER_EMAIL,
          email_verified: true,
          name: 'Test User',
          picture: 'https://example.com/avatar.png'
        })

      case EXPIRED_FIREBASE_TOKEN:
        return Promise.reject(createFirebaseError(
          'auth/id-token-expired',
          'Firebase ID token has expired. Get a fresh token from your client app and try again.'
        ))

      case MALFORMED_FIREBASE_TOKEN:
        return Promise.reject(createFirebaseError(
          'auth/argument-error',
          'Firebase ID token has incorrect format'
        ))

      case INVALID_FIREBASE_TOKEN:
      default:
        return Promise.reject(createFirebaseError(
          'auth/id-token-revoked',
          'Firebase ID token has been revoked'
        ))
    }
  })

  const mockGetUser = vi.fn((uid: string) => {
    if (uid === TEST_USER_ID) {
      return Promise.resolve({
        uid,
        email: TEST_USER_EMAIL,
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://example.com/avatar.png',
        disabled: false,
        metadata: {
          creationTime: '2024-01-01T00:00:00Z',
          lastSignInTime: new Date().toISOString(),
          lastRefreshTime: new Date().toISOString()
        },
        providerData: [{
          uid: TEST_USER_EMAIL,
          email: TEST_USER_EMAIL,
          providerId: 'password'
        }],
        customClaims: {}
      })
    } else if (uid === 'unverified-user-123') {
      return Promise.resolve({
        uid,
        email: 'unverified@example.com',
        emailVerified: false,
        displayName: 'Unverified User',
        disabled: false
      })
    } else {
      return Promise.reject(createFirebaseError(
        'auth/user-not-found',
        'There is no user record corresponding to the provided identifier'
      ))
    }
  })

  const mockCreateUser = vi.fn((props: any) => {
    return Promise.resolve({
      uid: 'new-user-id',
      email: props.email,
      emailVerified: props.emailVerified || false,
      displayName: props.displayName,
      disabled: false,
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: null
      },
      providerData: []
    })
  })

  // Mock Firebase Admin initialization
  const mockInitializeFirebaseAdmin = vi.fn()

  vi.doMock('@/lib/firebase-admin', () => ({
    verifyFirebaseToken: mockVerifyIdToken,
    getUserByUid: mockGetUser,
    createUser: mockCreateUser,
    initializeFirebaseAdmin: mockInitializeFirebaseAdmin,
    getFirebaseAdminAuth: vi.fn(() => ({
      verifyIdToken: mockVerifyIdToken,
      getUser: mockGetUser,
      createUser: mockCreateUser
    }))
  }))

  return {
    mockVerifyIdToken,
    mockGetUser,
    mockCreateUser,
    mockInitializeFirebaseAdmin
  }
}

// Enhanced Firebase Server Utils mock with realistic token caching behavior
export const mockFirebaseServerUtils = () => {
  // Simulate the token cache behavior from the real implementation
  const tokenCache = new Map<string, { result: any; exp: number }>()

  const mockRequireAuthServer = vi.fn(async (request: Request) => {
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')

    let token: string | null = null

    // Extract token from Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    // Or from session cookie
    else if (cookieHeader && cookieHeader.includes('firebase-session=')) {
      const match = cookieHeader.match(/firebase-session=([^;]+)/)
      token = match ? match[1] : null
    }

    if (!token) {
      return null
    }

    // Check cache first (simulating real caching behavior)
    const cached = tokenCache.get(token)
    const now = Date.now()

    if (cached && cached.exp > now) {
      return cached.result.isValid ? cached.result.user : null
    }

    // Simulate token validation
    let result: any
    switch (token) {
      case VALID_FIREBASE_TOKEN:
        result = {
          isValid: true,
          user: {
            uid: TEST_USER_ID,
            email: TEST_USER_EMAIL,
            emailVerified: true
          }
        }
        // Cache for 1 hour (like real implementation)
        tokenCache.set(token, {
          result,
          exp: now + 60 * 60 * 1000
        })
        return result.user

      case EXPIRED_FIREBASE_TOKEN:
      case INVALID_FIREBASE_TOKEN:
      case MALFORMED_FIREBASE_TOKEN:
      default:
        result = {
          isValid: false,
          error: 'Invalid or expired token'
        }
        // Don't cache invalid tokens
        return null
    }
  })

  const mockValidateFirebaseTokenServer = vi.fn(async (idToken: string, requestUrl?: string) => {
    // Check cache first
    const cached = tokenCache.get(idToken)
    const now = Date.now()

    if (cached && cached.exp > now) {
      return cached.result
    }

    // Validate token
    let result: any
    switch (idToken) {
      case VALID_FIREBASE_TOKEN:
        result = {
          isValid: true,
          user: {
            uid: TEST_USER_ID,
            email: TEST_USER_EMAIL,
            emailVerified: true
          }
        }
        // Cache the result (simulating real behavior)
        tokenCache.set(idToken, {
          result,
          exp: now + 60 * 60 * 1000 // 1 hour cache
        })
        break

      case EXPIRED_FIREBASE_TOKEN:
        result = {
          isValid: false,
          error: 'Token has expired'
        }
        break

      case MALFORMED_FIREBASE_TOKEN:
        result = {
          isValid: false,
          error: 'Token format is invalid'
        }
        break

      case INVALID_FIREBASE_TOKEN:
      default:
        result = {
          isValid: false,
          error: 'Invalid token'
        }
        break
    }

    return result
  })

  // Mock the legacy function as well
  const mockValidateFirebaseTokenServerLegacy = mockValidateFirebaseTokenServer

  vi.doMock('@/lib/firebase-server-utils', () => ({
    requireAuthServer: mockRequireAuthServer,
    validateFirebaseTokenServer: mockValidateFirebaseTokenServer,
    validateFirebaseTokenServerLegacy: mockValidateFirebaseTokenServerLegacy,
  }))

  // Mock secure auth utils
  vi.doMock('@/lib/secure-auth-utils', () => ({
    validateFirebaseTokenSecure: mockValidateFirebaseTokenServer,
    requireAuthServerSecure: mockRequireAuthServer,
  }))

  return {
    mockRequireAuthServer,
    mockValidateFirebaseTokenServer,
    mockValidateFirebaseTokenServerLegacy,
    // Provide access to cache for testing cache behavior
    getTokenCache: () => tokenCache,
    clearTokenCache: () => tokenCache.clear()
  }
}

// Mock Supabase Storage for file upload/delete endpoints
export const mockSupabaseStorage = () => {
  const mockUpload = vi.fn()
  const mockGetPublicUrl = vi.fn()
  const mockDelete = vi.fn()
  const mockFrom = vi.fn()

  mockUpload.mockResolvedValue({
    data: { path: 'test-file.pdf' },
    error: null
  })

  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: 'https://storage.example.com/test-file.pdf' }
  })

  mockDelete.mockResolvedValue({ error: null })

  mockFrom.mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
    remove: mockDelete
  })

  vi.doMock('@/lib/supabase-service', () => ({
    getSupabaseServiceClient: () => ({
      storage: { from: mockFrom }
    })
  }))

  return {
    mockUpload,
    mockGetPublicUrl,
    mockDelete,
    mockFrom
  }
}

// Enhanced Supabase service mock with better query simulation
export const mockSupabaseService = () => {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockUpsert = vi.fn()
  const mockEq = vi.fn()
  const mockOr = vi.fn()
  const mockIn = vi.fn()
  const mockOrder = vi.fn()
  const mockSingle = vi.fn()
  const mockRange = vi.fn()

  // Create a more realistic chain that matches Supabase PostgREST API
  const createChain = () => ({
    eq: mockEq,
    or: mockOr,
    in: mockIn,
    order: mockOrder,
    single: mockSingle,
    range: mockRange,
    select: mockSelect
  })

  // All query methods return the same chain for fluent API
  mockSelect.mockReturnValue(createChain())
  mockEq.mockReturnValue(createChain())
  mockOr.mockReturnValue(createChain())
  mockIn.mockReturnValue(createChain())
  mockOrder.mockReturnValue(createChain())

  // Insert/Update/Delete also return chains for .select() calls
  mockInsert.mockReturnValue(createChain())
  mockUpdate.mockReturnValue(createChain())
  mockDelete.mockReturnValue(createChain())
  mockUpsert.mockReturnValue(createChain())

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    upsert: mockUpsert
  })

  const mockClient = { from: mockFrom }

  vi.doMock('@/lib/supabase-service', () => ({
    getSupabaseServiceClient: () => mockClient
  }))

  return {
    mockClient,
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockUpsert,
    mockEq,
    mockOr,
    mockIn,
    mockOrder,
    mockSingle,
    mockRange
  }
}

// Enhanced request creation with better header and cookie handling
export const createMockRequest = (
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    cookies?: Record<string, string>
  } = {}
): NextRequest => {
  const { method = 'GET', headers = {}, body, cookies = {} } = options

  // Create headers object
  const headersObj = new Headers(headers)

  // Add cookies to headers if provided
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    headersObj.set('cookie', cookieString)
  }

  const requestInit: RequestInit = {
    method,
    headers: headersObj
  }

  if (body && method !== 'GET') {
    if (body instanceof FormData) {
      requestInit.body = body
      // Don't set content-type for FormData, let browser set it with boundary
    } else if (typeof body === 'string') {
      requestInit.body = body
      headersObj.set('content-type', 'application/json')
    } else {
      requestInit.body = JSON.stringify(body)
      headersObj.set('content-type', 'application/json')
    }
  }

  const request = new Request(url, requestInit)
  return new NextRequest(request)
}

// Authentication helpers with enhanced token support
export const createAuthenticatedRequest = (
  url: string,
  token: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createMockRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  })
}

// Helper to create authenticated request with valid token
export const createValidAuthenticatedRequest = (
  url: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createAuthenticatedRequest(url, VALID_FIREBASE_TOKEN, options)
}

// Helper to create request with expired token
export const createExpiredAuthenticatedRequest = (
  url: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createAuthenticatedRequest(url, EXPIRED_FIREBASE_TOKEN, options)
}

// Helper to create request with invalid token
export const createInvalidAuthenticatedRequest = (
  url: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createAuthenticatedRequest(url, INVALID_FIREBASE_TOKEN, options)
}

export const createSessionCookieRequest = (
  url: string,
  sessionToken: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createMockRequest(url, {
    ...options,
    cookies: {
      ...options.cookies,
      'firebase-session': sessionToken
    }
  })
}

// Helper to create request with valid session cookie
export const createValidSessionCookieRequest = (
  url: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest => {
  return createSessionCookieRequest(url, VALID_FIREBASE_TOKEN, options)
}

// Common test user data - matches the mocked authentication
export const TEST_USER = {
  uid: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  emailVerified: true,
  displayName: 'Test User'
}

export const TEST_UNVERIFIED_USER = {
  uid: 'unverified-user-123',
  email: 'unverified@example.com',
  emailVerified: false,
  displayName: 'Unverified User'
}

// Common test content data
export const TEST_CONTENT = {
  id: 'content-123',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  content_type: 'Lyrics', // Must match schema enum
  content_data: { lyrics: 'Test song lyrics' }, // Correct field name
  user_id: TEST_USER.uid,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

// Response assertion helpers with better error messages
export const expectUnauthorized = (response: Response) => {
  expect(response.status).toBe(401)
}

export const expectBadRequest = (response: Response) => {
  expect(response.status).toBe(400)
}

export const expectSuccess = (response: Response) => {
  expect(response.status).toBe(200)
}

export const expectCreated = (response: Response) => {
  expect(response.status).toBe(201)
}

export const expectNotFound = (response: Response) => {
  expect(response.status).toBe(404)
}

export const expectServerError = (response: Response) => {
  expect(response.status).toBe(500)
}

// Enhanced JSON response helpers with better error handling
export const getJsonResponse = async (response: Response) => {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// Helper to assert response has proper error structure
export const expectErrorResponse = async (response: Response, expectedMessage?: string) => {
  const data = await getJsonResponse(response)
  expect(data).toHaveProperty('error')
  if (expectedMessage) {
    expect(data.error).toContain(expectedMessage)
  }
}

// Helper to assert response has proper success structure
export const expectSuccessResponse = async (response: Response, expectedData?: any) => {
  const data = await getJsonResponse(response)
  expect(response.status).toBeLessThan(400)
  if (expectedData) {
    expect(data).toMatchObject(expectedData)
  }
  return data
}

// Setup comprehensive mocks for API tests with better integration
export const setupApiTestMocks = () => {
  // Mock logger to avoid console spam
  vi.doMock('@/lib/logger', () => ({
    default: {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    }
  }))

  // Mock rate limiting
  vi.doMock('@/lib/rate-limit', () => ({
    withRateLimit: (handler: any) => handler
  }))

  // Mock session cookie utilities
  vi.doMock('@/lib/firebase-session-cookies', () => ({
    setSessionCookie: vi.fn(),
    clearSessionCookie: vi.fn(),
    getSessionCookie: vi.fn()
  }))

  const firebase = mockFirebaseAdmin()
  const firebaseServer = mockFirebaseServerUtils()
  const supabase = mockSupabaseService()
  const storage = mockSupabaseStorage()

  return {
    firebase,
    firebaseServer,
    supabase,
    storage,
    // Provide utilities for test-specific setup
    setupValidAuth: () => {
      firebase.mockVerifyIdToken.mockResolvedValue(MOCK_FIREBASE_TOKEN_PAYLOAD)
      firebaseServer.mockRequireAuthServer.mockResolvedValue(TEST_USER)
      firebaseServer.mockValidateFirebaseTokenServer.mockResolvedValue({
        isValid: true,
        user: TEST_USER
      })
    },
    setupInvalidAuth: () => {
      firebase.mockVerifyIdToken.mockRejectedValue(createFirebaseError('auth/id-token-revoked', 'Token revoked'))
      firebaseServer.mockRequireAuthServer.mockResolvedValue(null)
      firebaseServer.mockValidateFirebaseTokenServer.mockResolvedValue({
        isValid: false,
        error: 'Invalid token'
      })
    }
  }
}

// Clean up mocks after tests
export const cleanupApiTestMocks = () => {
  vi.resetModules()
  vi.clearAllMocks()
}

// Token constants are already exported at the top of the file