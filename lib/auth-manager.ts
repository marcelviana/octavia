import logger from './logger'
import { isFirebaseConfigured } from './firebase'
import { isSupabaseConfigured } from './supabase'
import { isSupabaseServiceConfigured } from './supabase-service'

// Tracks current ID token and expiry time (ms since epoch)
let currentToken: string | null = null
let tokenExpiry: number | null = null
const TOKEN_LIFETIME_MS = 60 * 60 * 1000 // 1 hour
const REFRESH_BUFFER_MS = 5 * 60 * 1000  // refresh 5 minutes before expiry

export function ensureAuthConfigured(): boolean {
  if (!isFirebaseConfigured) {
    logger.warn('Firebase not configured - authentication disabled')
  }
  if (!isSupabaseConfigured) {
    logger.warn('Supabase not configured - database operations may fail')
  }
  if (!isSupabaseServiceConfigured) {
    logger.warn('Supabase service role not configured - server operations may fail')
  }
  return isFirebaseConfigured && isSupabaseConfigured && isSupabaseServiceConfigured
}

interface TokenResult {
  token: string | null
  error?: string
}

export async function getValidToken(): Promise<TokenResult> {
  // For delete operations and other client-side operations, we primarily need Firebase auth
  // Don't fail if Supabase service role is not configured for client-side operations
  if (!isFirebaseConfigured) {
    logger.warn('Firebase not configured - authentication disabled')
    return { token: null, error: 'Firebase authentication not configured' }
  }

  const now = Date.now()
  if (currentToken && tokenExpiry && now < tokenExpiry - REFRESH_BUFFER_MS) {
    return { token: currentToken }
  }

  try {
    if (typeof window === 'undefined') {
      return { token: null, error: 'Token unavailable in server environment' }
    }
    
    const { auth, isFirebaseConfigured: dynamicFirebaseCheck } = await import('./firebase')
    
    // Double-check Firebase configuration dynamically
    if (!dynamicFirebaseCheck || !auth) {
      return { token: null, error: 'Firebase authentication not properly initialized' }
    }
    
    if (!auth.currentUser) {
      return { token: null, error: 'User not authenticated' }
    }
    
    const token = await auth.currentUser.getIdToken(true)
    currentToken = token
    tokenExpiry = now + TOKEN_LIFETIME_MS
    return { token }
  } catch (err: any) {
    logger.warn('Failed to get auth token:', err)
    currentToken = null
    tokenExpiry = null
    return { token: null, error: err?.message || 'Failed to get auth token' }
  }
}

export async function debugAuthConfig(): Promise<void> {
  // Debug function removed to clean up console output
  return;
}
