import { getSupabaseBrowserClient } from "@/lib/supabase"
import logger from "@/lib/logger"
import type { Database } from "@/types/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ContentQueryParams } from "./content-types"

type Content = Database["public"]["Tables"]["content"]["Row"]
type ContentInsert = Database["public"]["Tables"]["content"]["Insert"]
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"]

// Helper function to get the current Firebase user
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

async function getAuthenticatedUser(cookieStore?: ReadonlyRequestCookies): Promise<any | null> {
  try {
    if (typeof window !== 'undefined') {
      const { auth } = await import('@/lib/firebase')
      if (auth && auth.currentUser) {
        return { id: auth.currentUser.uid, email: auth.currentUser.email }
      }
    } else {
      const { getServerSideUser } = await import('@/lib/firebase-server-utils')
      let store = cookieStore
      if (!store) {
        try {
          // Dynamically import next/headers only when needed in server environment
          const { cookies: nextCookies } = await import('next/headers')
          store = await nextCookies()
        } catch {
          store = undefined
        }
      }
      if (store) {
        const user = await getServerSideUser(store)
        if (user) {
          return { id: user.uid, email: user.email }
        }
      }
    }
  } catch (err) {
    logger.warn('getAuthenticatedUser failed:', err)
  }
  return null
}

// Helper function to check if user is authenticated without timeout issues
export async function checkAuthState(): Promise<{ user: any | null; isAuthenticated: boolean }> {
  const user = await getAuthenticatedUser()
  return { user, isAuthenticated: !!user }
}


export interface AlbumField {
  album?: string | null
}

export interface DifficultyField {
  difficulty?: string | null
}

export interface KeyField {
  key?: string | null
}

export interface ContentRecord
  extends AlbumField,
    DifficultyField,
    KeyField {
  id: string
  title: string
  artist?: string
  content_type: string
  file_url?: string
  content_data?: Record<string, unknown>
  created_at: string
  updated_at: string
  user_id: string
  is_favorite: boolean
  tags: string[]
}


export async function getUserContent(supabase?: SupabaseClient, providedUser?: any) {
  try {
    const client = supabase ?? getSupabaseBrowserClient()

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      user = await getAuthenticatedUser()
    } else {
      console.log("🔍 getUserContent: Using provided user:", user.email)
    }
    
    if (!user) {
      logger.log("User not authenticated, returning empty content")
      throw new Error("User not authenticated")
    }

    const { data, error } = await client
      .from("content")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching content:", error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error("Error in getUserContent:", error)
    return []
  }
}

// Simple in-memory cache for content queries
const contentCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Function to clear content cache
export function clearContentCache() {
  contentCache.clear()
  console.log('Content cache cleared')
}

// Cache cleanup function
function cleanupCache() {
  const now = Date.now()
  for (const [key, value] of contentCache.entries()) {
    if (now > value.timestamp + value.ttl) {
      contentCache.delete(key)
    }
  }
}

// Clean cache every 5 minutes without keeping the Node.js process alive
const cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000)
// Only call unref() in Node.js environment (not in browser)
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref()
}

export async function getUserContentPage(
  params: ContentQueryParams = {},
  supabase?: SupabaseClient,
  providedUser?: any,
  signal?: AbortSignal
) {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "recent",
    filters = {},
    useCache = true
  } = params

  console.log('getUserContentPage called with filters:', filters)

  // Create cache key
  const cacheKey = `content-page:${JSON.stringify({ page, pageSize, search, sortBy, filters })}`

  // Check cache first
  if (useCache) {
    const cached = contentCache.get(cacheKey)
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      console.log("Returning cached content page result")
      return cached.data
    } else if (cached) {
      console.log("Cache expired, fetching fresh data")
    } else {
      console.log("No cache found, fetching fresh data")
    }
  } else {
    console.log("Cache disabled, fetching fresh data")
  }

  try {
    const client = supabase ?? getSupabaseBrowserClient()

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      user = await getAuthenticatedUser()
    } else {
      console.log("🔍 getUserContentPage: Using provided user:", user.email)
    }
    
    if (!user) {
      logger.log("User not authenticated, returning empty content page")
      throw new Error("User not authenticated")
    }

    let query = client
      .from("content")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)

    // Apply search with better text matching
    if (search) {
      // Use ilike for case-insensitive search across multiple fields
      // Note: We exclude tags from the main OR query since it's an array field
      query = query.or(
        `title.ilike.%${search}%,artist.ilike.%${search}%,album.ilike.%${search}%`
      )
    }

    // Apply filters with validation
    if (filters.contentType?.length) {
      const validTypes = ['Lyrics', 'Chord Chart', 'Guitar Tab', 'Sheet Music']
      const filteredTypes = filters.contentType.filter((type: string) => validTypes.includes(type))
      if (filteredTypes.length > 0) {
        query = query.in("content_type", filteredTypes)
      }
    }

    if (filters.difficulty?.length) {
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced']
      const filteredDifficulties = filters.difficulty.filter((diff: string) => validDifficulties.includes(diff))
      if (filteredDifficulties.length > 0) {
        query = query.in("difficulty", filteredDifficulties)
      }
    }

    if (filters.key?.length) {
      query = query.in("key", filters.key)
    }

    if (filters.favorite) {
      query = query.eq("is_favorite", true)
    }

    // Apply sorting with validation
    const sortMap = {
      recent: ["created_at", false],
      title: ["title", true],
      artist: ["artist", true],
      updated: ["updated_at", false]
    } as const

    const [sortColumn, ascending] = sortMap[sortBy as keyof typeof sortMap] || sortMap.recent
    query = query.order(sortColumn, { ascending })

    // Apply pagination with bounds checking
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100) // Max 100 items per page
    const from = (safePage - 1) * safePageSize
    const to = from + safePageSize - 1

    // Execute query with timeout
    const queryPromise = query.abortSignal(signal).range(from, to)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out')), 15000)
    )

    const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]) as any

    if (error) {
      logger.error("Database query error:", error)
      
      // Provide helpful error messages
      if (error.message?.includes('relation "content" does not exist')) {
        throw new Error("Database tables not set up. Please run the setup process.")
      }
      if (error.message?.includes('permission denied')) {
        throw new Error("Database access denied. Please check your permissions.")
      }
      
      throw new Error(`Database error: ${error.message}`)
    }

    console.log('Query results - content types found:', data?.map((item: any) => item.content_type).filter((type: any, index: number, arr: any[]) => arr.indexOf(type) === index))

    const result = {
      data: data || [],
      total: count || 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: (count || 0) > safePage * safePageSize,
      totalPages: Math.ceil((count || 0) / safePageSize)
    }

    // Cache successful results
    if (useCache && result.data.length > 0) {
      contentCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: 30 * 1000 // Cache for 30 seconds instead of 5 minutes
      })
    }

    logger.log("Content page loaded successfully", {
      page: safePage,
      pageSize: safePageSize,
      total: count,
      itemsReturned: data?.length || 0
    })

    return result

  } catch (error) {
    logger.error("Error in getUserContentPage:", error)
    
    // Return cached data if available during errors
    if (useCache) {
      const cached = contentCache.get(cacheKey)
      if (cached) {
        logger.log("Returning stale cached data due to error")
        return cached.data
      }
    }
    
    // Return empty result rather than throwing in some cases
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'))) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
        totalPages: 0,
        error: 'Request timed out - please try again'
      }
    }
    
    throw error
  }
}


