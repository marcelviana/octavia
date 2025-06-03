import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

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

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }
  return supabaseBrowserClient;
}

export function getSupabaseServerClient() {
  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookies().set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookies().delete({ name, ...options });
      },
    },
  });
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
