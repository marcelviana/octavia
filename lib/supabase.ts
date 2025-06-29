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

// Test connection with comprehensive error handling
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient()

    // Simple test that doesn't require authentication
    const { error } = await supabase.from("content").select("count").limit(1)

    if (error && error.message.includes('relation "content" does not exist')) {
      return true
    }

    return !error
  } catch (error) {
    logger.warn("Supabase connection test failed:", error)
    return false
  }
}

// Legacy function - no longer used since we switched to Firebase Auth
// Kept for backward compatibility but always returns null
export async function getSessionSafe(timeoutMs = 4000) {
  logger.warn('getSessionSafe called but Supabase auth is disabled - using Firebase Auth instead')
  return null
}
