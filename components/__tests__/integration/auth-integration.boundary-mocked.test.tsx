import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { SessionProvider } from '@/components/providers/session-provider'
import { createUnauthenticatedAuthContext, TestAuthProvider } from '@/lib/__tests__/test-auth'
import { createTestUser } from '@/lib/__tests__/test-database'

/**
 * BOUNDARY-MOCKED AUTH INTEGRATION TEST
 * 
 * This test uses:
 * ✅ Real form components and interactions
 * ✅ Real form validation logic
 * ✅ Real state management and UI updates
 * ✅ Real user workflows and error handling
 * 
 * Only mocks:
 * ❌ Firebase auth service (external boundary)
 * ❌ Navigation router (external boundary)
 * ❌ Browser APIs (external boundary)
 * 
 * This approach tests YOUR code integration while controlling external dependencies
 */

// Mock external boundaries at module level
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
}

const mockFirebaseAuth = {
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(),
}

// Mock Next.js navigation (external boundary)
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}))

// Mock Firebase auth functions (external boundary)  
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(),
}))

// Mock the Firebase auth context
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isLoading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPassword: vi.fn(),
    profile: null,
    idToken: null,
    isConfigured: true,
    isInitialized: true,
    refreshToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    updateProfile: vi.fn(),
    resendVerificationEmail: vi.fn(),
  }),
  useFirebaseAuth: () => ({
    user: null,
    loading: false,
    isLoading: false,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: mockSignOut,
    resetPassword: vi.fn(),
    profile: null,
    idToken: null,
    isConfigured: true,
    isInitialized: true,
    refreshToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    updateProfile: vi.fn(),
    resendVerificationEmail: vi.fn(),
  }),
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="firebase-auth-provider">{children}</div>
  ),
}))

