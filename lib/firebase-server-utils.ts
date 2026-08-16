// Server-side Firebase utilities that work with the API-based architecture
// This file is safe to use in Edge Runtime as it doesn't import Firebase Admin directly

import logger from './logger'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Simple runtime check so we only use firebase-admin on Node.js
function isNodeJsRuntime(): boolean {
  try {
    return typeof process !== 'undefined' && !!process.versions?.node
  } catch {
    return false
  }
}

// Token blacklist for security testing
const tokenBlacklist = new Set<string>()

export function blacklistToken(token: string): void {
  tokenBlacklist.add(token)
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token)
}

export function clearTokenBlacklist(): void {
  tokenBlacklist.clear()
}

export function clearTokenCache(): void {
  tokenCache.clear()
}

// Cache verification results to avoid repeated validation and allow offline use
const tokenCache = new Map<string, { result: ServerAuthResult; exp: number }>()

// Periodically remove expired tokens to avoid unbounded memory usage
const TOKEN_CACHE_CLEANUP_MS = 5 * 60 * 1000
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, { exp }] of tokenCache) {
      if (exp <= now) tokenCache.delete(key)
    }
  }, TOKEN_CACHE_CLEANUP_MS).unref?.()
}

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
 * This replaces the direct Firebase Admin usage to avoid client-side bundling issues
 */
export async function validateFirebaseTokenServer(
  idToken: string,
  requestUrl?: string | URL
): Promise<ServerAuthResult> {
  try {
    if (!idToken) {
      return { isValid: false, error: 'Missing ID token' }
    }

    const now = Date.now()
    const cached = tokenCache.get(idToken)
    if (cached && cached.exp > now) {
      return cached.result
    }

    // B1.1: nas lambdas Node a verificação é chamada de função direta —
    // o hop HTTP abaixo fica exclusivo do middleware Edge até a B1.2.
    // O guard é resolvido em BUILD por compilação: NEXT_RUNTIME vira
    // 'edge' no bundle do middleware (branch eliminado por DCE — o
    // firebase-admin nunca entra no bundle Edge) e 'nodejs' nas lambdas;
    // no client, o alias do next.config resolve @/lib/firebase-admin
    // para módulo vazio (o guard de window impede a execução).
    if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
      try {
        const { verifyFirebaseToken } = await import('@/lib/firebase-admin')
        const decoded = await verifyFirebaseToken(idToken)
        const res: ServerAuthResult = {
          isValid: true,
          user: {
            uid: decoded.uid,
            email: decoded.email,
            emailVerified: decoded.email_verified
          }
        }
        tokenCache.set(idToken, {
          result: res,
          exp: now + 60 * 60 * 1000 // mesmo TTL de 1h do transporte HTTP
        })
        return res
      } catch (err: any) {
        const msg = String(err?.message || '')
        // Mesmas classes observáveis do transporte HTTP: token
        // inválido/expirado → isValid:false; erro de infra (ex.: fetch
        // de certificados do SDK) → fallback para cache vencido.
        if (/expired|invalid|argument|decod/i.test(msg)) {
          return { isValid: false, error: 'Token validation failed' }
        }
        logger.error('Token verification failed (direct):', msg)
        if (cached) {
          return cached.result
        }
        return { isValid: false, error: 'Token validation failed' }
      }
    }

    // Ramo fetch: só o middleware Edge chega aqui (morre na B1.2)
    let baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL

    if (!baseUrl && requestUrl) {
      try {
        baseUrl = new URL(requestUrl.toString()).origin
      } catch {
        baseUrl = undefined
      }
    }

    // Fallback to localhost for development
    if (!baseUrl && typeof window === 'undefined') {
      // Try to detect the port from environment or use default
      const port = process.env.PORT || '3000'
      baseUrl = `http://localhost:${port}`
    }

    if (baseUrl) {
      if (!/^https?:\/\//.test(baseUrl)) {
        baseUrl = `https://${baseUrl}`
      }

      const apiUrl = new URL('/api/auth/verify', baseUrl).toString()

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.user) {
            const res: ServerAuthResult = {
              isValid: true,
              user: {
                uid: result.user.uid,
                email: result.user.email,
                emailVerified: result.user.emailVerified
              }
            }
            tokenCache.set(idToken, {
              result: res,
              exp: now + 60 * 60 * 1000 // cache 1h when using API
            })
            return res
          }
          return { isValid: false, error: result.error || 'Token validation failed' }
        }

        const errorData = await response.json().catch(() => ({}))
        return { isValid: false, error: errorData.error || `HTTP ${response.status}: ${response.statusText}` }
      } catch (err: any) {
        logger.error('Token verification fetch failed:', err.message)
        if (cached) {
          return cached.result
        }
      }
    }

    return { isValid: false, error: 'Token validation failed' }
  } catch (error: any) {
    logger.error('Firebase token validation failed:', error.message)
    return { isValid: false, error: error.message || 'Token validation failed' }
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
  let idToken: string | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    idToken = authHeader.substring(7)
  } else {
    // Fall back to session cookie if no Authorization header
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookie = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('firebase-session='))
      if (cookie) {
        idToken = cookie.trim().substring('firebase-session='.length)
      }
    }
  }

  if (!idToken) {
    return null
  }

  const validation = await validateFirebaseTokenServer(idToken, request.url)

  if (!validation.isValid || !validation.user) {
    return null
  }

  return validation.user
}

export async function getServerSideUser(
  cookieStore: ReadonlyRequestCookies, 
  requestUrl?: string
): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  try {
    const sessionCookie = cookieStore.get('firebase-session')

    if (!sessionCookie?.value) {
      logger.warn('Server-side user: No session cookie found')
      return null
    }

    // Use direct Firebase Admin validation for better reliability
    // Pass the request URL for proper base URL construction
    const validation = await validateFirebaseTokenServer(sessionCookie.value, requestUrl)
    
    if (!validation.isValid || !validation.user) {
      logger.warn('Server-side user validation failed:', validation.error)
      return null
    }
    
    return validation.user
  } catch (error) {
    logger.warn('Error getting server-side user:', error)
    return null
  }
}

/**
 * Get server-side user using direct Firebase Admin validation
 * This is more reliable for middleware and SSR contexts
 */
export async function getServerSideUserDirect(cookieStore: ReadonlyRequestCookies): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  try {
    const sessionCookie = cookieStore.get('firebase-session')

    if (!sessionCookie?.value) {
      return null
    }

    // Use direct Firebase Admin validation
    const validation = await validateFirebaseTokenServer(sessionCookie.value)
    
    if (!validation.isValid || !validation.user) {
      return null
    }
    
    return validation.user
  } catch (error) {
    logger.warn('Error getting server-side user (direct):', error)
    return null
  }
} 