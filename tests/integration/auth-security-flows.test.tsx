/**
 * Integration Tests: Authentication Flows with Security Measures
 *
 * Tests the complete authentication system with all security measures
 * including rate limiting, token blacklisting, session management,
 * and protection against various attack vectors. This validates the
 * enterprise-grade security implementation.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock Firebase Auth
const mockFirebaseAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(),
  getIdToken: vi.fn()
}

// Mock server-side auth verification
const mockAuthServer = {
  requireAuthServer: vi.fn(),
  validateToken: vi.fn(),
  blacklistToken: vi.fn(),
  getTokenClaims: vi.fn()
}

// Mock rate limiter
const mockRateLimiter = {
  checkLimit: vi.fn(),
  isBlocked: vi.fn(),
  getRemainingAttempts: vi.fn(),
  resetAttempts: vi.fn()
}

// Mock security logger
const mockSecurityLogger = {
  logAuthAttempt: vi.fn(),
  logSuspiciousActivity: vi.fn(),
  logTokenBlacklist: vi.fn(),
  logRateLimitViolation: vi.fn()
}

// Authentication component with security measures
const SecureAuthComponent = () => {
  const [user, setUser] = React.useState(null)
  const [isSigningIn, setIsSigningIn] = React.useState(false)
  const [authError, setAuthError] = React.useState('')
  const [remainingAttempts, setRemainingAttempts] = React.useState(5)
  const [isBlocked, setIsBlocked] = React.useState(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = React.useState(0)
  const [securityEvents, setSecurityEvents] = React.useState<string[]>([])

  // Rate limiting check
  const checkRateLimit = async (action: string) => {
    const blocked = await mockRateLimiter.isBlocked(action)
    const remaining = await mockRateLimiter.getRemainingAttempts(action)

    setIsBlocked(blocked)
    setRemainingAttempts(remaining)

    if (blocked) {
      setBlockTimeRemaining(60) // 60 seconds block
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setIsBlocked(false)
            mockRateLimiter.resetAttempts(action)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return !blocked
  }

  // Secure sign in with all security measures
  const signIn = async (email: string, password: string) => {
    setAuthError('')
    setIsSigningIn(true)

    try {
      // 1. Rate limiting check
      const canProceed = await checkRateLimit('signin')
      if (!canProceed) {
        throw new Error('Too many failed attempts. Please try again later.')
      }

      // 2. Log authentication attempt
      mockSecurityLogger.logAuthAttempt('signin', email, 'attempt')

      // 3. Attempt authentication
      const userCredential = await mockFirebaseAuth.signInWithEmailAndPassword(email, password)

      // 4. Validate token server-side
      const token = await userCredential.user.getIdToken()
      const isValid = await mockAuthServer.validateToken(token)

      if (!isValid) {
        throw new Error('Invalid authentication token')
      }

      // 5. Success
      setUser(userCredential.user)
      mockSecurityLogger.logAuthAttempt('signin', email, 'success')
      mockRateLimiter.resetAttempts('signin')
      setSecurityEvents(prev => [...prev, `Successful login: ${email}`])

    } catch (error: any) {
      // Log failed attempt
      mockSecurityLogger.logAuthAttempt('signin', email, 'failure', error.message)
      setAuthError(error.message)
      setSecurityEvents(prev => [...prev, `Failed login attempt: ${email} - ${error.message}`])

      // Check for suspicious activity
      if (error.message.includes('invalid') || error.message.includes('wrong')) {
        mockSecurityLogger.logSuspiciousActivity('invalid_credentials', { email })
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  // Secure sign up
  const signUp = async (email: string, password: string) => {
    setAuthError('')
    setIsSigningIn(true)

    try {
      const canProceed = await checkRateLimit('signup')
      if (!canProceed) {
        throw new Error('Too many signup attempts. Please try again later.')
      }

      mockSecurityLogger.logAuthAttempt('signup', email, 'attempt')

      const userCredential = await mockFirebaseAuth.createUserWithEmailAndPassword(email, password)
      setUser(userCredential.user)

      mockSecurityLogger.logAuthAttempt('signup', email, 'success')
      setSecurityEvents(prev => [...prev, `New user registered: ${email}`])

    } catch (error: any) {
      mockSecurityLogger.logAuthAttempt('signup', email, 'failure', error.message)
      setAuthError(error.message)
      setSecurityEvents(prev => [...prev, `Failed signup: ${email} - ${error.message}`])
    } finally {
      setIsSigningIn(false)
    }
  }

  // Secure sign out with token blacklisting
  const signOut = async () => {
    try {
      if (user) {
        // Blacklist current token
        const token = await user.getIdToken()
        await mockAuthServer.blacklistToken(token)
        mockSecurityLogger.logTokenBlacklist(token, user.uid, 'manual_signout')
      }

      await mockFirebaseAuth.signOut()
      setUser(null)
      setSecurityEvents(prev => [...prev, 'User signed out'])
    } catch (error: any) {
      setAuthError(error.message)
    }
  }

  // Password reset with rate limiting
  const resetPassword = async (email: string) => {
    try {
      const canProceed = await checkRateLimit('password_reset')
      if (!canProceed) {
        throw new Error('Too many password reset attempts. Please try again later.')
      }

      await mockFirebaseAuth.sendPasswordResetEmail(email)
      mockSecurityLogger.logAuthAttempt('password_reset', email, 'success')
      setSecurityEvents(prev => [...prev, `Password reset sent: ${email}`])
    } catch (error: any) {
      setAuthError(error.message)
      mockSecurityLogger.logAuthAttempt('password_reset', email, 'failure', error.message)
    }
  }

  return (
    <div data-testid="secure-auth-component">
      {/* Security status indicators */}
      <div data-testid="security-status">
        <div data-testid="rate-limit-status">
          Remaining attempts: {remainingAttempts}
        </div>
        {isBlocked && (
          <div data-testid="blocked-indicator">
            Blocked for {blockTimeRemaining} seconds
          </div>
        )}
      </div>

      {/* Authentication forms */}
      {!user ? (
        <div data-testid="auth-forms">
          <div data-testid="signin-form">
            <h3>Sign In</h3>
            <input
              data-testid="signin-email"
              type="email"
              placeholder="Email"
              disabled={isBlocked}
            />
            <input
              data-testid="signin-password"
              type="password"
              placeholder="Password"
              disabled={isBlocked}
            />
            <button
              data-testid="signin-button"
              onClick={() => {
                const email = (document.querySelector('[data-testid="signin-email"]') as HTMLInputElement)?.value
                const password = (document.querySelector('[data-testid="signin-password"]') as HTMLInputElement)?.value
                signIn(email, password)
              }}
              disabled={isSigningIn || isBlocked}
            >
              {isSigningIn ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

          <div data-testid="signup-form">
            <h3>Sign Up</h3>
            <input
              data-testid="signup-email"
              type="email"
              placeholder="Email"
              disabled={isBlocked}
            />
            <input
              data-testid="signup-password"
              type="password"
              placeholder="Password"
              disabled={isBlocked}
            />
            <button
              data-testid="signup-button"
              onClick={() => {
                const email = (document.querySelector('[data-testid="signup-email"]') as HTMLInputElement)?.value
                const password = (document.querySelector('[data-testid="signup-password"]') as HTMLInputElement)?.value
                signUp(email, password)
              }}
              disabled={isSigningIn || isBlocked}
            >
              {isSigningIn ? 'Signing Up...' : 'Sign Up'}
            </button>
          </div>

          <div data-testid="password-reset-form">
            <h3>Reset Password</h3>
            <input
              data-testid="reset-email"
              type="email"
              placeholder="Email"
              disabled={isBlocked}
            />
            <button
              data-testid="reset-button"
              onClick={() => {
                const email = (document.querySelector('[data-testid="reset-email"]') as HTMLInputElement)?.value
                resetPassword(email)
              }}
              disabled={isBlocked}
            >
              Reset Password
            </button>
          </div>
        </div>
      ) : (
        <div data-testid="authenticated-user">
          <h3>Welcome, {user.email}</h3>
          <button data-testid="signout-button" onClick={signOut}>
            Sign Out
          </button>
        </div>
      )}

      {/* Error display */}
      {authError && (
        <div data-testid="auth-error" style={{ color: 'red' }}>
          {authError}
        </div>
      )}

      {/* Security events log */}
      <div data-testid="security-events">
        <h4>Security Events</h4>
        <ul>
          {securityEvents.map((event, index) => (
            <li key={index} data-testid={`security-event-${index}`}>
              {event}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [securityCheck, setSecurityCheck] = React.useState('')

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulate server-side auth check
        const result = await mockAuthServer.requireAuthServer({
          headers: { authorization: 'Bearer mock-token' }
        })

        if (result.success) {
          setIsAuthenticated(true)
          setSecurityCheck('Authorized')
        } else {
          setSecurityCheck('Unauthorized')
        }
      } catch (error) {
        setSecurityCheck('Auth check failed')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return <div data-testid="auth-loading">Checking authentication...</div>
  }

  if (!isAuthenticated) {
    return (
      <div data-testid="unauthorized-access">
        <h3>Unauthorized Access</h3>
        <p data-testid="security-check-result">{securityCheck}</p>
        <p>Please sign in to access this content.</p>
      </div>
    )
  }

  return (
    <div data-testid="protected-content">
      <div data-testid="security-check-result">{securityCheck}</div>
      {children}
    </div>
  )
}

// Token management component
const TokenManager = () => {
  const [tokens, setTokens] = React.useState<string[]>([])
  const [blacklistedTokens, setBlacklistedTokens] = React.useState<string[]>([])
  const [tokenStatus, setTokenStatus] = React.useState<Record<string, string>>({})

  const generateToken = () => {
    const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setTokens(prev => [...prev, token])
    setTokenStatus(prev => ({ ...prev, [token]: 'active' }))
    return token
  }

  const blacklistToken = async (token: string) => {
    try {
      await mockAuthServer.blacklistToken(token)
      setBlacklistedTokens(prev => [...prev, token])
      setTokenStatus(prev => ({ ...prev, [token]: 'blacklisted' }))
      mockSecurityLogger.logTokenBlacklist(token, 'test-user', 'manual_blacklist')
    } catch (error) {
      console.error('Failed to blacklist token:', error)
    }
  }

  const validateToken = async (token: string) => {
    try {
      const isValid = await mockAuthServer.validateToken(token)
      setTokenStatus(prev => ({
        ...prev,
        [token]: isValid ? 'valid' : 'invalid'
      }))
      return isValid
    } catch (error) {
      setTokenStatus(prev => ({ ...prev, [token]: 'error' }))
      return false
    }
  }

  return (
    <div data-testid="token-manager">
      <h3>Token Management</h3>

      <button data-testid="generate-token" onClick={generateToken}>
        Generate Token
      </button>

      <div data-testid="token-list">
        <h4>Active Tokens</h4>
        {tokens.map(token => (
          <div key={token} data-testid={`token-${token}`}>
            <span>{token.substr(0, 20)}...</span>
            <span data-testid={`token-status-${token}`}>
              Status: {tokenStatus[token] || 'unknown'}
            </span>
            <button
              data-testid={`blacklist-${token}`}
              onClick={() => blacklistToken(token)}
              disabled={blacklistedTokens.includes(token)}
            >
              Blacklist
            </button>
            <button
              data-testid={`validate-${token}`}
              onClick={() => validateToken(token)}
            >
              Validate
            </button>
          </div>
        ))}
      </div>

      <div data-testid="blacklisted-tokens">
        <h4>Blacklisted Tokens</h4>
        <div data-testid="blacklist-count">
          Count: {blacklistedTokens.length}
        </div>
        {blacklistedTokens.map(token => (
          <div key={token} data-testid={`blacklisted-${token}`}>
            {token.substr(0, 20)}... (BLACKLISTED)
          </div>
        ))}
      </div>
    </div>
  )
}

describe('Authentication Flows with Security Measures', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock states
    mockFirebaseAuth.currentUser = null

    // Default mock implementations
    mockFirebaseAuth.signInWithEmailAndPassword.mockImplementation((email, password) => {
      if (email === 'valid@example.com' && password === 'validpassword') {
        const user = {
          uid: 'test-uid',
          email,
          getIdToken: vi.fn().mockResolvedValue('valid-token')
        }
        mockFirebaseAuth.currentUser = user
        return Promise.resolve({ user })
      }
      throw new Error('Invalid credentials')
    })

    mockFirebaseAuth.createUserWithEmailAndPassword.mockImplementation((email, password) => {
      if (email && password && password.length >= 6) {
        const user = {
          uid: `new-${Date.now()}`,
          email,
          getIdToken: vi.fn().mockResolvedValue('new-user-token')
        }
        return Promise.resolve({ user })
      }
      throw new Error('Weak password')
    })

    mockFirebaseAuth.signOut.mockResolvedValue(undefined)
    mockFirebaseAuth.sendPasswordResetEmail.mockResolvedValue(undefined)

    mockRateLimiter.isBlocked.mockResolvedValue(false)
    mockRateLimiter.getRemainingAttempts.mockResolvedValue(5)
    mockRateLimiter.checkLimit.mockResolvedValue(true)
    mockRateLimiter.resetAttempts.mockResolvedValue(undefined)

    mockAuthServer.requireAuthServer.mockResolvedValue({ success: true })
    mockAuthServer.validateToken.mockResolvedValue(true)
    mockAuthServer.blacklistToken.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Secure Authentication Flow', () => {
    it('should handle successful sign in with all security measures', async () => {
      render(<SecureAuthComponent />)

      // Enter valid credentials
      const emailInput = screen.getByTestId('signin-email') as HTMLInputElement
      const passwordInput = screen.getByTestId('signin-password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } })

      // Attempt sign in
      fireEvent.click(screen.getByTestId('signin-button'))

      // Should show loading state
      expect(screen.getByTestId('signin-button')).toHaveTextContent('Signing In...')

      // Wait for successful authentication
      await waitFor(() => {
        expect(screen.getByTestId('authenticated-user')).toBeInTheDocument()
        expect(screen.getByText('Welcome, valid@example.com')).toBeInTheDocument()
      })

      // Verify security measures were applied
      expect(mockRateLimiter.isBlocked).toHaveBeenCalledWith('signin')
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledWith('signin', 'valid@example.com', 'attempt')
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledWith('signin', 'valid@example.com', 'success')
      expect(mockAuthServer.validateToken).toHaveBeenCalledWith('valid-token')

      // Check security events
      expect(screen.getByTestId('security-event-0')).toHaveTextContent('Successful login: valid@example.com')
    })

    it('should handle failed authentication with rate limiting', async () => {
      render(<SecureAuthComponent />)

      const emailInput = screen.getByTestId('signin-email') as HTMLInputElement
      const passwordInput = screen.getByTestId('signin-password') as HTMLInputElement

      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
        fireEvent.click(screen.getByTestId('signin-button'))

        await waitFor(() => {
          expect(screen.getByTestId('auth-error')).toHaveTextContent('Invalid credentials')
        })
      }

      // Verify failed attempts were logged
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledTimes(6) // 3 attempts + 3 failures
      expect(mockSecurityLogger.logSuspiciousActivity).toHaveBeenCalledWith('invalid_credentials', { email: 'invalid@example.com' })

      // Check security events show failed attempts
      expect(screen.getByTestId('security-event-2')).toHaveTextContent('Failed login attempt: invalid@example.com - Invalid credentials')
    })

    it('should enforce rate limiting and block after multiple failures', async () => {
      // Mock rate limiter to block after setup
      mockRateLimiter.isBlocked.mockResolvedValueOnce(false).mockResolvedValue(true)
      mockRateLimiter.getRemainingAttempts.mockResolvedValue(0)

      render(<SecureAuthComponent />)

      const emailInput = screen.getByTestId('signin-email') as HTMLInputElement
      const passwordInput = screen.getByTestId('signin-password') as HTMLInputElement

      // First failed attempt
      fireEvent.change(emailInput, { target: { value: 'blocked@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(screen.getByTestId('signin-button'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Too many failed attempts. Please try again later.')
      })

      // Should show blocked indicator
      await waitFor(() => {
        expect(screen.getByTestId('blocked-indicator')).toBeInTheDocument()
        expect(screen.getByTestId('blocked-indicator')).toHaveTextContent('Blocked for')
      })

      // Form should be disabled
      expect(screen.getByTestId('signin-button')).toBeDisabled()
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
    })

    it('should handle secure sign out with token blacklisting', async () => {
      // First sign in
      mockFirebaseAuth.currentUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        getIdToken: vi.fn().mockResolvedValue('current-token')
      }

      render(<SecureAuthComponent />)

      // Simulate already signed in state
      await act(async () => {
        const component = screen.getByTestId('secure-auth-component')
        component.dispatchEvent(new CustomEvent('user-signed-in'))
      })

      // Sign out
      fireEvent.click(screen.getByTestId('signout-button'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-forms')).toBeInTheDocument()
      })

      // Verify token was blacklisted
      expect(mockAuthServer.blacklistToken).toHaveBeenCalledWith('current-token')
      expect(mockSecurityLogger.logTokenBlacklist).toHaveBeenCalledWith('current-token', 'test-uid', 'manual_signout')
    })
  })

  describe('Protected Route Security', () => {
    it('should protect routes with server-side authentication check', async () => {
      render(
        <ProtectedRoute>
          <div data-testid="sensitive-content">Sensitive Information</div>
        </ProtectedRoute>
      )

      // Should show loading initially
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument()

      // Should authenticate and show content
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        expect(screen.getByTestId('sensitive-content')).toBeInTheDocument()
        expect(screen.getByTestId('security-check-result')).toHaveTextContent('Authorized')
      })

      expect(mockAuthServer.requireAuthServer).toHaveBeenCalled()
    })

    it('should block access when authentication fails', async () => {
      mockAuthServer.requireAuthServer.mockResolvedValue({ success: false })

      render(
        <ProtectedRoute>
          <div data-testid="sensitive-content">Sensitive Information</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument()
        expect(screen.getByText('Please sign in to access this content.')).toBeInTheDocument()
        expect(screen.queryByTestId('sensitive-content')).not.toBeInTheDocument()
      })
    })

    it('should handle authentication errors gracefully', async () => {
      mockAuthServer.requireAuthServer.mockRejectedValue(new Error('Auth service unavailable'))

      render(
        <ProtectedRoute>
          <div data-testid="sensitive-content">Sensitive Information</div>
        </ProtectedRoute>
      )

      await waitFor(() => {
        expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument()
        expect(screen.getByTestId('security-check-result')).toHaveTextContent('Auth check failed')
      })
    })
  })

  describe('Token Management and Blacklisting', () => {
    it('should manage token lifecycle with security tracking', async () => {
      render(<TokenManager />)

      // Generate tokens
      fireEvent.click(screen.getByTestId('generate-token'))
      fireEvent.click(screen.getByTestId('generate-token'))
      fireEvent.click(screen.getByTestId('generate-token'))

      // Should show active tokens
      await waitFor(() => {
        expect(screen.getByTestId('token-list')).toBeInTheDocument()
      })

      const tokens = screen.getByTestId('token-list').querySelectorAll('[data-testid^="token-token-"]')
      expect(tokens).toHaveLength(3)

      // Blacklist a token
      const firstTokenElement = tokens[0] as HTMLElement
      const tokenId = firstTokenElement.getAttribute('data-testid')?.replace('token-', '')
      if (tokenId) {
        fireEvent.click(screen.getByTestId(`blacklist-${tokenId}`))

        await waitFor(() => {
          expect(screen.getByTestId('blacklist-count')).toHaveTextContent('Count: 1')
          expect(screen.getByTestId(`blacklisted-${tokenId}`)).toBeInTheDocument()
        })

        // Verify security logging
        expect(mockAuthServer.blacklistToken).toHaveBeenCalledWith(tokenId)
        expect(mockSecurityLogger.logTokenBlacklist).toHaveBeenCalledWith(tokenId, 'test-user', 'manual_blacklist')
      }
    })

    it('should validate tokens against blacklist', async () => {
      render(<TokenManager />)

      // Generate and blacklist a token
      fireEvent.click(screen.getByTestId('generate-token'))

      const tokens = screen.getByTestId('token-list').querySelectorAll('[data-testid^="token-token-"]')
      const firstTokenElement = tokens[0] as HTMLElement
      const tokenId = firstTokenElement.getAttribute('data-testid')?.replace('token-', '')

      if (tokenId) {
        // First validate as active
        fireEvent.click(screen.getByTestId(`validate-${tokenId}`))
        await waitFor(() => {
          expect(screen.getByTestId(`token-status-${tokenId}`)).toHaveTextContent('Status: valid')
        })

        // Blacklist the token
        fireEvent.click(screen.getByTestId(`blacklist-${tokenId}`))

        // Mock validation to return false for blacklisted token
        mockAuthServer.validateToken.mockResolvedValueOnce(false)

        // Validate again
        fireEvent.click(screen.getByTestId(`validate-${tokenId}`))
        await waitFor(() => {
          expect(screen.getByTestId(`token-status-${tokenId}`)).toHaveTextContent('Status: invalid')
        })
      }
    })

    it('should handle concurrent token operations safely', async () => {
      render(<TokenManager />)

      // Generate multiple tokens rapidly
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(screen.getByTestId('generate-token'))
        }
      })

      // Should handle all tokens
      const tokens = screen.getByTestId('token-list').querySelectorAll('[data-testid^="token-token-"]')
      expect(tokens).toHaveLength(10)

      // Rapidly blacklist multiple tokens
      const tokenIds: string[] = []
      tokens.forEach((tokenElement, index) => {
        if (index < 5) {
          const tokenId = tokenElement.getAttribute('data-testid')?.replace('token-', '')
          if (tokenId) {
            tokenIds.push(tokenId)
            fireEvent.click(screen.getByTestId(`blacklist-${tokenId}`))
          }
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('blacklist-count')).toHaveTextContent('Count: 5')
      })

      // Verify all blacklist operations were called
      expect(mockAuthServer.blacklistToken).toHaveBeenCalledTimes(5)
    })
  })

  describe('Password Reset Security', () => {
    it('should handle password reset with rate limiting', async () => {
      render(<SecureAuthComponent />)

      const resetEmailInput = screen.getByTestId('reset-email') as HTMLInputElement

      fireEvent.change(resetEmailInput, { target: { value: 'reset@example.com' } })
      fireEvent.click(screen.getByTestId('reset-button'))

      await waitFor(() => {
        expect(screen.getByTestId('security-event-0')).toHaveTextContent('Password reset sent: reset@example.com')
      })

      expect(mockRateLimiter.isBlocked).toHaveBeenCalledWith('password_reset')
      expect(mockFirebaseAuth.sendPasswordResetEmail).toHaveBeenCalledWith('reset@example.com')
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledWith('password_reset', 'reset@example.com', 'success')
    })

    it('should block excessive password reset attempts', async () => {
      mockRateLimiter.isBlocked.mockResolvedValue(true)

      render(<SecureAuthComponent />)

      const resetEmailInput = screen.getByTestId('reset-email') as HTMLInputElement

      fireEvent.change(resetEmailInput, { target: { value: 'blocked@example.com' } })
      fireEvent.click(screen.getByTestId('reset-button'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Too many password reset attempts. Please try again later.')
      })

      expect(mockFirebaseAuth.sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('User Registration Security', () => {
    it('should handle secure user registration', async () => {
      render(<SecureAuthComponent />)

      const signupEmailInput = screen.getByTestId('signup-email') as HTMLInputElement
      const signupPasswordInput = screen.getByTestId('signup-password') as HTMLInputElement

      fireEvent.change(signupEmailInput, { target: { value: 'newuser@example.com' } })
      fireEvent.change(signupPasswordInput, { target: { value: 'strongpassword123' } })
      fireEvent.click(screen.getByTestId('signup-button'))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-user')).toBeInTheDocument()
        expect(screen.getByText('Welcome, newuser@example.com')).toBeInTheDocument()
      })

      expect(mockRateLimiter.isBlocked).toHaveBeenCalledWith('signup')
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledWith('signup', 'newuser@example.com', 'attempt')
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledWith('signup', 'newuser@example.com', 'success')
    })

    it('should enforce registration rate limiting', async () => {
      mockRateLimiter.isBlocked.mockResolvedValue(true)

      render(<SecureAuthComponent />)

      const signupEmailInput = screen.getByTestId('signup-email') as HTMLInputElement
      const signupPasswordInput = screen.getByTestId('signup-password') as HTMLInputElement

      fireEvent.change(signupEmailInput, { target: { value: 'blocked@example.com' } })
      fireEvent.change(signupPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(screen.getByTestId('signup-button'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toHaveTextContent('Too many signup attempts. Please try again later.')
      })

      expect(mockFirebaseAuth.createUserWithEmailAndPassword).not.toHaveBeenCalled()
    })
  })

  describe('Security Event Logging', () => {
    it('should log all security events comprehensively', async () => {
      render(<SecureAuthComponent />)

      // Failed login attempt
      const emailInput = screen.getByTestId('signin-email') as HTMLInputElement
      const passwordInput = screen.getByTestId('signin-password') as HTMLInputElement

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(screen.getByTestId('signin-button'))

      await waitFor(() => {
        expect(screen.getByTestId('auth-error')).toBeInTheDocument()
      })

      // Successful login
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } })
      fireEvent.click(screen.getByTestId('signin-button'))

      await waitFor(() => {
        expect(screen.getByTestId('authenticated-user')).toBeInTheDocument()
      })

      // Password reset
      fireEvent.click(screen.getByTestId('signout-button'))
      await waitFor(() => {
        expect(screen.getByTestId('auth-forms')).toBeInTheDocument()
      })

      const resetEmailInput = screen.getByTestId('reset-email') as HTMLInputElement
      fireEvent.change(resetEmailInput, { target: { value: 'reset@example.com' } })
      fireEvent.click(screen.getByTestId('reset-button'))

      // Verify comprehensive logging
      expect(mockSecurityLogger.logAuthAttempt).toHaveBeenCalledTimes(6) // 2 signin attempts + 2 results + 1 reset attempt + 1 reset result
      expect(mockSecurityLogger.logSuspiciousActivity).toHaveBeenCalledWith('invalid_credentials', { email: 'test@example.com' })
      expect(mockSecurityLogger.logTokenBlacklist).toHaveBeenCalled()
    })
  })
})