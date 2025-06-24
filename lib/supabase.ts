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
        persistSession: true,
        autoRefreshToken: true,
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

export async function getSessionSafe(timeoutMs = 4000) {
  try {
    const supabase = getSupabaseBrowserClient()

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), timeoutMs),
    )

    const { data: { session }, error } = (await Promise.race([
      supabase.auth.getSession(),
      timeout,
    ])) as any

    if (error) {
      if (
        error.message?.includes('expired') ||
        error.message?.includes('invalid')
      ) {
        try {
          const { data: { session: refreshed }, error: refreshError } =
            await supabase.auth.refreshSession()
          if (!refreshError) return refreshed
        } catch (err) {
          logger.warn('Session refresh failed:', err)
        }
      }
      return null
    }

    return session
  } catch (err) {
    logger.warn('getSessionSafe failed:', err)
    return null
  }
}
