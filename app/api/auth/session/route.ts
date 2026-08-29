import { NextRequest, NextResponse } from 'next/server'
import { validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'
import logger from '@/lib/logger'
import { authSchemas } from '@/lib/api-schemas'
import { withPublicBodyValidation } from '@/lib/api-validation-middleware'
import { authRequired, internalError } from '@/lib/api-errors'
import {
  checkRateLimit,
  rateLimited,
  getClientIp,
  RATE_LIMITS
} from '@/lib/user-rate-limit'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

const SESSION_COOKIE_NAME = 'firebase-session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// POST /api/auth/session - Set session cookie
const postSessionHandler = withPublicBodyValidation(authSchemas.sessionCreate)(
  async (request: Request, validatedData: any) => {
    try {
      const { idToken } = validatedData

      // Verify the token using secure authentication utilities
      const validation = await validateFirebaseTokenSecure(idToken, request.url)
      if (!validation.isValid || !validation.user) {
        // B1.3: token inválido conta na janela por IP (brute force);
        // estourou → 429 estruturada, senão 401 como sempre
        const fail = checkRateLimit({
          scope: 'ip',
          id: getClientIp(request),
          familia: 'session-authfail',
          config: RATE_LIMITS.SESSION_AUTH_FAIL
        })
        if (!fail.ok) {
          return rateLimited(fail)
        }
        // B3 PR-3b: envelope; a MENSAGEM fica (exceção deliberada do
        // desenho §2.4 — mais útil que a canônica, mesmo code)
        return authRequired('Invalid or expired token')
      }

      // B1.3: a janela do session é por UID, pós-verificação —
      // 120/15min (caso dimensionante: visibilitychange do tablet de
      // palco; dossiê de 6 medições no plano). O limiter antigo de
      // 5/15min por chave instável era o 63%-de-429 da Fase D.
      const rl = checkRateLimit({
        scope: 'user',
        id: validation.user.uid,
        familia: 'session',
        config: RATE_LIMITS.SESSION
      })
      if (!rl.ok) {
        return rateLimited(rl)
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
      return internalError('Failed to set session cookie')
    }
  }
)

export const POST = postSessionHandler

// DELETE /api/auth/session - Clear session cookie
const deleteSessionHandler = async (request: NextRequest) => {
  try {
    // B1.3: logout por IP (logout com token morto deve funcionar)
    const rl = checkRateLimit({
      scope: 'ip',
      id: getClientIp(request),
      familia: 'session-delete',
      config: RATE_LIMITS.SESSION_DELETE
    })
    if (!rl.ok) {
      return rateLimited(rl)
    }

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
    return internalError()
  }
}

export const DELETE = deleteSessionHandler
