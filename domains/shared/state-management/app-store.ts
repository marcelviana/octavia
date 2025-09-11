/**
 * Centralized Application State Management
 * 
 * Zustand-based global state for the entire Octavia application
 * Replaces scattered Context API usage with unified state management
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

// Domain State Types
interface AuthState {
  user: any | null
  isLoading: boolean
  isAuthenticated: boolean
  sessionCookie: string | null
}

interface ContentState {
  content: any[]
  selectedContent: any | null
  filters: {
    search: string
    contentType: string | null
    sortBy: 'title' | 'artist' | 'created_at'
    sortOrder: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

interface SetlistState {
  setlists: any[]
  selectedSetlist: any | null
  isCreating: boolean
  isEditing: boolean
}

interface PerformanceState {
  isActive: boolean
  currentSetlist: any | null
  currentSong: number
  songs: any[]
  controls: {
    zoom: number
    isPlaying: boolean
    bpm: number
    darkSheet: boolean
    showControls: boolean
  }
  cache: Map<string, any>
}

interface UIState {
  sidebar: {
    isOpen: boolean
    activeSection: string
  }
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: number
  }>
  loading: {
    global: boolean
    operations: Record<string, boolean>
  }
  errors: {
    global: string | null
    operations: Record<string, string | null>
  }
}

// Combined Application State
interface AppState {
  // Domain States
  auth: AuthState
  content: ContentState
  setlists: SetlistState
  performance: PerformanceState
  ui: UIState

  // Authentication Actions
  setUser: (user: any | null) => void
  setAuthLoading: (loading: boolean) => void
  setSessionCookie: (cookie: string | null) => void
  logout: () => void

  // Content Actions
  setContent: (content: any[]) => void
  addContent: (content: any) => void
  updateContent: (id: string, updates: any) => void
  removeContent: (id: string) => void
  setSelectedContent: (content: any | null) => void
  setContentFilters: (filters: Partial<ContentState['filters']>) => void
  setContentPagination: (pagination: Partial<ContentState['pagination']>) => void

  // Setlist Actions  
  setSetlists: (setlists: any[]) => void
  addSetlist: (setlist: any) => void
  updateSetlist: (id: string, updates: any) => void
  removeSetlist: (id: string) => void
  setSelectedSetlist: (setlist: any | null) => void
  setSetlistCreating: (creating: boolean) => void
  setSetlistEditing: (editing: boolean) => void

  // Performance Actions
  startPerformance: (setlist: any, startingSongIndex?: number) => void
  stopPerformance: () => void
  navigateToSong: (songIndex: number) => void
  updatePerformanceControls: (controls: Partial<PerformanceState['controls']>) => void
  cachePerformanceData: (key: string, data: any) => void
  getCachedPerformanceData: (key: string) => any

  // UI Actions
  toggleSidebar: () => void
  setSidebarSection: (section: string) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  setGlobalLoading: (loading: boolean) => void
  setOperationLoading: (operation: string, loading: boolean) => void
  setGlobalError: (error: string | null) => void
  setOperationError: (operation: string, error: string | null) => void
  clearAllErrors: () => void

  // Utility Actions
  reset: () => void
}

// Initial State
const initialState = {
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
}

// Create the store with middleware
export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          ...initialState,

          // Authentication Actions
          setUser: (user) => set((state) => {
            state.auth.user = user
            state.auth.isAuthenticated = !!user
            state.auth.isLoading = false
          }),

          setAuthLoading: (loading) => set((state) => {
            state.auth.isLoading = loading
          }),

          setSessionCookie: (cookie) => set((state) => {
            state.auth.sessionCookie = cookie
          }),

          logout: () => set((state) => {
            state.auth.user = null
            state.auth.isAuthenticated = false
            state.auth.sessionCookie = null
            state.performance.isActive = false
            state.ui.sidebar.isOpen = false
          }),

          // Content Actions
          setContent: (content) => set((state) => {
            state.content.content = content
            state.content.pagination.total = content.length
          }),

          addContent: (content) => set((state) => {
            state.content.content.unshift(content)
            state.content.pagination.total += 1
          }),

          updateContent: (id, updates) => set((state) => {
            const index = state.content.content.findIndex(c => c.id === id)
            if (index >= 0) {
              state.content.content[index] = { ...state.content.content[index], ...updates }
            }
            if (state.content.selectedContent?.id === id) {
              state.content.selectedContent = { ...state.content.selectedContent, ...updates }
            }
          }),

          removeContent: (id) => set((state) => {
            state.content.content = state.content.content.filter(c => c.id !== id)
            state.content.pagination.total -= 1
            if (state.content.selectedContent?.id === id) {
              state.content.selectedContent = null
            }
          }),

          setSelectedContent: (content) => set((state) => {
            state.content.selectedContent = content
          }),

          setContentFilters: (filters) => set((state) => {
            state.content.filters = { ...state.content.filters, ...filters }
            state.content.pagination.page = 1 // Reset to first page on filter change
          }),

          setContentPagination: (pagination) => set((state) => {
            state.content.pagination = { ...state.content.pagination, ...pagination }
          }),

          // Setlist Actions
          setSetlists: (setlists) => set((state) => {
            state.setlists.setlists = setlists
          }),

          addSetlist: (setlist) => set((state) => {
            state.setlists.setlists.unshift(setlist)
          }),

          updateSetlist: (id, updates) => set((state) => {
            const index = state.setlists.setlists.findIndex(s => s.id === id)
            if (index >= 0) {
              state.setlists.setlists[index] = { ...state.setlists.setlists[index], ...updates }
            }
            if (state.setlists.selectedSetlist?.id === id) {
              state.setlists.selectedSetlist = { ...state.setlists.selectedSetlist, ...updates }
            }
          }),

          removeSetlist: (id) => set((state) => {
            state.setlists.setlists = state.setlists.setlists.filter(s => s.id !== id)
            if (state.setlists.selectedSetlist?.id === id) {
              state.setlists.selectedSetlist = null
            }
          }),

          setSelectedSetlist: (setlist) => set((state) => {
            state.setlists.selectedSetlist = setlist
          }),

          setSetlistCreating: (creating) => set((state) => {
            state.setlists.isCreating = creating
          }),

          setSetlistEditing: (editing) => set((state) => {
            state.setlists.isEditing = editing
          }),

          // Performance Actions
          startPerformance: (setlist, startingSongIndex = 0) => set((state) => {
            state.performance.isActive = true
            state.performance.currentSetlist = setlist
            state.performance.currentSong = startingSongIndex
            state.performance.songs = setlist?.setlist_songs || []
            state.ui.sidebar.isOpen = false // Close sidebar during performance
          }),

          stopPerformance: () => set((state) => {
            state.performance.isActive = false
            state.performance.currentSetlist = null
            state.performance.currentSong = 0
            state.performance.songs = []
            state.performance.cache.clear()
          }),

          navigateToSong: (songIndex) => set((state) => {
            if (songIndex >= 0 && songIndex < state.performance.songs.length) {
              state.performance.currentSong = songIndex
            }
          }),

          updatePerformanceControls: (controls) => set((state) => {
            state.performance.controls = { ...state.performance.controls, ...controls }
          }),

          cachePerformanceData: (key, data) => set((state) => {
            state.performance.cache.set(key, data)
          }),

          getCachedPerformanceData: (key) => {
            return get().performance.cache.get(key)
          },

          // UI Actions
          toggleSidebar: () => set((state) => {
            state.ui.sidebar.isOpen = !state.ui.sidebar.isOpen
          }),

          setSidebarSection: (section) => set((state) => {
            state.ui.sidebar.activeSection = section
          }),

          addNotification: (notification) => set((state) => {
            const id = `notification-${Date.now()}-${Math.random()}`
            state.ui.notifications.push({
              ...notification,
              id,
              timestamp: Date.now(),
            })
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
              set((state) => {
                state.ui.notifications = state.ui.notifications.filter(n => n.id !== id)
              })
            }, 5000)
          }),

          removeNotification: (id) => set((state) => {
            state.ui.notifications = state.ui.notifications.filter(n => n.id !== id)
          }),

          setGlobalLoading: (loading) => set((state) => {
            state.ui.loading.global = loading
          }),

          setOperationLoading: (operation, loading) => set((state) => {
            if (loading) {
              state.ui.loading.operations[operation] = loading
            } else {
              delete state.ui.loading.operations[operation]
            }
          }),

          setGlobalError: (error) => set((state) => {
            state.ui.errors.global = error
          }),

          setOperationError: (operation, error) => set((state) => {
            if (error) {
              state.ui.errors.operations[operation] = error
            } else {
              delete state.ui.errors.operations[operation]
            }
          }),

          clearAllErrors: () => set((state) => {
            state.ui.errors.global = null
            state.ui.errors.operations = {}
          }),

          // Utility Actions
          reset: () => set(initialState),
        }),
        {
          name: 'octavia-app-store',
          partialize: (state) => ({
            // Only persist essential state
            auth: {
              sessionCookie: state.auth.sessionCookie,
            },
            performance: {
              controls: state.performance.controls,
            },
            ui: {
              sidebar: {
                activeSection: state.ui.sidebar.activeSection,
              },
            },
            content: {
              filters: state.content.filters,
              pagination: {
                limit: state.content.pagination.limit,
              },
            },
          }),
        }
      )
    )
  )
)

// Selector hooks for optimized subscriptions
export const useAuth = () => useAppStore((state) => state.auth)
export const useAuthActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setAuthLoading: state.setAuthLoading,
  setSessionCookie: state.setSessionCookie,
  logout: state.logout,
}))

export const useContent = () => useAppStore((state) => state.content)
export const useContentActions = () => useAppStore((state) => ({
  setContent: state.setContent,
  addContent: state.addContent,
  updateContent: state.updateContent,
  removeContent: state.removeContent,
  setSelectedContent: state.setSelectedContent,
  setContentFilters: state.setContentFilters,
  setContentPagination: state.setContentPagination,
}))

export const useSetlists = () => useAppStore((state) => state.setlists)
export const useSetlistActions = () => useAppStore((state) => ({
  setSetlists: state.setSetlists,
  addSetlist: state.addSetlist,
  updateSetlist: state.updateSetlist,
  removeSetlist: state.removeSetlist,
  setSelectedSetlist: state.setSelectedSetlist,
  setSetlistCreating: state.setSetlistCreating,
  setSetlistEditing: state.setSetlistEditing,
}))

export const usePerformance = () => useAppStore((state) => state.performance)
export const usePerformanceActions = () => useAppStore((state) => ({
  startPerformance: state.startPerformance,
  stopPerformance: state.stopPerformance,
  navigateToSong: state.navigateToSong,
  updatePerformanceControls: state.updatePerformanceControls,
  cachePerformanceData: state.cachePerformanceData,
  getCachedPerformanceData: state.getCachedPerformanceData,
}))

export const useUI = () => useAppStore((state) => state.ui)
export const useUIActions = () => useAppStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarSection: state.setSidebarSection,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  setGlobalLoading: state.setGlobalLoading,
  setOperationLoading: state.setOperationLoading,
  setGlobalError: state.setGlobalError,
  setOperationError: state.setOperationError,
  clearAllErrors: state.clearAllErrors,
}))

// Subscribe to auth changes
useAppStore.subscribe(
  (state) => state.auth.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      // Clear sensitive state on logout
      useAppStore.getState().stopPerformance()
      useAppStore.getState().clearAllErrors()
    }
  }
)

export default useAppStore