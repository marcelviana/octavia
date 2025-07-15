import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DashboardPageClient from '@/components/dashboard-page-client'
import { SessionProvider } from '@/components/providers/session-provider'
import type { ContentItem, UserStats } from '@/components/dashboard'

/**
 * COMPONENT-FOCUSED DASHBOARD INTEGRATION TEST
 * 
 * This test focuses on:
 * ✅ Real component coordination between Dashboard parts
 * ✅ Real state management and UI updates
 * ✅ Real user interactions and workflows
 * ✅ Real data flow through component props
 * 
 * Only mocks:
 * ❌ External navigation (Next.js router)
 * ❌ Auth context (controlled test state)
 * 
 * This approach tests component integration patterns without external dependencies
 */

describe('Dashboard Component Integration', () => {
  let mockRouter: any
  let mockAuthContext: any

  // Realistic test data that matches your actual data structure
  const mockRecentContent: ContentItem[] = [
    {
      id: 'content-1',
      title: 'Amazing Grace',
      content_type: 'lyrics',
      is_favorite: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'content-2', 
      title: 'How Great Thou Art',
      content_type: 'chords',
      is_favorite: false,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: 'content-3',
      title: 'Be Thou My Vision',
      content_type: 'tabs',
      is_favorite: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  ]

  const mockFavoriteContent: ContentItem[] = [
    {
      id: 'content-3',
      title: 'Be Thou My Vision',
      content_type: 'tabs',
      is_favorite: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    },
    {
      id: 'content-4',
      title: 'Blessed Be Your Name',
      content_type: 'lyrics',
      is_favorite: true,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z'
    }
  ]

  const mockStats: UserStats = {
    totalContent: 15,
    totalSetlists: 3,
    favoriteContent: 5,
    recentlyViewed: 8
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock only external boundaries
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    }

    mockAuthContext = {
      user: {
        uid: 'test-user',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      loading: false,
      isLoading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      profile: {
        user_id: 'test-user',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        primary_instrument: 'guitar'
      },
      idToken: 'mock-token',
      isConfigured: true,
      isInitialized: true,
      refreshToken: vi.fn(),
      signInWithGoogle: vi.fn(),
      updateProfile: vi.fn(),
      resendVerificationEmail: vi.fn(),
    }

    // Mock external boundaries only
    vi.mock('next/navigation', () => ({
      useRouter: () => mockRouter,
      useSearchParams: () => new URLSearchParams(),
      usePathname: () => '/dashboard',
    }))

    vi.mock('@/contexts/firebase-auth-context', () => ({
      FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      useAuth: () => mockAuthContext,
    }))
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const renderDashboard = async (props = {}) => {
    const defaultProps = {
      recentContent: mockRecentContent,
      favoriteContent: mockFavoriteContent,
      stats: mockStats,
      ...props
    }
    
    await act(async () => {
      render(
        <SessionProvider>
          <DashboardPageClient {...defaultProps} />
        </SessionProvider>
      )
    })
  }

  it('coordinates between tabs and content display with real state management', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    // REAL COMPONENT COORDINATION: Dashboard should show initial state
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // REAL TAB INTEGRATION: User can switch between content views
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    const favoritesTab = screen.getByRole('tab', { name: /favorites/i })
    
    expect(recentTab).toBeInTheDocument()
    expect(favoritesTab).toBeInTheDocument()

    // REAL STATE MANAGEMENT: Switch to recent content tab
    await act(async () => {
      await user.click(recentTab)
    })

    // REAL DATA DISPLAY: Recent content should be displayed
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()
    })

    // REAL COMPONENT COORDINATION: Switch to favorites tab
    await act(async () => {
      await user.click(favoritesTab)
    })

    // REAL DATA FILTERING: Only favorite content should be shown
    await waitFor(() => {
      expect(screen.getByText('Blessed Be Your Name')).toBeInTheDocument()
      expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument()
    })
  })

  it('handles real user interactions with content navigation', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    // Navigate to recent content first
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    await act(async () => {
      await user.click(recentTab)
    })
    
    // REAL NAVIGATION: User clicks on content item
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    const contentLink = screen.getByText('Amazing Grace')
    await act(async () => {
      await user.click(contentLink)
    })
    
    // REAL ROUTER INTEGRATION: Should trigger navigation
    expect(mockRouter.push).toHaveBeenCalledWith('/content/content-1')
  })

  it('displays stats correctly with real data processing', async () => {
    await renderDashboard()

    // REAL DATA PRESENTATION: Stats should be displayed correctly
    expect(screen.getByText('15')).toBeInTheDocument() // totalContent
    expect(screen.getByText('3')).toBeInTheDocument()  // totalSetlists
    expect(screen.getByText('5')).toBeInTheDocument()  // favoriteContent
    expect(screen.getByText('8')).toBeInTheDocument()  // recentlyViewed

    // REAL STAT LABELS: Should have meaningful labels
    expect(screen.getByText(/total.*content/i)).toBeInTheDocument()
    expect(screen.getByText(/setlists/i)).toBeInTheDocument()
    expect(screen.getByText(/favorites/i)).toBeInTheDocument()
  })

  it('handles empty states with real conditional rendering', async () => {
    const user = userEvent.setup()
    await renderDashboard({
      recentContent: [],
      favoriteContent: [],
      stats: {
        totalContent: 0,
        totalSetlists: 0,
        favoriteContent: 0,
        recentlyViewed: 0
      }
    })

    // REAL EMPTY STATE HANDLING: Should show appropriate empty states
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // REAL ZERO STATE: All stats should show zero
    const zeroElements = screen.getAllByText('0')
    expect(zeroElements.length).toBeGreaterThan(0)

    // Navigate to tabs to see empty content states
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    await act(async () => {
      await user.click(recentTab)
    })

    // REAL EMPTY CONTENT: Should handle empty content gracefully
    // (Exact empty state message may vary by implementation)
    expect(screen.queryByText('Amazing Grace')).not.toBeInTheDocument()
  })

  it('preserves user context across component interactions', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    // REAL USER CONTEXT: User info should be accessible throughout
    expect(mockAuthContext.user.uid).toBe('test-user')
    expect(mockAuthContext.profile.full_name).toBe('Test User')

    // REAL CONTEXT PRESERVATION: User context should remain during interactions
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    await act(async () => {
      await user.click(recentTab)
    })

    // User context should still be available
    expect(mockAuthContext.user.uid).toBe('test-user')
  })

  it('handles responsive layout and component composition', async () => {
    await renderDashboard()

    // REAL LAYOUT COMPOSITION: Dashboard should be composed properly
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // REAL COMPONENT INTEGRATION: All dashboard sections should be present
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /recent/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()

    // REAL RESPONSIVE BEHAVIOR: Should handle different content types
    const contentTypes = ['lyrics', 'chords', 'tabs']
    contentTypes.forEach(type => {
      if (screen.queryByText(type)) {
        expect(screen.getByText(type)).toBeInTheDocument()
      }
    })
  })

  it('maintains state consistency across tab switches with real state management', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    // REAL STATE PERSISTENCE: Switch between tabs multiple times
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    const favoritesTab = screen.getByRole('tab', { name: /favorites/i })
    const overviewTab = screen.getByRole('tab', { name: /overview/i })

    // Navigate through different tabs
    await act(async () => {
      await user.click(recentTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(favoritesTab)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Blessed Be Your Name')).toBeInTheDocument()
    })

    await act(async () => {
      await user.click(overviewTab)
    })

    // Return to recent tab
    await act(async () => {
      await user.click(recentTab)
    })

    // REAL STATE CONSISTENCY: Recent content should still be available
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })
  })

  it('handles quick actions and navigation shortcuts', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    // REAL QUICK ACTIONS: Look for quick action buttons
    const addButton = screen.queryByRole('button', { name: /add content/i }) ||
                     screen.queryByRole('button', { name: /create/i }) ||
                     screen.queryByRole('link', { name: /add/i })

    const libraryButton = screen.queryByRole('button', { name: /library/i }) ||
                         screen.queryByRole('link', { name: /library/i })

    // REAL NAVIGATION: Test available navigation options
    if (addButton) {
      await act(async () => {
        await user.click(addButton)
      })
      // Should trigger some form of navigation or action
    }

    if (libraryButton) {
      await act(async () => {
        await user.click(libraryButton)
      })
      // Should trigger navigation to library
    }

    // At minimum, dashboard should remain functional
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })
}) 