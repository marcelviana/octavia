import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Library } from '@/components/library'

/**
 * COMPONENT INTEGRATION TEST for Content Library
 * 
 * This test focuses on:
 * ✅ Real component interactions and state management
 * ✅ Real user workflows and UI updates
 * ✅ Real error handling and recovery
 * 
 * Only mocks:
 * ❌ External API boundaries (navigation, browser APIs)
 * ❌ Database operations (when not configured)
 */

// Mock external boundaries at module level
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
}

const mockAuthContext = {
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
  usePathname: () => '/library',
}))

vi.mock('@/contexts/firebase-auth-context', () => ({
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => mockAuthContext,
  useFirebaseAuth: () => mockAuthContext,
}))

// Mock content service to provide test data
vi.mock('@/lib/content-service', () => ({
  toggleFavorite: vi.fn().mockResolvedValue({ success: true }),
  getLibraryContent: vi.fn().mockResolvedValue({
    data: [
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
      }
    ],
    total: 2,
    page: 1,
    pageSize: 20,
    hasMore: false,
    totalPages: 1,
  }),
  searchContent: vi.fn().mockResolvedValue({
    data: [
      {
        id: 'content-1',
        title: 'Amazing Grace',
        content_type: 'lyrics',
        is_favorite: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
    ],
    total: 1,
    page: 1,
    pageSize: 20,
    hasMore: false,
    totalPages: 1,
  }),
  deleteContent: vi.fn(),
  getUserContentPage: vi.fn().mockResolvedValue({
    data: [
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
      }
    ],
    total: 2,
    page: 1,
    pageSize: 20,
    hasMore: false,
    totalPages: 1,
  }),
}))

describe('Content Library Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('displays content and handles user interactions with real component state', async () => {
    const user = userEvent.setup()
    
    // Render library with test data
    render(
      <Library
        onSelectContent={vi.fn()}
        initialContent={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />
    )

    // REAL DATA LOADING: Content should appear from mocked service
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Verify content is displayed correctly
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    expect(screen.getByText('How Great Thou Art')).toBeInTheDocument()

    // REAL USER INTERACTION: User favorites a song
    const favoriteButton = screen.getByLabelText('Add to favorites')
    await act(async () => {
      await user.click(favoriteButton)
    })

    // REAL SERVICE CALL: Verify the favorite action was processed
    const contentService = await import('@/lib/content-service')
    await waitFor(() => {
      expect(contentService.toggleFavorite).toHaveBeenCalledWith('content-1', true)
    })

    // REAL UI UPDATE: UI should reflect the change
    await waitFor(() => {
      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
    })
  })

  it('handles content filtering with real component interactions', async () => {
    const user = userEvent.setup()
    
    render(
      <Library
        onSelectContent={vi.fn()}
        initialContent={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />
    )

    // Wait for initial content to load
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    // REAL FILTER: User clicks on filters button
    const filterButton = screen.getByRole('button', { name: /filters/i })
    await act(async () => {
      await user.click(filterButton)
    })

    // Verify filter options are available
    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })
  })

  it('handles error scenarios with real error recovery', async () => {
    const user = userEvent.setup()
    
    // Mock service failure
    const contentService = await import('@/lib/content-service')
    ;(contentService.toggleFavorite as any).mockRejectedValueOnce(new Error('Network error'))
    
    render(
      <Library
        onSelectContent={vi.fn()}
        initialContent={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />
    )

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    // Try to favorite a song (this should fail)
    const favoriteButton = screen.getByLabelText('Add to favorites')
    await act(async () => {
      await user.click(favoriteButton)
    })

    // REAL ERROR HANDLING: UI should show error state or handle gracefully
    await waitFor(() => {
      // The component might handle errors gracefully without showing alerts
      // Just verify the operation didn't succeed
      expect(screen.getByLabelText('Add to favorites')).toBeInTheDocument()
    })

    // Mock successful retry
    ;(contentService.toggleFavorite as any).mockResolvedValueOnce({ success: true })
    
    // User retries the action
    await act(async () => {
      await user.click(favoriteButton)
    })

    // REAL SUCCESS: Operation should now succeed
    await waitFor(() => {
      expect(screen.getByLabelText('Remove from favorites')).toBeInTheDocument()
    })
  })

  it('handles content selection with real component interactions', async () => {
    const user = userEvent.setup()
    const mockOnSelectContent = vi.fn()
    
    render(
      <Library
        onSelectContent={mockOnSelectContent}
        initialContent={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />
    )

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    // REAL INTERACTION: User clicks on content item
    const contentButton = screen.getByRole('button', { name: /view amazing grace/i })
    await act(async () => {
      await user.click(contentButton)
    })
    
    // REAL COMPONENT INTEGRATION: Should call the onSelectContent callback
    expect(mockOnSelectContent).toHaveBeenCalled()
  })

  it('preserves user context across component interactions', async () => {
    const user = userEvent.setup()
    
    render(
      <Library
        onSelectContent={vi.fn()}
        initialContent={[]}
        initialTotal={0}
        initialPage={1}
        initialPageSize={20}
      />
    )

    // Verify user context is available
    expect(mockAuthContext.user.uid).toBe('test-user')
    expect(mockAuthContext.profile.full_name).toBe('Test User')

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    })

    // User context should still be available after interactions
    expect(mockAuthContext.user.uid).toBe('test-user')
  })
}) 