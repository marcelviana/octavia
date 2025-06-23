import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Set up test environment variables
beforeAll(() => {
  // Supabase Test Configuration
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiJ9.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoic2VydmljZV9yb2xlIn0.test'
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET = 'content-files'

  // Firebase Test Configuration
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com'
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789'
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID = '1:123456789:web:abcdef'

  // Firebase Admin Test Configuration
  process.env.FIREBASE_PROJECT_ID = 'test-project'
  process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com'
  process.env.FIREBASE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
UIQ6rQ6V3c9YVZVnUSYJKBKUc6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7Md
bEK6pqzN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK
6pqzN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pq
zN6JcJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6J
cJdQjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJd
QjXoE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjX
oE1OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1
OHh6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh
6Qjf7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6Qj
f7Vt7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6Qjf7V
t7a8L4qkFgOBJBNQXGCQGW8HQS6Zo7MdbEK6pqzN6JcJdQjXoE1OHh6
-----END PRIVATE KEY-----`

  // Proxy Configuration
  process.env.ALLOWED_PROXY_HOSTS = 'demo.supabase.co,imslp.org,uploads.musescore.com'

  // Additional test environment variables
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
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
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Clean up after each test
afterEach(() => {
  cleanup()
})