import { NextRequest, NextResponse } from "next/server"
import { requireAuthServer } from "@/lib/firebase-server-utils"
import { getSupabaseServiceClient } from "@/lib/supabase-service"
import logger from "@/lib/logger"
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { setlistSchemas } from '@/lib/api-schemas'
import { authRequired, internalError, validationError } from '@/lib/api-errors'
import { z } from 'zod'

// GET /api/setlists - Get user's setlists
const getSetlistsHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'setlist-read', RATE_LIMITS.READ)
    if (limited) return limited

    const supabase = getSupabaseServiceClient()

    // B6 PR-4 (D6, desenho §6.1): UMA query via embedding do PostgREST
    // (FKs setlist_songs->setlists e setlist_songs->content; sintaxe
    // referencedTable verificada no supabase-js 2.89.0 instalado) no
    // lugar do 1+2N medido no pre-check §3 (7 queries para N=3).
    // Delta DECLARADO (§6.1): a query antiga de content filtrava
    // user_id; o embedding segue a FK sem esse filtro — diferença
    // observável só se existisse setlist_song apontando para content
    // de OUTRO usuário, estado inalcançável pelos caminhos de escrita
    // (addSong e create validam posse) e inexistente nos dados.
    const { data: setlists, error: setlistsError } = await supabase
      .from('setlists')
      .select(`*, setlist_songs ( id, setlist_id, content_id, position, notes,
        content ( id, title, artist, content_type, key, bpm, file_url, content_data ) )`)
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .order('position', { referencedTable: 'setlist_songs', ascending: true })

    if (setlistsError) {
      logger.error("Error fetching setlists:", setlistsError)
      throw setlistsError
    }

    // Mapeamento INALTERADO (gate de shape em __tests__/get-shape.test.ts):
    // só a FONTE mudou — o content EMBUTIDO no lugar do contentMap.
    const setlistsWithSongs = (setlists || []).map((setlist: any) => {
      const setlistSongs = setlist.setlist_songs

      if (!setlistSongs || setlistSongs.length === 0) {
        return { ...setlist, setlist_songs: [] }
      }

      // Format the songs with proper content data
      const formattedSongs = setlistSongs.map((song: any) => {
        const content = song.content

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

      return { ...setlist, setlist_songs: formattedSongs }
    })

    return NextResponse.json(setlistsWithSongs)
  } catch (error: any) {
    logger.error('Error in setlists API:', error)
    return internalError()
  }
}

export const GET = getSetlistsHandler

// POST /api/setlists - Create new setlist
const createSetlistHandler = withBodyValidation(setlistSchemas.create, {
  rateLimit: { familia: 'setlist-mutate', config: RATE_LIMITS.MUTATE }
})(
  async (request: Request, validatedData: z.infer<typeof setlistSchemas.create>, user: any) => {
    try {
      const supabase = getSupabaseServiceClient()
      const songs = validatedData.songs

      // PR-5/5b: se vieram músicas, validar POSSE de todos os content_id
      // ANTES de criar qualquer coisa — uma query, comparação de contagem.
      let ownedContent: Array<{ id: string; title: string; artist: string | null; content_type: string; key: string | null; bpm: number | null; file_url: string | null; content_data: unknown }> = []
      if (songs.length > 0) {
        const ids = songs.map((s) => s.content_id)
        const { data: contents, error: contentError } = await supabase
          .from('content')
          .select('id, title, artist, content_type, key, bpm, file_url, content_data')
          .in('id', ids)
          .eq('user_id', user.uid)
        if (contentError) {
          logger.error('Error validating songs ownership:', contentError)
          throw contentError
        }
        ownedContent = contents ?? []
        if (ownedContent.length !== new Set(ids).size) {
          // B3 PR-3b: a cópia manual do semente vira o helper —
          // byte-idêntico (gate de invariância no route.test)
          return validationError([
            { code: 'custom', path: ['songs'], message: 'One or more content_id do not exist or do not belong to the user' } as never,
          ])
        }
      }

      // PR-5/5a: os cinco campos de metadados persistem de verdade (fim do
      // SET-01 — antes o schema stripava venue/performance_date/notes e
      // estas linhas gravavam null incondicionalmente)
      const setlistData = {
        name: validatedData.name,
        description: validatedData.description ?? null,
        performance_date: validatedData.performance_date ?? null,
        venue: validatedData.venue ?? null,
        notes: validatedData.notes ?? null,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: setlist, error } = await supabase
        .from('setlists')
        .insert(setlistData)
        .select()
        .single()

      if (error) {
        logger.error("Error creating setlist:", error)
        throw error
      }

      if (!setlist) {
        throw new Error('Failed to create setlist: no data returned')
      }

      // PR-5/5b, opção (B) do aval — dois statements + delete compensatório.
      // O insert das músicas é UM statement multi-row (atômico entre si);
      // a ordem do array é a ordem, renumerada 1..N. Se falhar, a setlist
      // recém-criada é apagada e o erro é honesto — NENHUM 201 mentiroso.
      // PIOR CASO (documentado por exigência do aval): se o próprio delete
      // compensatório falhar (rede/banco no meio-tempo), sobra uma setlist
      // VAZIA órfã — visível na listagem e apagável pela UI. Nunca um 201
      // com músicas fantasma.
      let formattedSongs: Array<Record<string, unknown>> = []
      if (songs.length > 0) {
        const rows = songs.map((s, i) => ({
          setlist_id: (setlist as { id: string }).id,
          content_id: s.content_id,
          position: i + 1,
          notes: s.notes ?? null,
        }))
        const { data: inserted, error: songsError } = await supabase
          .from('setlist_songs')
          .insert(rows)
          .select()
        if (songsError || !inserted) {
          logger.error('Error inserting setlist songs, rolling back setlist:', songsError)
          const { error: rollbackError } = await supabase
            .from('setlists')
            .delete()
            .eq('id', (setlist as { id: string }).id)
            .eq('user_id', user.uid)
          if (rollbackError) {
            logger.error('Compensating delete FAILED — empty orphan setlist left behind:', rollbackError)
          }
          return internalError('Failed to create setlist songs')
        }

        const contentMap = new Map(ownedContent.map((c) => [c.id, c]))
        formattedSongs = inserted.map((song: { id: string; setlist_id: string; content_id: string; position: number; notes: string | null }) => {
          const content = contentMap.get(song.content_id)
          return {
            id: song.id,
            setlist_id: song.setlist_id,
            content_id: song.content_id,
            position: song.position,
            notes: song.notes,
            content: {
              id: content?.id ?? song.content_id,
              title: content?.title ?? 'Unknown Title',
              artist: content?.artist ?? null,
              content_type: content?.content_type ?? 'Unknown Type',
              key: content?.key ?? null,
              bpm: content?.bpm ?? null,
              file_url: content?.file_url ?? null,
              content_data: content?.content_data ?? null,
            },
          }
        })
      }

      // o 201 diz a verdade: setlist_songs traz o que foi realmente gravado
      const responseData = { ...(setlist as Record<string, any>), setlist_songs: formattedSongs }
      return NextResponse.json(responseData, { status: 201 })
    } catch (error: any) {
      logger.error('Error creating setlist:', error)
      return internalError()
    }
  }
)

// Wrap handler to match withRateLimit signature
const createSetlistHandlerWrapped = async (request: NextRequest): Promise<NextResponse> => {
  const response = await createSetlistHandler(request)
  return response as NextResponse
}

export const POST = createSetlistHandlerWrapped
