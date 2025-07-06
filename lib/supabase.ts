import { createBrowserClient } from "@supabase/ssr"
import logger from "@/lib/logger"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20,
)

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null

// ⚠️ WARNING: This browser client should NOT be used for database operations
// It's only available for compatibility and testing purposes.
// All database operations should go through secure API routes using the service role key.
export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      isSingleton: true,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'implicit'
      },
    })
  }
  return supabaseBrowserClient
}

// Connection testing is now handled server-side via API routes
// This function has been removed to comply with security guidelines
// that prohibit direct client-side Supabase database access

// Legacy function - no longer used since we switched to Firebase Auth
// Kept for backward compatibility but always returns null
export async function getSessionSafe(timeoutMs = 4000) {
  logger.warn('getSessionSafe called but Supabase auth is disabled - using Firebase Auth instead')
  return null
}
