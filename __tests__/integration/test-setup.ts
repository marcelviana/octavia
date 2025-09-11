/**
 * Integration Test Setup
 * 
 * Comprehensive test setup for integration tests that validate
 * complete user journeys and cross-system functionality.
 * 
 * Features:
 * - Mock service layer with realistic data
 * - Simulated authentication context
 * - Offline/online state management
 * - Performance monitoring utilities
 * - Test data factories
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import type { Database } from '@/types/supabase'

// Test data types
type Content = Database["public"]["Tables"]["content"]["Row"]
type Setlist = Database["public"]["Tables"]["setlists"]["Row"]

// Test user context
export interface TestUser {
  uid: string
  email: string
  displayName?: string
}

export const TEST_USER: TestUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
}

// Test data factories
export const createTestContent = (overrides: Partial<Content> = {}): Content => ({
  id: `content-${Date.now()}-${Math.random()}`,
  user_id: TEST_USER.uid,
  title: 'Test Song',
  artist: 'Test Artist',
  content_type: 'LYRICS',
  file_url: 'https://example.com/test-file.pdf',
  content_data: {
    lyrics: 'Test lyrics content\nLine 2\nLine 3',
    file: 'https://example.com/test-file.pdf'
  },
  key: 'C',
  bpm: 120,
  notes: 'Test notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestSetlist = (overrides: Partial<Setlist> = {}): Setlist => ({
  id: `setlist-${Date.now()}-${Math.random()}`,
  user_id: TEST_USER.uid,
  name: 'Test Setlist',
  description: 'A test setlist for integration tests',
  performance_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  venue: 'Test Venue',
  notes: 'Test setlist notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Mock server handlers
const handlers = [
  // Content API endpoints
  http.get('/api/content', () => {
    const testContent = [
      createTestContent({ title: 'Song 1', content_type: 'LYRICS' }),
      createTestContent({ title: 'Song 2', content_type: 'CHORDS' }),
      createTestContent({ title: 'Song 3', content_type: 'TABS' }),
    ]
    return HttpResponse.json({
      content: testContent,
      total: testContent.length,
      page: 1,
      hasMore: false
    })
  }),

  http.get('/api/content/:id', ({ params }) => {
    const content = createTestContent({ id: params.id as string })
    return HttpResponse.json(content)
  }),

  http.post('/api/content', async ({ request }) => {
    const data = await request.json()
    const content = createTestContent(data as Partial<Content>)
    return HttpResponse.json(content, { status: 201 })
  }),

  // Setlist API endpoints
  http.get('/api/setlists', () => {
    const testSetlist = createTestSetlist()
    return HttpResponse.json([{
      ...testSetlist,
      setlist_songs: []
    }])
  }),

  http.get('/api/setlists/:id', ({ params }) => {
    const setlist = createTestSetlist({ id: params.id as string })
    return HttpResponse.json({
      ...setlist,
      setlist_songs: []
    })
  }),

  // File proxy endpoint for testing
  http.get('/api/proxy', ({ request }) => {
    const url = new URL(request.url)
    const targetUrl = url.searchParams.get('url')
    
    // Simulate different file types
    if (targetUrl?.includes('.pdf')) {
      return new HttpResponse(new ArrayBuffer(1024), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': '1024'
        }
      })
    }
    
    if (targetUrl?.includes('.jpg') || targetUrl?.includes('.png')) {
      return new HttpResponse(new ArrayBuffer(512), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': '512'
        }
      })
    }

    return new HttpResponse('Test file content', {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Length': '17'
      }
    })
  }),

  // Authentication endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(TEST_USER)
  }),
]

// Create MSW server
export const server = setupServer(...handlers)

// Performance monitoring utilities
export const performanceMonitor = {
  measurements: new Map<string, number>(),
  
  start(label: string) {
    this.measurements.set(`${label}-start`, performance.now())
  },
  
  end(label: string): number {
    const start = this.measurements.get(`${label}-start`)
    if (!start) {
      throw new Error(`No start measurement found for ${label}`)
    }
    
    const duration = performance.now() - start
    this.measurements.set(`${label}-duration`, duration)
    return duration
  },
  
  getDuration(label: string): number {
    const duration = this.measurements.get(`${label}-duration`)
    if (duration === undefined) {
      throw new Error(`No duration measurement found for ${label}`)
    }
    return duration
  },
  
  clear() {
    this.measurements.clear()
  }
}

// Offline/online state simulation
export const networkSimulator = {
  isOnline: true,
  
  goOffline() {
    this.isOnline = false
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })
    window.dispatchEvent(new Event('offline'))
  },
  
  goOnline() {
    this.isOnline = true
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })
    window.dispatchEvent(new Event('online'))
  },
  
  simulateSlowConnection() {
    // Add delay to all network requests
    server.use(
      http.all('*', async ({ request }) => {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2s delay
        return HttpResponse.json({ error: 'Timeout' }, { status: 408 })
      })
    )
  },
  
  reset() {
    this.goOnline()
    server.resetHandlers()
  }
}

// Firebase Auth mock
const mockCurrentUser = {
  uid: TEST_USER.uid,
  email: TEST_USER.email,
  displayName: TEST_USER.displayName,
}

export const mockFirebaseAuth = {
  currentUser: mockCurrentUser,
  
  onAuthStateChanged: vi.fn((callback) => {
    callback(mockCurrentUser)
    return vi.fn() // unsubscribe function
  }),
  
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: mockCurrentUser
  }),
  
  signOut: vi.fn().mockResolvedValue(undefined),
}

// LocalStorage mock for caching tests
const localStorageMock = {
  store: new Map<string, string>(),
  
  getItem: vi.fn((key: string) => {
    return localStorageMock.store.get(key) || null
  }),
  
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store.set(key, value)
  }),
  
  removeItem: vi.fn((key: string) => {
    localStorageMock.store.delete(key)
  }),
  
  clear: vi.fn(() => {
    localStorageMock.store.clear()
  }),
  
  key: vi.fn((index: number) => {
    const keys = Array.from(localStorageMock.store.keys())
    return keys[index] || null
  }),
  
  get length() {
    return localStorageMock.store.size
  }
}

// Global setup
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
  
  // Mock global APIs
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
  
  Object.defineProperty(window, 'performance', {
    value: {
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn(),
    }
  })

  // Mock Firebase
  vi.mock('@/lib/firebase', () => ({
    auth: mockFirebaseAuth,
    app: {},
  }))

  // Mock IndexedDB for offline cache tests
  vi.mock('localforage', () => ({
    default: {
      getItem: vi.fn().mockResolvedValue(null),
      setItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
    }
  }))
})

afterAll(() => {
  server.close()
})

beforeEach(() => {
  performanceMonitor.clear()
  networkSimulator.reset()
  localStorageMock.clear()
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})