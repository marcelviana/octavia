/**
 * API Test Helpers - Simplified utilities for API testing
 */

import { vi } from 'vitest'
import { createSetlistAPIMock, SupabaseMockFactory } from './supabase-mock-factory'

/**
 * Create mock data for API route tests
 * Note: vi.mock calls should be done in test files to avoid hoisting issues
 */
export function createAPIMockData() {
  // Create Supabase mock
  const apiMock = createSetlistAPIMock()
  
  return {
    ...apiMock
  }
}

/**
 * Helper to create a mock Next.js request
 */
export function createMockRequest(options: {
  method?: string
  url?: string
  body?: any
  headers?: Record<string, string>
} = {}) {
  const { method = 'GET', url = 'http://localhost:3000/api/test', body, headers = {} } = options

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
}

/**
 * Create error scenarios for testing
 */
export function createErrorScenarios(factory: SupabaseMockFactory) {
  return {
    databaseError: () => {
      factory.setMockError('setlists', {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed'
      })
    },
    
    setlistNotFound: () => {
      factory.setMockError('setlists', {
        code: 'PGRST116',
        message: 'No rows found'
      })
    },
    
    contentNotFound: () => {
      factory.setMockData('content', [])
    },
    
    unauthorizedAccess: () => {
      factory.setMockData('setlists', [])
    }
  }
}
