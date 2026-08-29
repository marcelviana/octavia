import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { setlistSchemas } from '@/lib/api-schemas'
import { internalError, notFound, validationError } from '@/lib/api-errors'
import type { Database } from '@/types/database.types'

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
        // B3 PR-4 (rito do PR-3a): inexistente-ou-alheia → 404 idêntico
        // por construção (query filtrada por user_id → mesmo PGRST116).
        // Era throw → 500 — fechava a lacuna do pre-check §2.5.
        if (setlistError.code === 'PGRST116') {
          return notFound('Setlist not found')
        }
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
        // B3 PR-4: mesma classe — 404 com mensagem própria (idêntica ao
        // 404 de content/[id]); era throw → 500
        return notFound('Content not found')
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

      // Calculate the actual position to insert at.
      // PR-5: position ausente/null → vai direto para o fim (max+1). Antes,
      // Math.max(undefined, …) = NaN → 500 do Postgres já na 1ª inserção
      // (achado da verificação pós-MIG-1; o schema sempre permitiu omitir).
      const currentMaxPosition = (maxPositionResult as { position: number } | null)?.position || 0
      const actualPosition = position == null
        ? currentMaxPosition + 1
        : Math.max(position, currentMaxPosition + 1)

      // Add the new song at the calculated position
      const insertData = {
        setlist_id: setlistId,
        content_id: contentId,
        position: actualPosition,
        notes: notes || null,
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

      // PR-5/5c: mudar as músicas MUDA a setlist — sem este bump, um cliente
      // que sincroniza por updated_at perde toda alteração de músicas
      // (achado §0.3 do desenho: não existe trigger no banco)
      const { error: touchError } = await supabase
        .from('setlists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', setlistId)
      if (touchError) {
        logger.error('Error bumping setlist updated_at:', touchError)
      }

      return NextResponse.json(song, { status: 201 })
    } catch (error: any) {
      logger.error('Error adding song to setlist:', error)
      return internalError()
    }
  }
)

// Wrapper for POST handler
const wrappedAddSongHandler = async (request: NextRequest): Promise<Response> => {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 2] // Get the setlist ID from the path
  if (!id) {
    return validationError([
      { code: 'invalid_type', path: ['id'], message: 'Setlist ID is required' } as never,
    ])
  }

  const response = await addSongToSetlistHandler(request, { id })
  return response
}

export const POST = wrappedAddSongHandler
