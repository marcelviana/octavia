import { NextRequest, NextResponse } from "next/server"
import { requireAuthServer } from "@/lib/firebase-server-utils"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import logger from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Setlists API: Starting...")
    
    // Get authenticated user
    const user = await requireAuthServer(req)
    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    console.log("🔍 Setlists API: User authenticated:", user.email)

    // Get service client (bypasses RLS)
    const supabase = getSupabaseServiceClient()

    // Get all setlists for the user
    const { data: setlists, error: setlistsError } = await supabase
      .from("setlists")
      .select("*")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false })

    if (setlistsError) {
      console.error("🔍 Setlists API: Error fetching setlists:", setlistsError)
      logger.error("Error fetching setlists:", setlistsError)
      return NextResponse.json({ error: "Failed to fetch setlists", details: setlistsError }, { status: 500 })
    }

    console.log("🔍 Setlists API: Found", setlists?.length || 0, "setlists")

    // For each setlist, get the songs with content
    const setlistsWithSongs = await Promise.all(
      setlists.map(async (setlist: any) => {
        console.log("🔍 Setlists API: Fetching songs for setlist:", setlist.name)
        
        const { data: songs, error: songsError } = await supabase
          .from("setlist_songs")
          .select(`
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
          `)
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true })

        if (songsError) {
          console.error("🔍 Setlists API: Error fetching songs for setlist", setlist.id, ":", songsError)
          logger.error(`Error fetching songs for setlist ${setlist.id}:`, songsError)
          return { ...setlist, setlist_songs: [] }
        }

        console.log("🔍 Setlists API: Found", songs?.length || 0, "songs for setlist:", setlist.name)
        
        // Debug the first song if available
        if (songs && songs.length > 0) {
          console.log("🔍 Setlists API: First song data:", {
            id: songs[0].id,
            content_id: songs[0].content_id,
            content: songs[0].content,
            title: (songs[0].content as any)?.title,
            artist: (songs[0].content as any)?.artist
          })
        }

        // Format the songs to match the expected structure
        const formattedSongs = songs.map((song: any) => {
          const formattedSong = {
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
          }
          
          // Log when we're falling back to "Unknown"
          if (!song.content?.title) {
            console.log("🔍 Setlists API: Missing title for song:", song.content_id, "content data:", song.content)
          }
          if (!song.content?.artist) {
            console.log("🔍 Setlists API: Missing artist for song:", song.content_id, "content data:", song.content)
          }
          
          return formattedSong
        })

        return { ...setlist, setlist_songs: formattedSongs }
      }),
    )

    console.log("🔍 Setlists API: Returning", setlistsWithSongs.length, "setlists with songs")
    return NextResponse.json({ setlists: setlistsWithSongs })

  } catch (error) {
    console.error("🔍 Setlists API: Error:", error)
    logger.error("Error in setlists API:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
} 