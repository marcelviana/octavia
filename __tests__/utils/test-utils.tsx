/**
 * Testing Utilities for New Architecture
 * 
 * Provides utilities for testing components that use the new domain-driven architecture,
 * including Zustand store, repository pattern, and error boundaries.
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import { useAppStore } from '@/domains/shared/state-management/app-store'

// Mock the app store for testing
export const createMockStore = (initialState: any = {}) => {
  const mockStore = {
    // Auth state
    auth: {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionCookie: null,
      ...initialState.auth,
    } as any,
    // Content state
    content: {
      content: [],
      selectedContent: null,
      filters: {
        search: '',
        contentType: null,
        sortBy: 'created_at' as const,
        sortOrder: 'desc' as const,
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      ...initialState.content,
    } as any,
    // Setlists state
    setlists: {
      setlists: [],
      selectedSetlist: null,
      isCreating: false,
      isEditing: false,
      ...initialState.setlists,
    } as any,
    // Performance state
    performance: {
      isActive: false,
      currentSetlist: null,
      currentSong: 0,
      songs: [],
      controls: {
        zoom: 1,
        isPlaying: false,
        bpm: 120,
        darkSheet: false,
        showControls: true,
      },
      cache: new Map(),
      ...initialState.performance,
    } as any,
    // UI state
    ui: {
      sidebar: {
        isOpen: false,
        activeSection: 'dashboard',
      },
      notifications: [],
      loading: {
        global: false,
        operations: {},
      },
      errors: {
        global: null,
        operations: {},
      },
      ...initialState.ui,
    } as any,

    // Mock actions
    actions: {
      setUser: vi.fn(),
      setAuthLoading: vi.fn(),
      setSessionCookie: vi.fn(),
      logout: vi.fn(),
      setContent: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      removeContent: vi.fn(),
      setSelectedContent: vi.fn(),
      setContentFilters: vi.fn(),
      setContentPagination: vi.fn(),
      setSetlists: vi.fn(),
      addSetlist: vi.fn(),
      updateSetlist: vi.fn(),
      removeSetlist: vi.fn(),
      setSelectedSetlist: vi.fn(),
      setSetlistCreating: vi.fn(),
      setSetlistEditing: vi.fn(),
      startPerformance: vi.fn(),
      stopPerformance: vi.fn(),
      navigateToSong: vi.fn(),
      updatePerformanceControls: vi.fn(),
      cachePerformanceData: vi.fn(),
      getCachedPerformanceData: vi.fn(),
      toggleSidebar: vi.fn(),
      setSidebarSection: vi.fn(),
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
      setGlobalLoading: vi.fn(),
      setOperationLoading: vi.fn(),
      setGlobalError: vi.fn(),
      setOperationError: vi.fn(),
      clearAllErrors: vi.fn(),
      reset: vi.fn(),
      ...initialState.actions,
    } as any,
  }

  return mockStore
}

// Mock the Zustand store with custom state
export const mockAppStore = (initialState = {}) => {
  const mockStore = createMockStore(initialState)
  
  // Since the store is already mocked at the module level,
  // we just need to update the mock implementation
  const mockImplementation = vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore)
    }
    return mockStore
  })
  
  // Get the mocked store and update its implementation
  const mockedStore = vi.mocked(useAppStore)
  mockedStore.mockImplementation(mockImplementation)

  return mockStore
}

// Test wrapper component
interface TestWrapperProps {
  children: React.ReactNode
  initialState?: any
}

export function TestWrapper({ children, initialState = {} }: TestWrapperProps) {
  // Mock the store for this test
  mockAppStore(initialState)
  
  return <>{children}</>
}

// Custom render function with store
export function renderWithStore(
  ui: ReactElement,
  {
    initialState = {},
    ...renderOptions
  }: RenderOptions & { initialState?: any } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <TestWrapper initialState={initialState}>{children}</TestWrapper>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock content data for tests
export const mockContentItem = {
  id: 'test-content-1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  content_type: 'Lyrics',
  content_data: {
    lyrics: 'Test lyrics content'
  },
  key: 'C',
  bpm: 120,
  time_signature: '4/4',
  difficulty: 'Intermediate',
  genre: 'Rock',
  tags: ['rock', 'test'],
  notes: 'Test notes',
  is_favorite: false,
  is_public: false,
  file_url: null,
  user_id: 'test-user',
  capo: null,
  tuning: null,
  thumbnail_url: null,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
}

export const mockSetlistItem = {
  id: 'test-setlist-1',
  title: 'Test Setlist',
  description: 'Test setlist description',
  user_id: 'test-user',
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  setlist_songs: [
    {
      id: 'test-setlist-song-1',
      setlist_id: 'test-setlist-1',
      content_id: 'test-content-1',
      position: 1,
      content: mockContentItem,
    },
  ],
}

// Mock file for testing
export const mockFile = new File(['test content'], 'test.txt', {
  type: 'text/plain',
})

// Mock uploaded file structure
export const mockUploadedFile = {
  id: 1,
  name: 'test-song.txt',
  size: 1024,
  type: 'text/plain',
  contentType: 'Lyrics',
  file: mockFile,
  url: 'https://example.com/test-song.txt',
  status: 'completed',
  progress: 100,
}

// Error simulation utilities
export const simulateError = (message: string = 'Test error') => {
  return new Error(message)
}

export const simulateAsyncError = async (message: string = 'Async test error') => {
  throw new Error(message)
}

// Repository response mocks
export const mockRepositorySuccess = <T,>(data: T) => ({
  data,
})

export const mockRepositoryError = (message: string = 'Repository error') => ({
  error: {
    message,
    code: 'TEST_ERROR',
    statusCode: 500,
  },
})

// Auth context mock
export const mockAuthUser = {
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User',
}

export const createMockAuthContext = (user = mockAuthUser) => ({
  user,
  loading: false,
  error: null,
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
})

// Re-export testing library utilities
export * from '@testing-library/react'
export { vi } from 'vitest'