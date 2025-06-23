import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"
import logger from "@/lib/logger"
import { getContentById } from "@/lib/content-service"
import { auth } from "@/lib/firebase"
import type { Database } from "@/types/supabase"

// Helper to get the current Firebase user
function getAuthenticatedUser() {
  if (auth && auth.currentUser) {
    return { id: auth.currentUser.uid, email: auth.currentUser.email }
  }
  return null
}

// Mock data for demo mode
const MOCK_SETLISTS = [
  {
    id: "mock-setlist-1",
    name: "Weekend Gig",
    description: "Songs for the Saturday night show",
    user_id: "demo-user",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    setlist_songs: [
      {
        id: "mock-song-1",
        setlist_id: "mock-setlist-1",
        content_id: "mock-1",
        position: 1,
        notes: "Start with this one to warm up the crowd",
        content: {
          id: "mock-1",
          title: "Wonderwall",
          artist: "Oasis",
          content_type: "Chord Chart",
        },
      },
      {
        id: "mock-song-2",
        setlist_id: "mock-setlist-1",
        content_id: "mock-3",
        position: 2,
        notes: "Slow it down a bit",
        content: {
          id: "mock-3",
          title: "Hallelujah",
          artist: "Leonard Cohen",
          content_type: "Lyrics",
        },
      },
      {
        id: "mock-song-3",
        setlist_id: "mock-setlist-1",
        content_id: "mock-5",
        position: 3,
        notes: "End with a bang!",
        content: {
          id: "mock-5",
          title: "Sweet Child O' Mine",
          artist: "Guns N' Roses",
          content_type: "Guitar Tab",
        },
      },
    ],
  },
  {
    id: "mock-setlist-2",
    name: "Acoustic Set",
    description: "Mellow songs for the coffee shop",
    user_id: "demo-user",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    setlist_songs: [
      {
        id: "mock-song-4",
        setlist_id: "mock-setlist-2",
        content_id: "mock-3",
        position: 1,
        notes: "Start with this classic",
        content: {
          id: "mock-3",
          title: "Hallelujah",
          artist: "Leonard Cohen",
          content_type: "Lyrics",
        },
      },
      {
        id: "mock-song-5",
        setlist_id: "mock-setlist-2",
        content_id: "mock-1",
        position: 2,
        notes: "Always a crowd pleaser",
        content: {
          id: "mock-1",
          title: "Wonderwall",
          artist: "Oasis",
          content_type: "Chord Chart",
        },
      },
    ],
  },
]

type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
type SetlistInsert = Database["public"]["Tables"]["setlists"]["Insert"]
type SetlistUpdate = Database["public"]["Tables"]["setlists"]["Update"]
type SetlistSong = Database["public"]["Tables"]["setlist_songs"]["Row"]
type SetlistSongInsert = Database["public"]["Tables"]["setlist_songs"]["Insert"]

export async function getUserSetlists(providedUser?: any) {
  try {
    console.log("🔍 getUserSetlists: Starting...")
    
    // Return mock data in demo mode
    if (!isSupabaseConfigured) {
      console.log("🔍 getUserSetlists: Demo mode detected")
      logger.log("Demo mode: Returning mock setlists")
      return Promise.all(
        MOCK_SETLISTS.map(async (sl) => ({
          ...sl,
          setlist_songs: await Promise.all(
            sl.setlist_songs.map(async (song: any) => ({
              ...song,
              content: await getContentById(song.content.id || song.content_id),
            }))
          ),
        }))
      )
    }

    console.log("🔍 getUserSetlists: Getting Supabase client...")
    const supabase = getSupabaseBrowserClient()

    // Use provided user or check authentication
    let user = providedUser
    if (!user) {
      console.log("🔍 getUserSetlists: Checking authentication...")
      user = await getAuthenticatedUser(supabase)
    } else {
      console.log("🔍 getUserSetlists: Using provided user:", user.email)
    }
    
    if (!user) {
      logger.log("User not authenticated, returning empty setlists")
      throw new Error("User not authenticated")
    }

    // Get all setlists for the user
    const { data: setlists, error: setlistsError } = await supabase
      .from("setlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (setlistsError) {
      logger.error("Error fetching setlists:", setlistsError)
      return []
    }

    // For each setlist, get the songs
    const setlistsWithSongs = await Promise.all(
      setlists.map(async (setlist: any) => {
        const { data: songs, error: songsError } = await supabase
          .from("setlist_songs")
          .select(
            `
            id,
            setlist_id,
            content_id,
            position,
            notes,
            content:content_id (
              id,
              title,
              artist,
              content_type,
              key,
              bpm,
              file_url,
              content_data
            )
          `,
          )
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true })

        if (songsError) {
          logger.error(`Error fetching songs for setlist ${setlist.id}:`, songsError)
          return { ...setlist, setlist_songs: [] }
        }

        // Format the songs to match the expected structure
        const formattedSongs = songs.map((song: any) => ({
          id: song.id,
          setlist_id: song.setlist_id,
          content_id: song.content_id,
          position: song.position,
          notes: song.notes,
          content: {
            id: song.content?.id || song.content_id,
            title: song.content?.title || "Unknown Title",
            artist: song.content?.artist || "Unknown Artist",
            content_type: song.content?.content_type || "Unknown Type",
            key: song.content?.key || null,
            bpm: song.content?.bpm || null,
            file_url: song.content?.file_url || null,
            content_data: song.content?.content_data || null,
          },
        }))

        return { ...setlist, setlist_songs: formattedSongs }
      }),
    )

    return setlistsWithSongs
  } catch (error) {
    logger.error("Error in getUserSetlists:", error)
    // Return mock data as fallback in case of errors
    return isSupabaseConfigured ? [] : MOCK_SETLISTS
  }
}

