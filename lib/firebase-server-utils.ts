// This file should only be imported in server-side code (API routes, middleware)
import { verifyFirebaseToken } from './firebase-admin'
import logger from './logger'

export interface ServerAuthResult {
  isValid: boolean
  user?: {
    uid: string
    email?: string
    emailVerified?: boolean
  }
  error?: string
}

export async function validateFirebaseTokenServer(idToken: string): Promise<ServerAuthResult> {
  try {
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

    // Check if Firebase is properly configured
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      logger.warn('Firebase Admin not configured, falling back to demo mode')
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
    
    // If it's a configuration error, fall back to demo mode
    if (error.message.includes('Firebase Admin is not initialized') || 
        error.message.includes('Invalid private key format') ||
        error.message.includes('Failed to parse private key')) {
      logger.warn('Firebase configuration issue, falling back to demo mode')
      return {
        isValid: true,
        user: {
          uid: 'demo-user',
          email: 'demo@musicsheet.pro',
          emailVerified: true
        }
      }
    }
    
    return {
      isValid: false,
      error: error.message || 'Token validation failed'
    }
  }
}

export async function requireAuthServer(request: Request): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const idToken = authHeader.substring(7)
  const validation = await validateFirebaseTokenServer(idToken)
  
  if (!validation.isValid || !validation.user) {
    return null
  }
  
  return validation.user
}

export async function getServerSideUser(): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  // In Next.js 13+ app router, we need to get the session cookie from headers or cookies
  const { cookies } = await import('next/headers')
  
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('firebase-session')
    
    if (!sessionCookie?.value) {
      return null
    }

    const validation = await validateFirebaseTokenServer(sessionCookie.value)
    
    if (!validation.isValid || !validation.user) {
      return null
    }
    
    return validation.user
  } catch (error) {
    logger.warn('Error getting server-side user:', error)
    return null
  }
} 