// COMPREHENSIVE API Validation Middleware for all endpoints
// Implements Zod validation as required by CLAUDE.md security patterns

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import logger from './logger'
import { requireAuthServerSecure } from './secure-auth-utils'

// Common validation schemas
export const commonSchemas = {
  // MongoDB ObjectId pattern
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format'),

  // Firebase UID pattern
  firebaseUid: z.string().min(1).max(128),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Content types enum
  contentType: z.enum(['Lyrics', 'Chords', 'Tabs', 'Piano', 'Drums'], {
    errorMap: () => ({ message: 'Invalid content type' })
  }),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),

  // Search query
  search: z.string().min(1).max(200).optional(),

  // File validation
  filename: z.string().min(1).max(255).regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename'),

  // Security: Prevent XSS in text fields
  safeText: z.string().max(1000).refine(
    (text) => !/<script|javascript:|data:|vbscript:/i.test(text),
    'Potentially unsafe content detected'
  ),

  // Security: Safe HTML content (for lyrics, etc.)
  safeHtml: z.string().max(50000).refine(
    (html) => {
      // Basic XSS prevention
      const dangerous = /<script|javascript:|data:|vbscript:|on\w+\s*=/i
      return !dangerous.test(html)
    },
    'Potentially unsafe HTML content detected'
  )
} as const

// Authentication validation schemas
export const authSchemas = {
  // Firebase ID token validation
  firebaseToken: z.object({
    token: z.string().min(1, 'Token is required')
      .max(4000, 'Token too long')
      .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, 'Invalid token format')
  }),

  // Session creation
  sessionCreate: z.object({
    idToken: z.string().min(1, 'ID token is required')
      .max(4000, 'Token too long')
  }),

  // User profile update
  profileUpdate: z.object({
    displayName: commonSchemas.safeText.optional(),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      autoSync: z.boolean().optional(),
      performanceMode: z.boolean().optional()
    }).optional()
  })
} as const

// Content validation schemas
export const contentSchemas = {
  // Content creation
  create: z.object({
    title: commonSchemas.safeText.min(1, 'Title is required'),
    artist: commonSchemas.safeText.optional(),
    album: commonSchemas.safeText.optional(),
    content_type: commonSchemas.contentType,
    content_data: z.record(z.unknown()).optional(), // Will be validated based on content_type
    key: z.string().max(10).optional(),
    bpm: z.number().int().min(30).max(300).optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    tags: z.array(commonSchemas.safeText).max(10).optional(),
    is_favorite: z.boolean().default(false),
    notes: commonSchemas.safeHtml.optional()
  }),

  // Content update
  update: z.object({
    title: commonSchemas.safeText.min(1).optional(),
    artist: commonSchemas.safeText.optional(),
    album: commonSchemas.safeText.optional(),
    content_type: commonSchemas.contentType.optional(),
    content_data: z.record(z.unknown()).optional(),
    key: z.string().max(10).optional(),
    bpm: z.number().int().min(30).max(300).optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    tags: z.array(commonSchemas.safeText).max(10).optional(),
    is_favorite: z.boolean().optional(),
    notes: commonSchemas.safeHtml.optional()
  }),

  // Content query
  query: z.object({
    search: commonSchemas.search,
    content_type: commonSchemas.contentType.optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    is_favorite: z.coerce.boolean().optional(),
    ...commonSchemas.pagination.shape
  }),

  // Content ID parameter
  params: z.object({
    id: commonSchemas.objectId
  })
} as const

// Setlist validation schemas
export const setlistSchemas = {
  // Setlist creation
  create: z.object({
    name: commonSchemas.safeText.min(1, 'Setlist name is required').max(100),
    description: commonSchemas.safeHtml.optional(),
    songs: z.array(z.object({
      content_id: commonSchemas.objectId,
      position: z.number().int().min(0),
      notes: commonSchemas.safeText.optional()
    })).max(100).default([])
  }),

  // Setlist update
  update: z.object({
    name: commonSchemas.safeText.min(1).max(100).optional(),
    description: commonSchemas.safeHtml.optional(),
    songs: z.array(z.object({
      content_id: commonSchemas.objectId,
      position: z.number().int().min(0),
      notes: commonSchemas.safeText.optional()
    })).max(100).optional()
  }),

  // Add song to setlist
  addSong: z.object({
    content_id: commonSchemas.objectId,
    position: z.number().int().min(0).optional(),
    notes: commonSchemas.safeText.optional()
  }),

  // Update song position
  updatePosition: z.object({
    song_id: commonSchemas.objectId,
    new_position: z.number().int().min(0)
  }),

  // Query setlists
  query: z.object({
    search: commonSchemas.search,
    ...commonSchemas.pagination.shape
  }),

  // Setlist and song IDs
  params: z.object({
    id: commonSchemas.objectId,
    songId: commonSchemas.objectId.optional()
  })
} as const

