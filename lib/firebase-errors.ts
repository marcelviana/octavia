/**
 * Firebase Authentication Error Mapping Utility
 * 
 * Maps Firebase Auth error codes to user-friendly messages.
 * Designed to be compatible with future i18n implementation.
 */

export interface FirebaseErrorMap {
  [key: string]: {
    message: string;
    translationKey?: string; // For future i18n support
  };
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export const FIREBASE_AUTH_ERRORS: FirebaseErrorMap = {
  // Authentication errors
  'auth/invalid-credential': {
    message: 'Invalid email or password. Please check your credentials and try again.',
    translationKey: 'auth.errors.invalid_credential'
  },
  'auth/user-not-found': {
    message: 'No account found with this email address. Please check your email or sign up.',
    translationKey: 'auth.errors.user_not_found'
  },
  'auth/wrong-password': {
    message: 'Incorrect password. Please try again.',
    translationKey: 'auth.errors.wrong_password'
  },
  'auth/email-already-in-use': {
    message: 'An account with this email already exists. Please sign in or use a different email.',
    translationKey: 'auth.errors.email_already_in_use'
  },
  'auth/weak-password': {
    message: 'Password is too weak. Please choose a stronger password with at least 6 characters.',
    translationKey: 'auth.errors.weak_password'
  },
  'auth/invalid-email': {
    message: 'Please enter a valid email address.',
    translationKey: 'auth.errors.invalid_email'
  },
  'auth/operation-not-allowed': {
    message: 'This sign-in method is not enabled. Please contact support.',
    translationKey: 'auth.errors.operation_not_allowed'
  },
  'auth/too-many-requests': {
    message: 'Too many failed attempts. Please try again later.',
    translationKey: 'auth.errors.too_many_requests'
  },
  'auth/user-disabled': {
    message: 'This account has been disabled. Please contact support.',
    translationKey: 'auth.errors.user_disabled'
  },
  'auth/requires-recent-login': {
    message: 'Please sign in again to complete this action.',
    translationKey: 'auth.errors.requires_recent_login'
  },
  'auth/account-exists-with-different-credential': {
    message: 'An account already exists with the same email but different sign-in credentials.',
    translationKey: 'auth.errors.account_exists_with_different_credential'
  },
  'auth/credential-already-in-use': {
    message: 'This account is already linked to another sign-in method.',
    translationKey: 'auth.errors.credential_already_in_use'
  },
  'auth/invalid-verification-code': {
    message: 'Invalid verification code. Please check your email and try again.',
    translationKey: 'auth.errors.invalid_verification_code'
  },
  'auth/invalid-verification-id': {
    message: 'Invalid verification ID. Please try again.',
    translationKey: 'auth.errors.invalid_verification_id'
  },
  'auth/missing-verification-code': {
    message: 'Verification code is required. Please check your email.',
    translationKey: 'auth.errors.missing_verification_code'
  },
  'auth/missing-verification-id': {
    message: 'Verification ID is missing. Please try again.',
    translationKey: 'auth.errors.missing_verification_id'
  },
  'auth/quota-exceeded': {
    message: 'Service temporarily unavailable. Please try again later.',
    translationKey: 'auth.errors.quota_exceeded'
  },
  'auth/network-request-failed': {
    message: 'Network error. Please check your connection and try again.',
    translationKey: 'auth.errors.network_request_failed'
  },
  'auth/popup-closed-by-user': {
    message: 'Sign-in was cancelled. Please try again.',
    translationKey: 'auth.errors.popup_closed_by_user'
  },
  'auth/popup-blocked': {
    message: 'Sign-in popup was blocked. Please allow popups and try again.',
    translationKey: 'auth.errors.popup_blocked'
  },
  'auth/cancelled-popup-request': {
    message: 'Sign-in was cancelled. Please try again.',
    translationKey: 'auth.errors.cancelled_popup_request'
  },
  'auth/invalid-apple-credential': {
    message: 'Invalid Apple sign-in credentials. Please try again.',
    translationKey: 'auth.errors.invalid_apple_credential'
  },
  'auth/invalid-google-credential': {
    message: 'Invalid Google sign-in credentials. Please try again.',
    translationKey: 'auth.errors.invalid_google_credential'
  },
  'auth/invalid-facebook-credential': {
    message: 'Invalid Facebook sign-in credentials. Please try again.',
    translationKey: 'auth.errors.invalid_facebook_credential'
  },
  'auth/invalid-twitter-credential': {
    message: 'Invalid Twitter sign-in credentials. Please try again.',
    translationKey: 'auth.errors.invalid_twitter_credential'
  },
  'auth/invalid-github-credential': {
    message: 'Invalid GitHub sign-in credentials. Please try again.',
    translationKey: 'auth.errors.invalid_github_credential'
  },
  'auth/invalid-phone-number': {
    message: 'Invalid phone number format. Please check and try again.',
    translationKey: 'auth.errors.invalid_phone_number'
  },
  'auth/missing-phone-number': {
    message: 'Phone number is required.',
    translationKey: 'auth.errors.missing_phone_number'
  },
  'auth/unverified-email': {
    message: 'Please verify your email address before signing in.',
    translationKey: 'auth.errors.unverified_email'
  },
  'auth/email-change-needs-verification': {
    message: 'Please verify your new email address.',
    translationKey: 'auth.errors.email_change_needs_verification'
  },
  'auth/second-factor-required': {
    message: 'Two-factor authentication is required. Please complete the verification.',
    translationKey: 'auth.errors.second_factor_required'
  },
  'auth/multi-factor-auth-required': {
    message: 'Multi-factor authentication is required. Please complete the verification.',
    translationKey: 'auth.errors.multi_factor_auth_required'
  }
};

/**
 * Extracts the Firebase error code from an error object
 */
export function extractFirebaseErrorCode(error: any): string | null {
  if (!error) return null;
  
  // Handle Firebase Auth errors
  if (error.code && typeof error.code === 'string') {
    return error.code;
  }
  
  // Handle error messages that might contain the code
  if (error.message && typeof error.message === 'string') {
    // Look for patterns like "Firebase: Error (auth/invalid-credential)"
    const match = error.message.match(/Firebase:\s*Error\s*\(([^)]+)\)/);
    if (match) {
      return match[1];
    }
    
    // Look for patterns like "auth/invalid-credential"
    const authMatch = error.message.match(/(auth\/[^\s]+)/);
    if (authMatch) {
      return authMatch[1];
    }
  }
  
