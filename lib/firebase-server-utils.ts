// Server-side Firebase utilities that work with the API-based architecture
// This file is safe to use in Edge Runtime as it doesn't import Firebase Admin directly

import logger from './logger'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export interface ServerAuthResult {
  isValid: boolean
  user?: {
    uid: string
    email?: string
    emailVerified?: boolean
  }
  error?: string
}

/**
 * Validate Firebase token via API route (safe for Edge Runtime)
 * This replaces the direct Firebase Admin usage
 */
export async function validateFirebaseTokenServer(
  idToken: string,
  requestUrl?: string | URL
): Promise<ServerAuthResult> {
  try {
    if (!idToken) {
      return {
        isValid: false,
        error: 'Missing ID token'
      }
    }


    // Construct the verification URL. Prefer environment variables but fall
    // back to the current request origin when available.
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL

    if (!baseUrl && requestUrl) {
      baseUrl = new URL(requestUrl.toString()).origin
    }

    if (!baseUrl) {
      baseUrl = 'http://localhost:3000'
      logger.warn(
        'Falling back to localhost for token verification; set NEXTAUTH_URL or VERCEL_URL'
      )
    }

    if (!/^https?:\/\//.test(baseUrl)) {
      baseUrl = `https://${baseUrl}`
    }

    const apiUrl = new URL('/api/auth/verify', baseUrl).toString()

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: idToken }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        isValid: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const result = await response.json()
    
    if (result.success && result.user) {
      return {
        isValid: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          emailVerified: result.user.emailVerified
        }
      }
    } else {
      return {
        isValid: false,
        error: result.error || 'Token validation failed'
      }
    }
  } catch (error: any) {
    logger.error('Firebase token validation failed:', error.message)
    
    return {
      isValid: false,
      error: error.message || 'Token validation failed'
    }
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use validateFirebaseTokenServer instead
 */
export const validateFirebaseTokenServerLegacy = validateFirebaseTokenServer

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
  const validation = await validateFirebaseTokenServer(idToken, request.url)
  
  if (!validation.isValid || !validation.user) {
    return null
  }
  
  return validation.user
}

export async function getServerSideUser(cookieStore: ReadonlyRequestCookies): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  try {
    const sessionCookie = cookieStore.get('firebase-session')

    if (!sessionCookie?.value) {
      return null
    }

    // Attempt to determine the request origin when environment variables are
    // not configured. This helps in production deployments where NEXTAUTH_URL
    // or VERCEL_URL might be missing (e.g. custom domains).
    let origin: string | undefined = process.env.NEXTAUTH_URL || process.env.VERCEL_URL

    if (!origin) {
      try {
        const hdrs = (await import('next/headers')).headers
        const host = (await hdrs()).get('host')
        if (host) {
          const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
          origin = `${protocol}://${host}`
        }
      } catch {
        // ignore, we'll fall back to localhost below
      }
    }

    const validation = await validateFirebaseTokenServer(sessionCookie.value, origin)
    
    if (!validation.isValid || !validation.user) {
      return null
    }
    
    return validation.user
  } catch (error) {
    logger.warn('Error getting server-side user:', error)
    return null
  }
} 