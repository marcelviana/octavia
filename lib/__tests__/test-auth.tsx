import React from 'react'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser, User } from 'firebase/auth'
import { createTestUser } from './test-database'
import { vi } from 'vitest'

/**
 * Test authentication utilities for integration testing
 * Provides real Firebase auth for testing while maintaining isolation
 */

interface TestAuthUser {
  user: User
  cleanup: () => Promise<void>
}

/**
 * Creates a real test user in Firebase Auth
 * Returns user object and cleanup function
 */
export async function createTestAuthUser(
  email?: string, 
  password: string = 'testpassword123'
): Promise<TestAuthUser> {
  const testUser = createTestUser({ email })
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, testUser.email, password)
    
    const cleanup = async () => {
      try {
        await deleteUser(userCredential.user)
      } catch (error) {
        console.warn('Failed to cleanup test user:', error)
      }
    }
    
    return {
      user: userCredential.user,
      cleanup
    }
  } catch (error) {
    throw new Error(`Failed to create test user: ${error}`)
  }
}

/**
 * Signs in a test user and returns auth state
 * Use this for tests that need authenticated state
 */
export async function signInTestUser(email: string, password: string = 'testpassword123'): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw new Error(`Failed to sign in test user: ${error}`)
  }
}

/**
 * Signs out the current test user
 * Ensures clean state between tests
 */
export async function signOutTestUser(): Promise<void> {
  try {
    await signOut(auth)
  } catch (error) {
    console.warn('Failed to sign out test user:', error)
  }
}

/**
 * Creates a complete test auth context with real Firebase user
 * Returns both the user and mock auth context for components
 */
export async function setupTestAuth() {
  const { user, cleanup } = await createTestAuthUser()
  
  // Create realistic auth context that matches your app structure
  const mockAuthContext = {
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Test User',
      emailVerified: user.emailVerified
    },
    loading: false,
    isLoading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null, data: { user } }),
    signOut: vi.fn().mockImplementation(signOutTestUser),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
    profile: {
      user_id: user.uid,
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      primary_instrument: 'guitar'
    },
    idToken: 'mock-id-token',
    isConfigured: true,
    isInitialized: true,
    refreshToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    updateProfile: vi.fn(),
    resendVerificationEmail: vi.fn(),
  }
  
  return {
    user,
    authContext: mockAuthContext,
    cleanup
  }
}

/**
 * Mock auth provider that uses real user data but controlled behavior
 * This gives you real user objects while controlling auth flow
 */
export function createMockAuthProvider(authContext: any) {
  return {
    useAuth: () => authContext,
    useFirebaseAuth: () => authContext,
    FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="auth-provider">{children}</div>
    )
  }
}

/**
 * Sets up auth mocking that preserves real user data
 * Use this in beforeEach to get realistic but controlled auth state
 */
export async function setupIntegrationAuth() {
  const { user, authContext, cleanup } = await setupTestAuth()
  
  // Mock only the auth context, not the underlying Firebase auth
  const authMocks = createMockAuthProvider(authContext)
  
  return {
    user,
    authContext,
    authMocks,
    cleanup
  }
}

/**
 * Creates test auth context for unauthenticated state
 * Useful for testing login flows and protected routes
 */
export function createUnauthenticatedAuthContext() {
  return {
    user: null,
    loading: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    profile: null,
    idToken: null,
    isConfigured: true,
    isInitialized: true,
    refreshToken: vi.fn(),
    signInWithGoogle: vi.fn(),
    updateProfile: vi.fn(),
    resendVerificationEmail: vi.fn(),
  }
}

/**
 * Test wrapper that provides auth context to components
 * Use this to wrap components that need authentication
 */
export function TestAuthProvider({ 
  children, 
  authContext 
}: { 
  children: React.ReactNode
  authContext?: any 
}) {
  const defaultContext = createUnauthenticatedAuthContext()
  const contextValue = authContext || defaultContext
  
  return (
    <div data-testid="test-auth-provider" data-auth-user={contextValue.user?.uid || 'unauthenticated'}>
      {children}
    </div>
  )
}

/**
 * Utility to wait for auth state changes in tests
 * Useful when testing async auth operations
 */
export function waitForAuthState(expectedState: 'authenticated' | 'unauthenticated', timeout = 5000) {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (expectedState === 'authenticated' && user) {
        unsubscribe()
        resolve(user)
      } else if (expectedState === 'unauthenticated' && !user) {
        unsubscribe()
        resolve(null)
      }
    })
    
    setTimeout(() => {
      unsubscribe()
      reject(new Error(`Auth state did not change to ${expectedState} within ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Cleans up all test auth state
 * Call this in afterEach or afterAll hooks
 */
export async function cleanupTestAuth() {
  try {
    await signOutTestUser()
  } catch (error) {
    console.warn('Failed to cleanup test auth:', error)
  }
} 