  return null;
}

/**
 * Maps a Firebase error to a user-friendly message
 */
export function getFirebaseErrorMessage(error: any): string {
  const errorCode = extractFirebaseErrorCode(error);
  
  if (errorCode && FIREBASE_AUTH_ERRORS[errorCode]) {
    return FIREBASE_AUTH_ERRORS[errorCode].message;
  }
  
  // Fallback to generic message
  return 'Something went wrong. Please try again.';
}

/**
 * Gets the translation key for a Firebase error (for future i18n support)
 */
export function getFirebaseErrorTranslationKey(error: any): string | null {
  const errorCode = extractFirebaseErrorCode(error);
  
  if (errorCode && FIREBASE_AUTH_ERRORS[errorCode]) {
    return FIREBASE_AUTH_ERRORS[errorCode].translationKey || null;
  }
  
  return null;
}

/**
 * Checks if an error is a Firebase Auth error
 */
export function isFirebaseAuthError(error: any): boolean {
  const errorCode = extractFirebaseErrorCode(error);
  return errorCode !== null && errorCode.startsWith('auth/');
}

/**
 * Gets a user-friendly error message with fallback handling
 */
export function getErrorMessage(error: any): string {
  // If it's a Firebase Auth error, use our mapping
  if (isFirebaseAuthError(error)) {
    return getFirebaseErrorMessage(error);
  }
  
  // If it's a custom error with a message, use it
  if (error && typeof error.message === 'string') {
    return error.message;
  }
  
  // Fallback to generic message
  return 'Something went wrong. Please try again.';
} 