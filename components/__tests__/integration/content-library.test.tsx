import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Library } from '@/components/library'

// Mock the content service
vi.mock('@/lib/content-service', () => {
  return {
    toggleFavorite: vi.fn(),
    getLibraryContent: vi.fn(),
    searchContent: vi.fn(),
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
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
      totalPages: 1,
    }),
  };
});

// Mock the auth context
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
  }),
  useFirebaseAuth: () => ({
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

// Mock the router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/library',
}))

describe('Library Management Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles content favoriting', async () => {
    const user = userEvent.setup()
    
    // Import the mock after vi.mock has been called
    const contentService = await import('@/lib/content-service')
    
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

    // User clicks favorite button
    const favoriteButton = screen.getByLabelText('Add to favorites')
    await act(async () => {
      await user.click(favoriteButton)
    })

    // Service function is called
    await waitFor(() => {
      expect(contentService.toggleFavorite).toHaveBeenCalledWith('content-1', true)
    })
  })
})