export async function getSetlistById(id: string) {
  try {
    // Return mock data in demo mode
    if (!isSupabaseConfigured) {
      const mockSetlist =
        MOCK_SETLISTS.find((setlist) => setlist.id === id) || MOCK_SETLISTS[0]
      return {
        ...mockSetlist,
        setlist_songs: await Promise.all(
          mockSetlist.setlist_songs.map(async (song: any) => ({
            ...song,
            content: await getContentById(song.content.id || song.content_id),
          }))
        ),
      }
    }

    const supabase = getSupabaseBrowserClient()

    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get the setlist
    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (setlistError) {
      logger.error("Error fetching setlist:", setlistError)
      throw setlistError
    }

    // Get the songs for this setlist
    const { data: songs, error: songsError } = await supabase
      .from("setlist_songs")
      .select(
        `
        id,
        setlist_id,
        content_id,
        position,
        notes,
        content:content_id (
          id,
          title,
          artist,
          content_type,
          key,
          bpm,
          file_url,
          content_data
        )
      `,
      )
      .eq("setlist_id", id)
      .order("position", { ascending: true })

    if (songsError) {
      logger.error(`Error fetching songs for setlist ${id}:`, songsError)
      return { ...setlist, setlist_songs: [] }
    }

    // Format the songs to match the expected structure
    const formattedSongs = songs.map((song: any) => ({
      id: song.id,
      setlist_id: song.setlist_id,
      content_id: song.content_id,
      position: song.position,
      notes: song.notes,
      content: {
        id: song.content?.id || song.content_id,
        title: song.content?.title || "Unknown Title",
        artist: song.content?.artist || "Unknown Artist",
        content_type: song.content?.content_type || "Unknown Type",
        key: song.content?.key || null,
        bpm: song.content?.bpm || null,
        file_url: song.content?.file_url || null,
        content_data: song.content?.content_data || null,
      },
    }))

    return { ...setlist, setlist_songs: formattedSongs }
  } catch (error) {
    logger.error("Error in getSetlistById:", error)
    // In case of error in production, throw the error
    // In demo mode, return mock data
    if (isSupabaseConfigured) {
      throw error
    }
    return MOCK_SETLISTS[0]
  }
}

