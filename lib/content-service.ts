import { getSupabaseBrowserClient } from "@/lib/supabase";
import logger from "@/lib/logger";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentQueryParams } from "./content-types";

type Content = Database["public"]["Tables"]["content"]["Row"];
type ContentInsert = Database["public"]["Tables"]["content"]["Insert"];
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"];

// Helper function to get the current Firebase user
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

async function getAuthenticatedUser(
  cookieStore?: ReadonlyRequestCookies,
): Promise<any | null> {
  try {
    if (typeof window !== "undefined") {
      const { auth } = await import("@/lib/firebase");
      if (auth && auth.currentUser) {
        return { id: auth.currentUser.uid, email: auth.currentUser.email };
      }

      // If no current user, wait a bit for Firebase Auth to initialize
      // This helps with timing issues during page loads/refreshes
      if (auth) {
        return new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
              resolve({ id: user.uid, email: user.email });
            } else {
              resolve(null);
            }
          });

          // Don't wait forever - timeout after 2 seconds
          setTimeout(() => {
            unsubscribe();
            resolve(null);
          }, 2000);
        });
      }
    } else {
      const { getServerSideUser } = await import("@/lib/firebase-server-utils");
      let store = cookieStore;
      if (store) {
        const user = await getServerSideUser(store);
        if (user) {
          return { id: user.uid, email: user.email };
        }
      }
    }
  } catch (err) {
    logger.warn("getAuthenticatedUser failed:", err);
  }
  return null;
}

// Helper function to check if user is authenticated without timeout issues
export async function checkAuthState(): Promise<{
  user: any | null;
  isAuthenticated: boolean;
}> {
  const user = await getAuthenticatedUser();
  return { user, isAuthenticated: !!user };
}

export interface AlbumField {
  album?: string | null;
}

export interface DifficultyField {
  difficulty?: string | null;
}

export interface KeyField {
  key?: string | null;
}

export interface ContentRecord extends AlbumField, DifficultyField, KeyField {
  id: string;
  title: string;
  artist?: string;
  content_type: string;
  file_url?: string;
  content_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_favorite: boolean;
  tags: string[];
}

export async function getUserContent(
  supabase?: SupabaseClient,
  providedUser?: any,
) {
  try {
    const client = supabase ?? getSupabaseBrowserClient();

    // Use provided user or check authentication
    let user = providedUser;
    if (!user) {
      user = await getAuthenticatedUser();
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 getUserContent: Using provided user:", user.email);
      }
    }

    if (!user) {
      logger.log("User not authenticated, returning empty content");
      throw new Error("User not authenticated");
    }

    const { data, error } = await client
      .from("content")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching content:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Error in getUserContent:", error);
    return [];
  }
}

// Simple in-memory cache for content queries
const contentCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

// Function to clear content cache
export function clearContentCache() {
  contentCache.clear();
  if (process.env.NODE_ENV === "development") {
    console.log("Content cache cleared");
  }
}

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of contentCache.entries()) {
    if (now > value.timestamp + value.ttl) {
      contentCache.delete(key);
    }
  }
}

// Clean cache every 5 minutes without keeping the Node.js process alive
const cleanupInterval = setInterval(cleanupCache, 5 * 60 * 1000);
// Only call unref() in Node.js environment (not in browser)
if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}