export async function getContentById(id: string, supabase?: SupabaseClient, providedUser?: any) {
  try {
    const client = supabase ?? getSupabaseBrowserClient()

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      user = await getAuthenticatedUser()
    } else {
      console.log("🔍 getContentById: Using provided user:", user.email)
    }
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await client.from("content").select("*").eq("id", id).eq("user_id", user.id).single()

    if (error) {
      logger.error("Error fetching content:", error)
      throw error
    }

    return data
  } catch (error) {
    logger.error("Error in getContentById:", error)
    throw error
  }
}

export async function createContent(content: ContentInsert) {
  try {
    if (typeof window === 'undefined') {
      throw new Error('createContent can only be called from the browser')
    }
    const { auth } = await import('@/lib/firebase')
    if (!auth?.currentUser) {
      throw new Error('User not authenticated')
    }
    const token = await auth.currentUser.getIdToken()
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(content),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to create content')
    }
    return await response.json()
  } catch (error) {
    logger.error('Error in createContent:', error)
    throw error
  }
}

export async function updateContent(id: string, content: ContentUpdate) {
  try {

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const user = await getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Ensure content_data is properly formatted
    const updateData = {
      ...content,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("content")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      logger.error("Error updating content:", error)
      throw error
    }

    // Clear cache after update
    clearContentCache()

    return data
  } catch (error) {
    logger.error("Error in updateContent:", error)
    throw error
  }
}

export async function deleteContent(id: string) {
  try {
    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const user = await getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase.from("content").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      logger.error("Error deleting content:", error)
      throw error
    }

    // Clear cache after delete
    clearContentCache()

    return true
  } catch (error) {
    logger.error("Error in deleteContent:", error)
    throw error
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  return updateContent(id, { is_favorite: isFavorite })
}

export async function getUserStats(supabase?: SupabaseClient, providedUser?: any) {
  try {
    const client = supabase ?? getSupabaseBrowserClient()

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      user = await getAuthenticatedUser()
    } else {
      console.log("🔍 getUserStats: Using provided user:", user.email)
    }
    
    if (!user) {
      logger.log("User not authenticated for stats")
      return {
        totalContent: 0,
        totalSetlists: 0,
        favoriteContent: 0,
        recentlyViewed: 0,
      }
    }

    // Get total content count
    const { count: totalContent } = await client
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get favorite content count
    const { count: favoriteContent } = await client
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_favorite", true)

    // Get setlists count (if table exists)
    let totalSetlists = 0
    try {
      const { count } = await client
        .from("setlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      totalSetlists = count || 0
    } catch (error) {
      logger.log("Setlists table not available yet")
      totalSetlists = 0
    }

    // Get recently viewed count (using total content for now)
    const recentlyViewed = Math.min(totalContent || 0, 10)

    return {
      totalContent: totalContent || 0,
      totalSetlists,
      favoriteContent: favoriteContent || 0,
      recentlyViewed,
    }
  } catch (error) {
    logger.error("Error getting user stats:", error)
    return {
      totalContent: 0,
      totalSetlists: 0,
      favoriteContent: 0,
      recentlyViewed: 0,
    }
  }
}

// Keep the old function names for backward compatibility
export const getContent = getUserContent