export async function createSetlist(setlist: { name: string; description?: string }) {
  try {
    // Mock creation in demo mode
    if (!isSupabaseConfigured) {
      const newId = `mock-setlist-${Date.now()}`
      const newSetlist = {
        id: newId,
        ...setlist,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: "demo-user",
        setlist_songs: [],
      }

      logger.log("Demo mode: Created mock setlist", newSetlist)
      return newSetlist
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Create the setlist
    const { data, error } = await supabase
      .from("setlists")
      .insert({
        ...setlist,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      logger.error("Error creating setlist:", error)
      throw error
    }

    return { ...data, setlist_songs: [] }
  } catch (error) {
    logger.error("Error in createSetlist:", error)
    if (isSupabaseConfigured) {
      throw error
    }

    // Return mock data in demo mode
    return {
      id: `mock-setlist-${Date.now()}`,
      ...setlist,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "demo-user",
      setlist_songs: [],
    }
  }
}

export async function updateSetlist(id: string, updates: { name?: string; description?: string | null; performance_date?: string | null; venue?: string | null; notes?: string | null }) {
  try {
    // Mock update in demo mode
    if (!isSupabaseConfigured) {
      const mockSetlist = MOCK_SETLISTS.find((setlist) => setlist.id === id)
      if (mockSetlist) {
        const updatedSetlist = {
          ...mockSetlist,
          ...updates,
          updated_at: new Date().toISOString(),
        }
        logger.log("Demo mode: Updated mock setlist", updatedSetlist)
        return updatedSetlist
      }
      return MOCK_SETLISTS[0]
    }

    const supabase = getSupabaseBrowserClient()

    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Update the setlist
    const { data, error } = await supabase
      .from("setlists")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      logger.error("Error updating setlist:", error)
      throw error
    }

    // Get the songs for this setlist
    const { data: songs, error: songsError } = await supabase
      .from("setlist_songs")
      .select(
        `
        id,
        setlist_id,
        content_id,
        position,
        notes,
        content:content_id (
          id,
          title,
          artist,
          content_type,
          key,
          bpm,
          file_url,
          content_data
        )
      `,
      )
      .eq("setlist_id", id)
      .order("position", { ascending: true })

    if (songsError) {
      logger.error(`Error fetching songs for setlist ${id}:`, songsError)
      return { ...data, setlist_songs: [] }
    }

    // Format the songs to match the expected structure
    const formattedSongs = songs.map((song: any) => ({
      id: song.id,
      setlist_id: song.setlist_id,
      content_id: song.content_id,
      position: song.position,
      notes: song.notes,
      content: {
        id: song.content?.id || song.content_id,
        title: song.content?.title || "Unknown Title",
        artist: song.content?.artist || "Unknown Artist",
        content_type: song.content?.content_type || "Unknown Type",
        key: song.content?.key || null,
        bpm: song.content?.bpm || null,
        file_url: song.content?.file_url || null,
        content_data: song.content?.content_data || null,
      },
    }))

    return { ...data, setlist_songs: formattedSongs }
  } catch (error) {
    logger.error("Error in updateSetlist:", error)
    if (isSupabaseConfigured) {
      throw error
    }

    // Return mock data in demo mode
    const mockSetlist = MOCK_SETLISTS.find((setlist) => setlist.id === id) || MOCK_SETLISTS[0]
    return {
      ...mockSetlist,
      ...updates,
      updated_at: new Date().toISOString(),
    }
  }
}

export async function deleteSetlist(id: string) {
  try {
    // Mock delete in demo mode
    if (!isSupabaseConfigured) {
      logger.log("Demo mode: Deleted mock setlist with id", id)
      return true
    }

    const supabase = getSupabaseBrowserClient()

    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Delete all songs in the setlist first
    const { error: songsError } = await supabase.from("setlist_songs").delete().eq("setlist_id", id)

    if (songsError) {
      logger.error("Error deleting setlist songs:", songsError)
      throw songsError
    }

    // Then delete the setlist
    const { error } = await supabase.from("setlists").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      logger.error("Error deleting setlist:", error)
      throw error
    }

    return true
  } catch (error) {
    logger.error("Error in deleteSetlist:", error)
    if (isSupabaseConfigured) {
      throw error
    }
    return true // Return success in demo mode
  }
}

