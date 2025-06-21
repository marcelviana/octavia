import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
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
  } catch {
    return false
  }
}
