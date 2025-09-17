/**
 * ENHANCED Security Headers Configuration
 *
 * Production-ready security headers with enhanced protection
 * against XSS, CSRF, clickjacking, and other attacks.
 */

import { NextRequest, NextResponse } from 'next/server'

export interface EnhancedSecurityConfig {
  contentSecurityPolicy: {
    directives: Record<string, string[]>
    reportUri?: string
    reportOnly?: boolean
  }
  hsts: {
    maxAge: number
    includeSubDomains: boolean
    preload: boolean
  }
  frameOptions: 'DENY' | 'SAMEORIGIN'
  contentTypeOptions: boolean
  referrerPolicy: string
  permissionsPolicy: Record<string, string[]>
  crossOriginPolicies: {
    embedderPolicy: string
    openerPolicy: string
    resourcePolicy: string
  }
  additionalHeaders: Record<string, string>
}

// PRODUCTION Security Configuration
export const PRODUCTION_SECURITY_CONFIG: EnhancedSecurityConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'nonce-{NONCE}'", // Dynamic nonce for inline scripts
        'https://*.googleapis.com',
        'https://*.gstatic.com',
        'https://www.google.com',
        'https://cdn.jsdelivr.net'
      ],
      'style-src': [
        "'self'",
        "'nonce-{NONCE}'", // Dynamic nonce for inline styles
        'https://fonts.googleapis.com',
        'https://*.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:' // For base64 encoded fonts
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.supabase.co', // Supabase storage
        'https://*.firebaseapp.com', // Firebase storage
        'https://*.googleusercontent.com' // User avatars
      ],
      'media-src': [
        "'self'",
        'blob:',
        'https://*.supabase.co'
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
        'wss://*.supabase.co' // WebSocket connections
      ],
      'frame-src': [
        "'none'" // Prevent any iframe embedding
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': [
        "'self'",
        'blob:' // For PDF.js and service workers
      ]
    },
    reportUri: '/api/security/csp-report',
    reportOnly: false
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: ["'none'"],
    microphone: ["'none'"],
    geolocation: ["'none'"],
    payment: ["'none'"],
    usb: ["'none'"],
    gyroscope: ["'none'"],
    magnetometer: ["'none'"],
    accelerometer: ["'none'"],
    "ambient-light-sensor": ["'none'"],
    autoplay: ["'self'"],
    "encrypted-media": ["'none'"],
    fullscreen: ["'self'"],
    "picture-in-picture": ["'none'"]
  },
  crossOriginPolicies: {
    embedderPolicy: 'require-corp',
    openerPolicy: 'same-origin',
    resourcePolicy: 'same-origin'
  },
  additionalHeaders: {
    'X-Robots-Tag': 'noindex, nofollow', // Prevent indexing in production
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin'
  }
}

// DEVELOPMENT Security Configuration (less restrictive)
export const DEVELOPMENT_SECURITY_CONFIG: EnhancedSecurityConfig = {
  ...PRODUCTION_SECURITY_CONFIG,
  contentSecurityPolicy: {
    directives: {
      ...PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives,
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Allow for development
        "'unsafe-eval'", // Allow for HMR
        'https://*.googleapis.com',
        'https://*.gstatic.com',
        'localhost:*',
        '127.0.0.1:*'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Allow for development
        'https://fonts.googleapis.com'
      ],
      'connect-src': [
        ...PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives['connect-src']!,
        'localhost:*',
        '127.0.0.1:*',
        'ws://localhost:*',
        'ws://127.0.0.1:*'
      ]
    },
    reportOnly: true // Don't block in development
  },
  additionalHeaders: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet'
  }
}

// Environment-specific configuration
export function getEnvironmentSecurityConfig(): EnhancedSecurityConfig {
  return process.env.NODE_ENV === 'production'
    ? PRODUCTION_SECURITY_CONFIG
    : DEVELOPMENT_SECURITY_CONFIG
}

