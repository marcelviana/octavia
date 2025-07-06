import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

// GET /api/setlists/[id] - Get specific setlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
      logger.error("Error fetching setlist:", setlistError)
      throw setlistError
    }

    // Get the setlist_songs
    const { data: setlistSongs, error: songsError } = await supabase
      .from("setlist_songs")
      .select("id, setlist_id, content_id, position, notes")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: true })

    if (songsError) {
      logger.error(`Error fetching songs for setlist ${setlistId}:`, songsError)
      return NextResponse.json({ ...setlist, setlist_songs: [] })
    }

    if (!setlistSongs || setlistSongs.length === 0) {
      return NextResponse.json({ ...setlist, setlist_songs: [] })
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

    return NextResponse.json({ ...setlist, setlist_songs: formattedSongs })
  } catch (error: any) {
    logger.error('Error in setlist API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/setlists/[id] - Update setlist
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Await params for Next.js 15
    const { id: setlistId } = await params

    const body = await request.json()
    const supabase = getSupabaseServiceClient()
    
    const updateData = {
      name: body.name,
      description: body.description || null,
      performance_date: body.performance_date || null,
      venue: body.venue || null,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
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

    // Get the songs for this setlist
    const { data: setlistSongs, error: songsError } = await supabase
      .from("setlist_songs")
      .select("id, setlist_id, content_id, position, notes")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: true })

    if (songsError) {
      logger.error(`Error fetching songs for setlist ${setlistId}:`, songsError)
      return NextResponse.json({ ...setlist, setlist_songs: [] })
    }

    if (!setlistSongs || setlistSongs.length === 0) {
      return NextResponse.json({ ...setlist, setlist_songs: [] })
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

    return NextResponse.json({ ...setlist, setlist_songs: formattedSongs })
  } catch (error: any) {
    logger.error('Error updating setlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/setlists/[id] - Delete setlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
  } catch (error: any) {
    logger.error('Error deleting setlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 