export async function getUserContentPage(
  params: ContentQueryParams = {},
  supabase?: SupabaseClient,
  providedUser?: any,
  signal?: AbortSignal,
) {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "recent",
    filters = {},
    useCache = true,
  } = params;

  if (process.env.NODE_ENV === "development") {
    console.log("getUserContentPage called with filters:", filters);
  }

  // Create cache key
  const cacheKey = `content-page:${JSON.stringify({ page, pageSize, search, sortBy, filters })}`;

  // Check cache first
  if (useCache) {
    const cached = contentCache.get(cacheKey);
    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      if (process.env.NODE_ENV === "development") {
        console.log("Returning cached content page result");
      }
      return cached.data;
    } else if (cached) {
      if (process.env.NODE_ENV === "development") {
        console.log("Cache expired, fetching fresh data");
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("No cache found, fetching fresh data");
      }
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log("Cache disabled, fetching fresh data");
    }
  }

  try {
    // If we have a provided user (server-side), use the original Supabase query logic
    if (providedUser && supabase) {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 getUserContentPage: Using server-side Supabase query");
      }
      return await getUserContentPageDirect(
        params,
        supabase,
        providedUser,
        signal,
      );
    }

    // For client-side queries, use the API route to avoid RLS issues
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 getUserContentPage: Using client-side API route");
    }

    // Check authentication first
    const user = await getAuthenticatedUser();
    if (!user) {
      console.warn("🔍 getUserContentPage: No authenticated user found");
      throw new Error("User not authenticated");
    }

    // Get Firebase auth token
    let token: string;
    try {
      if (typeof window === "undefined") {
        throw new Error("Client-side API calls should only happen in browser");
      }
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }
      token = await auth.currentUser.getIdToken();
    } catch (error) {
      console.error("Failed to get Firebase auth token:", error);
      throw new Error("Authentication failed");
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      search,
      sortBy,
      favorite: String(filters.favorite || false),
    });

    if (filters.contentType?.length) {
      queryParams.set("contentType", filters.contentType.join(","));
    }
    if (filters.difficulty?.length) {
      queryParams.set("difficulty", filters.difficulty.join(","));
    }
    if (filters.key?.length) {
      queryParams.set("key", filters.key.join(","));
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "🔍 getUserContentPage: Making API request with params:",
        Object.fromEntries(queryParams),
      );
    }

    const response = await fetch(`/api/content?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API request failed: ${response.status}`,
      );
    }

    const result = await response.json();

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 getUserContentPage: API response received", {
        dataLength: result.data?.length || 0,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasData: !!(result.data && result.data.length > 0),
      });
    }

    // Cache successful results
    if (useCache && result.data?.length > 0) {
      contentCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: 30 * 1000, // Cache for 30 seconds
      });
    }

    return result;
  } catch (error) {
    logger.error("Error in getUserContentPage:", error);

    // Return cached data if available during errors
    if (useCache) {
      const cached = contentCache.get(cacheKey);
      if (cached) {
        logger.log("Returning stale cached data due to error");
        return cached.data;
      }
    }

    // Return empty result rather than throwing in some cases
    if (
      error instanceof Error &&
      (error.message.includes("timeout") || error.message.includes("timed out"))
    ) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
        totalPages: 0,
        error: "Request timed out - please try again",
      };
    }

    throw error;
  }
}

