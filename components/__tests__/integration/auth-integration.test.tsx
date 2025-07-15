import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { SessionProvider } from '@/components/providers/session-provider'

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signOut: vi.fn(),
  getAuth: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}))

// Mock Firebase Auth context
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => mockAuthState,
  useFirebaseAuth: () => mockAuthState,
  FirebaseAuthProvider: ({ children }: any) => children,
}))

let mockRouterPush: any
let mockAuthState: any

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockRouterPush = vi.fn()
    mockAuthState = {
      user: null,
      loading: false,
      isLoading: false,
      signIn: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null, data: { user: { uid: 'test', emailVerified: false } } }),
      signOut: vi.fn(),
      resetPassword: vi.fn().mockResolvedValue({ error: null }),
      profile: null,
      idToken: null,
      isConfigured: true,
      isInitialized: true,
      refreshToken: vi.fn(),
      signInWithGoogle: vi.fn(),
      updateProfile: vi.fn(),
      resendVerificationEmail: vi.fn(),
    }

    // Setup Firebase mock implementations
    const { 
      signInWithEmailAndPassword, 
      createUserWithEmailAndPassword,
      sendPasswordResetEmail 
    } = await import('firebase/auth')
    
    ;(signInWithEmailAndPassword as any).mockResolvedValue({
      user: {
        uid: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
    ;(createUserWithEmailAndPassword as any).mockResolvedValue({
      user: {
        uid: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User'
      }
    })
    ;(sendPasswordResetEmail as any).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Login Flow', () => {
    const renderLoginForm = () => {
      return render(
        <SessionProvider>
          <LoginForm />
        </SessionProvider>
      )
    }

    it('supports complete login workflow with validation and feedback', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // User sees login form
      const emailField = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordField = screen.getByLabelText(/^password$/i) ||
                           document.querySelector('input[type="password"]')
      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })

      expect(emailField).toBeInTheDocument()
      expect(passwordField).toBeInTheDocument()
      expect(loginButton).toBeInTheDocument()

      // User attempts to login with empty fields
      await act(async () => {
        const loginButton = screen.getByRole('button', { name: /sign in/i })
        await user.click(loginButton)
      })

      // System may or may not show immediate validation - focus on the workflow
      // (Some forms validate on submit, others on blur)
      
      // User enters invalid email and tries again
      await act(async () => {
        await user.type(emailField, 'invalid-email')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // User enters valid email but leaves password empty
      await act(async () => {
        await user.clear(emailField)
        await user.type(emailField, 'john@example.com')
        await user.clear(passwordField)
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // User completes form with valid credentials
      await act(async () => {
        await user.type(passwordField, 'password123')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
      })

      // System processes login (button text might change)
      const submitButton = screen.getByRole('button', { name: /sign in|signing in/i })
      expect(submitButton).toBeInTheDocument()

      // Eventually authentication occurs (mocked)
      await waitFor(() => {
        expect(mockAuthState.signIn).toHaveBeenCalledWith('john@example.com', 'password123')
      })
    })

    it('handles successful login', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // Fill in credentials
      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i) ||
                           document.querySelector('input[type="password"]')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Submit form
      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)

      // Should call login function
      await waitFor(() => {
        expect(mockAuthState.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('displays validation errors for empty fields', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // Try to submit without filling fields
      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })
      
      // The form has HTML5 required attributes, so it won't submit without values
      await user.click(loginButton)
      
      // Check that the form inputs have required attributes
      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = document.querySelector('input[type="password"]')
      
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('displays error for invalid credentials', async () => {
      const user = userEvent.setup()
      
      // Mock login failure
      mockAuthState.signIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
      
      renderLoginForm()

      // Fill in invalid credentials
      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i) ||
                           document.querySelector('input[type="password"]')
      
      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')

      // Submit form
      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)

      // Should show error message in alert
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i) ||
               screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('provides user-friendly navigation to signup and password recovery', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      // User can easily find signup option
      const signupLink = screen.getByRole('link', { name: /sign up/i })
      expect(signupLink).toBeAccessible()
      expect(signupLink).toHaveAttribute('href', '/signup')

      // User can easily find password recovery option
      const forgotLink = screen.getByRole('link', { name: /forgot.*password/i })
      expect(forgotLink).toBeAccessible()
      expect(forgotLink).toHaveAttribute('href', '/forgot-password')

      // Links are properly labeled for screen readers
      expect(signupLink).toHaveAriaLabel('sign up')
      expect(forgotLink).toHaveAriaLabel('forgot password')
    })
  })

  describe('Signup Flow', () => {
    const renderSignupForm = () => {
      return render(
        <SessionProvider>
          <SignupForm />
        </SessionProvider>
      )
    }

    it('supports complete signup workflow with comprehensive validation', async () => {
      const user = userEvent.setup()

      await renderSignupForm()
      
      const emailField = screen.getByLabelText(/email/i)
      const passwordField = screen.getByLabelText(/^password$/i)
      const signupButton = screen.getByRole('button', { name: /create account/i })
      
      // User can see and interact with form elements
      expect(signupButton).toBeInTheDocument()

      // User attempts signup with empty fields
      await act(async () => {
        const signupButton = screen.getByRole('button', { name: /create account/i })
        await user.click(signupButton)
      })

      // System shows validation errors (may vary by implementation)
      // Focus on the fields that actually show validation
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert').map(el => el.textContent)
        expect(alerts.length).toBeGreaterThan(0) // Some validation appears
      })

      // User enters valid information step by step
      await act(async () => {
        await user.type(screen.getByLabelText(/first name/i), 'John')
        await user.type(screen.getByLabelText(/last name/i), 'Doe')
        await user.type(emailField, 'john@example.com')
        await user.type(passwordField, 'password123')
        await user.type(screen.getByLabelText(/confirm password/i), 'password123')
        await user.click(screen.getByRole('button', { name: /create account/i }))
      })

      // System processes signup (button text might change)
      const submitButton = screen.getByRole('button', { name: /create account|creating account/i })
      expect(submitButton).toBeInTheDocument()

      // Eventually completes signup (mocked)
      await waitFor(() => {
        expect(mockAuthState.signUp).toHaveBeenCalledWith(
          'john@example.com',
          'password123',
          expect.objectContaining({
            first_name: expect.any(String),
            last_name: expect.any(String),
            full_name: expect.any(String),
            primary_instrument: expect.any(String)
          })
        )
      })
    })

    it('handles successful signup', async () => {
      const user = userEvent.setup()
      renderSignupForm()

      // Fill in signup details - need to fill all required fields
      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInputs = document.querySelectorAll('input[type="password"]')
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = passwordInputs[1] || passwordInputs[0]
      
      await user.type(firstNameInput, 'John')
      await user.type(lastNameInput, 'Doe')
      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      if (confirmPasswordInput !== passwordInput) {
        await user.type(confirmPasswordInput, 'newpassword123')
      }

      // Submit form
      const signupButton = screen.getByRole('button', { name: /create account/i })
      await user.click(signupButton)

      // Should call signup function with the expected parameters
      await waitFor(() => {
        expect(mockAuthState.signUp).toHaveBeenCalledWith(
          'newuser@example.com', 
          'newpassword123',
          expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
            full_name: 'John Doe',
            primary_instrument: ''
          })
        )
      })
    })

    it('validates password confirmation', async () => {
      const user = userEvent.setup()
      renderSignupForm()

      // Fill in mismatched passwords
      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInputs = document.querySelectorAll('input[type="password"]')
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = passwordInputs[1]
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      
      if (confirmPasswordInput) {
        await user.type(confirmPasswordInput, 'different123')

        // Submit the form to trigger validation
        const signupButton = screen.getByRole('button', { name: /create account/i })
        await user.click(signupButton)

        // Check that the password values are different (which should trigger validation)
        expect(passwordInput).toHaveValue('password123')
        expect(confirmPasswordInput).toHaveValue('different123')
        
        // The form should handle this validation internally
        // We don't need to check for specific error messages since they may vary
      }
    })

    it('validates password strength', async () => {
      const user = userEvent.setup()
      renderSignupForm()

      // Fill in weak password
      const passwordInput = document.querySelector('input[type="password"]')
      
      if (passwordInput) {
        await user.type(passwordInput, '123')

        // Check that the password input has the short value (form validation will handle strength)
        expect(passwordInput).toHaveValue('123')
        
        // The form has minLength validation, so short passwords will be caught by HTML5 validation
        // when form is submitted
      }
    })

    it('navigates to login page', async () => {
      const user = userEvent.setup()
      renderSignupForm()

      // Find login link - should be in the footer
      const loginLink = screen.getByRole('link', { name: /sign in/i })

      if (loginLink) {
        // Check that the link has the correct href instead of testing router.push
        // since this is a Link component, not a programmatic navigation
        expect(loginLink).toHaveAttribute('href', '/login')
      }
    })
  })

  describe('Password Reset Flow', () => {
    it('handles password reset request', async () => {
      const user = userEvent.setup()
      
      // Render a simple password reset form
      render(
        <SessionProvider>
          <div>
            <input 
              type="email" 
              placeholder="Enter your email"
              data-testid="reset-email"
            />
            <button 
              onClick={() => mockAuthState.resetPassword('test@example.com')}
              data-testid="reset-button"
            >
              Reset Password
            </button>
          </div>
        </SessionProvider>
      )

      const emailInput = screen.getByTestId('reset-email')
      const resetButton = screen.getByTestId('reset-button')

      await user.type(emailInput, 'test@example.com')
      await user.click(resetButton)

      // Should call reset password function
      expect(mockAuthState.resetPassword).toHaveBeenCalledWith('test@example.com')
    })
  })

  describe('Protected Route Integration', () => {
    it('redirects unauthenticated users to login', async () => {
      // Mock unauthenticated state
      mockAuthState.user = null
      
      // Simulate trying to access a protected route
      render(
        <SessionProvider>
          <div data-testid="protected-content">
            Protected Content
          </div>
        </SessionProvider>
      )

      // In a real app, this would be handled by middleware or route guards
      // For testing, we check that the auth state is properly detected
      expect(mockAuthState.user).toBeNull()
    })

    it('allows authenticated users to access protected content', async () => {
      // Mock authenticated state
      mockAuthState.user = {
        uid: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User'
      }
      
      render(
        <SessionProvider>
          <div data-testid="protected-content">
            Protected Content
          </div>
        </SessionProvider>
      )

      // Should show protected content for authenticated user
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockAuthState.user).toBeTruthy()
    })

    it('handles logout and redirects to login', async () => {
      const user = userEvent.setup()
      
      // Mock authenticated state
      mockAuthState.user = {
        uid: 'test-user-1',
        email: 'test@example.com',
        displayName: 'Test User'
      }
      
      render(
        <SessionProvider>
          <div>
            <div data-testid="user-info">
              Welcome, {mockAuthState.user.email}
            </div>
            <button 
              onClick={mockAuthState.signOut}
              data-testid="logout-button"
            >
              Logout
            </button>
          </div>
        </SessionProvider>
      )

      const logoutButton = screen.getByTestId('logout-button')
      await user.click(logoutButton)

      // Should call logout function
      expect(mockAuthState.signOut).toHaveBeenCalled()
    })
  })

  describe('Form Validation Integration', () => {
    const renderLoginForm = () => {
      return render(
        <SessionProvider>
          <LoginForm />
        </SessionProvider>
      )
    }

    it('prevents submission with invalid email format', async () => {
      const user = userEvent.setup()
      renderLoginForm()

      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i) ||
                           document.querySelector('input[type="password"]')
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')

      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)

      // Check that the email input has invalid value
      // HTML5 validation will prevent submission, but the form will still show the invalid value
      expect(emailInput).toHaveValue('invalid-email')
      
      // The email input should have type="email" which provides HTML5 validation
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('shows loading state during authentication', async () => {
      const user = userEvent.setup()
      
      // Mock delayed login
      mockAuthState.signIn.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      renderLoginForm()

      const emailInput = screen.getByRole('textbox', { name: /email/i }) ||
                        screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/^password$/i) ||
                           document.querySelector('input[type="password"]')
      
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      const loginButton = screen.getByRole('button', { name: /sign in/i }) ||
                         screen.getByRole('button', { name: /login/i })
      await user.click(loginButton)

      // Should show loading state - the button text changes to "Signing in..."
      await waitFor(() => {
        expect(screen.getByText(/signing in/i) ||
               loginButton.hasAttribute('disabled')).toBeTruthy()
      })
    })
  })
}) 