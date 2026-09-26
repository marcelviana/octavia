import { User } from "firebase/auth"
import { getIdToken } from "firebase/auth"
import logger from "./logger"

const SESSION_COOKIE_NAME = 'firebase-session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * I1-PR1 (H-I1-7): o resultado do POST /api/auth/session é DADO, não `throw`
 * genérico — o provider transforma cada razão em estado e em frase. A razão
 * `limite` carrega o `Retry-After` em segundos quando o servidor o manda
 * (`lib/user-rate-limit.ts`); sem ele, `null`.
 */
export type FalhaSessao =
  | { motivo: 'rede' }
  | { motivo: 'recusado'; status: number }
  | { motivo: 'limite'; retryAfterS: number | null }
  | { motivo: 'servidor'; status: number }

export type ResultadoSessao = { ok: true } | ({ ok: false } & FalhaSessao)

/** `Retry-After` em segundos (inteiro ou data HTTP); inválido → null. */
export function lerRetryAfter(valor: string | null, agora: number = Date.now()): number | null {
  if (!valor) return null
  const v = valor.trim()
  if (/^\d+$/.test(v)) return Number(v)
  const data = Date.parse(v)
  if (Number.isNaN(data)) return null
  return Math.max(0, Math.ceil((data - agora) / 1000))
}

export async function setSessionCookie(user: User): Promise<ResultadoSessao> {
  let idToken: string
  try {
    idToken = await getIdToken(user)
  } catch (error) {
    logger.warn('Failed to get ID token for session cookie:', error)
    const code = (error as { code?: string } | null)?.code ?? ''
    return code.includes('network') ? { ok: false, motivo: 'rede' } : { ok: false, motivo: 'recusado', status: 0 }
  }

  let response: Response
  try {
    // Set HTTP-only cookie via API route
    response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
  } catch (error) {
    logger.warn('Failed to set session cookie (network):', error)
    return { ok: false, motivo: 'rede' }
  }

  if (response.ok) {
    logger.log('Session cookie set successfully')
    return { ok: true }
  }

  logger.warn('Failed to set session cookie:', response.status)
  if (response.status === 429) {
    return { ok: false, motivo: 'limite', retryAfterS: lerRetryAfter(response.headers?.get('Retry-After') ?? null) }
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, motivo: 'recusado', status: response.status }
  }
  return { ok: false, motivo: 'servidor', status: response.status }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to clear session cookie')
    }
    
    logger.log('Session cookie cleared successfully')
  } catch (error) {
    logger.warn('Failed to clear session cookie:', error)
    throw error
  }
}

export function getSessionCookieFromBrowser(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  )
  
  if (!sessionCookie) return null
  
  return sessionCookie.split('=')[1] ?? null
} 