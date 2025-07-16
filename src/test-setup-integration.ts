// Set up mock environment variables for integration tests (must be before any imports)
(function setupMockEnvironment() {
  // Supabase Configuration - use actual system environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-mock.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key-for-testing-only';
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-for-testing-only';
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'test-content';
  
  // Firebase Configuration
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-project-id';
  process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@test-project.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMOCK_KEY_FOR_TESTING_ONLY\n-----END PRIVATE KEY-----';
  
  // Other required environment variables
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key';
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
})();

import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'
import { setupTestDatabase, cleanupTestData } from '@/lib/__tests__/test-database'
import { cleanupTestAuth } from '@/lib/__tests__/test-auth'

// Integration test environment setup
// Uses real services with boundary mocking only

// Setup test environment
beforeAll(async () => {
  // Initialize test database
  await setupTestDatabase()
  
  // Mock only external boundaries, not internal services
  setupBoundaryMocks()
})

// Clean up after each test to ensure isolation
afterEach(async () => {
  // Clean up test data but preserve database structure
  await cleanupTestData()
  await cleanupTestAuth()
  
  // Clear all mocks but preserve boundary mocks
  vi.clearAllMocks()
})

// Clean up after all tests
afterAll(async () => {
  // Final cleanup
  await cleanupTestData()
  await cleanupTestAuth()
})

/**
 * Sets up boundary mocks for external services
 * These are the ONLY things we mock in integration tests
 */
function setupBoundaryMocks() {
  // Mock external HTTP requests (but not internal API routes)
  global.fetch = vi.fn()
  
  // Mock browser APIs that aren't available in test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock localStorage (if needed for some tests)
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  })

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock performance API
  Object.defineProperty(window, 'performance', {
    value: {
      mark: vi.fn(),
      measure: vi.fn(),
      now: vi.fn(() => Date.now()),
      getEntriesByType: vi.fn(() => []),
    }
  })

  // Mock console.warn/error for cleaner test output
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

// NODE_ENV should already be 'test' when running tests
if (process.env.NODE_ENV !== 'test') {
  console.warn('Integration tests should run with NODE_ENV=test')
} 