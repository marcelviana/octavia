import { describe, it, expect } from 'vitest'
import {
  extractFirebaseErrorCode,
  getFirebaseErrorMessage,
  getErrorMessage,
  isFirebaseAuthError,
  FIREBASE_AUTH_ERRORS
} from '../firebase-errors'

describe('Firebase Error Mapping Utility', () => {
  describe('extractFirebaseErrorCode', () => {
    it('should extract error code from Firebase error object', () => {
      const error = { code: 'auth/invalid-credential' }
      expect(extractFirebaseErrorCode(error)).toBe('auth/invalid-credential')
    })

    it('should extract error code from Firebase error message', () => {
      const error = { message: 'Firebase: Error (auth/user-not-found)' }
      expect(extractFirebaseErrorCode(error)).toBe('auth/user-not-found')
    })

    it('should extract error code from plain auth error message', () => {
      const error = { message: 'auth/email-already-in-use' }
      expect(extractFirebaseErrorCode(error)).toBe('auth/email-already-in-use')
    })

    it('should return null for non-Firebase errors', () => {
      const error = { message: 'Some other error' }
      expect(extractFirebaseErrorCode(error)).toBeNull()
    })

    it('should return null for null/undefined error', () => {
      expect(extractFirebaseErrorCode(null)).toBeNull()
      expect(extractFirebaseErrorCode(undefined)).toBeNull()
    })
  })

  describe('getFirebaseErrorMessage', () => {
    it('should return user-friendly message for known error codes', () => {
      const error = { code: 'auth/invalid-credential' }
      const message = getFirebaseErrorMessage(error)
      expect(message).toBe('Invalid email or password. Please check your credentials and try again.')
    })

    it('should return fallback message for unknown error codes', () => {
      const error = { code: 'auth/unknown-error' }
      const message = getFirebaseErrorMessage(error)
      expect(message).toBe('Something went wrong. Please try again.')
    })

    it('should handle errors with message containing error code', () => {
      const error = { message: 'Firebase: Error (auth/weak-password)' }
      const message = getFirebaseErrorMessage(error)
      expect(message).toBe('Password is too weak. Please choose a stronger password with at least 6 characters.')
    })
  })

  describe('isFirebaseAuthError', () => {
    it('should return true for Firebase auth errors', () => {
      const error = { code: 'auth/invalid-credential' }
      expect(isFirebaseAuthError(error)).toBe(true)
    })

    it('should return true for Firebase auth errors in message', () => {
      const error = { message: 'Firebase: Error (auth/user-not-found)' }
      expect(isFirebaseAuthError(error)).toBe(true)
    })

    it('should return false for non-Firebase errors', () => {
      const error = { message: 'Some other error' }
      expect(isFirebaseAuthError(error)).toBe(false)
    })

    it('should return false for null/undefined error', () => {
      expect(isFirebaseAuthError(null)).toBe(false)
      expect(isFirebaseAuthError(undefined)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('should return Firebase error message for auth errors', () => {
      const error = { code: 'auth/invalid-email' }
      const message = getErrorMessage(error)
      expect(message).toBe('Please enter a valid email address.')
    })

    it('should return custom error message for non-Firebase errors', () => {
      const error = { message: 'Custom error message' }
      const message = getErrorMessage(error)
      expect(message).toBe('Custom error message')
    })

    it('should return fallback message for errors without message', () => {
      const error = {}
      const message = getErrorMessage(error)
      expect(message).toBe('Something went wrong. Please try again.')
    })

    it('should return fallback message for null/undefined error', () => {
      expect(getErrorMessage(null)).toBe('Something went wrong. Please try again.')
      expect(getErrorMessage(undefined)).toBe('Something went wrong. Please try again.')
    })
  })

  describe('FIREBASE_AUTH_ERRORS', () => {
    it('should contain common Firebase auth error codes', () => {
      expect(FIREBASE_AUTH_ERRORS['auth/invalid-credential']).toBeDefined()
      expect(FIREBASE_AUTH_ERRORS['auth/user-not-found']).toBeDefined()
      expect(FIREBASE_AUTH_ERRORS['auth/email-already-in-use']).toBeDefined()
      expect(FIREBASE_AUTH_ERRORS['auth/weak-password']).toBeDefined()
      expect(FIREBASE_AUTH_ERRORS['auth/invalid-email']).toBeDefined()
    })

    it('should have user-friendly messages', () => {
      const error = FIREBASE_AUTH_ERRORS['auth/invalid-credential']
      expect(error.message).toContain('Invalid email or password')
      expect(error.message).not.toContain('auth/invalid-credential')
    })

    it('should have translation keys for future i18n', () => {
      const error = FIREBASE_AUTH_ERRORS['auth/invalid-credential']
      expect(error.translationKey).toBe('auth.errors.invalid_credential')
    })
  })
}) 