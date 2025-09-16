import { NextRequest, NextResponse } from 'next/server'
import { validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'
import logger from '@/lib/logger'
import { authSchemas } from '@/lib/api-validation-middleware'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

const SESSION_COOKIE_NAME = 'firebase-session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// POST /api/auth/session - Set session cookie
const postSessionHandler = withBodyValidation(authSchemas.sessionCreate)(
  async (request: Request, validatedData: any) => {
    try {
      const { idToken } = validatedData

      // Verify the token using secure authentication utilities
      const validation = await validateFirebaseTokenSecure(idToken, request.url)
      if (!validation.isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Create response with session cookie
      const response = new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      })

      // Set secure session cookie
      const cookieOptions = [
        `${SESSION_COOKIE_NAME}=${idToken}`,
        'HttpOnly',
        `Max-Age=${SESSION_COOKIE_MAX_AGE}`,
        'Path=/',
        'SameSite=Lax',
        ...(process.env.NODE_ENV === 'production' ? ['Secure'] : [])
      ].join('; ')

      response.headers.set('Set-Cookie', cookieOptions)
      return response
    } catch (error: any) {
      logger.error('Error setting session cookie:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to set session cookie' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

export const POST = withRateLimit(RATE_LIMIT_CONFIGS.AUTH)(postSessionHandler)

// DELETE /api/auth/session - Clear session cookie
const deleteSessionHandler = async (request: NextRequest) => {
  try {
    const response = NextResponse.json({ success: true })
    
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error: any) {
    logger.error('Error clearing session cookie:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = withRateLimit(RATE_LIMIT_CONFIGS.AUTH)(deleteSessionHandler) 