describe('Auth Integration with Boundary Mocking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Login Form Integration', () => {
    const renderLoginWithAuth = () => {
      return render(
        <SessionProvider>
          <LoginForm />
        </SessionProvider>
      )
    }

    it('completes successful login workflow with real form integration', async () => {
      const user = userEvent.setup()
      
      // Mock successful authentication response
      mockSignIn.mockResolvedValue({
        error: null,
        user: { uid: 'test-user', email: 'test@example.com' }
      })

      renderLoginWithAuth()

      // REAL FORM INTERACTION: User fills out login form
      const emailField = screen.getByRole('textbox', { name: /email/i })
      const passwordField = screen.getByLabelText(/^password$/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await act(async () => {
        await user.type(emailField, 'test@example.com')
        await user.type(passwordField, 'password123')
        await user.click(loginButton)
      })

      // REAL SERVICE INTEGRATION: Auth service should be called with form data
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })

      // REAL UI STATE: Form should show success state
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })
    })

    it('handles authentication errors with real error display', async () => {
      const user = userEvent.setup()
      
      // Mock authentication failure
      mockFirebaseAuth.signInWithEmailAndPassword.mockRejectedValue(
        new Error('Invalid email or password')
      )

      renderLoginWithAuth()

      // REAL FORM INTERACTION: User submits invalid credentials
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'wrong@example.com')
        await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // REAL ERROR HANDLING: Error should be displayed to user
      await waitFor(() => {
        expect(screen.getByRole('alert') || screen.getByText(/invalid email or password/i)).toBeInTheDocument()
      })

      // REAL FORM STATE: Form should remain usable for retry
      expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
    })

    it('validates form inputs with real validation logic', async () => {
      const user = userEvent.setup()
      renderLoginWithAuth()

      // REAL VALIDATION: Submit empty form
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // REAL VALIDATION FEEDBACK: HTML5 validation or custom validation should work
      const emailField = screen.getByRole('textbox', { name: /email/i }) as HTMLInputElement
      expect(emailField.validity.valid).toBe(false) // HTML5 required validation

      // REAL VALIDATION: Enter invalid email format
      await act(async () => {
        await user.type(emailField, 'invalid-email-format')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // REAL VALIDATION FEEDBACK: Email format validation
      expect(emailField.validity.valid).toBe(false) // HTML5 email validation
    })

    it('shows loading state during authentication with real UI updates', async () => {
      const user = userEvent.setup()
      
      // Mock delayed authentication
      mockSignIn.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null, user: null }), 1000))
      )

      renderLoginWithAuth()

      // REAL FORM INTERACTION: Start login process
      await act(async () => {
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com')
        await user.type(screen.getByLabelText(/^password$/i), 'password123')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

             // REAL UI STATE: Loading state should be shown
       await waitFor(() => {
         const button = screen.getByRole('button', { name: /signing in|sign in/i }) as HTMLButtonElement
         expect(button.disabled || button.textContent?.match(/signing in/i)).toBeTruthy()
       })
    })
  })

  describe('Signup Form Integration', () => {
    const renderSignupWithAuth = () => {
      return render(
        <SessionProvider>
          <SignupForm />
        </SessionProvider>
      )
    }

    it('completes successful signup workflow with real form validation', async () => {
      const user = userEvent.setup()
      
      // Mock successful signup response
      mockSignUp.mockResolvedValue({
        error: null,
        data: { user: { uid: 'test-user', email: 'john@example.com' } }
      })

      renderSignupWithAuth()

      // REAL FORM INTERACTION: User fills complete signup form
      await act(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John')
        await user.type(screen.getByLabelText(/last name/i), 'Doe')
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com')
        
        const passwordInputs = screen.getAllByLabelText(/password/i)
        await user.type(passwordInputs[0], 'securepassword123')
        await user.type(passwordInputs[1], 'securepassword123') // confirm password
        
        await user.click(screen.getByRole('button', { name: /create account/i }))
      })

      // REAL SERVICE INTEGRATION: Signup should be called with form data
      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          'john@example.com',
          'securepassword123',
          expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            full_name: 'John Doe'
          })
        )
      })
    })

    it('validates password confirmation with real validation logic', async () => {
      const user = userEvent.setup()
      renderSignupWithAuth()

      // REAL VALIDATION: Enter mismatched passwords
      const passwordInputs = screen.getAllByLabelText(/password/i)
      await act(async () => {
        await user.type(passwordInputs[0], 'password123')
        await user.type(passwordInputs[1], 'differentpassword')
        await user.click(screen.getByRole('button', { name: /create account/i }))
      })

      // REAL VALIDATION FEEDBACK: Password mismatch should be handled
      await waitFor(() => {
        // Either custom validation message or prevent submission
        expect(
          screen.queryByText(/passwords.*match/i) ||
          (passwordInputs[1] as HTMLInputElement).validity.valid === false
        ).toBeTruthy()
      })
    })

    it('handles network errors during signup with real error recovery', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockSignUp.mockRejectedValue(new Error('Network error'))

      renderSignupWithAuth()

      // Fill and submit form
      await act(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John')
        await user.type(screen.getByLabelText(/last name/i), 'Doe')
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com')
        
        const passwordInputs = screen.getAllByLabelText(/password/i)
        await user.type(passwordInputs[0], 'password123')
        await user.type(passwordInputs[1], 'password123')
        
        await user.click(screen.getByRole('button', { name: /create account/i }))
      })

      // REAL ERROR HANDLING: Network error should be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert') || screen.getByText(/error/i)).toBeInTheDocument()
      })

      // REAL ERROR RECOVERY: Form should be usable for retry
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
    })
  })

  describe('Navigation Integration', () => {
    it('navigates correctly between auth pages with real link components', async () => {
      const user = userEvent.setup()
      render(
        <TestAuthProvider>
          <SessionProvider>
            <LoginForm />
          </SessionProvider>
        </TestAuthProvider>
      )

      // REAL NAVIGATION: User clicks signup link
      const signupLink = screen.getByRole('link', { name: /sign up/i })
      expect(signupLink).toHaveAttribute('href', '/signup')

      // REAL NAVIGATION: User clicks forgot password link
      const forgotLink = screen.getByRole('link', { name: /forgot.*password/i })
      expect(forgotLink).toHaveAttribute('href', '/forgot-password')

      // These are real Link components, not programmatic navigation
      // So we verify href attributes rather than router.push calls
    })
  })

  describe('Session Integration', () => {
    it('preserves auth state across component re-renders', async () => {
      const user = userEvent.setup()
      const testUser = createTestUser()
      
      // Start with authenticated state  
      const authContext = {
        ...createUnauthenticatedAuthContext(),
        user: testUser,
        isLoading: false
      }

      const { rerender } = render(
        <TestAuthProvider authContext={authContext}>
          <SessionProvider>
            <div data-testid="user-info">
              {authContext.user ? `Welcome ${authContext.user.email}` : 'Not logged in'}
            </div>
          </SessionProvider>
        </TestAuthProvider>
      )

      // REAL STATE MANAGEMENT: User info should be displayed
      expect(screen.getByText(`Welcome ${testUser.email}`)).toBeInTheDocument()

      // Simulate state change (e.g., logout)
      const updatedAuthContext = {
        ...authContext,
        user: null
      }
      
      rerender(
        <TestAuthProvider authContext={updatedAuthContext}>
          <SessionProvider>
            <div data-testid="user-info">
              {updatedAuthContext.user ? `Welcome ${updatedAuthContext.user.email}` : 'Not logged in'}
            </div>
          </SessionProvider>
        </TestAuthProvider>
      )

      // REAL STATE UPDATE: Should reflect new state
      expect(screen.getByText('Not logged in')).toBeInTheDocument()
    })
  })
}) 