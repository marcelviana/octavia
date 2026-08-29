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
    
    // Get all setlists for the user
    const { data: setlists, error: setlistsError } = await supabase
      .from("setlists")
      .select("*")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false })

    if (setlistsError) {
      logger.error("Error fetching setlists:", setlistsError)
      throw setlistsError
    }

    // For each setlist, get the songs
    const setlistsWithSongs = await Promise.all(
      (setlists || []).map(async (setlist: any) => {
        // Get the setlist_songs
        const { data: setlistSongs, error: songsError } = await supabase
          .from("setlist_songs")
          .select("id, setlist_id, content_id, position, notes")
          .eq("setlist_id", setlist.id)
          .order("position", { ascending: true })

        if (songsError) {
          logger.error(`Error fetching songs for setlist ${setlist.id}:`, songsError)
          return { ...setlist, setlist_songs: [] }
        }

        if (!setlistSongs || setlistSongs.length === 0) {
          return { ...setlist, setlist_songs: [] }
        }

        // Get all unique content IDs
        const contentIds = [...new Set(setlistSongs.map((song: any) => song.content_id))]

        // Fetch content separately
        const { data: contentData, error: contentError } = await supabase
          .from("content")
          .select("id, title, artist, content_type, key, bpm, file_url, content_data")
          .in("id", contentIds)
          .eq("user_id", user.uid)

        if (contentError) {
          logger.error(`Error fetching content for setlist ${setlist.id}:`, contentError)
        }

        // Create a map of content by ID for efficient lookup
        const contentMap = new Map<string, any>()
        if (contentData) {
          contentData.forEach((content: any) => {
            contentMap.set(content.id, content)
          })
        }

        // Format the songs with proper content data
        const formattedSongs = setlistSongs.map((song: any) => {
          const content = contentMap.get(song.content_id)
          
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
      }),
    )

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
