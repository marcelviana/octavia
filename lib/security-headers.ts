/**
 * Security Headers Configuration
 * 
 * Comprehensive security headers for production deployment
 * protecting against common web vulnerabilities.
 */

import { NextRequest, NextResponse } from 'next/server'

export interface SecurityConfig {
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
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Next.js requires this for _next/static
        "'unsafe-eval'", // Required for development and some Next.js features
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
        'https://fonts.googleapis.com'
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
        'https:', // Allow images from Firebase Storage and other CDNs
        '*.googleapis.com',
        '*.firebaseapp.com'
      ],
      'media-src': [
        "'self'",
        'blob:',
        'https:', // For audio/video content
        '*.firebaseapp.com',
        '*.googleapis.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.supabase.io',
        'https://*.supabase.co',
        'https://identitytoolkit.googleapis.com', // Firebase Auth
        'https://securetoken.googleapis.com', // Firebase Auth tokens
        'https://www.googleapis.com', // Firebase APIs
        'https://firestore.googleapis.com', // Firestore
        'https://storage.googleapis.com', // Firebase Storage
        'https://*.firebaseio.com', // Realtime Database
        'wss://*.supabase.co' // Supabase realtime
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"], // Prevent embedding in frames
      'upgrade-insecure-requests': []
    },
    reportOnly: process.env.NODE_ENV === 'development'
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
    'accelerometer': ["'none'"],
    'camera': ["'none'"],
    'geolocation': ["'none'"],
    'gyroscope': ["'none'"],
    'magnetometer': ["'none'"],
    'microphone': ["'none'"],
    'payment': ["'none'"],
    'usb': ["'none'"]
  }
}

/**
 * Generate Content Security Policy string from configuration
 */
export function generateCSPHeader(config: SecurityConfig['contentSecurityPolicy']): string {
  const directives = Object.entries(config.directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')

  return directives
}

/**
 * Generate Permissions Policy string from configuration
 */
export function generatePermissionsPolicyHeader(permissions: Record<string, string[]>): string {
  return Object.entries(permissions)
    .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
    .join(', ')
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse, 
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): NextResponse {
  // Content Security Policy
  const cspValue = generateCSPHeader(config.contentSecurityPolicy)
  const cspHeader = config.contentSecurityPolicy.reportOnly 
    ? 'Content-Security-Policy-Report-Only' 
    : 'Content-Security-Policy'
  response.headers.set(cspHeader, cspValue)

  // HTTP Strict Transport Security
  if (process.env.NODE_ENV === 'production') {
    const hstsValue = `max-age=${config.hsts.maxAge}${
      config.hsts.includeSubDomains ? '; includeSubDomains' : ''
    }${config.hsts.preload ? '; preload' : ''}`
    response.headers.set('Strict-Transport-Security', hstsValue)
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
  const permissionsPolicyValue = generatePermissionsPolicyHeader(config.permissionsPolicy)
  response.headers.set('Permissions-Policy', permissionsPolicyValue)

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // Cross-Origin-Embedder-Policy (COEP) - Restrictive for security
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')

  // Cross-Origin-Opener-Policy (COOP) - Prevent window references
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')

  // Cross-Origin-Resource-Policy (CORP) - Prevent cross-origin loads
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return response
}

/**
 * Security headers middleware for API routes
 */
export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const response = await handler(request, context)
    
    // Apply security headers to NextResponse objects
    if (response instanceof NextResponse) {
      return applySecurityHeaders(response)
    }
    
    // For Response objects, create new NextResponse with security headers
    if (response instanceof Response) {
      const nextResponse = NextResponse.json(
        response.body ? await response.json() : null,
        { status: response.status, statusText: response.statusText }
      )
      return applySecurityHeaders(nextResponse)
    }

    return response
  }
}

/**
 * Validate CSP configuration for common issues
 */
export function validateCSPConfig(config: SecurityConfig['contentSecurityPolicy']): string[] {
  const warnings: string[] = []

  // Check for unsafe-inline in script-src (development only)
  if (config.directives['script-src']?.includes("'unsafe-inline'") && process.env.NODE_ENV === 'production') {
    warnings.push("WARNING: 'unsafe-inline' in script-src should not be used in production")
  }

  // Check for unsafe-eval in script-src
  if (config.directives['script-src']?.includes("'unsafe-eval'") && process.env.NODE_ENV === 'production') {
    warnings.push("WARNING: 'unsafe-eval' in script-src should be avoided in production if possible")
  }

  // Ensure default-src is restrictive
  if (config.directives['default-src']?.includes('*')) {
    warnings.push("WARNING: Wildcard (*) in default-src is too permissive")
  }

  // Check for missing important directives
  const importantDirectives = ['script-src', 'style-src', 'img-src', 'connect-src']
  for (const directive of importantDirectives) {
    if (!config.directives[directive]) {
      warnings.push(`WARNING: Missing important directive: ${directive}`)
    }
  }

  return warnings
}

/**
 * Environment-specific CSP adjustments
 */
export function getEnvironmentCSPConfig(): SecurityConfig {
  const config = { ...DEFAULT_SECURITY_CONFIG }

  if (process.env.NODE_ENV === 'development') {
    // Allow webpack dev server in development
    config.contentSecurityPolicy.directives['connect-src'].push(
      'ws://localhost:*',
      'http://localhost:*'
    )
    
    // Allow hot reload
    config.contentSecurityPolicy.directives['script-src'].push(
      'http://localhost:*'
    )
  }

  if (process.env.NODE_ENV === 'production') {
    // Remove unsafe directives in production
    config.contentSecurityPolicy.directives['script-src'] = 
      config.contentSecurityPolicy.directives['script-src'].filter(
        src => src !== "'unsafe-eval'" && src !== "'unsafe-inline'"
      )
      
    // Add nonce support for production
    config.contentSecurityPolicy.directives['script-src'].push("'nonce-{{NONCE}}'")
    config.contentSecurityPolicy.directives['style-src'].push("'nonce-{{NONCE}}'")
  }

  return config
}