import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation, setlistSchemas } from '@/lib/api-validation-middleware'
import type { Database } from '@/types/supabase'

// POST /api/setlists/[id]/songs - Add song to setlist
const addSongToSetlistHandler = withBodyValidation(setlistSchemas.addSong, {
  rateLimit: { familia: 'setlist-mutate', config: RATE_LIMITS.MUTATE }
})(
  async (request: Request, validatedData: any, user: any, params: { id: string }) => {
    try {
      const setlistId = params.id
      const { content_id: contentId, position, notes = "" } = validatedData

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
        .maybeSingle()

      if (maxPositionError) {
        logger.error("Error getting max position:", maxPositionError)
        throw maxPositionError
      }

      // Calculate the actual position to insert at
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      const actualPosition = Math.max(position, currentMaxPosition + 1)

      // Add the new song at the calculated position
      const insertData = {
        setlist_id: setlistId,
        content_id: contentId,
        position: actualPosition,
        notes: notes || null,
      }

      const { data: song, error: songError } = await supabase
        .from("setlist_songs")
        .insert(insertData as any)
        .select()
        .single()

      if (songError) {
        logger.error("Error adding song to setlist:", songError)
        throw songError
      }

      return NextResponse.json(song, { status: 201 })
    } catch (error: any) {
      logger.error('Error adding song to setlist:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

// Wrapper for POST handler
const wrappedAddSongHandler = async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 2] // Get the setlist ID from the path
  if (!id) {
    return NextResponse.json({ error: 'Setlist ID is required' }, { status: 400 })
  }

  const response = await addSongToSetlistHandler(request, { id })
  return response as NextResponse
}

export const POST = wrappedAddSongHandler
