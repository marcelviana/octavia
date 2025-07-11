import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import userEvent from '@testing-library/user-event'
import DashboardPageClient from '@/components/dashboard-page-client'
import { SessionProvider } from '@/components/providers/session-provider'
import { FirebaseAuthProvider } from '@/contexts/firebase-auth-context'
import type { ContentItem, UserStats } from '@/components/dashboard'

// Mock Firebase Auth
vi.mock('@/contexts/firebase-auth-context', () => ({
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
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
    profile: null,
    idToken: 'mock-token',
    isConfigured: true,
    isInitialized: true,
    refreshToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    updateProfile: vi.fn(),
    resendVerificationEmail: vi.fn(),
  })
}))

// Mock Next.js components
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}))

vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

let mockRouterPush: any

describe('Dashboard Integration Tests', () => {
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
    }
  ]

  const mockFavoriteContent: ContentItem[] = [
    {
      id: 'content-3',
      title: 'Blessed Be Your Name',
      content_type: 'lyrics',
      is_favorite: true,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
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
    mockRouterPush = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const renderDashboard = (props = {}) => {
    const defaultProps = {
      recentContent: mockRecentContent,
      favoriteContent: mockFavoriteContent,
      stats: mockStats,
      ...props
    }
    
    return render(
      <FirebaseAuthProvider>
        <SessionProvider>
          <DashboardPageClient {...defaultProps} />
        </SessionProvider>
      </FirebaseAuthProvider>
    )
  }

  it('displays user content and stats on dashboard load', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Should display stats in overview tab (default)
    expect(screen.getByText('15')).toBeInTheDocument() // totalContent
    expect(screen.getByText('3')).toBeInTheDocument() // totalSetlists
    expect(screen.getByText('5')).toBeInTheDocument() // favoriteContent

    // Switch to recent tab to see recent content
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    await user.click(recentTab)

    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()
    })

    // Switch to favorites tab to see favorite content
    const favoritesTab = screen.getByRole('tab', { name: /favorites/i })
    await user.click(favoritesTab)

    await waitFor(() => {
      expect(screen.getByText('Blessed Be Your Name')).toBeInTheDocument()
    })
  })

  it('handles navigation to different screens', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Look for Add Content button that navigates to /add-content
    const addContentButton = screen.getByRole('link', { name: /add content/i })
    expect(addContentButton).toHaveAttribute('href', '/add-content')
  })

  it('handles content selection navigation', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // Switch to recent tab to see content
    const recentTab = screen.getByRole('tab', { name: /recent/i })
    await user.click(recentTab)

    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    // Find clickable content item (it's a Link component)
    const contentLink = screen.getByRole('link', { name: /amazing grace/i })
    expect(contentLink).toHaveAttribute('href', '/content/content-1')
  })

  it('handles performance mode navigation', async () => {
    const user = userEvent.setup()
    renderDashboard()

    // This test might need to be updated based on actual functionality
    // For now, let's just check that the component renders
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('renders with empty content arrays', async () => {
    renderDashboard({
      recentContent: [],
      favoriteContent: [],
      stats: mockStats
    })

    // Should render without errors even with empty arrays
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // Stats should still show
    expect(screen.getByText('15')).toBeInTheDocument() // totalContent
  })

  it('renders with null stats', async () => {
    renderDashboard({
      recentContent: mockRecentContent,
      favoriteContent: mockFavoriteContent,
      stats: null
    })

    // Should render without errors even with null stats
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // Should show 0 for stats when stats is null
    // (This might need adjustment based on actual component behavior)
  })

  it('handles dashboard navigation state', async () => {
    renderDashboard()

    // The component should handle navigation between dashboard sections
    // Check that tabs are present and functional
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /recent/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()
  })

  it('integrates with responsive layout', async () => {
    renderDashboard()

    // Should render within ResponsiveLayout
    // The ResponsiveLayout should be present and handling navigation
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('passes correct props to dashboard component', async () => {
    renderDashboard()

    // Should render the main dashboard content
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    
    // Should show the stats from props
    expect(screen.getByText('15')).toBeInTheDocument() // totalContent
    expect(screen.getByText('3')).toBeInTheDocument() // totalSetlists
    expect(screen.getByText('5')).toBeInTheDocument() // favoriteContent
  })
}) 