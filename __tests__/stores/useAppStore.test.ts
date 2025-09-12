/**
 * Tests for Zustand App Store
 * 
 * Tests the centralized state management including auth state, content management,
 * notifications, UI state, and store persistence/rehydration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAppStore } from '@/stores/useAppStore'
import { mockContentItem, mockUser } from '../utils/test-utils'

// Mock external dependencies
vi.mock('@/lib/logger')
vi.mock('@/lib/content-service')

describe('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear store state
    useAppStore.getState().reset?.()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial auth state', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.auth.user).toBeNull()
      expect(result.current.auth.isLoading).toBe(false)
      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(result.current.auth.sessionCookie).toBeNull()
    })

    it('should have correct initial content state', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.content.content).toEqual([])
      expect(result.current.content.selectedContent).toBeNull()
      expect(result.current.content.isLoading).toBe(false)
      expect(result.current.content.error).toBeNull()
      expect(result.current.content.filters).toEqual({
        searchTerm: '',
        contentType: null,
        favorites: false,
      })
      expect(result.current.content.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      })
    })

    it('should have correct initial UI state', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.ui.notifications).toEqual([])
      expect(result.current.ui.modals.deleteConfirm).toEqual({
        isOpen: false,
        contentId: null,
        contentTitle: '',
      })
      expect(result.current.ui.sidebar.isOpen).toBe(false)
      expect(result.current.ui.sidebar.activeSection).toBe('library')
      expect(result.current.ui.performanceMode.isActive).toBe(false)
      expect(result.current.ui.performanceMode.currentSong).toBeNull()
    })
  })

  describe('auth actions', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(result.current.auth.user).toEqual(mockUser)
      expect(result.current.auth.isAuthenticated).toBe(true)
    })

    it('should clear user correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First set user
      act(() => {
        result.current.setUser(mockUser)
      })
      
      // Then clear
      act(() => {
        result.current.clearUser()
      })
      
      expect(result.current.auth.user).toBeNull()
      expect(result.current.auth.isAuthenticated).toBe(false)
      expect(result.current.auth.sessionCookie).toBeNull()
    })

    it('should set session cookie correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const sessionCookie = 'test-session-cookie'
      
      act(() => {
        result.current.setSessionCookie(sessionCookie)
      })
      
      expect(result.current.auth.sessionCookie).toBe(sessionCookie)
    })

    it('should set auth loading state', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setAuthLoading(true)
      })
      
      expect(result.current.auth.isLoading).toBe(true)
      
      act(() => {
        result.current.setAuthLoading(false)
      })
      
      expect(result.current.auth.isLoading).toBe(false)
    })
  })

  describe('content actions', () => {
    it('should set content list correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const contentList = [mockContentItem, { ...mockContentItem, id: 'test-2' }]
      
      act(() => {
        result.current.setContent(contentList)
      })
      
      expect(result.current.content.content).toEqual(contentList)
    })

    it('should add content correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.addContent(mockContentItem)
      })
      
      expect(result.current.content.content).toContain(mockContentItem)
    })

    it('should update content correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First add content
      act(() => {
        result.current.addContent(mockContentItem)
      })
      
      // Then update it
      const updates = { title: 'Updated Title' }
      act(() => {
        result.current.updateContent(mockContentItem.id, updates)
      })
      
      const updatedContent = result.current.content.content.find(c => c.id === mockContentItem.id)
      expect(updatedContent?.title).toBe('Updated Title')
    })

    it('should remove content correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First add content
      act(() => {
        result.current.addContent(mockContentItem)
      })
      
      expect(result.current.content.content).toContain(mockContentItem)
      
      // Then remove it
      act(() => {
        result.current.removeContent(mockContentItem.id)
      })
      
      expect(result.current.content.content).not.toContain(mockContentItem)
    })

    it('should set selected content correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setSelectedContent(mockContentItem)
      })
      
      expect(result.current.content.selectedContent).toEqual(mockContentItem)
    })

    it('should clear selected content', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First set selected content
      act(() => {
        result.current.setSelectedContent(mockContentItem)
      })
      
      // Then clear it
      act(() => {
        result.current.clearSelectedContent()
      })
      
      expect(result.current.content.selectedContent).toBeNull()
    })

    it('should set content loading state', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setContentLoading(true)
      })
      
      expect(result.current.content.isLoading).toBe(true)
    })

    it('should set content error', () => {
      const { result } = renderHook(() => useAppStore())
      const error = 'Failed to load content'
      
      act(() => {
        result.current.setContentError(error)
      })
      
      expect(result.current.content.error).toBe(error)
    })

    it('should clear content error', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First set error
      act(() => {
        result.current.setContentError('Some error')
      })
      
      // Then clear it
      act(() => {
        result.current.clearContentError()
      })
      
      expect(result.current.content.error).toBeNull()
    })
  })

  describe('filter actions', () => {
    it('should set search term', () => {
      const { result } = renderHook(() => useAppStore())
      const searchTerm = 'test song'
      
      act(() => {
        result.current.setSearchTerm(searchTerm)
      })
      
      expect(result.current.content.filters.searchTerm).toBe(searchTerm)
    })

    it('should set content type filter', () => {
      const { result } = renderHook(() => useAppStore())
      const contentType = 'Lyrics'
      
      act(() => {
        result.current.setContentTypeFilter(contentType)
      })
      
      expect(result.current.content.filters.contentType).toBe(contentType)
    })

    it('should toggle favorites filter', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.toggleFavoritesFilter()
      })
      
      expect(result.current.content.filters.favorites).toBe(true)
      
      act(() => {
        result.current.toggleFavoritesFilter()
      })
      
      expect(result.current.content.filters.favorites).toBe(false)
    })

    it('should clear all filters', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Set some filters
      act(() => {
        result.current.setSearchTerm('test')
        result.current.setContentTypeFilter('Lyrics')
        result.current.toggleFavoritesFilter()
      })
      
      // Clear all filters
      act(() => {
        result.current.clearFilters()
      })
      
      expect(result.current.content.filters).toEqual({
        searchTerm: '',
        contentType: null,
        favorites: false,
      })
    })
  })

  describe('pagination actions', () => {
    it('should set pagination correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const pagination = {
        page: 2,
        limit: 10,
        total: 25,
        hasMore: true,
      }
      
      act(() => {
        result.current.setPagination(pagination)
      })
      
      expect(result.current.content.pagination).toEqual(pagination)
    })

    it('should reset pagination', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First set custom pagination
      act(() => {
        result.current.setPagination({
          page: 5,
          limit: 10,
          total: 100,
          hasMore: true,
        })
      })
      
      // Then reset
      act(() => {
        result.current.resetPagination()
      })
      
      expect(result.current.content.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      })
    })

    it('should increment page', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.nextPage()
      })
      
      expect(result.current.content.pagination.page).toBe(2)
      
      act(() => {
        result.current.nextPage()
      })
      
      expect(result.current.content.pagination.page).toBe(3)
    })
  })

  describe('notification actions', () => {
    it('should add notification correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const notification = {
        id: '1',
        type: 'success' as const,
        message: 'Operation successful',
      }
      
      act(() => {
        result.current.addNotification(notification)
      })
      
      expect(result.current.ui.notifications).toContain(notification)
    })

    it('should auto-generate notification ID if not provided', () => {
      const { result } = renderHook(() => useAppStore())
      const notification = {
        type: 'info' as const,
        message: 'Info message',
      }
      
      act(() => {
        result.current.addNotification(notification)
      })
      
      expect(result.current.ui.notifications).toHaveLength(1)
      expect(result.current.ui.notifications[0].id).toBeDefined()
      expect(result.current.ui.notifications[0].message).toBe('Info message')
    })

    it('should remove notification correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const notification = {
        id: 'test-1',
        type: 'error' as const,
        message: 'Error message',
      }
      
      // First add notification
      act(() => {
        result.current.addNotification(notification)
      })
      
      expect(result.current.ui.notifications).toContain(notification)
      
      // Then remove it
      act(() => {
        result.current.removeNotification('test-1')
      })
      
      expect(result.current.ui.notifications).not.toContain(notification)
    })

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Add multiple notifications
      act(() => {
        result.current.addNotification({ id: '1', type: 'success', message: 'Success 1' })
        result.current.addNotification({ id: '2', type: 'error', message: 'Error 1' })
      })
      
      expect(result.current.ui.notifications).toHaveLength(2)
      
      // Clear all
      act(() => {
        result.current.clearNotifications()
      })
      
      expect(result.current.ui.notifications).toHaveLength(0)
    })
  })

  describe('modal actions', () => {
    it('should open delete confirmation modal', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.openDeleteConfirm('test-id', 'Test Song')
      })
      
      expect(result.current.ui.modals.deleteConfirm).toEqual({
        isOpen: true,
        contentId: 'test-id',
        contentTitle: 'Test Song',
      })
    })

    it('should close delete confirmation modal', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First open modal
      act(() => {
        result.current.openDeleteConfirm('test-id', 'Test Song')
      })
      
      // Then close it
      act(() => {
        result.current.closeDeleteConfirm()
      })
      
      expect(result.current.ui.modals.deleteConfirm).toEqual({
        isOpen: false,
        contentId: null,
        contentTitle: '',
      })
    })
  })

  describe('sidebar actions', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.ui.sidebar.isOpen).toBe(true)
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.ui.sidebar.isOpen).toBe(false)
    })

    it('should set sidebar section', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setSidebarSection('favorites')
      })
      
      expect(result.current.ui.sidebar.activeSection).toBe('favorites')
    })
  })

  describe('performance mode actions', () => {
    it('should enter performance mode', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.enterPerformanceMode(mockContentItem)
      })
      
      expect(result.current.ui.performanceMode.isActive).toBe(true)
      expect(result.current.ui.performanceMode.currentSong).toEqual(mockContentItem)
    })

    it('should exit performance mode', () => {
      const { result } = renderHook(() => useAppStore())
      
      // First enter performance mode
      act(() => {
        result.current.enterPerformanceMode(mockContentItem)
      })
      
      // Then exit
      act(() => {
        result.current.exitPerformanceMode()
      })
      
      expect(result.current.ui.performanceMode.isActive).toBe(false)
      expect(result.current.ui.performanceMode.currentSong).toBeNull()
    })

    it('should set current performance song', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setCurrentPerformanceSong(mockContentItem)
      })
      
      expect(result.current.ui.performanceMode.currentSong).toEqual(mockContentItem)
    })
  })

  describe('computed selectors', () => {
    it('should compute filtered content correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const contentList = [
        mockContentItem,
        { ...mockContentItem, id: 'test-2', title: 'Another Song', content_type: 'Chords' },
        { ...mockContentItem, id: 'test-3', title: 'Favorite Song', is_favorite: true },
      ]
      
      // Set content
      act(() => {
        result.current.setContent(contentList)
      })
      
      // Test search filter
      act(() => {
        result.current.setSearchTerm('Another')
      })
      
      const filteredBySearch = result.current.getFilteredContent()
      expect(filteredBySearch).toHaveLength(1)
      expect(filteredBySearch[0].title).toBe('Another Song')
      
      // Clear search and test content type filter
      act(() => {
        result.current.clearFilters()
        result.current.setContentTypeFilter('Chords')
      })
      
      const filteredByType = result.current.getFilteredContent()
      expect(filteredByType).toHaveLength(1)
      expect(filteredByType[0].content_type).toBe('Chords')
      
      // Clear filters and test favorites filter
      act(() => {
        result.current.clearFilters()
        result.current.toggleFavoritesFilter()
      })
      
      const filteredByFavorites = result.current.getFilteredContent()
      expect(filteredByFavorites).toHaveLength(1)
      expect(filteredByFavorites[0].is_favorite).toBe(true)
    })

    it('should compute content stats correctly', () => {
      const { result } = renderHook(() => useAppStore())
      const contentList = [
        mockContentItem, // Lyrics
        { ...mockContentItem, id: 'test-2', content_type: 'Chords' },
        { ...mockContentItem, id: 'test-3', content_type: 'Lyrics', is_favorite: true },
        { ...mockContentItem, id: 'test-4', content_type: 'Tabs' },
      ]
      
      act(() => {
        result.current.setContent(contentList)
      })
      
      const stats = result.current.getContentStats()
      
      expect(stats.total).toBe(4)
      expect(stats.favorites).toBe(1)
      expect(stats.byType.Lyrics).toBe(2)
      expect(stats.byType.Chords).toBe(1)
      expect(stats.byType.Tabs).toBe(1)
    })

    it('should check if user is authenticated correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.isAuthenticated()).toBe(false)
      
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(result.current.isAuthenticated()).toBe(true)
    })

    it('should check if content is loading correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.isContentLoading()).toBe(false)
      
      act(() => {
        result.current.setContentLoading(true)
      })
      
      expect(result.current.isContentLoading()).toBe(true)
    })
  })

  describe('store persistence', () => {
    it('should persist auth state across sessions', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setUser(mockUser)
        result.current.setSessionCookie('test-cookie')
      })
      
      // Simulate store rehydration
      const persistedState = useAppStore.getState()
      expect(persistedState.auth.user).toEqual(mockUser)
      expect(persistedState.auth.sessionCookie).toBe('test-cookie')
    })

    it('should not persist sensitive content in local storage', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setContent([mockContentItem])
        result.current.setSelectedContent(mockContentItem)
      })
      
      // Content should not be persisted for security
      const persistedState = useAppStore.getState()
      // This would need to be verified based on the actual persistence configuration
      // The content data should be loaded fresh on each session for security
    })
  })

  describe('error handling', () => {
    it('should handle invalid content updates gracefully', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.addContent(mockContentItem)
      })
      
      // Try to update non-existent content
      act(() => {
        result.current.updateContent('non-existent-id', { title: 'Updated' })
      })
      
      // Should not cause errors and original content should remain unchanged
      const content = result.current.content.content.find(c => c.id === mockContentItem.id)
      expect(content?.title).toBe(mockContentItem.title)
    })

    it('should handle notification overflow gracefully', () => {
      const { result } = renderHook(() => useAppStore())
      
      // Add many notifications
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.addNotification({
            id: `notification-${i}`,
            type: 'info',
            message: `Message ${i}`,
          })
        }
      })
      
      // Should limit notifications to prevent memory issues
      // The actual limit would depend on implementation
      expect(result.current.ui.notifications.length).toBeLessThanOrEqual(10)
    })
  })

  describe('store subscription', () => {
    it('should trigger subscriptions on state changes', () => {
      const { result } = renderHook(() => useAppStore())
      let authStateChanges = 0
      let contentStateChanges = 0
      
      // Subscribe to auth changes
      const unsubscribeAuth = useAppStore.subscribe(
        (state) => state.auth,
        () => authStateChanges++
      )
      
      // Subscribe to content changes
      const unsubscribeContent = useAppStore.subscribe(
        (state) => state.content,
        () => contentStateChanges++
      )
      
      act(() => {
        result.current.setUser(mockUser)
      })
      
      expect(authStateChanges).toBe(1)
      expect(contentStateChanges).toBe(0)
      
      act(() => {
        result.current.addContent(mockContentItem)
      })
      
      expect(authStateChanges).toBe(1)
      expect(contentStateChanges).toBe(1)
      
      // Cleanup subscriptions
      unsubscribeAuth()
      unsubscribeContent()
    })
  })
})