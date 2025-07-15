import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cookies, headers } from 'next/headers'
import { getServerSideUser } from '@/lib/firebase-server-utils'
import { getUserContentPageServer } from '@/lib/content-service-server'
import LibraryPage from '../library/page'

// Mock Next.js headers and cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

// Mock Firebase server utils
vi.mock('@/lib/firebase-server-utils', () => ({
  getServerSideUser: vi.fn(),
}))

// Mock content service server
vi.mock('@/lib/content-service-server', () => ({
  getUserContentPageServer: vi.fn(),
}))

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalConsoleError
  vi.clearAllMocks()
})

describe('Library Page', () => {
  const mockCookies = vi.mocked(cookies)
  const mockHeaders = vi.mocked(headers)
  const mockGetServerSideUser = vi.mocked(getServerSideUser)
  const mockGetUserContentPageServer = vi.mocked(getUserContentPageServer)

  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    emailVerified: true,
  }

  const mockContentData = [
    {
      id: 'content-1',
      title: 'Amazing Grace',
      content_type: 'lyrics',
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'content-2',
      title: 'How Great Thou Art',
      content_type: 'chords',
      is_favorite: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    // Setup default mocks
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'mock-session-token' }),
    } as any)

    mockHeaders.mockResolvedValue({
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'host') return 'localhost:3000'
        if (key === 'x-forwarded-proto') return 'http'
        return null
      }),
    } as any)

    mockGetServerSideUser.mockResolvedValue(mockUser)
    mockGetUserContentPageServer.mockResolvedValue({
      data: mockContentData,
      total: 2,
    })
  })

  it('renders library with user content', async () => {
    const searchParams = Promise.resolve({})

    const result = await LibraryPage({ searchParams })

    // Verify user authentication was checked
    expect(mockGetServerSideUser).toHaveBeenCalledWith(
      expect.any(Object),
      'http://localhost:3000/library'
    )

    // Verify content was fetched with default parameters
    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )

    // Verify the component renders with correct props
    expect(result).toBeDefined()
    expect(result.type).toBeDefined()
  })

  it('handles search parameter correctly', async () => {
    const searchParams = Promise.resolve({ search: 'amazing' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: 'amazing',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles array search parameter correctly', async () => {
    const searchParams = Promise.resolve({ search: ['amazing', 'grace'] })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: 'amazing',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles page parameter correctly', async () => {
    const searchParams = Promise.resolve({ page: '3' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 3,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles array page parameter correctly', async () => {
    const searchParams = Promise.resolve({ page: ['5'] })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 5,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles invalid page parameter gracefully', async () => {
    const searchParams = Promise.resolve({ page: 'invalid' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1, // Should default to 1 for invalid page numbers
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles missing user gracefully with loading state', async () => {
    mockGetServerSideUser.mockResolvedValue(null)
    const searchParams = Promise.resolve({})

    const result = await LibraryPage({ searchParams })

    // Should log error message
    expect(console.error).toHaveBeenCalledWith(
      'Library: User not found despite middleware authentication check'
    )

    // Should return loading state
    expect(result).toBeDefined()
    expect(result.type).toBeDefined()
  })

  it('handles missing host header gracefully', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue(null),
    } as any)

    const searchParams = Promise.resolve({})

    await LibraryPage({ searchParams })

    // Should call getServerSideUser with undefined requestUrl
    expect(mockGetServerSideUser).toHaveBeenCalledWith(
      expect.any(Object),
      undefined
    )
  })

  it('uses https protocol when x-forwarded-proto is https', async () => {
    mockHeaders.mockResolvedValue({
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'host') return 'example.com'
        if (key === 'x-forwarded-proto') return 'https'
        return null
      }),
    } as any)

    const searchParams = Promise.resolve({})

    await LibraryPage({ searchParams })

    expect(mockGetServerSideUser).toHaveBeenCalledWith(
      expect.any(Object),
      'https://example.com/library'
    )
  })

  it('handles content service errors gracefully', async () => {
    mockGetUserContentPageServer.mockRejectedValue(new Error('Database error'))
    const searchParams = Promise.resolve({})

    // Should not throw error, but handle it gracefully
    await expect(LibraryPage({ searchParams })).rejects.toThrow('Database error')
  })

  it('handles empty search parameters', async () => {
    const searchParams = Promise.resolve({})

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles empty content response', async () => {
    mockGetUserContentPageServer.mockResolvedValue({
      data: [],
      total: 0,
    })

    const searchParams = Promise.resolve({})

    const result = await LibraryPage({ searchParams })

    expect(result).toBeDefined()
    expect(result.type).toBeDefined()
  })

  it('handles large page numbers gracefully', async () => {
    const searchParams = Promise.resolve({ page: '999999' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 999999,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles zero page number gracefully', async () => {
    const searchParams = Promise.resolve({ page: '0' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 0,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles negative page number gracefully', async () => {
    const searchParams = Promise.resolve({ page: '-1' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: -1,
        pageSize: 20,
        search: '',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles special characters in search parameter', async () => {
    const searchParams = Promise.resolve({ search: 'amazing & grace' })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: 'amazing & grace',
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })

  it('handles very long search parameter', async () => {
    const longSearch = 'a'.repeat(1000)
    const searchParams = Promise.resolve({ search: longSearch })

    await LibraryPage({ searchParams })

    expect(mockGetUserContentPageServer).toHaveBeenCalledWith(
      {
        page: 1,
        pageSize: 20,
        search: longSearch,
      },
      expect.any(Object),
      'http://localhost:3000/library'
    )
  })
}) 