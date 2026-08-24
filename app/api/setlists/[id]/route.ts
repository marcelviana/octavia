import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation, setlistSchemas } from '@/lib/api-validation-middleware'
import type { SetlistSong, ContentData, FormattedSetlistSong } from '@/types/setlist'
import { z } from 'zod'

// GET /api/setlists/[id] - Get specific setlist
const getSetlistByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const limited = enforceUserLimit(user.uid, 'setlist-read', RATE_LIMITS.READ)
    if (limited) return limited

    // Await params for Next.js 15
    const { id: setlistId } = await params

    const supabase = getSupabaseServiceClient()
    
    // Get the setlist
    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", setlistId)
      .eq("user_id", user.uid)
      .single()

    if (setlistError) {
      if (setlistError.code === 'PGRST116') {
        // No rows found - setlist doesn't exist
        return NextResponse.json(
          { error: 'Setlist not found' },
          { status: 404 }
        )
      }
      logger.error("Error fetching setlist:", setlistError)
      throw setlistError
    }

    if (!setlist) {
      return NextResponse.json(
        { error: 'Setlist not found' },
        { status: 404 }
      )
    }

    // TypeScript type narrowing - setlist is guaranteed to be non-null here
    const setlistData = setlist as Record<string, unknown>

    // Get the setlist_songs
    const { data: setlistSongs, error: songsError } = await supabase
      .from("setlist_songs")
      .select("id, setlist_id, content_id, position, notes")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: true })

    if (songsError) {
      logger.error(`Error fetching songs for setlist ${setlistId}:`, songsError)
      return NextResponse.json({ ...setlistData, setlist_songs: [] })
    }

    if (!setlistSongs || setlistSongs.length === 0) {
      return NextResponse.json({ ...setlistData, setlist_songs: [] })
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
      logger.error(`Error fetching content for setlist ${setlistId}:`, contentError)
    }

    // Create a map of content by ID for efficient lookup
    const contentMap = new Map<string, any>()
    if (contentData) {
      contentData.forEach((content: ContentData) => {
        contentMap.set(content.id, content)
      })
    }

    // Format the songs with proper content data
    const formattedSongs = setlistSongs.map((song: SetlistSong): FormattedSetlistSong => {
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

    return NextResponse.json({ ...setlistData, setlist_songs: formattedSongs })
  } catch (error: unknown) {
    logger.error('Error in setlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrapper for GET handler
const wrappedGetSetlistHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Setlist ID is required' }, { status: 400 })
  }
  
  const params = Promise.resolve({ id })
  return getSetlistByIdHandler(request, { params })
}

export const GET = wrappedGetSetlistHandler

// PUT /api/setlists/[id] - Update setlist
const updateSetlistHandler = withBodyValidation(setlistSchemas.update, {
  rateLimit: { familia: 'setlist-mutate', config: RATE_LIMITS.MUTATE }
})(
  async (request: Request, validatedData: z.infer<typeof setlistSchemas.update>, user?: { uid: string }, params?: { id: string }) => {
    try {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (!params?.id) {
        return new Response(
          JSON.stringify({ error: 'Setlist ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const setlistId = params.id
      const supabase = getSupabaseServiceClient()

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (validatedData.name !== undefined) {
        updateData.name = validatedData.name
      }
      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description || null
      }

    // Update the setlist
    const { data: setlist, error } = await supabase
      .from("setlists")
      .update(updateData)
      .eq("id", setlistId)
      .eq("user_id", user.uid)
      .select()
      .single()

    if (error) {
      logger.error("Error updating setlist:", error)
      throw error
    }

    if (!setlist) {
      return new Response(
        JSON.stringify({ error: 'Setlist not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // TypeScript type narrowing - setlist is guaranteed to be non-null here
    const setlistData = setlist as Record<string, unknown>

      // Get the songs for this setlist
      const { data: setlistSongs, error: songsError } = await supabase
        .from("setlist_songs")
        .select("id, setlist_id, content_id, position, notes")
        .eq("setlist_id", setlistId)
        .order("position", { ascending: true })

      if (songsError) {
        logger.error(`Error fetching songs for setlist ${setlistId}:`, songsError)
        return new Response(JSON.stringify({ ...setlistData, setlist_songs: [] }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (!setlistSongs || setlistSongs.length === 0) {
        return new Response(JSON.stringify({ ...setlistData, setlist_songs: [] }), {
          headers: { 'Content-Type': 'application/json' }
        })
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
        logger.error(`Error fetching content for setlist ${setlistId}:`, contentError)
      }

      // Create a map of content by ID for efficient lookup
      const contentMap = new Map<string, any>()
      if (contentData) {
        contentData.forEach((content: ContentData) => {
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

      return new Response(JSON.stringify({ ...setlistData, setlist_songs: formattedSongs }), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: unknown) {
      logger.error('Error updating setlist:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

// Wrapper for PUT handler
const wrappedUpdateSetlistHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Setlist ID is required' }, { status: 400 })
  }

  // Convert NextRequest to Request for the middleware, then convert Response back to NextResponse
  const response = await updateSetlistHandler(request as unknown as Request, { id })
  const data = await response.json()
  return NextResponse.json(data, { status: response.status, headers: response.headers })
}

export const PUT = wrappedUpdateSetlistHandler

// DELETE /api/setlists/[id] - Delete setlist
const deleteSetlistHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const limited = enforceUserLimit(user.uid, 'setlist-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

    // Await params for Next.js 15
    const { id: setlistId } = await params

    const supabase = getSupabaseServiceClient()

    // Delete all songs in the setlist first
    const { error: songsError } = await supabase
      .from("setlist_songs")
      .delete()
      .eq("setlist_id", setlistId)

    if (songsError) {
      logger.error("Error deleting setlist songs:", songsError)
      throw songsError
    }

    // Then delete the setlist
    const { error } = await supabase
      .from("setlists")
      .delete()
      .eq("id", setlistId)
      .eq("user_id", user.uid)

    if (error) {
      logger.error("Error deleting setlist:", error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Error deleting setlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrapper for DELETE handler
const wrappedDeleteSetlistHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Setlist ID is required' }, { status: 400 })
  }
  
  const params = Promise.resolve({ id })
  return deleteSetlistHandler(request, { params })
}

export const DELETE = wrappedDeleteSetlistHandler
