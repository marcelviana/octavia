import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("https://") && supabaseAnonKey.length > 20,
)

// Create a comprehensive mock client for development
const createMockClient = () => ({
  auth: {
    getSession: () =>
      Promise.resolve({
        data: { session: null },
        error: null,
      }),
    onAuthStateChange: (callback: any) => {
      // Call callback immediately with no session
      setTimeout(() => callback("INITIAL_SESSION", null), 0)
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log("Mock auth subscription unsubscribed"),
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
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
      }),
      limit: (count: number) => Promise.resolve({ data: [], error: null }),
      order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: null }),
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
  }),
})

// Browser client with comprehensive error handling
let supabaseBrowserClient: any = null

export function getSupabaseBrowserClient() {
  // Return mock client if not configured
  if (!isSupabaseConfigured) {
    console.warn("Supabase not configured - using mock client for demo mode")
    return createMockClient()
  }

  // Return existing client if available
  if (supabaseBrowserClient) {
    return supabaseBrowserClient
  }

  try {
    supabaseBrowserClient = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
      global: {
        headers: {
          "X-Client-Info": "musicsheet-pro",
        },
      },
    })

    console.log("Supabase client created successfully")
    return supabaseBrowserClient
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return createMockClient()
  }
}

// Server client with error handling
export function getSupabaseServerClient() {
  if (!isSupabaseConfigured) {
    return createMockClient()
  }

  try {
    return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  } catch (error) {
    console.error("Failed to create Supabase server client:", error)
    return createMockClient()
  }
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
      console.warn("Supabase connected but tables not set up")
      return true // Connection works, just no tables
    }

    return !error
  } catch (error) {
    console.warn("Supabase connection test failed:", error)
    return false
  }
}
