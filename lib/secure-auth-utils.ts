// SECURITY-HARDENED Firebase Authentication Utilities
// Fixes critical vulnerabilities in token caching and validation

import logger from './logger'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Security Configuration
const SECURITY_CONFIG = {
  // Reduced cache time from 1 hour to 5 minutes for security
  TOKEN_CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  // Cleanup interval
  CACHE_CLEANUP_INTERVAL_MS: 2 * 60 * 1000, // 2 minutes
  // Maximum cache size to prevent memory exhaustion
  MAX_CACHE_SIZE: 1000,
  // Token blacklist duration (longer than cache to prevent replay)
  BLACKLIST_DURATION_MS: 30 * 60 * 1000, // 30 minutes
} as const

// Token blacklist for immediate revocation
const tokenBlacklist = new Map<string, number>() // token -> expiry timestamp
const tokenCache = new Map<string, { result: ServerAuthResult; exp: number; userId: string }>()
const userSessionMap = new Map<string, Set<string>>() // userId -> active tokens

// Enhanced cleanup with blacklist management
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()

    // Clean expired cache entries
    for (const [token, { exp }] of tokenCache) {
      if (exp <= now) {
        const cachedEntry = tokenCache.get(token)
        if (cachedEntry) {
          removeTokenFromUserSession(cachedEntry.userId, token)
        }
        tokenCache.delete(token)
      }
    }

    // Clean expired blacklist entries
    for (const [token, exp] of tokenBlacklist) {
      if (exp <= now) {
        tokenBlacklist.delete(token)
      }
    }

    // Enforce maximum cache size (LRU eviction)
    if (tokenCache.size > SECURITY_CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(tokenCache.entries())
      entries.sort((a, b) => a[1].exp - b[1].exp) // Sort by expiry time

      const toRemove = entries.slice(0, entries.length - SECURITY_CONFIG.MAX_CACHE_SIZE)
      for (const [token] of toRemove) {
        const cachedEntry = tokenCache.get(token)
        if (cachedEntry) {
          removeTokenFromUserSession(cachedEntry.userId, token)
        }
        tokenCache.delete(token)
      }
    }
  }, SECURITY_CONFIG.CACHE_CLEANUP_INTERVAL_MS).unref?.()
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

// Helper function to manage user session tokens
function addTokenToUserSession(userId: string, token: string): void {
  if (!userSessionMap.has(userId)) {
    userSessionMap.set(userId, new Set())
  }
  userSessionMap.get(userId)!.add(token)
}

function removeTokenFromUserSession(userId: string, token: string): void {
  const userTokens = userSessionMap.get(userId)
  if (userTokens) {
    userTokens.delete(token)
    if (userTokens.size === 0) {
      userSessionMap.delete(userId)
    }
  }
}

/**
 * SECURITY: Immediately blacklist a token (for logout, user suspension, etc.)
 */
export function blacklistToken(token: string): void {
  if (!token) return

  const exp = Date.now() + SECURITY_CONFIG.BLACKLIST_DURATION_MS
  tokenBlacklist.set(token, exp)

  // Remove from cache immediately
  const cachedEntry = tokenCache.get(token)
  if (cachedEntry) {
    removeTokenFromUserSession(cachedEntry.userId, token)
    tokenCache.delete(token)
  }

  logger.log(`Token blacklisted: ${token.substring(0, 10)}...`)
}

/**
 * SECURITY: Blacklist all tokens for a specific user (for account suspension)
 */
export function blacklistUserTokens(userId: string): void {
  const userTokens = userSessionMap.get(userId)
  if (userTokens) {
    for (const token of userTokens) {
      blacklistToken(token)
    }
  }
  logger.log(`All tokens blacklisted for user: ${userId}`)
}

/**
 * SECURITY: Check if token is blacklisted
 */
function isTokenBlacklisted(token: string): boolean {
  const exp = tokenBlacklist.get(token)
  if (!exp) return false

  if (Date.now() > exp) {
    tokenBlacklist.delete(token)
    return false
  }

  return true
}

/**
 * SECURITY-HARDENED: Validate Firebase token with enhanced security checks
 */
