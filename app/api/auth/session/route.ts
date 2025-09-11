import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import logger from '@/lib/logger'
import { sessionSchema } from '@/lib/validation-schemas'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse
} from '@/lib/validation-utils'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

const SESSION_COOKIE_NAME = 'firebase-session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// POST /api/auth/session - Set session cookie
const postSessionHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, sessionSchema)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const { idToken } = bodyValidation.data

    // Verify the token using Firebase Admin directly
    try {
      await verifyFirebaseToken(idToken)
    } catch (err) {
      return createUnauthorizedResponse('Invalid or expired token')
    }

    // Create response with session cookie
    const response = NextResponse.json({ success: true })
    
    response.cookies.set(SESSION_COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error: any) {
    logger.error('Error setting session cookie:', error)
    return createServerErrorResponse('Failed to set session cookie')
  }
}

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