// COMPREHENSIVE API Validation Middleware for all endpoints
// Implements Zod validation as required by CLAUDE.md security patterns

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import logger from './logger'
import { authRequired, internalError, validationError } from './api-errors'
import { requireAuthServerSecure } from './secure-auth-utils'
import {
  checkRateLimit,
  rateLimited,
  getAuthFailureLimit,
  getClientIp,
  type RateLimitConfig
} from './user-rate-limit'

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
      [{ 
        code: 'invalid_type', 
        message: 'Invalid request body format', 
        path: [],
        expected: 'object',
        received: 'unknown'
      }],
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
    allowUnverifiedEmail?: boolean
    /** B1.3: limite por uid (roda APÓS a auth) — família + janela do sistema único */
    rateLimit?: { familia: string; config: RateLimitConfig }
  } = {}
) {
  const { validateParams = false, requireAuth = true, source = 'body', allowUnverifiedEmail = false, rateLimit } = options

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
          user = await requireAuthServerSecure(request, { allowUnverifiedEmail })
          if (!user) {
            // B1.3: IP com janela de auth falhada estourada recebe 429
            // estruturada (o funil já negou deny-fast por baixo)
            const failLimit = getAuthFailureLimit(getClientIp(request))
            if (failLimit) {
              return rateLimited(failLimit)
            }
            // B3 PR-1: construção delegada ao ponto único (byte-idêntica
            // ao inline anterior — provado pela camada 2 do contract-errors)
            return authRequired()
          }

          // B1.3: limite por uid, pós-auth
          if (rateLimit) {
            const rl = checkRateLimit({
              scope: 'user',
              id: user.uid,
              familia: rateLimit.familia,
              config: rateLimit.config
            })
            if (!rl.ok) {
              return rateLimited(rl)
            }
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

          // B3 PR-1: delegado ao ponto único. expandUnrecognizedKeys:false
          // preserva o mapping antigo do unrecognized (um item, field:"")
          // — exigência de byte-identidade do §4.1; o flip para o default
          // do contrato (D7 por chave) é mudança declarada de PR posterior.
          return validationError(validationResult.error, { expandUnrecognizedKeys: false })
        }

        // Call handler with validated data
        return await handler(request, validationResult.data, user || undefined, ...args)

      } catch (error) {
        if (error instanceof ValidationError) {
          // B3 PR-1 (achado §0.3-2 do desenho): a issue sintética passa
          // pelo mapper único — field:"" ("o corpo como um todo", reserva
          // do contrato), morrem os path/expected/received crus. O
          // statusCode da ValidationError sempre foi 400 (único valor
          // construído); o code VALIDATION_ERROR fixa 400 por contrato.
          return validationError(error.issues)
        }

        logger.error('Validation middleware error:', error)
        return internalError()
      }
    }
  }
}

// Convenience functions for common validation patterns
export const withAuth = (handler: any) =>
  withValidation(z.object({}), { requireAuth: true, source: 'body' })(handler)

export const withBodyValidation = <T extends z.ZodSchema>(
  schema: T,
  options: {
    allowUnverifiedEmail?: boolean
    rateLimit?: { familia: string; config: RateLimitConfig }
  } = {}
) =>
  withValidation(schema, { requireAuth: true, source: 'body', ...options })

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