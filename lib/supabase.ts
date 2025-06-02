import { createBrowserClient, createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// Declare global variable for TypeScript
declare global {
  var __supabaseClient: ReturnType<typeof createBrowserClient<Database>> | undefined
}

// Single browser client instance
export function createSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    // Server-side: create a new instance each time
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  // Client-side: use global singleton
  if (!globalThis.__supabaseClient) {
    globalThis.__supabaseClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return globalThis.__supabaseClient
}

// Server client for server-side operations
export function createSupabaseServerClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return undefined
        },
        set(name: string, value: string, options: any) {
          // No-op for server-side
        },
        remove(name: string, options: any) {
          // No-op for server-side
        },
      },
    },
  )
}

// Legacy function for backward compatibility
export const getSupabaseBrowserClient = createSupabaseBrowserClient

// Server-side client with service role for admin operations
export function getSupabaseServerClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server environment variables")
  }

  return createServerClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
    cookies: {
      get(name: string) {
        return undefined
      },
      set(name: string, value: string, options: any) {
        // No-op for server-side
      },
      remove(name: string, options: any) {
        // No-op for server-side
      },
    },
  })
}
