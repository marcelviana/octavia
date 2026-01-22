/**
 * Smart Supabase Mock Factory for Complex API Tests
 * 
 * This factory creates table-aware mocks that respond dynamically
 * to different query patterns without relying on call counting.
 */

import { vi } from 'vitest'

export interface MockData {
  setlists?: any[]
  setlist_songs?: any[]
  content?: any[]
  [tableName: string]: any[] | undefined
}

export interface MockErrors {
  setlists?: any
  setlist_songs?: any
  content?: any
  [tableName: string]: any
}

interface QueryContext {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  filters: Record<string, any>
  columns: string[]
}

export class SupabaseMockFactory {
  private mockData: MockData = {}
  private mockErrors: MockErrors = {}
  private queryLog: QueryContext[] = []

  constructor(initialData: MockData = {}, initialErrors: MockErrors = {}) {
    this.mockData = initialData
    this.mockErrors = initialErrors
  }

  /**
   * Set mock data for specific tables
   */
  setMockData(tableName: string, data: any[]): this {
    this.mockData[tableName] = data
    return this
  }

  /**
   * Set mock errors for specific tables
   */
  setMockError(tableName: string, error: any): this {
    this.mockErrors[tableName] = error
    return this
  }

  /**
   * Clear all mock data and errors
   */
  clear(): this {
    this.mockData = {}
    this.mockErrors = {}
    this.queryLog = []
    return this
  }

  /**
   * Get query log for debugging
   */
  getQueryLog(): QueryContext[] {
    return [...this.queryLog]
  }

  /**
   * Create a smart Supabase client mock
   */
  createSupabaseMock() {
    const mockClient = {
      from: vi.fn((tableName: string) => {
        return this.createQueryBuilder(tableName)
      })
    }

    return mockClient
  }

  private createQueryBuilder(tableName: string) {
    let currentContext: QueryContext = {
      table: tableName,
      operation: 'select',
      filters: {},
      columns: []
    }

    const builder: any = {}

    // Chainable query methods
    builder.select = vi.fn((columns = '*') => {
      currentContext.operation = 'select'
      currentContext.columns = columns === '*' ? [] : columns.split(',').map((c: string) => c.trim())
      return builder
    })

    builder.insert = vi.fn((data) => {
      currentContext.operation = 'insert'
      return builder
    })

    builder.update = vi.fn((data) => {
      currentContext.operation = 'update'
      return builder
    })

    builder.delete = vi.fn(() => {
      currentContext.operation = 'delete'
      return builder
    })

    // Filter methods
    builder.eq = vi.fn((column, value) => {
      currentContext.filters[column] = { op: 'eq', value }
      return builder
    })

    builder.neq = vi.fn((column, value) => {
      currentContext.filters[column] = { op: 'neq', value }
      return builder
    })

    builder.in = vi.fn((column, values) => {
      currentContext.filters[column] = { op: 'in', value: values }
      return builder
    })

    builder.order = vi.fn((column, options) => {
      currentContext.filters['_order'] = { column, options }
      return builder
    })

    builder.limit = vi.fn((count) => {
      currentContext.filters['_limit'] = count
      return builder
    })

    // Terminal methods that return promises
    builder.single = vi.fn(() => {
      return this.executeQuery(currentContext, true)
    })

    builder.maybeSingle = vi.fn(() => {
      return this.executeQuery(currentContext, true)
    })

    // Make builder thenable for backward compatibility
    builder.then = vi.fn((onResolve, onReject) => {
      return this.executeQuery(currentContext, false).then(onResolve, onReject)
    })

    return builder
  }

