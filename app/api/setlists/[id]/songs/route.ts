import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

// POST /api/setlists/[id]/songs - Add song to setlist
export async function POST(
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

    const body = await request.json()
    const { contentId, position, notes = "" } = body
    
    if (!contentId || !position) {
      return NextResponse.json(
        { error: 'Content ID and position are required' },
        { status: 400 }
      )
    }

    // Await params for Next.js 15
    const { id: setlistId } = await params

    const supabase = getSupabaseServiceClient()

    // Verify the setlist belongs to the user
    const { data: setlist, error: setlistError } = await supabase
      .from("setlists")
      .select("id")
      .eq("id", setlistId)
      .eq("user_id", user.uid)
      .single()

    if (setlistError) {
      logger.error("Error verifying setlist ownership:", setlistError)
      throw setlistError
    }

    // Validate that the content exists and belongs to the user
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id")
      .eq("id", contentId)
      .eq("user_id", user.uid)
      .single()

    if (contentError || !content) {
      logger.error("Error validating content:", contentError)
      throw new Error(`Content with ID ${contentId} does not exist or does not belong to user`)
    }

    // Get the current maximum position in the setlist
    const { data: maxPositionResult, error: maxPositionError } = await supabase
      .from("setlist_songs")
      .select("position")
      .eq("setlist_id", setlistId)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    if (maxPositionError && maxPositionError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      logger.error("Error getting max position:", maxPositionError)
      throw maxPositionError
    }

    // Calculate the actual position to insert at
    const currentMaxPosition = maxPositionResult?.position || 0
    const actualPosition = Math.max(position, currentMaxPosition + 1)

    // Add the new song at the calculated position
    const insertData = {
      setlist_id: setlistId,
      content_id: contentId,
      position: actualPosition,
      notes,
    }
    
    const { data: song, error: songError } = await supabase
      .from("setlist_songs")
      .insert(insertData)
      .select()
      .single()

    if (songError) {
      logger.error("Error adding song to setlist:", songError)
      throw songError
    }

    return NextResponse.json(song)
  } catch (error: any) {
    logger.error('Error adding song to setlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 