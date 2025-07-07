# Firebase Error Mapping Utility

This document explains how the Firebase error mapping utility works and how to use it to display user-friendly authentication error messages.

## Overview

The Firebase error mapping utility (`lib/firebase-errors.ts`) provides a centralized way to map Firebase Authentication error codes to user-friendly messages. This improves the user experience by displaying clear, actionable error messages instead of raw Firebase error codes like `auth/invalid-credential`.

## Features

- **Comprehensive Error Mapping**: Maps all common Firebase Auth error codes to user-friendly messages
- **Fallback Handling**: Provides generic fallback messages for unknown errors
- **i18n Ready**: Includes translation keys for future internationalization
- **Flexible Error Detection**: Handles various error formats (error objects, error messages, etc.)
- **Type Safety**: Full TypeScript support with proper interfaces

## Usage

### Basic Usage

```typescript
import { getErrorMessage } from '@/lib/firebase-errors'

// In your error handling code
try {
  await signInWithEmailAndPassword(auth, email, password)
} catch (error) {
  const userFriendlyMessage = getErrorMessage(error)
  setError(userFriendlyMessage)
}
```

### Available Functions

#### `getErrorMessage(error: any): string`
The main function to use for getting user-friendly error messages. It automatically detects Firebase Auth errors and maps them to friendly messages.

```typescript
// Firebase Auth error
const error = { code: 'auth/invalid-credential' }
getErrorMessage(error) // Returns: "Invalid email or password. Please check your credentials and try again."

// Custom error
const error = { message: 'Custom error message' }
getErrorMessage(error) // Returns: "Custom error message"

// Unknown error
const error = {}
getErrorMessage(error) // Returns: "Something went wrong. Please try again."
```

#### `getFirebaseErrorMessage(error: any): string`
Specifically for Firebase Auth errors. Returns the mapped message or a fallback.

#### `isFirebaseAuthError(error: any): boolean`
Checks if an error is a Firebase Auth error.

#### `extractFirebaseErrorCode(error: any): string | null`
Extracts the Firebase error code from various error formats.

#### `getFirebaseErrorTranslationKey(error: any): string | null`
Gets the translation key for a Firebase error (for future i18n support).

## Error Code Mapping

The utility maps the following Firebase Auth error codes:

| Error Code | User-Friendly Message |
|------------|----------------------|
| `auth/invalid-credential` | Invalid email or password. Please check your credentials and try again. |
| `auth/user-not-found` | No account found with this email address. Please check your email or sign up. |
| `auth/wrong-password` | Incorrect password. Please try again. |
| `auth/email-already-in-use` | An account with this email already exists. Please sign in or use a different email. |
| `auth/weak-password` | Password is too weak. Please choose a stronger password with at least 6 characters. |
| `auth/invalid-email` | Please enter a valid email address. |
| `auth/operation-not-allowed` | This sign-in method is not enabled. Please contact support. |
| `auth/too-many-requests` | Too many failed attempts. Please try again later. |
| `auth/user-disabled` | This account has been disabled. Please contact support. |
| `auth/requires-recent-login` | Please sign in again to complete this action. |
| `auth/network-request-failed` | Network error. Please check your connection and try again. |
| `auth/popup-closed-by-user` | Sign-in was cancelled. Please try again. |
| `auth/popup-blocked` | Sign-in popup was blocked. Please allow popups and try again. |
| `auth/unverified-email` | Please verify your email address before signing in. |

And many more...

## Integration with Authentication Context

The Firebase Auth context (`contexts/firebase-auth-context.tsx`) has been updated to use this utility automatically. All authentication functions (`signIn`, `signUp`, `signInWithGoogle`, `resendVerificationEmail`) now return user-friendly error messages.

### Before (Raw Firebase Errors)
```typescript
// User would see: "Firebase: Error (auth/invalid-credential)"
```

### After (User-Friendly Messages)
```typescript
// User sees: "Invalid email or password. Please check your credentials and try again."
```

## Testing

The utility includes comprehensive tests in `lib/__tests__/firebase-errors.test.ts` that verify:

- Error code extraction from various formats
- User-friendly message mapping
- Fallback handling
- Firebase Auth error detection
- Translation key generation

Run the tests with:
```bash
npm test -- lib/__tests__/firebase-errors.test.ts
```

## Future i18n Support

The utility is designed to support internationalization in the future. Each error mapping includes a `translationKey` that can be used with translation libraries:

```typescript
const error = { code: 'auth/invalid-credential' }
const translationKey = getFirebaseErrorTranslationKey(error)
// Returns: 'auth.errors.invalid_credential'
```

## Security Considerations

- **No Raw Error Exposure**: The utility ensures that raw Firebase error codes are never exposed to users
- **Generic Fallbacks**: Unknown errors return generic messages to avoid information leakage
- **Consistent Messaging**: All authentication errors follow the same user-friendly format

## Adding New Error Codes

To add support for new Firebase Auth error codes, simply add them to the `FIREBASE_AUTH_ERRORS` object in `lib/firebase-errors.ts`:

```typescript
'auth/new-error-code': {
  message: 'User-friendly message for the new error.',
  translationKey: 'auth.errors.new_error_code'
}
```

## Best Practices

1. **Always use `getErrorMessage()`** for user-facing error messages
2. **Log raw errors** for debugging purposes
3. **Test error scenarios** to ensure proper message display
4. **Keep messages actionable** - tell users what they can do to resolve the issue
5. **Use consistent language** across all error messages

## Example Implementation

```typescript
import { getErrorMessage } from '@/lib/firebase-errors'
import { toast } from '@/hooks/use-toast'

const handleSignIn = async (email: string, password: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    toast.success('Successfully signed in!')
  } catch (error) {
    // Log the raw error for debugging
    console.error('Sign in error:', error)
    
    // Show user-friendly message
    const userMessage = getErrorMessage(error)
    toast.error(userMessage)
  }
}
```

This approach ensures that users see helpful, actionable error messages while developers can still access the raw error information for debugging purposes. 