import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Add garbage collection to global if available
// Note: gc is exposed via NODE_OPTIONS="--expose-gc" and typed in Node.js types

vi.mock('next/link', async () => {
  const React = await import('react')
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, any>(function Link({ href, children, ...props }, ref) {
      return React.createElement('a', { href, ref, ...props }, children)
    })
  }
})

vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }
  return {
    useRouter: () => router,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    usePathname: () => '',
    redirect: vi.fn(),
  }
})

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: vi.fn() }),
}))

vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    __esModule: true,
    default: React.forwardRef<HTMLImageElement, any>(function Image(props, ref) {
      return React.createElement('img', { ref, ...props })
    })
  }
})

// Mock the Zustand store at module level
vi.mock('@/domains/shared/state-management/app-store', () => {
  const mockStore = {
    auth: {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionCookie: null,
    },
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
    },
    setlists: {
      setlists: [],
      selectedSetlist: null,
      isCreating: false,
      isEditing: false,
    },
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
    },
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
    },
    // Mock actions
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
  }

  const mockUseAppStore = vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStore)
    }
    return mockStore
  })

  return {
    useAppStore: mockUseAppStore,
    useAuth: () => mockStore.auth,
    useAuthActions: () => ({
      setUser: mockStore.setUser,
      setAuthLoading: mockStore.setAuthLoading,
      setSessionCookie: mockStore.setSessionCookie,
      logout: mockStore.logout,
    }),
    useContent: () => mockStore.content,
    useContentActions: () => ({
      setContent: mockStore.setContent,
      addContent: mockStore.addContent,
      updateContent: mockStore.updateContent,
      removeContent: mockStore.removeContent,
      setSelectedContent: mockStore.setSelectedContent,
      setContentFilters: mockStore.setContentFilters,
      setContentPagination: mockStore.setContentPagination,
    }),
    useSetlists: () => mockStore.setlists,
    useSetlistActions: () => ({
      setSetlists: mockStore.setSetlists,
      addSetlist: mockStore.addSetlist,
      updateSetlist: mockStore.updateSetlist,
      removeSetlist: mockStore.removeSetlist,
      setSelectedSetlist: mockStore.setSelectedSetlist,
      setSetlistCreating: mockStore.setSetlistCreating,
      setSetlistEditing: mockStore.setSetlistEditing,
    }),
    usePerformance: () => mockStore.performance,
    usePerformanceActions: () => ({
      startPerformance: mockStore.startPerformance,
      stopPerformance: mockStore.stopPerformance,
      navigateToSong: mockStore.navigateToSong,
      updatePerformanceControls: mockStore.updatePerformanceControls,
      cachePerformanceData: mockStore.cachePerformanceData,
      getCachedPerformanceData: mockStore.getCachedPerformanceData,
    }),
    useUI: () => mockStore.ui,
    useUIActions: () => ({
      toggleSidebar: mockStore.toggleSidebar,
      setSidebarSection: mockStore.setSidebarSection,
      addNotification: mockStore.addNotification,
      removeNotification: mockStore.removeNotification,
      setGlobalLoading: mockStore.setGlobalLoading,
      setOperationLoading: mockStore.setOperationLoading,
      setGlobalError: mockStore.setGlobalError,
      setOperationError: mockStore.setOperationError,
      clearAllErrors: mockStore.clearAllErrors,
    }),
    default: mockUseAppStore,
  }
})

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  })),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase-admin', () => ({
  auth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
    createCustomToken: vi.fn(),
  })),
  initializeApp: vi.fn(),
  credential: {
    cert: vi.fn(),
  },
}))

// Mock Supabase with proper query builder chaining
vi.mock('@supabase/supabase-js', () => {
  const createMockQueryBuilder = () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      csv: vi.fn().mockResolvedValue({ data: '', error: null }),
      explain: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    
    // Set up default resolved values for different operations
    mockBuilder.select.mockResolvedValue({ data: [], error: null })
    mockBuilder.insert.mockResolvedValue({ data: [], error: null })
    mockBuilder.update.mockResolvedValue({ data: [], error: null })
    mockBuilder.delete.mockResolvedValue({ data: [], error: null })
    mockBuilder.upsert.mockResolvedValue({ data: [], error: null })
    
    return mockBuilder
  }

  return {
    createClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      from: vi.fn(() => createMockQueryBuilder()),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ data: null, error: null }),
          download: vi.fn().mockResolvedValue({ data: null, error: null }),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } }),
        })),
      },
      rpc: vi.fn(() => createMockQueryBuilder()),
    })),
  }
})

vi.mock('@supabase/ssr', () => {
  const createMockQueryBuilder = () => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      csv: vi.fn().mockResolvedValue({ data: '', error: null }),
      explain: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    
    // Set up default resolved values for different operations
    mockBuilder.select.mockResolvedValue({ data: [], error: null })
    mockBuilder.insert.mockResolvedValue({ data: [], error: null })
    mockBuilder.update.mockResolvedValue({ data: [], error: null })
    mockBuilder.delete.mockResolvedValue({ data: [], error: null })
    mockBuilder.upsert.mockResolvedValue({ data: [], error: null })
    
    return mockBuilder
  }

  return {
    createServerClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
      from: vi.fn(() => createMockQueryBuilder()),
      rpc: vi.fn(() => createMockQueryBuilder()),
    })),
  }
})

// Mock URL APIs for jsdom environment
if (typeof URL !== 'undefined') {
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = vi.fn()
  }
  if (!URL.createObjectURL) {
    URL.createObjectURL = vi.fn(() => 'mock-blob-url')
  }
}

// Global cleanup after each test
afterEach(() => {
  cleanup()
  
  // Force garbage collection if available (helps with memory issues)
  if (typeof global !== 'undefined' && (global as any).gc) {
    (global as any).gc()
  }
})
