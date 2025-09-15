import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLibraryData } from '../use-library-data'

// Mock getUserContentPage with proper return structure
vi.mock('@/lib/content-service', () => ({
  getUserContentPage: vi.fn()
}))

// Mock offline cache functions
vi.mock('@/lib/offline-cache', () => ({
  saveContent: vi.fn(),
  getCachedContent: vi.fn(),
  warmCache: vi.fn().mockResolvedValue(undefined)
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams()
}))

// Mock useDebounce to return the value immediately without delay
vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: any) => value
}))

describe('useLibraryData', () => {
  let mockGetUserContentPage: any
  let mockSaveContent: any
  let mockGetCachedContent: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked functions
    const contentService = await import('@/lib/content-service')
    const offlineCache = await import('@/lib/offline-cache')
    
    mockGetUserContentPage = contentService.getUserContentPage as any
    mockSaveContent = offlineCache.saveContent as any
    mockGetCachedContent = offlineCache.getCachedContent as any
    
    // Default successful response
    mockGetUserContentPage.mockResolvedValue({
      data: [
        { id: 'c1', title: 'Test Song', artist: 'Test Artist', content_type: 'tab' },
        { id: 'c2', title: 'Another Song', artist: 'Another Artist', content_type: 'lyrics' }
      ],
      total: 2,
      totalPages: 1
    })
    
    mockSaveContent.mockResolvedValue(undefined)
    mockGetCachedContent.mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.resetAllMocks()
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useLibraryData({
      user: null,
      ready: false,
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))

    expect(result.current.content).toEqual([])
    expect(result.current.totalCount).toBe(0)
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.sortBy).toBe('recent')
    expect(result.current.loading).toBe(false)
  })

  it('provides working state setters', () => {
    const { result } = renderHook(() => useLibraryData({
      user: null,
      ready: false,
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))

    // Test setters work for basic state
    act(() => {
      result.current.setPage(3)
    })
    expect(result.current.page).toBe(3)

    act(() => {
      result.current.setPageSize(50)
    })
    expect(result.current.pageSize).toBe(50)

    act(() => {
      result.current.setSortBy('title')
    })
    expect(result.current.sortBy).toBe('title')
  })

  it('loads data when user becomes ready', async () => {
    // Start with user not ready
    const { result, rerender } = renderHook(
      ({ user, ready }) => useLibraryData({
        user,
        ready,
        initialContent: [],
        initialTotal: 0,
        initialPage: 1,
        initialPageSize: 20,
      }),
      {
        initialProps: {
          user: { uid: 'test-user-1', email: 'test@example.com' },
          ready: false
        }
      }
    )

    expect(result.current.loading).toBe(false)
    expect(mockGetUserContentPage).not.toHaveBeenCalled()

    // Make user ready - this should trigger loading
    rerender({
      user: { uid: 'test-user-1', email: 'test@example.com' },
      ready: true
    })

    // Give time for the hook's timeout and data loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Check that the service was called
    expect(mockGetUserContentPage).toHaveBeenCalled()
  })

  it('provides reload function', () => {
    const { result } = renderHook(() => useLibraryData({
      user: { uid: 'test-user-1', email: 'test@example.com' },
      ready: true,
      initialContent: [{ id: 'initial', title: 'Initial Song' }],
      initialTotal: 1,
      initialPage: 1,
      initialPageSize: 20,
    }))

    // Should have a reload function
    expect(typeof result.current.reload).toBe('function')
    
    // Initial content should be present
    expect(result.current.content).toHaveLength(1)
    expect(result.current.content[0].title).toBe('Initial Song')
    
    // Should have other expected properties
    expect(typeof result.current.setSearchQuery).toBe('function')
    expect(typeof result.current.setSelectedFilters).toBe('function')
    expect(result.current.totalCount).toBe(1)
  })

  it('handles filter changes correctly', () => {
    const { result } = renderHook(() => useLibraryData({
      user: null,
      ready: false,
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))

    const newFilters = {
      contentType: ['tab'],
      difficulty: ['beginner'],
      key: ['C'],
      favorite: true
    }

    act(() => {
      result.current.setSelectedFilters(newFilters)
    })

    expect(result.current.selectedFilters).toEqual(newFilters)
  })

  it('does not load when user is not ready', () => {
    const { result } = renderHook(() => useLibraryData({
      user: { uid: 'test-user-1', email: 'test@example.com' },
      ready: false, // Not ready
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))

    expect(result.current.loading).toBe(false)
    expect(mockGetUserContentPage).not.toHaveBeenCalled()
  })

  it('does not load when user is null', () => {
    const { result } = renderHook(() => useLibraryData({
      user: null, // No user
      ready: true,
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))

    expect(result.current.loading).toBe(false)
    expect(mockGetUserContentPage).not.toHaveBeenCalled()
  })

  it('preserves initial content when provided', () => {
    const initialContent = [
      { id: 'initial-1', title: 'Initial Song 1' },
      { id: 'initial-2', title: 'Initial Song 2' }
    ]

    const { result } = renderHook(() => useLibraryData({
      user: null,
      ready: false,
      initialContent,
      initialTotal: 2,
      initialPage: 1,
      initialPageSize: 20,
    }))

    expect(result.current.content).toEqual(initialContent)
    expect(result.current.totalCount).toBe(2)
  })
})
