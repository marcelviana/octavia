import { NextRequest, NextResponse } from "next/server"
import { requireAuthServer } from "@/lib/firebase-server-utils"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import logger from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limit"
import { withBodyValidation, setlistSchemas } from "@/lib/api-validation-middleware"

// GET /api/setlists - Get user's setlists
const getSetlistsHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServiceClient()
    
    // Get all setlists for the user
    const { data: setlists, error: setlistsError } = await supabase
      .from("setlists")
      .select("*")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false })

    if (setlistsError) {
      logger.error("Error fetching setlists:", setlistsError)
      throw setlistsError
    }

    // For each setlist, get the songs
    const setlistsWithSongs = await Promise.all(
      (setlists || []).map(async (setlist: any) => {
        // Get the setlist_songs
        const { data: setlistSongs, error: songsError } = await supabase
          .from("setlist_songs")
          .select("id, setlist_id, content_id, position, notes")
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true })

        if (songsError) {
          logger.error(`Error fetching songs for setlist ${setlist.id}:`, songsError)
          return { ...setlist, setlist_songs: [] }
        }

        if (!setlistSongs || setlistSongs.length === 0) {
          return { ...setlist, setlist_songs: [] }
        }

        // Get all unique content IDs
        const contentIds = [...new Set(setlistSongs.map((song: any) => song.content_id))]

        // Fetch content separately
        const { data: contentData, error: contentError } = await supabase
          .from("content")
          .select("id, title, artist, content_type, key, bpm, file_url, content_data")
          .in("id", contentIds)
          .eq("user_id", user.uid)

        if (contentError) {
          logger.error(`Error fetching content for setlist ${setlist.id}:`, contentError)
        }

        // Create a map of content by ID for efficient lookup
        const contentMap = new Map<string, any>()
        if (contentData) {
          contentData.forEach((content: any) => {
            contentMap.set(content.id, content)
          })
        }

        // Format the songs with proper content data
        const formattedSongs = setlistSongs.map((song: any) => {
          const content = contentMap.get(song.content_id)
          
          return {
            id: song.id,
            setlist_id: song.setlist_id,
            content_id: song.content_id,
            position: song.position,
            notes: song.notes,
            content: {
              id: content?.id || song.content_id,
              title: content?.title || "Unknown Title",
              artist: content?.artist || "Unknown Artist",
              content_type: content?.content_type || "Unknown Type",
              key: content?.key || null,
              bpm: content?.bpm || null,
              file_url: content?.file_url || null,
              content_data: content?.content_data || null,
            },
          }
        })

        return { ...setlist, setlist_songs: formattedSongs }
      }),
    )

    return NextResponse.json(setlistsWithSongs)
  } catch (error: any) {
    logger.error('Error in setlists API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(getSetlistsHandler, 100)

// POST /api/setlists - Create new setlist
const createSetlistHandler = withBodyValidation(setlistSchemas.create)(
  async (request: Request, validatedData: any, user: any) => {
    try {
      const supabase = getSupabaseServiceClient()

      const setlistData = {
        name: validatedData.name,
        description: validatedData.description || null,
        performance_date: validatedData.performance_date || null,
        venue: validatedData.venue || null,
        notes: validatedData.notes || null,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: setlist, error } = await supabase
        .from('setlists')
        .insert(setlistData)
        .select()
        .single()

      if (error) {
        logger.error("Error creating setlist:", error)
        throw error
      }

      return new Response(JSON.stringify({ ...setlist, setlist_songs: [] }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      logger.error('Error creating setlist:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

export const POST = withRateLimit(createSetlistHandler, 100) 