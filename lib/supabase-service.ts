import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import logger from "@/lib/logger"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const isSupabaseServiceConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl.startsWith("https://") &&
  supabaseServiceKey.length > 20,
)

let supabaseServiceClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseServiceClient() {
  if (!supabaseServiceClient) {
    if (!isSupabaseServiceConfigured) {
      logger.warn("Supabase service role not configured - operations will fail")
      throw new Error("Supabase service role key not configured")
    }
    
    supabaseServiceClient = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  
  return supabaseServiceClient!
}

// Test service connection
export async function testSupabaseServiceConnection(): Promise<boolean> {
  if (!isSupabaseServiceConfigured) {
    return false
  }

  try {
    const supabase = getSupabaseServiceClient()
    
    // Simple test that doesn't require authentication
    const { error } = await supabase.from("profiles").select("count").limit(1)
    
    return !error
  } catch (error) {
    logger.warn("Supabase service connection test failed:", error)
    return false
  }
} 