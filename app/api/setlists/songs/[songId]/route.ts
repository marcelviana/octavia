import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { authRequired, internalError, notFound, validationError } from '@/lib/api-errors'
import { rpcErrorResponse } from '@/lib/rpc-errors'

// Type for song with joined setlist data
type SongWithSetlist = {
  id: string
  position: number
  setlist_id: string
  setlists: {
    id: string
    user_id: string
  }
}


// DELETE /api/setlists/songs/[songId] - Remove song from setlist
const removeSongFromSetlistHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'setlist-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

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
      // B3 PR-3a: PGRST116 tratado — songId inexistente era throw → 500
      // (o ramo `if (!song)` abaixo era código morto, pre-check §2.5);
      // .single() com sucesso garante linha, então o ramo morto saiu.
      if (songError.code === 'PGRST116') {
        return notFound('Song not found')
      }
      logger.error("Error getting song details:", songError)
      throw songError
    }

    const songData = song as SongWithSetlist

    // B3 PR-3a/D2: recurso de OUTRO usuário → 404 idêntico ao de
    // inexistente (sem oráculo de existência; era throw → 500)
    if (songData.setlists.user_id !== user.uid) {
      return notFound('Song not found')
    }

    // B6 PR-3b (D9/D10, desenho §2.4): delete + renumeração 1..N-1 +
    // bump de updated_at viram UMA transação na RPC, sob o lock da
    // linha-pai — o loop sequencial de shift (não-atômico) morreu.
    // Tradução por error.code (§2.2): OB603/OB602 → 404 sem oráculo;
    // OB601/desconhecido → 500.
    const { error: rpcError } = await supabase.rpc('remove_setlist_song', {
      p_song_id: songId,
    })

    if (rpcError) {
      return rpcErrorResponse('removeSong', rpcError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error removing song from setlist:', error)
    return internalError()
  }
}

// Wrapper for DELETE handler
const wrappedRemoveSongHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const songId = url.pathname.split('/').pop()
  if (!songId) {
    return validationError([
      { code: 'invalid_type', path: ['songId'], message: 'Song ID is required' } as never,
    ])
  }
  
  const params = Promise.resolve({ songId })
  return removeSongFromSetlistHandler(request, { params })
}

export const DELETE = wrappedRemoveSongHandler