  private async executeQuery(context: QueryContext, single: boolean = false): Promise<{ data: any, error: any }> {
    // Log the query for debugging
    this.queryLog.push({ ...context })

    // Check for mock errors first
    if (this.mockErrors[context.table]) {
      return { data: null, error: this.mockErrors[context.table] }
    }

    // Get mock data for the table
    let data = this.mockData[context.table] || []

    // Apply filters
    data = this.applyFilters(data, context.filters)

    // Apply column selection
    if (context.columns.length > 0) {
      data = data.map(row => {
        const filtered: any = {}
        context.columns.forEach(col => {
          if (row[col] !== undefined) {
            filtered[col] = row[col]
          }
        })
        return filtered
      })
    }

    // Return single item or array
    if (single) {
      if (data.length === 0) {
        // Supabase returns PGRST116 error when .single() finds no rows
        return { 
          data: null, 
          error: { 
            code: 'PGRST116', 
            message: 'No rows found',
            details: 'The result contains 0 rows'
          } 
        }
      }
      return { data: data[0] || null, error: null }
    }

    return { data, error: null }
  }

  private applyFilters(data: any[], filters: Record<string, any>): any[] {
    let result = [...data]

    Object.entries(filters).forEach(([column, filter]) => {
      if (column.startsWith('_')) return // Skip meta filters like _order, _limit

      if (filter.op === 'eq') {
        result = result.filter(row => row[column] === filter.value)
      } else if (filter.op === 'neq') {
        result = result.filter(row => row[column] !== filter.value)
      } else if (filter.op === 'in') {
        result = result.filter(row => filter.value.includes(row[column]))
      }
    })

    // Apply ordering
    if (filters._order) {
      const { column, options } = filters._order
      result.sort((a, b) => {
        const aVal = a[column]
        const bVal = b[column]
        const ascending = options?.ascending !== false
        
        if (aVal < bVal) return ascending ? -1 : 1
        if (aVal > bVal) return ascending ? 1 : -1
        return 0
      })
    }

    // Apply limit
    if (filters._limit) {
      result = result.slice(0, filters._limit)
    }

    return result
  }
}

/**
 * Create a pre-configured mock for setlist API tests
 */
export function createSetlistAPIMock() {
  const mockUser = { uid: 'test-user-123' }
  
  // Valid UUID test IDs
  const TEST_IDS = {
    SETLIST_1: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    SONG_1: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
    SONG_2: '2b3c4d5e-6f78-9012-bcde-f12345678901',
    CONTENT_1: '550e8400-e29b-41d4-a716-446655440000',
    CONTENT_2: '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
  }
  
  const mockSetlists = [
    {
      id: TEST_IDS.SETLIST_1,
      name: 'Test Setlist',
      description: 'A test setlist',
      user_id: mockUser.uid,
      created_at: '2024-01-01T00:00:00Z',
      performance_date: '2024-01-14',
      venue: 'Test Venue'
    }
  ]

  const mockSetlistSongs = [
    {
      id: TEST_IDS.SONG_1,
      setlist_id: TEST_IDS.SETLIST_1,
      content_id: TEST_IDS.CONTENT_1,
      position: 1,
      notes: 'Opening song'
    },
    {
      id: TEST_IDS.SONG_2, 
      setlist_id: TEST_IDS.SETLIST_1,
      content_id: TEST_IDS.CONTENT_2,
      position: 2,
      notes: 'Second song'
    }
  ]

  const mockContent = [
    {
      id: TEST_IDS.CONTENT_1,
      title: 'Wonderwall',
      artist: 'Oasis',
      content_type: 'Chords',
      key: 'Em',
      bpm: 87,
      file_url: 'http://example.com/wonderwall.pdf',
      content_data: null,
      user_id: mockUser.uid
    },
    {
      id: TEST_IDS.CONTENT_2,
      title: 'Champagne Supernova',
      artist: 'Oasis', 
      content_type: 'Tabs',
      key: 'A',
      bpm: 75,
      file_url: 'http://example.com/champagne.pdf',
      content_data: null,
      user_id: mockUser.uid
    }
  ]

  const factory = new SupabaseMockFactory()
    .setMockData('setlists', mockSetlists)
    .setMockData('setlist_songs', mockSetlistSongs)
    .setMockData('content', mockContent)

  return {
    factory,
    mockUser,
    mockSetlists,
    mockSetlistSongs,
    mockContent,
    TEST_IDS,
    supabaseMock: factory.createSupabaseMock()
  }
}
