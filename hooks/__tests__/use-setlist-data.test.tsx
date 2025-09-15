import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSetlistData } from '../use-setlist-data'

// Mock setlist service functions
vi.mock('@/lib/setlist-service', () => ({
  getUserSetlists: vi.fn()
}))

// Mock content service functions  
vi.mock('@/lib/content-service', () => ({
  getUserContentPage: vi.fn()
}))

// Mock offline setlist cache functions
vi.mock('@/lib/offline-setlist-cache', () => ({
  saveSetlists: vi.fn(),
  getCachedSetlists: vi.fn()
}))

// Mock offline cache functions
vi.mock('@/lib/offline-cache', () => ({
  saveContent: vi.fn(),
  getCachedContent: vi.fn(),
  warmCache: vi.fn().mockResolvedValue(undefined)
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('useSetlistData', () => {
  let mockGetUserSetlists: any
  let mockGetUserContentPage: any
  let mockSaveSetlists: any
  let mockGetCachedSetlists: any
  let mockSaveContent: any
  let mockGetCachedContent: any

  const mockUser = { uid: 'test-user-1', email: 'test@example.com' }
  
  const mockSetlistsData = [
    {
      id: 'setlist-1',
      name: 'Sunday Service',
      user_id: 'test-user-1',
      created_at: '2024-01-01T00:00:00Z',
      setlist_songs: [
        {
          id: 'song-1',
          position: 1,
          notes: 'Opening song',
          content: {
            id: 'content-1',
            user_id: 'test-user-1',
            title: 'Amazing Grace',
            artist: 'Traditional',
            album: null,
            genre: null,
            content_type: 'lyrics',
            key: 'G',
            bpm: null,
            time_signature: '4/4',
            difficulty: 'beginner',
            tags: [],
            content: 'Amazing grace, how sweet the sound...',
            file_url: null,
            file_type: null,
            file_size: null,
            capo: null,
            tuning: null,
            notes: null,
            content_data: null,
            thumbnail_url: null,
            is_public: false,
            is_favorite: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ]
    },
    {
      id: 'setlist-2', 
      name: 'Evening Worship',
      user_id: 'test-user-1',
      created_at: '2024-01-02T00:00:00Z',
      setlist_songs: []
    }
  ]

  const mockContentData = [
    {
      id: 'content-1',
      user_id: 'test-user-1',
      title: 'Amazing Grace',
      artist: 'Traditional',
      album: null,
      genre: null,
      content_type: 'lyrics',
      key: 'G',
      bpm: null,
      time_signature: '4/4',
      difficulty: 'beginner',
      tags: [],
      content: 'Amazing grace, how sweet the sound...',
      file_url: null,
      file_type: null,
      file_size: null,
      capo: null,
      tuning: null,
      notes: null,
      content_data: null,
      thumbnail_url: null,
      is_public: false,
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'content-2',
      user_id: 'test-user-1',
      title: 'How Great Thou Art',
      artist: 'Carl Boberg',
      album: null,
      genre: 'hymn',
      content_type: 'chord',
      key: 'C',
      bpm: 72,
      time_signature: '4/4',
      difficulty: 'intermediate',
      tags: ['classic', 'hymn'],
      content: 'C F C G...',
      file_url: null,
      file_type: null,
      file_size: null,
      capo: null,
      tuning: 'standard',
      notes: 'Play with feeling',
      content_data: null,
      thumbnail_url: null,
      is_public: true,
      is_favorite: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Set default online state
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    
    // Get the mocked functions
    const setlistService = await import('@/lib/setlist-service')
    const contentService = await import('@/lib/content-service')
    const setlistCache = await import('@/lib/offline-setlist-cache')
    const offlineCache = await import('@/lib/offline-cache')
    
    mockGetUserSetlists = setlistService.getUserSetlists as any
    mockGetUserContentPage = contentService.getUserContentPage as any
    mockSaveSetlists = setlistCache.saveSetlists as any
    mockGetCachedSetlists = setlistCache.getCachedSetlists as any
    mockSaveContent = offlineCache.saveContent as any
    mockGetCachedContent = offlineCache.getCachedContent as any
    
    // Default successful responses
    mockGetUserSetlists.mockResolvedValue(mockSetlistsData)
    mockGetUserContentPage.mockResolvedValue({
      data: mockContentData,
      total: 2,
      totalPages: 1
    })
    
    mockSaveSetlists.mockResolvedValue(undefined)
    mockSaveContent.mockResolvedValue(undefined)
    mockGetCachedSetlists.mockResolvedValue([])
    mockGetCachedContent.mockResolvedValue([])
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('initializes with correct default values when user is not ready', () => {
    const { result } = renderHook(() => useSetlistData(mockUser, false))

    expect(result.current.setlists).toEqual([])
    expect(result.current.content).toEqual([])
    expect(result.current.loading).toBe(true) // Should be loading when not ready
    expect(result.current.error).toBeNull()
    expect(typeof result.current.reload).toBe('function')
  })

  it('does not load when user is null', async () => {
    const { result } = renderHook(() => useSetlistData(null, true))

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 1000 })

    expect(result.current.setlists).toHaveLength(0)
    expect(result.current.content).toHaveLength(0)
    expect(result.current.error).toBeNull()
    expect(mockGetUserSetlists).not.toHaveBeenCalled()
    expect(mockGetUserContentPage).not.toHaveBeenCalled()
  })

  it('loads data when user becomes ready', async () => {
    // Start with user not ready
    const { result, rerender } = renderHook(
      ({ user, ready }) => useSetlistData(user, ready),
      {
        initialProps: {
          user: mockUser,
          ready: false
        }
      }
    )

    expect(result.current.loading).toBe(true)
    expect(mockGetUserSetlists).not.toHaveBeenCalled()

    // Make user ready
    rerender({
      user: mockUser,
      ready: true
    })

    // Give time for the hook's timeout and data loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Check that the services were called
    expect(mockGetUserSetlists).toHaveBeenCalledWith({ id: 'test-user-1', email: 'test@example.com' })
    expect(mockGetUserContentPage).toHaveBeenCalled()
  })

  it('provides working reload function', async () => {
    const { result } = renderHook(() => useSetlistData(mockUser, true))

    // Set up new mock data for reload
    mockGetUserSetlists.mockResolvedValueOnce([
      {
        id: 'setlist-new',
        name: 'New Setlist',
        user_id: 'test-user-1',
        created_at: '2024-01-03T00:00:00Z',
        setlist_songs: []
      }
    ])

    // Call reload
    await act(async () => {
      await result.current.reload()
    })

    // Verify the services were called for reload
    expect(mockGetUserSetlists).toHaveBeenCalled()
  })

  it('provides working state setters', async () => {
    const { result } = renderHook(() => useSetlistData(mockUser, true))

    // Wait for initial setup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    const testSetlists = [{ id: 'test', name: 'Test Setlist' }]
    const testContent = [{ id: 'test-content', title: 'Test Content' }]

    // Test setlists setter
    act(() => {
      result.current.setSetlists(testSetlists as any)
    })
    expect(result.current.setlists).toEqual(testSetlists)

    // Test content setter
    act(() => {
      result.current.setContent(testContent as any)
    })
    expect(result.current.content).toEqual(testContent)
  })

  it('handles offline mode by using cached data', async () => {
    // Set offline mode
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    
    const cachedSetlists = [mockSetlistsData[0]]
    const cachedContent = [mockContentData[0]]
    
    mockGetCachedSetlists.mockResolvedValue(cachedSetlists)
    mockGetCachedContent.mockResolvedValue(cachedContent)

    const { result } = renderHook(() => useSetlistData(mockUser, true))

    // Give time for offline loading
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Should not call network services in offline mode
    expect(mockGetUserSetlists).not.toHaveBeenCalled()
    expect(mockGetUserContentPage).not.toHaveBeenCalled()
    
    // Should call cache functions
    expect(mockGetCachedSetlists).toHaveBeenCalled()
    expect(mockGetCachedContent).toHaveBeenCalled()
  })

  it('attempts error handling when services fail', async () => {
    const error = new Error('Network failure')
    mockGetUserSetlists.mockRejectedValue(error)
    mockGetUserContentPage.mockRejectedValue(error)
    
    // Make cache calls also fail
    mockGetCachedSetlists.mockRejectedValue(new Error('Cache error'))
    mockGetCachedContent.mockRejectedValue(new Error('Cache error'))

    const { result } = renderHook(() => useSetlistData(mockUser, true))

    // Give time for error handling
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Verify that the hook tried to call all the expected services and cache functions
    expect(mockGetUserSetlists).toHaveBeenCalled()
    expect(mockGetUserContentPage).toHaveBeenCalled()
    expect(mockGetCachedSetlists).toHaveBeenCalled()
    expect(mockGetCachedContent).toHaveBeenCalled()
    
    // Should still have empty data when everything fails
    expect(result.current.setlists).toHaveLength(0)
    expect(result.current.content).toHaveLength(0)
  })

  it('caches successful data', async () => {
    const { result } = renderHook(() => useSetlistData(mockUser, true))

    // Give time for data loading and caching
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
    })

    // Should eventually call cache save functions if data loads successfully
    // Note: This test might pass even if caching fails, as it's a side effect
    expect(mockSaveSetlists).toHaveBeenCalledTimes(1)
    expect(mockSaveContent).toHaveBeenCalledTimes(1)
  })
})
