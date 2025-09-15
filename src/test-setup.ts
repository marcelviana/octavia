import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll } from 'vitest'
import { cleanup, act } from '@testing-library/react'
import { setupCustomMatchers } from '@/lib/__tests__/custom-matchers'

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