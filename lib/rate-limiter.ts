/**
 * Rate Limiting System
 * 
 * Comprehensive rate limiting for API endpoints to prevent abuse,
 * DDoS attacks, and ensure fair usage during live performances.
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
  onLimitReached?: (req: NextRequest, key: string) => void // Custom callback
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequestTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Cleanup every minute

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // General API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.'
  },
  
  // File upload endpoints - very strict
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    message: 'Upload limit exceeded. Please wait before uploading more files.'
  },
  
  // Content creation endpoints
  CONTENT_CREATE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 content items per hour
    message: 'Content creation limit exceeded. Please wait before creating more content.'
  },
  
  // Content read endpoints - more permissive for performance mode
  CONTENT_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute (for live performance)
    message: 'Too many content requests. Please wait a moment.'
  },
  
  // Performance mode endpoints - most permissive for live use
  PERFORMANCE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute (song navigation, etc.)
    message: 'Performance mode request limit exceeded.'
  }
} as const

/**
 * Default key generator - uses IP address and user ID if available
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Try to extract user ID from Authorization header
  const authHeader = req.headers.get('authorization')
  let userId = 'anonymous'
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real implementation, you might decode the JWT to get user ID
    // For now, we'll use a hash of the token
    const token = authHeader.substring(7)
    userId = `user_${token.substring(0, 8)}`
  }

  return `${ip}:${userId}:${req.nextUrl.pathname}`
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = req.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to request IP (might be proxy)
  return req.ip || '127.0.0.1'
}

/**
 * Rate limiter implementation
 */
export function createRateLimiter(config: RateLimitConfig) {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator

  return async (req: NextRequest): Promise<{
    success: boolean
    remaining: number
    resetTime: number
    totalHits: number
  }> => {
    const key = keyGenerator(req)
    const now = Date.now()
    
    let entry = rateLimitStore.get(key)
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequestTime: now
      }
      rateLimitStore.set(key, entry)
    }

    // Increment count
    entry.count++

    // Check if limit exceeded
    const success = entry.count <= config.maxRequests

    // Trigger callback if limit reached
    if (!success && config.onLimitReached) {
      config.onLimitReached(req, key)
    }

    return {
      success,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      totalHits: entry.count
    }
  }
}

/**
 * Rate limiting middleware wrapper for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  const rateLimiter = createRateLimiter(config)

  return function rateLimitMiddleware<T extends Function>(handler: T): T {
    const wrappedHandler = async (req: NextRequest, ...args: any[]) => {
      // Apply rate limiting
      const result = await rateLimiter(req)

      if (!result.success) {
        // Create rate limit exceeded response
        const response = NextResponse.json(
          {
            error: config.message || 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { status: 429 }
        )

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
        response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString())

        return response
      }

      // Call original handler
      const response = await handler(req, ...args)

      // Add rate limit headers to successful responses
      if (response instanceof NextResponse || response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
      }

      return response
    }

    return wrappedHandler as T
  }
}

/**
 * Enhanced rate limiter with burst protection
 */
export function createBurstProtectedRateLimiter(config: RateLimitConfig & {
  burstLimit: number // Maximum requests in short burst
  burstWindowMs: number // Burst window duration
}) {
  const normalLimiter = createRateLimiter(config)
  const burstLimiter = createRateLimiter({
    windowMs: config.burstWindowMs,
    maxRequests: config.burstLimit,
    keyGenerator: config.keyGenerator
  })

  return async (req: NextRequest) => {
    // Check burst limit first
    const burstResult = await burstLimiter(req)
    if (!burstResult.success) {
      return {
        success: false,
        remaining: burstResult.remaining,
        resetTime: burstResult.resetTime,
        totalHits: burstResult.totalHits,
        limitType: 'burst' as const
      }
    }

    // Check normal limit
    const normalResult = await normalLimiter(req)
    return {
      ...normalResult,
      limitType: 'normal' as const
    }
  }
}

/**
 * Adaptive rate limiter that adjusts based on system load
 */
export function createAdaptiveRateLimiter(baseConfig: RateLimitConfig) {
  return async (req: NextRequest) => {
    // Get system metrics (simplified - in production, use proper monitoring)
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    // Adjust rate limits based on system load
    let adjustedConfig = { ...baseConfig }
    
    if (memoryUsagePercent > 80) {
      // Severely reduce limits when memory is critically high
      adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.3)
    } else if (memoryUsagePercent > 60) {
      // Reduce limits when memory is high
      adjustedConfig.maxRequests = Math.floor(baseConfig.maxRequests * 0.6)
    }

    const limiter = createRateLimiter(adjustedConfig)
    return limiter(req)
  }
}

/**
 * Whitelist middleware to bypass rate limiting for trusted IPs/users
 */
export function createWhitelistedRateLimiter(
  config: RateLimitConfig,
  whitelist: {
    ips?: string[]
    userIds?: string[]
    bypass?: (req: NextRequest) => boolean
  }
) {
  const rateLimiter = createRateLimiter(config)

  return async (req: NextRequest) => {
    // Check whitelist conditions
    const clientIP = getClientIP(req)
    
    if (whitelist.ips?.includes(clientIP)) {
      return { success: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs, totalHits: 0 }
    }

    if (whitelist.bypass?.(req)) {
      return { success: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs, totalHits: 0 }
    }

    // Apply normal rate limiting
    return rateLimiter(req)
  }
}

/**
 * Rate limiter specifically designed for live performance scenarios
 */
export const createPerformanceRateLimiter = () => {
  return createBurstProtectedRateLimiter({
    ...RATE_LIMIT_CONFIGS.PERFORMANCE,
    burstLimit: 20, // Allow 20 rapid requests for song changes
    burstWindowMs: 10 * 1000, // 10 second burst window
    onLimitReached: (req, key) => {
      console.warn(`Performance rate limit reached for ${key} at ${req.nextUrl.pathname}`)
    }
  })
}

/**
 * Security-focused rate limiter for sensitive endpoints
 */
export const createSecurityRateLimiter = () => {
  return createAdaptiveRateLimiter({
    ...RATE_LIMIT_CONFIGS.AUTH,
    onLimitReached: (req, key) => {
      const clientIP = getClientIP(req)
      console.error(`SECURITY: Rate limit exceeded for ${key} from IP ${clientIP} at ${req.nextUrl.pathname}`)

      // In production, you might want to:
      // - Log to security system
      // - Trigger IP blocking
      // - Send alerts
    }
  })
}

/**
 * Simple rate limit checker for testing
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API
) {
  const limiter = createRateLimiter(config)
  return limiter(req)
}