export async function addSongToSetlist(setlistId: string, contentId: string, position: number, notes = "") {
  try {
    // Mock add song in demo mode
    if (!isSupabaseConfigured) {
      logger.log("Demo mode: Added mock song to setlist", { setlistId, contentId, position, notes })
      return {
        id: `mock-song-${Date.now()}`,
        setlist_id: setlistId,
        content_id: contentId,
        position,
        notes,
        title: "New Song",
        artist: "Demo Artist",
        content_type: "Chord Chart",
      }
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Verify the setlist belongs to the user
    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .select("id")
      .eq("id", setlistId)
      .eq("user_id", user.id)
      .single()

    if (setlistError) {
      logger.error("Error verifying setlist ownership:", setlistError)
      throw setlistError
    }

    // Use a different approach to avoid constraint violations
    // First, shift all positions to a higher range (add 1000 to avoid conflicts)
    const { data: songsToShift, error: fetchError } = await supabase
      .from("setlist_songs")
      .select("id, position")
      .eq("setlist_id", setlistId)
      .gte("position", position)
      .order("position", { ascending: true })

    if (fetchError) {
      logger.error("Error fetching songs to shift:", fetchError)
      throw fetchError
    }

    // Shift to temporary high positions in a single query
    if (songsToShift.length > 0) {
      const { error: tempShiftError } = await supabase
        .from("setlist_songs")
        .upsert(
          songsToShift.map((s: any) => ({ id: s.id, position: s.position + 1000 })),
          { onConflict: "id" },
        )

      if (tempShiftError) {
        logger.error("Error temp shifting song positions:", tempShiftError)
        throw tempShiftError
      }
    }

    // Add the new song at the desired position
    const { data: song, error: songError } = await supabase
      .from("setlist_songs")
      .insert({
        setlist_id: setlistId,
        content_id: contentId,
        position,
        notes,
      })
      .select()
      .single()

    if (songError) {
      logger.error("Error adding song to setlist:", songError)
      throw songError
    }

    // Now shift the temporarily moved songs back to their correct positions
    if (songsToShift.length > 0) {
      const { error: finalShiftError } = await supabase
        .from("setlist_songs")
        .upsert(
          songsToShift.map((s: any) => ({ id: s.id, position: s.position + 1 })),
          { onConflict: "id" },
        )

      if (finalShiftError) {
        logger.error("Error final shifting song positions:", finalShiftError)
        throw finalShiftError
      }
    }

    // Get the content details
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("title, artist, content_type")
      .eq("id", contentId)
      .single()

    if (contentError) {
      logger.error("Error fetching content details:", contentError)
      return {
        ...song,
        title: "Unknown Title",
        artist: "Unknown Artist",
        content_type: "Unknown Type",
      }
    }

    return {
      ...song,
      title: content.title,
      artist: content.artist,
      content_type: content.content_type,
    }
  } catch (error) {
    logger.error("Error in addSongToSetlist:", error)
    if (isSupabaseConfigured) {
      throw error
    }

    // Return mock data in demo mode
    return {
      id: `mock-song-${Date.now()}`,
      setlist_id: setlistId,
      content_id: contentId,
      position,
      notes,
      title: "New Song",
      artist: "Demo Artist",
      content_type: "Chord Chart",
    }
  }
}

export async function removeSongFromSetlist(songId: string) {
  try {
    // Mock remove song in demo mode
    if (!isSupabaseConfigured) {
      logger.log("Demo mode: Removed mock song from setlist", { songId })
      return true
    }

    const supabase = getSupabaseBrowserClient()

    // Check if user is authenticated
    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get the song details including setlist_id
    const { data: song, error: songError } = await supabase
      .from("setlist_songs")
      .select(`
        id,
        position,
        setlist_id,
        setlists!inner (
          id,
          user_id
        )
      `)
      .eq("id", songId)
      .single()

    if (songError) {
      logger.error("Error getting song details:", songError)
      throw songError
    }

    // Verify the setlist belongs to the user
    if (song.setlists.user_id !== user.id) {
      throw new Error("Unauthorized: Setlist does not belong to user")
    }

    const setlistId = song.setlist_id
    const songPosition = song.position

    // Remove the song
    const { error: removeError } = await supabase.from("setlist_songs").delete().eq("id", songId)

    if (removeError) {
      logger.error("Error removing song from setlist:", removeError)
      throw removeError
    }

    // Get all songs with position > the removed song's position
    const { data: songsToShift, error: fetchError } = await supabase
      .from("setlist_songs")
      .select("id, position")
      .eq("setlist_id", setlistId)
      .gt("position", songPosition)
      .order("position", { ascending: true })

    if (fetchError) {
      logger.error("Error fetching songs to shift:", fetchError)
      throw fetchError
    }

    // Shift positions of remaining songs using individual updates
    if (songsToShift.length > 0) {
      for (const song of songsToShift) {
        const { error: updateError } = await supabase
          .from("setlist_songs")
          .update({ position: song.position - 1 })
          .eq("id", song.id)

        if (updateError) {
          logger.error("Error shifting song position:", updateError)
          throw updateError
        }
      }
    }

    return true
  } catch (error) {
    logger.error("Error in removeSongFromSetlist:", error)
    if (isSupabaseConfigured) {
      throw error
    }
    return true // Return success in demo mode
  }
}

export async function updateSongPosition(setlistId: string, songId: string, newPosition: number) {
  try {
    // Mock update position in demo mode
    if (!isSupabaseConfigured) {
      logger.log("Demo mode: Updated mock song position", { setlistId, songId, newPosition })
      return true
    }

    const supabase = getSupabaseBrowserClient()

    const user = getAuthenticatedUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Verify the setlist belongs to the user
    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .select("id")
      .eq("id", setlistId)
      .eq("user_id", user.id)
      .single()

    if (setlistError) {
      logger.error("Error verifying setlist ownership:", setlistError)
      throw setlistError
    }

    // Get the current position of the song
    const { data: song, error: songError } = await supabase
      .from("setlist_songs")
      .select("position")
      .eq("id", songId)
      .eq("setlist_id", setlistId)
      .single()

    if (songError) {
      logger.error("Error getting song position:", songError)
      throw songError
    }

    const currentPosition = song.position

    // If the position hasn't changed, do nothing
    if (currentPosition === newPosition) {
      return true
    }

    // Get all songs in the setlist ordered by position
    const { data: allSongs, error: fetchAllError } = await supabase
      .from("setlist_songs")
      .select("id, position")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: true })

    if (fetchAllError) {
      logger.error("Error fetching all songs:", fetchAllError)
      throw fetchAllError
    }

    // Find the song to move
    const songToMove = allSongs.find((s: any) => s.id === songId)
    if (!songToMove) {
      throw new Error("Song not found in setlist")
    }

    // Create a reordered list by moving the song to the new position
    // First, create an ordered list of all songs by their current positions
    const orderedSongs = [...allSongs].sort((a: any, b: any) => a.position - b.position)
    
    // Remove the song to move from its current position
    const songsWithoutMoved = orderedSongs.filter((s: any) => s.id !== songId)
    
    // Calculate the target index (0-based) for insertion
    // If moving to position N, we want to insert at index N-1
    let targetIndex = newPosition - 1
    
    // Adjust target index if we're moving a song from an earlier position
    // because removing it shifts all later positions down by 1
    if (currentPosition < newPosition) {
      targetIndex = Math.min(targetIndex, songsWithoutMoved.length)
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, songsWithoutMoved.length))
    }
    
    // Insert the song at the target position
    const reorderedSongs = [...songsWithoutMoved]
    reorderedSongs.splice(targetIndex, 0, songToMove)
    
    // Create updates with sequential positions
    const updates = reorderedSongs.map((song: any, index: number) => ({
      id: song.id,
      position: index + 1
    }))
    
    // Validate updates before sending to database
    if (!updates.length) {
      throw new Error("No songs to update")
    }
    
    // Check for duplicate positions or invalid IDs
    const positions = updates.map((u: any) => u.position)
    const ids = updates.map((u: any) => u.id)
    
    if (new Set(positions).size !== positions.length) {
      throw new Error("Duplicate positions detected in updates")
    }
    
    if (ids.some((id: any) => !id)) {
      throw new Error("Invalid song ID detected in updates")
    }
    
    // Filter out updates that don't actually change the position
    const originalPositions = new Map(allSongs.map((s: any) => [s.id, s.position]))
    const actualUpdates = updates.filter((u: any) => originalPositions.get(u.id) !== u.position)
    
    if (actualUpdates.length === 0) {
      logger.log("No position changes needed, skipping database update")
      return true
    }
    
    // Log the updates for debugging
          logger.log("Updating song positions with:", { 
        setlistId, 
        songId, 
        newPosition, 
        currentPosition, 
        totalSongs: allSongs.length,
        allSongPositions: allSongs.map((s: any) => ({ id: s.id, position: s.position })),
        allUpdates: updates,
        actualUpdates: actualUpdates
      })
    
        // Update songs using a safe two-phase approach to avoid constraint conflicts
    // Phase 1: move all affected songs to temporary high positions
    const maxPosition = Math.max(...allSongs.map((s: any) => s.position))
    const tempOffset = maxPosition + 1000

    // Use individual updates to avoid constraint violations
    for (let i = 0; i < actualUpdates.length; i++) {
      const update = actualUpdates[i]
      const { error: tempError } = await supabase
        .from("setlist_songs")
        .update({ position: tempOffset + i })
        .eq("id", update.id)

      if (tempError) {
        logger.error("Error setting temporary position:", tempError)
        throw new Error(
          `Failed to set temporary positions: ${tempError.message || tempError.details || 'Unknown database error'}`,
        )
      }
    }

    // Phase 2: update to final positions
    for (const update of actualUpdates) {
      const { error: updateError } = await supabase
        .from("setlist_songs")
        .update({ position: update.position })
        .eq("id", update.id)

      if (updateError) {
        logger.error("Error updating final song position:", updateError)
        throw new Error(
          `Failed to update song positions: ${updateError.message || updateError.details || 'Unknown database error'}`,
        )
      }
    }

    return true
  } catch (error) {
    logger.error("Error in updateSongPosition:", error)
    if (isSupabaseConfigured) {
      // Provide a more descriptive error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      throw new Error(`Failed to update song position: ${errorMessage}`)
    }
    return true // Return success in demo mode
  }
}