// Storage validation schemas
export const storageSchemas = {
  // File upload
  upload: z.object({
    filename: commonSchemas.filename,
    contentType: z.string().regex(
      /^(application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|image\/(jpeg|png|gif|webp)|text\/(plain|html))$/,
      'Unsupported file type'
    ),
    size: z.number().int().min(1).max(50 * 1024 * 1024) // 50MB max
  }),

  // File deletion
  delete: z.object({
    fileUrl: z.string().url('Invalid file URL')
  })
} as const

// Validation error handler
class ValidationError extends Error {
  constructor(
    public issues: z.ZodIssue[],
    public statusCode: number = 400
  ) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

// Security-focused request body parser
export async function parseRequestBody(request: Request): Promise<unknown> {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const text = await request.text()

      // Security: Limit JSON size
      if (text.length > 1024 * 1024) { // 1MB limit
        throw new Error('Request body too large')
      }

      // Security: Prevent prototype pollution
      const parsed = JSON.parse(text)
      if (typeof parsed === 'object' && parsed !== null) {
        // Remove dangerous keys
        delete parsed.__proto__
        delete parsed.constructor
        delete parsed.prototype
      }

      return parsed
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      return await request.formData()
    } else {
      // Handle other content types
      return await request.text()
    }
  } catch (error) {
    logger.error('Failed to parse request body:', error)
    throw new ValidationError(
      [{ code: 'invalid_type', message: 'Invalid request body format', path: [] }],
      400
    )
  }
}

// Main validation middleware
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  options: {
    validateParams?: boolean
    requireAuth?: boolean
    source?: 'body' | 'query' | 'params'
  } = {}
) {
  const { validateParams = false, requireAuth = true, source = 'body' } = options

  return function<TArgs extends any[]>(
    handler: (
      request: Request,
      validatedData: z.infer<T>,
      user?: NonNullable<Awaited<ReturnType<typeof requireAuthServerSecure>>>,
      ...args: TArgs
    ) => Promise<Response>
  ) {
    return async (request: Request, ...args: TArgs): Promise<Response> => {
      try {
        // Authentication check
        let user: Awaited<ReturnType<typeof requireAuthServerSecure>> = null

        if (requireAuth) {
          user = await requireAuthServerSecure(request)
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
        }

        // Get data based on source
        let rawData: any

        switch (source) {
          case 'query':
            const url = new URL(request.url)
            rawData = Object.fromEntries(url.searchParams.entries())
            break
          case 'params':
            // Extract from URL path - this would need to be passed in
            rawData = args[0] // Assuming params are passed as first argument
            break
          case 'body':
          default:
            if (request.method === 'GET' || request.method === 'HEAD') {
              rawData = {}
            } else {
              rawData = await parseRequestBody(request)
            }
            break
        }

        // Validate data
        const validationResult = schema.safeParse(rawData)

        if (!validationResult.success) {
          logger.warn('Validation failed:', {
            path: request.url,
            method: request.method,
            errors: validationResult.error.issues
          })

          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: validationResult.error.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
              }))
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // Call handler with validated data
        return await handler(request, validationResult.data, user || undefined, ...args)

      } catch (error) {
        if (error instanceof ValidationError) {
          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: error.issues
            }),
            {
              status: error.statusCode,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        logger.error('Validation middleware error:', error)
        return new Response(
          JSON.stringify({
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }
}

// Convenience functions for common validation patterns
export const withAuth = (handler: any) =>
  withValidation(z.object({}), { requireAuth: true, source: 'body' })(handler)

export const withBodyValidation = <T extends z.ZodSchema>(schema: T) =>
  withValidation(schema, { requireAuth: true, source: 'body' })

export const withQueryValidation = <T extends z.ZodSchema>(schema: T) =>
  withValidation(schema, { requireAuth: true, source: 'query' })

export const withParamsValidation = <T extends z.ZodSchema>(schema: T) =>
  withValidation(schema, { requireAuth: true, source: 'params' })

export const withPublicBodyValidation = <T extends z.ZodSchema>(schema: T) =>
  withValidation(schema, { requireAuth: false, source: 'body' })

// Export all schemas for use in API routes
export {
  ValidationError
}