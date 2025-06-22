import { createBrowserClient } from "@supabase/ssr"
import logger from "@/lib/logger"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20,
)

const createMockClient = () => ({
  auth: {
    getSession: () =>
      Promise.resolve({
        data: { session: null },
        error: null,
      }),
    onAuthStateChange: (callback: any) => {
      setTimeout(() => callback("INITIAL_SESSION", null), 0)
      return {
        data: {
          subscription: {
            unsubscribe: () =>
              logger.log("Mock auth subscription unsubscribed"),
          },
        },
      }
    },
    signInWithPassword: () =>
      Promise.resolve({
        data: { user: null, session: null },
        error: { message: "Demo mode - authentication disabled" },
      }),
    signUp: () =>
      Promise.resolve({
        data: { user: null, session: null },
        error: { message: "Demo mode - authentication disabled" },
      }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () =>
      Promise.resolve({
        data: { user: null },
        error: null,
      }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
      limit: () => Promise.resolve({ data: [], error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
})

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    if (!isSupabaseConfigured) {
      logger.warn("Supabase not configured - using mock client for demo mode")
      supabaseBrowserClient = createMockClient() as any
    } else {
      supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!, {
        isSingleton: true,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    }
  }
  return supabaseBrowserClient
}

// Test connection with comprehensive error handling
export async function testSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return false
  }

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
