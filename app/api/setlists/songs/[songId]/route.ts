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

// PUT /api/setlists/songs/[songId] - Update song position
export async function PUT(
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

    const { songId } = await params
    const body = await request.json()
    const { setlistId, newPosition } = body

    if (!setlistId || !newPosition) {
      return NextResponse.json(
        { error: 'setlistId and newPosition required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServiceClient()

    const { data: song, error: songError } = await supabase
      .from('setlist_songs')
      .select('position, setlist_id, setlists!inner (user_id)')
      .eq('id', songId)
      .single()

    if (songError) {
      logger.error('Error fetching song:', songError)
      throw songError
    }

    if ((song.setlists as any).user_id !== user.uid || song.setlist_id !== setlistId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data: allSongs, error: fetchError } = await supabase
      .from('setlist_songs')
      .select('id, position')
      .eq('setlist_id', setlistId)
      .order('position', { ascending: true })

    if (fetchError) {
      logger.error('Error fetching songs:', fetchError)
      throw fetchError
    }

    const currentPosition = song.position
    if (currentPosition === newPosition) {
      return NextResponse.json({ success: true })
    }

    const ordered = [...allSongs].sort((a: any, b: any) => a.position - b.position)
    const without = ordered.filter((s: any) => s.id !== songId)
    let targetIndex = newPosition - 1
    if (currentPosition < newPosition) {
      targetIndex = Math.min(targetIndex, without.length)
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, without.length))
    }
    const reordered = [...without]
    const moving = ordered.find((s: any) => s.id === songId)
    if (!moving) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }
    reordered.splice(targetIndex, 0, moving)

    for (let i = 0; i < reordered.length; i++) {
      const songRow = reordered[i]
      if (songRow.position !== i + 1) {
        const { error: updError } = await supabase
          .from('setlist_songs')
          .update({ position: i + 1 })
          .eq('id', songRow.id)

        if (updError) {
          logger.error('Error updating position:', updError)
          throw updError
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error updating song position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