// Generate CSP header with nonce support
export function generateEnhancedCSPHeader(
  config: EnhancedSecurityConfig['contentSecurityPolicy'],
  nonce?: string
): string {
  const directives = Object.entries(config.directives).map(([key, values]) => {
    const processedValues = values.map(value =>
      nonce && value.includes('{NONCE}') ? value.replace('{NONCE}', nonce) : value
    )
    return `${key} ${processedValues.join(' ')}`
  })

  let header = directives.join('; ')

  if (config.reportUri) {
    header += `; report-uri ${config.reportUri}`
  }

  return header
}

// Apply enhanced security headers to response
export function applyEnhancedSecurityHeaders(
  response: NextResponse,
  request?: NextRequest,
  nonce?: string
): NextResponse {
  const config = getEnvironmentSecurityConfig()

  // Content Security Policy
  const cspHeader = generateEnhancedCSPHeader(config.contentSecurityPolicy, nonce)
  const cspHeaderName = config.contentSecurityPolicy.reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'
  response.headers.set(cspHeaderName, cspHeader)

  // HTTP Strict Transport Security
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      `max-age=${config.hsts.maxAge}${config.hsts.includeSubDomains ? '; includeSubDomains' : ''}${config.hsts.preload ? '; preload' : ''}`
    )
  }

  // X-Frame-Options
  response.headers.set('X-Frame-Options', config.frameOptions)

  // X-Content-Type-Options
  if (config.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer Policy
  response.headers.set('Referrer-Policy', config.referrerPolicy)

  // Permissions Policy
  const permissionsDirectives = Object.entries(config.permissionsPolicy).map(
    ([key, values]) => `${key}=(${values.join(' ')})`
  )
  response.headers.set('Permissions-Policy', permissionsDirectives.join(', '))

  // Cross-Origin Policies
  response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginPolicies.embedderPolicy)
  response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginPolicies.openerPolicy)
  response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginPolicies.resourcePolicy)

  // Additional security headers
  Object.entries(config.additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Request-specific headers
  if (request) {
    // Vary header for proper caching
    response.headers.set('Vary', 'Accept-Encoding, User-Agent')

    // Cache control for sensitive pages
    if (request.nextUrl.pathname.includes('/api/') ||
        request.nextUrl.pathname.includes('/dashboard') ||
        request.nextUrl.pathname.includes('/performance')) {
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    }
  }

  // Security monitoring headers
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  return response
}

// CORS configuration for API routes
export interface CORSConfig {
  origin: string[] | string | boolean
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge: number
}

export const PRODUCTION_CORS_CONFIG: CORSConfig = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.NEXTAUTH_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

// Apply CORS headers
export function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest,
  config: CORSConfig = PRODUCTION_CORS_CONFIG
): NextResponse {
  const origin = request.headers.get('origin')

  // Check if origin is allowed
  let allowOrigin = false
  if (typeof config.origin === 'boolean') {
    allowOrigin = config.origin
  } else if (typeof config.origin === 'string') {
    allowOrigin = origin === config.origin
  } else if (Array.isArray(config.origin)) {
    allowOrigin = origin ? config.origin.includes(origin) : false
  }

  if (allowOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', config.maxAge.toString())

  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// Security event logging
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request?: NextRequest
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: request?.headers.get('user-agent'),
    ip: request?.ip || request?.headers.get('x-forwarded-for'),
    url: request?.url
  }

  // In production, this should go to a security monitoring system
  console.warn('[SECURITY EVENT]', logData)
}

// Middleware for enhanced security
export function withEnhancedSecurity(handler: any) {
  return async (request: NextRequest): Promise<Response> => {
    const response = await handler(request)
    const nextResponse = NextResponse.next(response)

    // Apply security headers
    applyEnhancedSecurityHeaders(nextResponse, request)

    // Apply CORS if needed
    if (request.nextUrl.pathname.startsWith('/api/')) {
      applyCORSHeaders(nextResponse, request)
    }

    return nextResponse
  }
}

// Export aliases for backward compatibility with tests
export const applySecurityHeaders = applyEnhancedSecurityHeaders
export const generateCSPNonce = generateSecurityNonce
export const createSecurityHeadersMiddleware = withEnhancedSecurity