import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { setlistSchemas } from '@/lib/api-schemas'
import { authRequired, internalError, notFound, validationError } from '@/lib/api-errors'

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

// Type for song row from database
type SongRow = {
  id: string
  position: number
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

    const setlistId = songData.setlist_id
    const songPosition = songData.position

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
    if (songsToShift && songsToShift.length > 0) {
      for (const song of songsToShift) {
        const songRow = song as SongRow
        const updateData: { position: number } = { position: songRow.position - 1 }
        const { error: updateError } = await supabase
          .from("setlist_songs")
          .update(updateData)
          .eq("id", songRow.id)

        if (updateError) {
          logger.error("Error shifting song position:", updateError)
          throw updateError
        }
      }
    }

    // PR-5/5c: remover música muda a setlist (achado §0.3 — sem trigger no banco)
    const { error: touchError } = await supabase
      .from('setlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', setlistId)
    if (touchError) {
      logger.error('Error bumping setlist updated_at:', touchError)
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

// PUT /api/setlists/songs/[songId] - Update song position
const updateSongPositionHandler = async (
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

    const { songId } = await params
    const body = await request.json()

    // B2 PR-6: Zod na única rota que não tinha nenhum (pre-check §2.9).
    // A guarda antiga `!setlistId || !newPosition` lia newPosition: 0 como
    // ausente (b7) e deixava string entrar na aritmética.
    // B3 PR-1: a cópia manual do shape semente vira import do ponto único
    // (primeiro cliente do helper fora do middleware). Mapper no default
    // do contrato — em chave desconhecida, um detail POR CHAVE (D7);
    // mudança declarada: rota morta na web (reorder é TODO no cliente),
    // zero observadores medidos.
    const validation = setlistSchemas.updateSongPosition.safeParse(body)
    if (!validation.success) {
      return validationError(validation.error)
    }
    const { setlistId, newPosition } = validation.data

    const supabase = getSupabaseServiceClient()

    const { data: song, error: songError } = await supabase
      .from('setlist_songs')
      .select('position, setlist_id, setlists!inner (user_id)')
      .eq('id', songId)
      .single()

    if (songError) {
      // B3 PR-3a: PGRST116 → 404 (era throw → 500; ramo `if (!song)`
      // era morto — removido)
      if (songError.code === 'PGRST116') {
        return notFound('Song not found')
      }
      logger.error('Error fetching song:', songError)
      throw songError
    }

    const songData = song as SongWithSetlist

    // B3 PR-3a/D2: era 403 {"error":"Unauthorized"} — vazava existência
    // (content/setlists respondem 404). Corpo BYTE-IDÊNTICO ao de
    // inexistente, por contrato.
    if (songData.setlists.user_id !== user.uid || songData.setlist_id !== setlistId) {
      return notFound('Song not found')
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

    const currentPosition = songData.position
    if (currentPosition === newPosition) {
      return NextResponse.json({ success: true })
    }

    // Use a two-step approach to avoid unique constraint violations
    // Step 1: Move all songs to temporary positions (using large offsets)
    const tempOffset = 10000
    
    // First, move all songs to temporary positions
    if (!allSongs) {
      return internalError('Failed to fetch songs')
    }

    const typedAllSongs = allSongs as SongRow[]

    for (let i = 0; i < typedAllSongs.length; i++) {
      const songRow = typedAllSongs[i]
      if (!songRow) continue
      
      const tempPosition = tempOffset + i
      const updateData: { position: number } = { position: tempPosition }
      
      const { error: tempError } = await supabase
        .from('setlist_songs')
        .update(updateData)
        .eq('id', songRow.id)

      if (tempError) {
        logger.error('Error moving song to temporary position:', tempError)
        throw tempError
      }
    }

    // Step 2: Calculate the new order and move to final positions
    const ordered = [...typedAllSongs].sort((a: any, b: any) => a.position - b.position)
    const without = ordered.filter((s: any) => s.id !== songId)
    
    // Insert the moving song at the target position
    const reordered: SongRow[] = [...without]
    const moving = ordered.find((s: any) => s.id === songId) as SongRow | undefined
    if (!moving) {
      return notFound('Song not found')
    }
    
    let targetIndex = newPosition - 1
    if (currentPosition < newPosition) {
      targetIndex = Math.min(targetIndex, without.length)
    } else {
      targetIndex = Math.max(0, Math.min(targetIndex, without.length))
    }
    
    reordered.splice(targetIndex, 0, moving)

    // Update all positions to their final values
    for (let i = 0; i < reordered.length; i++) {
      const songRow = reordered[i]
      if (!songRow) continue
      
      const newPos = i + 1
      const updateData: { position: number } = { position: newPos }
      
      const { error: updError } = await supabase
        .from('setlist_songs')
        .update(updateData)
        .eq('id', songRow.id)

      if (updError) {
        logger.error('Error updating position:', updError)
        throw updError
      }
    }

    // PR-5/5c: reordenar muda a setlist (achado §0.3 — sem trigger no banco)
    const { error: touchError } = await supabase
      .from('setlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', setlistId)
    if (touchError) {
      logger.error('Error bumping setlist updated_at:', touchError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error updating song position:', error)
    return internalError()
  }
}

// Wrapper for PUT handler
const wrappedUpdateSongPositionHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const songId = url.pathname.split('/').pop()
  if (!songId) {
    return validationError([
      { code: 'invalid_type', path: ['songId'], message: 'Song ID is required' } as never,
    ])
  }
  
  const params = Promise.resolve({ songId })
  return updateSongPositionHandler(request, { params })
}

export const PUT = wrappedUpdateSongPositionHandler
