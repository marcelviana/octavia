import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

// DELETE /api/setlists/songs/[songId] - Remove song from setlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
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
    const { songId } = await params

    const supabase = getSupabaseServiceClient()

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
    if ((song.setlists as any).user_id !== user.uid) {
      throw new Error("Unauthorized: Setlist does not belong to user")
    }

    const setlistId = song.setlist_id
    const songPosition = song.position

    // Remove the song
    const { error: removeError } = await supabase
      .from("setlist_songs")
      .delete()
      .eq("id", songId)

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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error removing song from setlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 