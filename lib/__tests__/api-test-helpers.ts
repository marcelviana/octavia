import { vi, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Use variáveis de ambiente para token e email reais
export const VALID_FIREBASE_TOKEN = process.env.FIREBASE_TEST_USER_TOKEN || 'valid-token'
const TEST_USER_EMAIL = process.env.FIREBASE_TEST_USER_EMAIL || 'test-user@example.com'
const TEST_USER_ID = 'auvL2KKsYBVdvvnc83faOJM8rLi1'

export const mockFirebaseAdmin = () => {
    const mockVerifyIdToken = vi.fn((token: string) => {
        if (token === VALID_FIREBASE_TOKEN) {
            return Promise.resolve({
                uid: TEST_USER_ID,
                email: TEST_USER_EMAIL,
                name: 'Test User',
                picture: 'https://example.com/avatar.png',
            })
        } else {
            const error: any = new Error('Invalid token')
            error.code = 'auth/invalid-token'
            return Promise.reject(error)
        }
    })

    const mockGetUser = vi.fn((uid: string) => {
        return Promise.resolve({
            uid,
            email: TEST_USER_EMAIL,
        })
    })

    const mockCreateUser = vi.fn((props: any) => {
        return Promise.resolve({
            uid: 'new-user-id',
            ...props,
        })
    })

    vi.doMock('@/lib/firebase-admin', () => ({
        verifyFirebaseToken: mockVerifyIdToken,
        getUserByUid: mockGetUser,
        createUser: mockCreateUser,
        initializeFirebaseAdmin: vi.fn(),
    }))

    return {
        mockVerifyIdToken,
        mockGetUser,
        mockCreateUser,
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

// Mock Firebase Server Utils for content/storage endpoints
export const mockFirebaseServerUtils = () => {
    const mockRequireAuthServer = vi.fn((request: Request) => {
        const authHeader = request.headers.get('authorization')
        const cookieHeader = request.headers.get('cookie')
        
        let token: string | null = null
        
        // Extract token from Authorization header
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7)
        }
        // Or from session cookie
        else if (cookieHeader && cookieHeader.includes('firebase-session=')) {
            const match = cookieHeader.match(/firebase-session=([^;]+)/)
            token = match ? match[1] : null
        }
        
        if (token === VALID_FIREBASE_TOKEN) {
            return Promise.resolve({
                uid: TEST_USER_ID,
                email: TEST_USER_EMAIL,
                emailVerified: true,
            })
        } else {
            return Promise.resolve(null)
        }
    })

    const mockValidateFirebaseTokenServer = vi.fn((idToken: string) => {
        if (idToken === VALID_FIREBASE_TOKEN) {
            return Promise.resolve({
                isValid: true,
                user: {
                    uid: TEST_USER_ID,
                    email: TEST_USER_EMAIL,
                    emailVerified: true,
                }
            })
        } else {
            return Promise.resolve({
                isValid: false,
                error: 'Invalid token'
            })
        }
    })

    vi.doMock('@/lib/firebase-server-utils', () => ({
        requireAuthServer: mockRequireAuthServer,
        validateFirebaseTokenServer: mockValidateFirebaseTokenServer,
        validateFirebaseTokenServerLegacy: mockValidateFirebaseTokenServer,
    }))

    return {
        mockRequireAuthServer,
        mockValidateFirebaseTokenServer,
    }
}

// Mock Supabase service client
export const mockSupabaseService = () => {
    const mockFrom = vi.fn()
    const mockSelect = vi.fn()
    const mockInsert = vi.fn()
    const mockUpdate = vi.fn()
    const mockDelete = vi.fn()
    const mockUpsert = vi.fn()
    const mockEq = vi.fn()
    const mockOrder = vi.fn()
    const mockSingle = vi.fn()
    const mockRange = vi.fn()

    // Chain methods return themselves for fluent API - Fixed chaining
    mockSelect.mockReturnValue({ 
        eq: mockEq, 
        order: mockOrder, 
        range: mockRange, 
        single: mockSingle,
        or: mockSelect,
        in: mockSelect
    })
    
    mockEq.mockReturnValue({ 
        order: mockOrder, 
        single: mockSingle, 
        range: mockRange, 
        eq: mockEq,
        select: mockSelect
    })
    
    mockOrder.mockReturnValue({ 
        range: mockRange, 
        single: mockSingle 
    })
    
    mockInsert.mockReturnValue({ 
        select: mockSelect,
        single: mockSingle
    })
    
    // Fix UPDATE chain to return proper mock references
    mockUpdate.mockReturnValue({ 
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
    })
    
    // Fix DELETE chain to return proper mock references  
    mockDelete.mockReturnValue({ 
        eq: mockEq,
        select: mockSelect,
        single: mockSingle
    })
    
    mockUpsert.mockReturnValue({ 
        select: mockSelect,
        single: mockSingle
    })
    
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
        mockOrder,
        mockSingle,
        mockRange
    }
}

// Create a mock NextRequest
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

// Authentication helpers
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

// Response assertion helpers
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

// JSON response helpers
export const getJsonResponse = async (response: Response) => {
    const text = await response.text()
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

// Setup common mocks for API tests
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

    return {
        firebase: mockFirebaseAdmin(),
        firebaseServer: mockFirebaseServerUtils(),
        supabase: mockSupabaseService(),
        storage: mockSupabaseStorage()
    }
}

// Clean up mocks after tests
export const cleanupApiTestMocks = () => {
    vi.resetModules()
    vi.clearAllMocks()
} 