export async function validateFirebaseTokenSecure(
  idToken: string,
  requestUrl?: string | URL
): Promise<ServerAuthResult> {
  try {
    if (!idToken || typeof idToken !== 'string') {
      return { isValid: false, error: 'Missing or invalid ID token format' }
    }

    // SECURITY: Check token blacklist first
    if (isTokenBlacklisted(idToken)) {
      logger.warn('Attempted use of blacklisted token')
      return { isValid: false, error: 'Token has been revoked' }
    }

    // Check cache with security considerations
    const cached = tokenCache.get(idToken)
    const now = Date.now()

    if (cached && cached.exp > now) {
      logger.log('Token validation from cache (secure)')
      return cached.result
    }

    // Remove expired cached entry
    if (cached && cached.exp <= now) {
      removeTokenFromUserSession(cached.userId, idToken)
      tokenCache.delete(idToken)
    }

    // Validate via API with enhanced error handling
    let result: ServerAuthResult

    if (typeof window === 'undefined' && requestUrl) {
      // Server-side: Use internal API
      try {
        const baseUrl = typeof requestUrl === 'string' ? new URL(requestUrl).origin : requestUrl.origin
        const verifyUrl = `${baseUrl}/api/auth/verify`

        const response = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OctaviaServer/1.0'
          },
          body: JSON.stringify({ token: idToken })
        })

        if (!response.ok) {
          logger.error(`Token verification failed: ${response.status}`)
          return { isValid: false, error: 'Token verification failed' }
        }

        const data = await response.json()

        if (data.error) {
          logger.warn(`Token validation error: ${data.error}`)
          return { isValid: false, error: data.error }
        }

        result = {
          isValid: true,
          user: {
            uid: data.user.uid,
            email: data.user.email,
            emailVerified: data.user.emailVerified
          }
        }

        // SECURITY: Track user session
        addTokenToUserSession(data.user.uid, idToken)

        logger.log(`Token validated successfully for user: ${data.user.uid}`)

      } catch (error) {
        logger.error('Token verification API call failed:', error)
        return { isValid: false, error: 'Token verification service unavailable' }
      }
    } else {
      // Client-side or fallback
      logger.warn('Client-side token validation attempted - security risk')
      return { isValid: false, error: 'Client-side validation not allowed' }
    }

    // Cache with security considerations
    if (result.isValid && result.user) {
      tokenCache.set(idToken, {
        result,
        exp: now + SECURITY_CONFIG.TOKEN_CACHE_DURATION_MS,
        userId: result.user.uid
      })
    }

    return result

  } catch (error) {
    logger.error('Token validation error:', error)
    return { isValid: false, error: 'Token validation failed' }
  }
}

/**
 * SECURITY-HARDENED: Require authentication with enhanced security
 */
export async function requireAuthServerSecure(request: Request): Promise<{
  uid: string
  email?: string
  emailVerified?: boolean
} | null> {
  try {
    // Extract token with security validation
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')

    let token: string | null = null

    // Extract from Authorization header
    if (authHeader) {
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
      if (bearerMatch) {
        token = bearerMatch[1]
      } else {
        logger.warn('Invalid Authorization header format')
        return null
      }
    }
    // Extract from session cookie
    else if (cookieHeader) {
      const sessionMatch = cookieHeader.match(/firebase-session=([^;]+)/)
      if (sessionMatch) {
        token = decodeURIComponent(sessionMatch[1])
      }
    }

    if (!token) {
      logger.log('No authentication token found')
      return null
    }

    // Validate token with security enhancements
    const validation = await validateFirebaseTokenSecure(token, request.url)

    if (!validation.isValid || !validation.user) {
      logger.warn('Token validation failed during auth requirement')

      // SECURITY: Automatically blacklist suspicious tokens
      if (validation.error?.includes('revoked') || validation.error?.includes('expired')) {
        blacklistToken(token)
      }

      return null
    }

    // SECURITY: Additional email verification check
    if (!validation.user.emailVerified) {
      logger.warn(`Unverified user attempted access: ${validation.user.uid}`)
      return null
    }

    logger.log(`Authentication successful for user: ${validation.user.uid}`)
    return validation.user

  } catch (error) {
    logger.error('Authentication requirement failed:', error)
    return null
  }
}

/**
 * SECURITY: Enhanced authentication middleware for API routes
 */
export function withSecureAuth<T extends any[]>(
  handler: (request: Request, user: NonNullable<Awaited<ReturnType<typeof requireAuthServerSecure>>>, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuthServerSecure(request)

      if (!user) {
        return new Response(
          JSON.stringify({
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer'
            }
          }
        )
      }

      // SECURITY: Rate limiting check (if user makes too many requests)
      // This could be enhanced with Redis-based rate limiting

      return await handler(request, user, ...args)

    } catch (error) {
      logger.error('Secure auth middleware error:', error)
      return new Response(
        JSON.stringify({
          error: 'Authentication error',
          code: 'AUTH_ERROR'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * SECURITY: Get cache statistics for monitoring
 */
export function getAuthCacheStats() {
  return {
    cacheSize: tokenCache.size,
    blacklistSize: tokenBlacklist.size,
    activeUsers: userSessionMap.size,
    totalActiveSessions: Array.from(userSessionMap.values()).reduce((total, tokens) => total + tokens.size, 0)
  }
}

/**
 * SECURITY: Clear all caches (for emergency situations)
 */
export function clearAllAuthCaches(): void {
  tokenCache.clear()
  tokenBlacklist.clear()
  userSessionMap.clear()
  logger.warn('All authentication caches cleared - emergency action')
}

export function clearExpiredTokens(): void {
  const now = Date.now()

  // Clear expired blacklisted tokens
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (now > expiry) {
      tokenBlacklist.delete(token)
    }
  }

  // Clear expired cached tokens
  for (const [token, entry] of tokenCache.entries()) {
    if (now > entry.expires) {
      tokenCache.delete(token)
    }
  }
}

export { isTokenBlacklisted }

export function getUserSessions(userId: string): string[] {
  return userSessionMap.get(userId) || []
}

export function invalidateUserSessions(userId: string): void {
  const sessions = userSessionMap.get(userId) || []
  sessions.forEach(token => blacklistToken(token))
  userSessionMap.delete(userId)
}

// Export legacy functions for backward compatibility
export const validateFirebaseTokenServer = validateFirebaseTokenSecure
export const requireAuthServer = requireAuthServerSecure