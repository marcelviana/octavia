import { User } from "firebase/auth"
import { getIdToken } from "firebase/auth"
import logger from "./logger"

const SESSION_COOKIE_NAME = 'firebase-session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setSessionCookie(user: User): Promise<void> {
  try {
    const idToken = await getIdToken(user)
    
    // Set HTTP-only cookie via API route
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to set session cookie')
    }
    
    logger.log('Session cookie set successfully')
  } catch (error) {
    logger.warn('Failed to set session cookie:', error)
  }
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
  }
}

export function getSessionCookieFromBrowser(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  )
  
  if (!sessionCookie) return null
  
  return sessionCookie.split('=')[1]
} 