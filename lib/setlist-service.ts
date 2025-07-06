import logger from "@/lib/logger"
import { getContentById } from "@/lib/content-service"
import { auth } from "@/lib/firebase"
import type { Database } from "@/types/supabase"

// Helper to get the current Firebase user with better error handling
function getAuthenticatedUser() {
  try {
    if (auth && auth.currentUser) {
      console.log("🔍 getAuthenticatedUser: Firebase user found:", auth.currentUser.email)
      return { id: auth.currentUser.uid, email: auth.currentUser.email }
    }
    console.log("🔍 getAuthenticatedUser: No Firebase user found")
    return null
  } catch (error) {
    console.error("🔍 getAuthenticatedUser: Error getting Firebase user:", error)
    return null
  }
}

type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
type SetlistInsert = Database["public"]["Tables"]["setlists"]["Insert"]
type SetlistUpdate = Database["public"]["Tables"]["setlists"]["Update"]
type SetlistSong = Database["public"]["Tables"]["setlist_songs"]["Row"]
type SetlistSongInsert = Database["public"]["Tables"]["setlist_songs"]["Insert"]

export async function getUserSetlists(providedUser?: any) {
  try {
    console.log("🔍 getUserSetlists: Starting...")

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      console.log("🔍 getUserSetlists: Checking authentication...")
      user = getAuthenticatedUser()
    } else {
      console.log("🔍 getUserSetlists: Using provided user:", user.email)
    }
    
    if (!user) {
      console.log("🔍 getUserSetlists: User not authenticated, returning empty setlists")
      logger.log("User not authenticated, returning empty setlists")
      return []
    }

    console.log("🔍 getUserSetlists: Fetching setlists for user:", user.id)

    // Get Firebase ID token
    const { auth } = await import("@/lib/firebase")
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }
    
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error("Firebase user not found")
    }
    
    const idToken = await firebaseUser.getIdToken()

    // Get setlists via API
    const response = await fetch('/api/setlists', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("🔍 getUserSetlists: API error:", errorData)
      logger.error("Error fetching setlists:", errorData)
      return []
    }

    const setlists = await response.json()
    console.log("🔍 getUserSetlists: Returning", setlists.length, "setlists with songs")
    return setlists
  } catch (error) {
    console.error("🔍 getUserSetlists: Error:", error)
    logger.error("Error in getUserSetlists:", error)
    return []
  }
}

export async function getSetlistById(id: string) {
  try {
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) {
      throw new Error("Authentication failed")
    }

    const response = await fetch(`/api/setlists/${id}`, {
      headers: { Authorization: `Bearer ${idToken}` }
    })

    if (!response.ok) {
      throw new Error(`Failed to load setlist: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error("Error in getSetlistById:", error)
    throw error
  }
}

export async function createSetlist(setlist: { 
  name: string; 
  description?: string | null; 
  performance_date?: string | null; 
  venue?: string | null; 
  notes?: string | null; 
  user_id?: string;
}) {
  try {
    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get Firebase ID token from the auth object
    const { auth } = await import("@/lib/firebase")
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }
    
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error("Firebase user not found")
    }
    
    const idToken = await firebaseUser.getIdToken()

    // Create the setlist via API
    const response = await fetch('/api/setlists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name: setlist.name,
        description: setlist.description || null,
        performance_date: setlist.performance_date || null,
        venue: setlist.venue || null,
        notes: setlist.notes || null,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create setlist')
    }

    const data = await response.json()
    return data
  } catch (error) {
    logger.error("Error in createSetlist:", error)
    throw error
  }
}

export async function updateSetlist(id: string, updates: { name?: string; description?: string | null; performance_date?: string | null; venue?: string | null; notes?: string | null }) {
  try {
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) {
      throw new Error("Authentication failed")
    }

    const response = await fetch(`/api/setlists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      throw new Error(`Failed to update setlist: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    logger.error("Error in updateSetlist:", error)
    throw error
  }
}

export async function deleteSetlist(id: string) {
  try {
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) {
      throw new Error("Authentication failed")
    }

    const response = await fetch(`/api/setlists/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${idToken}` }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete setlist: ${response.status}`)
    }

    return true
  } catch (error) {
    logger.error("Error in deleteSetlist:", error)
    throw error
  }
}

export async function addSongToSetlist(setlistId: string, contentId: string, position: number, notes = "") {
  try {
    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get Firebase ID token
    const { auth } = await import("@/lib/firebase")
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }
    
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error("Firebase user not found")
    }
    
    const idToken = await firebaseUser.getIdToken()

    // Add song to setlist via API
    const response = await fetch(`/api/setlists/${setlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        contentId,
        position,
        notes,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add song to setlist')
    }

    const song = await response.json()
    return song
  } catch (error) {
    logger.error("Error in addSongToSetlist:", error)
    throw error
  }
}

export async function removeSongFromSetlist(songId: string) {
  try {
    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get Firebase ID token
    const { auth } = await import("@/lib/firebase")
    if (!auth) {
      throw new Error("Firebase auth not initialized")
    }
    
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      throw new Error("Firebase user not found")
    }
    
    const idToken = await firebaseUser.getIdToken()

    // Remove song from setlist via API
    const response = await fetch(`/api/setlists/songs/${songId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to remove song from setlist')
    }

    return true
  } catch (error) {
    logger.error("Error in removeSongFromSetlist:", error)
    throw error
  }
}

export async function updateSongPosition(setlistId: string, songId: string, newPosition: number) {
  try {
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) {
      throw new Error("Authentication failed")
    }

    const response = await fetch(`/api/setlists/songs/${songId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ setlistId, newPosition }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update song position: ${response.status}`)
    }

    return true
  } catch (error) {
    logger.error("Error in updateSongPosition:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to update song position: ${errorMessage}`)
  }
}
