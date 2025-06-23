import { NextRequest } from 'next/server'
import { verifyFirebaseToken } from './firebase-admin'
import logger from './logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string
    email?: string
    emailVerified?: boolean
  }
}

export async function validateFirebaseToken(request: NextRequest): Promise<{
  isValid: boolean
  user?: {
    uid: string
    email?: string
    emailVerified?: boolean
  }
  error?: string
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Missing or invalid authorization header'
      }
    }

    const idToken = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!idToken) {
      return {
        isValid: false,
        error: 'Missing ID token'
      }
    }

    // Handle demo mode
    if (idToken === 'demo-token') {
      return {
        isValid: true,
        user: {
          uid: 'demo-user',
          email: 'demo@musicsheet.pro',
          emailVerified: true
        }
      }
    }

    const decodedToken = await verifyFirebaseToken(idToken)
    
    return {
      isValid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      }
    }
  } catch (error: any) {
    logger.warn('Firebase token validation failed:', error.message)
    return {
      isValid: false,
      error: error.message || 'Token validation failed'
    }
  }
}

export async function requireAuth(request: NextRequest): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  const validation = await validateFirebaseToken(request)
  
  if (!validation.isValid || !validation.user) {
    return null
  }
  
  return validation.user
}

// Extract token from request for use in API routes
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7) // Remove 'Bearer ' prefix
} 