import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ProfilePage from '../profile/page'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockReplace = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock Firebase auth context
const mockSignOut = vi.fn()
const mockResendVerificationEmail = vi.fn()
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  reload: vi.fn(),
} as any // Cast as any to avoid full User type requirements

vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: vi.fn(),
}))

// Get the mocked function after the mock is defined
import { useAuth } from '@/contexts/firebase-auth-context'
const mockUseAuth = vi.mocked(useAuth)

// Create a complete mock auth context
const createMockAuthContext = (overrides: Partial<any> = {}) => ({
  user: mockUser,
  profile: null,
  idToken: 'mock-token',
  isLoading: false,
  loading: false,
  isConfigured: true,
  isInitialized: true,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: mockSignOut,
  updateProfile: vi.fn(),
  refreshToken: vi.fn(),
  resendVerificationEmail: mockResendVerificationEmail,
  ...overrides,
})

// Mock components
vi.mock('@/components/ProfileForm', () => ({
  default: ({ prevPath }: { prevPath: string | null }) => (
    <div data-testid="profile-form" data-prev-path={prevPath || ''}>
      Profile Form Component
    </div>
  ),
}))

vi.mock('@/components/responsive-layout', () => ({
  ResponsiveLayout: ({ children, activeScreen, onNavigate }: any) => (
    <div data-testid="responsive-layout" data-active-screen={activeScreen}>
      <button onClick={() => onNavigate('dashboard')}>Dashboard</button>
      <button onClick={() => onNavigate('library')}>Library</button>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className}>
      Loading...
    </div>
  ),
}))

// Mock document.referrer
Object.defineProperty(document, 'referrer', {
  value: '',
  writable: true,
})

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document.referrer
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading skeleton when not mounted', () => {
    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Should show loading skeleton initially when not mounted
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(6)
  })

  it('renders loading skeleton when auth is initializing', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext({
      user: null,
      isLoading: true,
      isInitialized: false,
    }))

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should show loading skeleton when auth is loading
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(6)
  })

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isInitialized: true,
    } as any)

    render(<ProfilePage />)

    // Wait for component to mount and process auth state
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('renders profile form when user is authenticated', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should render profile form
    expect(screen.getByTestId('profile-form')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-layout')).toBeInTheDocument()
  })

  it('captures previous path from document.referrer', async () => {
    // Set document.referrer to simulate coming from another page
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000/dashboard',
      writable: true,
    })

    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should pass previous path to ProfileForm
    const profileForm = screen.getByTestId('profile-form')
    expect(profileForm).toHaveAttribute('data-prev-path', 'http://localhost:3000/dashboard')
  })

  it('does not capture previous path when coming from profile page', async () => {
    // Set document.referrer to profile page
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000/profile',
      writable: true,
    })

    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should not pass previous path when coming from profile page
    const profileForm = screen.getByTestId('profile-form')
    expect(profileForm).toHaveAttribute('data-prev-path', '')
  })

  it('handles navigation to other screens', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext())

    const user = userEvent.setup()
    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Click dashboard button
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i })
    await act(async () => {
      await user.click(dashboardButton)
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('handles navigation to library', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext())

    const user = userEvent.setup()
    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Click library button
    const libraryButton = screen.getByRole('button', { name: /library/i })
    await act(async () => {
      await user.click(libraryButton)
    })

    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('sets active screen to profile when navigating to profile', async () => {
    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should set active screen to profile
    const responsiveLayout = screen.getByTestId('responsive-layout')
    expect(responsiveLayout).toHaveAttribute('data-active-screen', 'profile')
  })

  it('handles empty document.referrer', async () => {
    // Set empty document.referrer
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
    })

    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should not pass previous path when referrer is empty
    const profileForm = screen.getByTestId('profile-form')
    expect(profileForm).toHaveAttribute('data-prev-path', '')
  })

  it('handles auth loading state transition', async () => {
    // Start with loading state
    mockUseAuth.mockReturnValue(createMockAuthContext({
      user: null,
      isLoading: true,
      isInitialized: false,
    }))

    const { rerender } = render(<ProfilePage />)

    // Should show loading skeleton
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)

    // Transition to authenticated state
    mockUseAuth.mockReturnValue(createMockAuthContext())

    rerender(<ProfilePage />)

    // Wait for component to update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should render profile form
    expect(screen.getByTestId('profile-form')).toBeInTheDocument()
  })

  it('handles auth loading to unauthenticated transition', async () => {
    // Start with loading state
    mockUseAuth.mockReturnValue(createMockAuthContext({
      user: null,
      isLoading: true,
      isInitialized: false,
    }))

    const { rerender } = render(<ProfilePage />)

    // Should show loading skeleton
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)

    // Transition to unauthenticated state
    mockUseAuth.mockReturnValue(createMockAuthContext({
      user: null,
      isLoading: false,
      isInitialized: true,
    }))

    rerender(<ProfilePage />)

    // Wait for component to update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should redirect to login
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('handles window object not being available', async () => {
    // Mock window as undefined (SSR scenario)
    const originalWindow = global.window
    delete (global as any).window

    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should render without error
    expect(screen.getByTestId('profile-form')).toBeInTheDocument()

    // Restore window
    global.window = originalWindow
  })

  it('handles complex referrer URLs', async () => {
    // Set complex referrer URL
    Object.defineProperty(document, 'referrer', {
      value: 'https://example.com/some/deep/path?param=value#fragment',
      writable: true,
    })

    mockUseAuth.mockReturnValue(createMockAuthContext())

    render(<ProfilePage />)

    // Wait for component to mount
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should capture the full referrer URL
    const profileForm = screen.getByTestId('profile-form')
    expect(profileForm).toHaveAttribute(
      'data-prev-path',
      'https://example.com/some/deep/path?param=value#fragment'
    )
  })
}) 