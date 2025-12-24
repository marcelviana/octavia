import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll, beforeEach } from 'vitest'
import { cleanup, act } from '@testing-library/react'
import { setupCustomMatchers } from '@/lib/__tests__/custom-matchers'
import type React from 'react'

// Polyfill Promise.withResolvers for older Node.js versions
if (!Promise.withResolvers) {
  (Promise as any).withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

// Hoisted mocks to ensure they run before any module imports
const mocks = vi.hoisted(() => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: vi.fn(),
    getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
    providerId: 'firebase'
  }

  const mockProfile = {
    id: 'test-user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    avatar_url: null,
    primary_instrument: 'Guitar',
    bio: 'Test bio',
    website: 'https://test.com'
  }

  const mockAuthContext = {
    user: mockUser,
    profile: mockProfile,
    idToken: 'mock-id-token',
    isLoading: false,
    loading: false,
    isConfigured: true,
    isInitialized: true,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null, data: mockUser }),
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue({ error: null }),
    refreshToken: vi.fn().mockResolvedValue('mock-id-token'),
    resendVerificationEmail: vi.fn().mockResolvedValue({ error: null })
  }

  return { mockUser, mockProfile, mockAuthContext }
})

// Export mock values for use in tests
export const mockUser = mocks.mockUser
export const mockProfile = mocks.mockProfile
export const mockAuthContextValue = mocks.mockAuthContext

// Mock Firebase Auth Context globally with hoisted factory
vi.mock('@/contexts/firebase-auth-context', () => ({
  useFirebaseAuth: () => mocks.mockAuthContext,
  useAuth: () => mocks.mockAuthContext,
  FirebaseAuthProvider: ({ children }: { children: any }) => children
}))

// Mock app store auth hooks
vi.mock('@/domains/shared/state-management/app-store', async () => {
  const actual = await vi.importActual('@/domains/shared/state-management/app-store')
  return {
    ...actual,
    useAuth: () => ({
      user: mocks.mockUser,
      isAuthenticated: true,
      isLoading: false,
      sessionCookie: 'mock-session-cookie'
    }),
    useAuthActions: () => ({
      setUser: vi.fn(),
      setAuthLoading: vi.fn(),
      setSessionCookie: vi.fn(),
      logout: vi.fn()
    })
  }
})

// Mock Firebase Server Utils for API route authentication
vi.mock('@/lib/firebase-server-utils', async () => {
  const actual = await vi.importActual('@/lib/firebase-server-utils')
  return {
    ...actual,
    requireAuthServer: mockRequireAuthServerSecure
  }
})

// Create a default mock for secure auth that tests can override
// This is exported so individual tests can configure it for specific scenarios
export const mockRequireAuthServerSecure = vi.fn().mockResolvedValue({
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true
})

// Mock Secure Auth Utils for API route authentication
vi.mock('@/lib/secure-auth-utils', async () => {
  const actual = await vi.importActual('@/lib/secure-auth-utils')
  return {
    ...actual,
    requireAuthServerSecure: mockRequireAuthServerSecure,
    // Also provide a helper to reset to default
    __resetAuthMock: () => {
      mockRequireAuthServerSecure.mockResolvedValue({
        uid: 'test-user-123',
        email: 'test@example.com',
        emailVerified: true
      })
    }
  }
})

// Mock Supabase client with query builder chain
const createMockQueryBuilder = (mockData: any[] = []) => {
  const mockBuilder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: null }),
    then: vi.fn((resolve) => resolve({ data: mockData, error: null }))
  }
  return mockBuilder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table) => createMockQueryBuilder([])),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.url' } }))
      }))
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null })
  }))
}))

// Suppress React DevTools warnings in tests
if (typeof window !== 'undefined') {
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    isDisabled: true,
    supportsFiber: true,
    inject: () => {},
    onCommitFiberRoot: () => {},
    onCommitFiberUnmount: () => {},
  };
}

// Mock Fetch API with blob support for testing
const originalFetch = global.fetch
beforeEach(() => {
  global.fetch = vi.fn((url, options) => {
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic',
      url: typeof url === 'string' ? url : url.toString(),
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      blob: vi.fn().mockResolvedValue(new Blob(['mock content'], { type: 'application/octet-stream' })),
      formData: vi.fn().mockResolvedValue(new FormData()),
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue('mock text'),
    } as Response)
  }) as any
})

afterEach(() => {
  global.fetch = originalFetch
})

// Helper function to wrap component rendering in act()
export const renderWithAct = async (renderFn: () => void) => {
  await act(async () => {
    renderFn();
  });
};

// Helper function to wrap user interactions in act()
export const actUserEvent = async (interactionFn: () => Promise<void>) => {
  await act(async () => {
    await interactionFn();
  });
};

// Set up test environment variables
beforeAll(() => {
  // Supabase Test Configuration - use environment variables with secure fallbacks
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test-mock.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'mock-anon-key-for-testing-only'
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'mock-service-key-for-testing-only'
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = process.env.TEST_SUPABASE_BUCKET || 'test-content-files'

  // Firebase Test Configuration - use environment variables with secure fallbacks
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.TEST_FIREBASE_API_KEY || 'mock-test-api-key-for-testing-only'
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.TEST_FIREBASE_AUTH_DOMAIN || 'test-octavia.firebaseapp.com'
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.TEST_FIREBASE_PROJECT_ID || 'test-octavia-project'
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.TEST_FIREBASE_STORAGE_BUCKET || 'test-octavia-project.appspot.com'
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.TEST_FIREBASE_SENDER_ID || '123456789012'
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.TEST_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456789012345678'

  // Firebase Admin Test Configuration - use environment variables with secure fallbacks
  process.env.FIREBASE_PROJECT_ID = process.env.TEST_FIREBASE_PROJECT_ID || 'test-mock-project'
  process.env.FIREBASE_CLIENT_EMAIL = process.env.TEST_FIREBASE_CLIENT_EMAIL || 'test-mock@test-project.iam.gserviceaccount.com'
  
  // Use a mock private key for testing - never put real keys in code!
  process.env.FIREBASE_PRIVATE_KEY = process.env.TEST_FIREBASE_PRIVATE_KEY || 
    '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING_ONLY_DO_NOT_USE_IN_PRODUCTION\n-----END PRIVATE KEY-----'

  // Proxy Configuration
  process.env.ALLOWED_PROXY_HOSTS = process.env.TEST_ALLOWED_PROXY_HOSTS || 'localhost,127.0.0.1'

  // Additional test environment variables
  process.env.NEXTAUTH_SECRET = process.env.TEST_NEXTAUTH_SECRET || 'mock-test-secret-key-change-in-production'
  process.env.NEXTAUTH_URL = process.env.TEST_NEXTAUTH_URL || 'http://localhost:3000'
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds = []
  
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return [] }
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => {
    const mockMatchMedia = {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    
    // Ensure matches property is always accessible
    Object.defineProperty(mockMatchMedia, 'matches', {
      value: false,
      writable: true,
      enumerable: true,
      configurable: true
    });
    
    return mockMatchMedia;
  }),
})

// Also set up a global mock for situations where window.matchMedia might be called before setup
if (typeof window !== 'undefined') {
  (window as any).matchMedia = window.matchMedia || vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Setup custom matchers for behavioral testing
setupCustomMatchers()