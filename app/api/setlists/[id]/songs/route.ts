import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { setlistSchemas } from '@/lib/api-schemas'
import { internalError, notFound, validationError } from '@/lib/api-errors'
import { rpcErrorResponse } from '@/lib/rpc-errors'
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

      // B6 PR-3b (D3/D10, desenho §2.5): a escrita vira UMA chamada de
      // RPC — max+1 é calculado DENTRO da transação, sob o lock da
      // linha-pai (append-only, gap impossível; a corrida
      // addSong×reorder/remove serializa no mesmo lock). O bump de
      // updated_at acontece NA transação — o best-effort separado morreu.
      // position do payload: aceita e SEMPRE recalculada (comentário do
      // schema, §4.2). A leitura de max + Math.max + insert direto
      // (código anterior) foi removida; `position` fica sem uso aqui por
      // contrato.
      void position
      const { data, error: rpcError } = await supabase.rpc('add_setlist_song', {
        p_setlist_id: setlistId,
        p_content_id: contentId,
        p_notes: notes || null,
      })

      if (rpcError) {
        return rpcErrorResponse('addSong', rpcError)
      }

      // returns setof: data[0] é a linha inserida nas 6 colunas na ordem
      // da tabela — o 201 ecoa a verdade da transação (paridade byte a
      // byte com o shape medido no pre-check L1.1)
      const song = Array.isArray(data) ? data[0] : data
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