// Direct Supabase query function for server-side use
async function getUserContentPageDirect(
  params: ContentQueryParams,
  supabase: SupabaseClient,
  providedUser: any,
  signal?: AbortSignal,
) {
  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "recent",
    filters = {},
  } = params;

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 getUserContentPageDirect: Starting server-side query");
  }

  let query = supabase
    .from("content")
    .select("*", { count: "exact" })
    .eq("user_id", providedUser.id);

  // Apply search with better text matching
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,artist.ilike.%${search}%,album.ilike.%${search}%`,
    );
  }

  // Apply filters with validation
  if (filters.contentType?.length) {
    const validTypes = ["Lyrics", "Chord Chart", "Guitar Tab", "Sheet Music"];
    const filteredTypes = filters.contentType.filter((type: string) =>
      validTypes.includes(type),
    );
    if (filteredTypes.length > 0) {
      query = query.in("content_type", filteredTypes);
    }
  }

  if (filters.difficulty?.length) {
    const validDifficulties = ["Beginner", "Intermediate", "Advanced"];
    const filteredDifficulties = filters.difficulty.filter((diff: string) =>
      validDifficulties.includes(diff),
    );
    if (filteredDifficulties.length > 0) {
      query = query.in("difficulty", filteredDifficulties);
    }
  }

  if (filters.key?.length) {
    query = query.in("key", filters.key);
  }

  if (filters.favorite) {
    query = query.eq("is_favorite", true);
  }

  // Apply sorting with validation
  const sortMap = {
    recent: ["created_at", false],
    title: ["title", true],
    artist: ["artist", true],
    updated: ["updated_at", false],
  } as const;

  const [sortColumn, ascending] =
    sortMap[sortBy as keyof typeof sortMap] || sortMap.recent;
  query = query.order(sortColumn, { ascending });

  // Apply pagination with bounds checking
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 100);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  // Execute query with timeout
  const queryPromise = signal
    ? query.abortSignal(signal).range(from, to)
    : query.range(from, to);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Database query timed out")), 15000),
  );

  const { data, error, count } = (await Promise.race([
    queryPromise,
    timeoutPromise,
  ])) as any;

  if (error) {
    logger.error("Database query error:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / safePageSize);

  const result = {
    data: data || [],
    total: totalItems,
    page: safePage,
    pageSize: safePageSize,
    hasMore: totalItems > safePage * safePageSize,
    totalPages,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 getUserContentPageDirect: Server-side query completed", {
      dataLength: result.data.length,
      total: result.total,
      page: result.page,
    });
  }

  return result;
}

export async function getContentById(
  id: string,
  supabase?: SupabaseClient,
  providedUser?: any,
) {
  try {
    const client = supabase ?? getSupabaseBrowserClient();

    // Use provided user or check authentication
    let user = providedUser;
    if (!user) {
      user = await getAuthenticatedUser();
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 getContentById: Using provided user:", user.email);
      }
    }

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await client
      .from("content")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      logger.error("Error fetching content:", error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Error in getContentById:", error);
    throw error;
  }
}

export async function createContent(content: ContentInsert) {
  try {
    if (typeof window === "undefined") {
      throw new Error("createContent can only be called from the browser");
    }
    const { auth } = await import("@/lib/firebase");
    if (!auth?.currentUser) {
      throw new Error("User not authenticated");
    }
    const token = await auth.currentUser.getIdToken();
    const response = await fetch("/api/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(content),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create content");
    }
    return await response.json();
  } catch (error) {
    logger.error("Error in createContent:", error);
    throw error;
  }
}

export async function updateContent(id: string, content: ContentUpdate) {
  try {
    const supabase = getSupabaseBrowserClient();

    // Check if user is authenticated
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Ensure content_data is properly formatted
    const updateData = {
      ...content,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("content")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating content:", error);
      throw error;
    }

    // Clear cache after update
    clearContentCache();

    return data;
  } catch (error) {
    logger.error("Error in updateContent:", error);
    throw error;
  }
}

export async function deleteContent(id: string) {
  try {
    const supabase = getSupabaseBrowserClient();

    // Check if user is authenticated
    const user = await getAuthenticatedUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting content:", error);
      throw error;
    }

    // Clear cache after delete
    clearContentCache();

    return true;
  } catch (error) {
    logger.error("Error in deleteContent:", error);
    throw error;
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  return updateContent(id, { is_favorite: isFavorite });
}

export async function getUserStats(
  supabase?: SupabaseClient,
  providedUser?: any,
) {
  try {
    const client = supabase ?? getSupabaseBrowserClient();

    // Use provided user or check authentication
    let user = providedUser;
    if (!user) {
      user = await getAuthenticatedUser();
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 getUserStats: Using provided user:", user.email);
      }
    }

    if (!user) {
      logger.log("User not authenticated for stats");
      return {
        totalContent: 0,
        totalSetlists: 0,
        favoriteContent: 0,
        recentlyViewed: 0,
      };
    }

    // Get total content count
    const { count: totalContent } = await client
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get favorite content count
    const { count: favoriteContent } = await client
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_favorite", true);

    // Get setlists count (if table exists)
    let totalSetlists = 0;
    try {
      const { count } = await client
        .from("setlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      totalSetlists = count || 0;
    } catch (error) {
      logger.log("Setlists table not available yet");
      totalSetlists = 0;
    }

    // Get recently viewed count (using total content for now)
    const recentlyViewed = Math.min(totalContent || 0, 10);

    return {
      totalContent: totalContent || 0,
      totalSetlists,
      favoriteContent: favoriteContent || 0,
      recentlyViewed,
    };
  } catch (error) {
    logger.error("Error getting user stats:", error);
    return {
      totalContent: 0,
      totalSetlists: 0,
      favoriteContent: 0,
      recentlyViewed: 0,
    };
  }
}

// Keep the old function names for backward compatibility
export const getContent = getUserContent;
