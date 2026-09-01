import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { setlistSchemas } from '@/lib/api-schemas'
import { internalError, notFound, validationError } from '@/lib/api-errors'
import { rpcErrorResponse } from '@/lib/rpc-errors'

// PUT /api/setlists/[id]/songs/order — reorder em LOTE (B6-D1/D2/D4;
// docs/ux/B6-DESENHO.md §1). O array é a ordem completa — permutação
// EXATA dos setlist_songs da setlist. A rota faz o gate de posse (404
// sem oráculo, byte-idêntico ao do addSong); a permutação é checada
// DENTRO da transação pela RPC (TOCTOU fechado); a renumeração 1..N é
// atômica sob o lock da linha-pai (D10). Nasce com o guard de corpo do
// middleware (D4) — nenhum request.json() cru.
const reorderSetlistHandler = withBodyValidation(setlistSchemas.reorder, {
  rateLimit: { familia: 'setlist-mutate', config: RATE_LIMITS.MUTATE }
})(
  async (request: Request, validatedData: any, user: any, params: { id: string }) => {
    try {
      const setlistId = params.id
      const supabase = getSupabaseServiceClient()

      // gate de posse: inexistente-ou-alheia → 404 idêntico por
      // construção (query filtrada por user_id — padrão B3 PR-4)
      const { data: setlist, error: setlistError } = await supabase
        .from('setlists')
        .select('id')
        .eq('id', setlistId)
        .eq('user_id', user.uid)
        .single()

      if (setlistError) {
        if (setlistError.code === 'PGRST116') {
          return notFound('Setlist not found')
        }
        logger.error('Error verifying setlist ownership:', setlistError)
        throw setlistError
      }
      if (!setlist) {
        return notFound('Setlist not found')
      }

      const { data, error } = await supabase.rpc('reorder_setlist_songs', {
        p_setlist_id: setlistId,
        p_song_ids: validatedData.order,
      })

      if (error) {
        return rpcErrorResponse('reorder', error)
      }

      // 200 com a ordem canônica renumerada — a resposta É a leitura
      // (reconciliação do drag-and-drop nativo sem GET subsequente)
      return NextResponse.json({ songs: data ?? [] })
    } catch (error: any) {
      logger.error('Error reordering setlist songs:', error)
      return internalError()
    }
  }
)

// Wrapper: extrai o id do path .../setlists/<id>/songs/order
const wrappedReorderHandler = async (request: NextRequest): Promise<Response> => {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const id = pathParts[pathParts.length - 3]
  if (!id) {
    return validationError([
      { code: 'invalid_type', path: ['id'], message: 'Setlist ID is required' } as never,
    ])
  }
  return reorderSetlistHandler(request, { id })
}

export const PUT = wrappedReorderHandler
