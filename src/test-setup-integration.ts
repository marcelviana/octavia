// Set up mock environment variables for integration tests (must be before any imports)
(function setupMockEnvironment() {
  // Supabase Configuration - provide mock values for testing
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-test-project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stdGVzdC1wcm9qZWN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2NTcxMjAwfQ.mock-service-role-key-for-testing-only';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY2stdGVzdC1wcm9qZWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjU3MTIwMH0.mock-anon-key-for-testing-only';
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'test-content-files';
  
  // Firebase Configuration - provide mock values for testing
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-test-api-key-for-testing-only';
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'test-octavia.firebaseapp.com';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'test-octavia-project';
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'test-octavia-project.appspot.com';
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012';
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456789012345678';
  
  // Firebase Admin Configuration
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-octavia-project';
  process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test-service-account@test-octavia-project.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY_FOR_TESTING_ONLY_DO_NOT_USE_IN_PRODUCTION\n-----END PRIVATE KEY-----';
  
  // Other required environment variables
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'mock-test-secret-key-for-testing-only-change-in-production';
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
})();

// Import vitest globals first so expect is available
import { vi, beforeAll, afterEach, afterAll } from 'vitest'
import '@testing-library/jest-dom'
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