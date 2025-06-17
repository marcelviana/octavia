import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]
type ContentInsert = Database["public"]["Tables"]["content"]["Insert"]
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"]

// Mock data for demo mode
const MOCK_CONTENT = [
  {
    id: "mock-1",
    title: "Wonderwall",
    artist: "Oasis",
    content_type: "Chord Chart",
    content_data: {
      chords: "Em7 G D A7sus4",
      key: "E minor",
      tempo: 86,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    user_id: "demo-user",
    is_favorite: true,
    tags: ["rock", "90s", "acoustic"],
  },
  {
    id: "mock-2",
    title: "Hotel California",
    artist: "Eagles",
    content_type: "Guitar Tab",
    content_data: {
      tuning: "Standard",
      difficulty: "Intermediate",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    user_id: "demo-user",
    is_favorite: false,
    tags: ["rock", "classic", "guitar solo"],
  },
  {
    id: "mock-3",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    content_type: "Lyrics",
    content_data: {
      verses: 5,
      has_chorus: true,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    user_id: "demo-user",
    is_favorite: true,
    tags: ["folk", "acoustic", "ballad"],
  },
  {
    id: "mock-4",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    content_type: "Sheet Music",
    file_url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    content_data: {
      pages: 8,
      instruments: ["piano", "vocals"],
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    user_id: "demo-user",
    is_favorite: false,
    tags: ["rock", "classic", "complex"],
  },
  {
    id: "mock-5",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    content_type: "Guitar Tab",
    content_data: {
      tuning: "Standard",
      difficulty: "Advanced",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    user_id: "demo-user",
    is_favorite: true,
    tags: ["rock", "80s", "guitar solo"],
  },
]

export async function getUserContent() {
  try {
    // Return mock data in demo mode
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Returning mock content")
      return MOCK_CONTENT
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("User not authenticated, returning empty content")
      return []
    }

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching content:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserContent:", error)
    // Return mock data as fallback in case of errors
    return isSupabaseConfigured ? [] : MOCK_CONTENT
  }
}

export async function getContentById(id: string) {
  try {
    // Return mock data in demo mode
    if (!isSupabaseConfigured) {
      const mockItem = MOCK_CONTENT.find((item) => item.id === id)
      if (mockItem) {
        return mockItem
      }
      // If ID not found in mock data, return the first item
      return MOCK_CONTENT[0]
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase.from("content").select("*").eq("id", id).eq("user_id", user.id).single()

    if (error) {
      console.error("Error fetching content:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in getContentById:", error)
    // In case of error in production, throw the error
    // In demo mode, return mock data
    if (isSupabaseConfigured) {
      throw error
    }
    return MOCK_CONTENT[0]
  }
}

export async function createContent(content: ContentInsert) {
  try {
    // Mock creation in demo mode
    if (!isSupabaseConfigured) {
      const newId = `mock-${Date.now()}`
      const newContent = {
        id: newId,
        ...content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "demo-user",
        is_favorite: false,
        tags: [],
      }

      // In a real app, we would add this to the mock data array
      // For demo purposes, we'll just return it
      console.log("Demo mode: Created mock content", newContent)
      return newContent
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Ensure user_id is set
    const contentWithUser = {
      ...content,
      user_id: user.id,
    }

    const { data, error } = await supabase.from("content").insert(contentWithUser).select().single()

    if (error) {
      console.error("Error creating content:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createContent:", error)
    if (isSupabaseConfigured) {
      throw error
    }

    // Return mock data in demo mode
    return {
      id: `mock-${Date.now()}`,
      ...content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "demo-user",
      is_favorite: false,
    }
  }
}

export async function updateContent(id: string, content: ContentUpdate) {
  try {
    // Mock update in demo mode
    if (!isSupabaseConfigured) {
      const mockItem = MOCK_CONTENT.find((item) => item.id === id)
      if (mockItem) {
        const updatedContent = {
          ...mockItem,
          ...content,
          updated_at: new Date().toISOString(),
        }
        console.log("Demo mode: Updated mock content", updatedContent)
        return updatedContent
      }
      return MOCK_CONTENT[0]
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
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
      console.error("Error updating content:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in updateContent:", error)
    if (isSupabaseConfigured) {
      throw error
    }

    // Return mock data in demo mode
    const mockItem = MOCK_CONTENT.find((item) => item.id === id) || MOCK_CONTENT[0]
    return {
      ...mockItem,
      ...content,
      updated_at: new Date().toISOString(),
    }
  }
}

export async function deleteContent(id: string) {
  try {
    // Mock delete in demo mode
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Deleted mock content with id", id)
      return true
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase.from("content").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting content:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteContent:", error)
    if (isSupabaseConfigured) {
      throw error
    }
    return true // Return success in demo mode
  }
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  return updateContent(id, { is_favorite: isFavorite })
}

export async function getUserStats() {
  try {
    // Return mock stats in demo mode
    if (!isSupabaseConfigured) {
      return {
        totalContent: MOCK_CONTENT.length,
        totalSetlists: 2,
        favoriteContent: MOCK_CONTENT.filter((item) => item.is_favorite).length,
        recentlyViewed: 3,
      }
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log("User not authenticated for stats")
      return {
        totalContent: 0,
        totalSetlists: 0,
        favoriteContent: 0,
        recentlyViewed: 0,
      }
    }

    // Get total content count
    const { count: totalContent } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get favorite content count
    const { count: favoriteContent } = await supabase
      .from("content")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_favorite", true)

    // Get setlists count (if table exists)
    let totalSetlists = 0
    try {
      const { count } = await supabase
        .from("setlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      totalSetlists = count || 0
    } catch (error) {
      console.log("Setlists table not available yet")
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
    console.error("Error getting user stats:", error)
    // Return default values if there's an error
    if (isSupabaseConfigured) {
      return {
        totalContent: 0,
        totalSetlists: 0,
        favoriteContent: 0,
        recentlyViewed: 0,
      }
    }

    // Return mock stats in demo mode
    return {
      totalContent: MOCK_CONTENT.length,
      totalSetlists: 2,
      favoriteContent: MOCK_CONTENT.filter((item) => item.is_favorite).length,
      recentlyViewed: 3,
    }
  }
}

// Keep the old function names for backward compatibility
export const getContent = getUserContent
