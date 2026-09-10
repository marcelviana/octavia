/**
 * Da linha de setlist ao que a tela mostra (PRD T1-R8 e T1-R11; aceites A7,
 * A8). Regra central: o corpo vem SEMPRE do cache de `content` por
 * `content_id` — o objeto `content` embutido na resposta de setlists é
 * ignorado, porque editar um content não bumpa `setlists.updated_at` (duas
 * cópias = dois relógios).
 */
import { isValidContent, type ContentValidity } from './content-contract'
import type { ContentDTO, SetlistSongDTO } from './types'

export interface ResolvedSong {
  /** Do cache por `content_id`; `null` quando o cache ainda não tem o item. */
  content: ContentDTO | null
  validity: ContentValidity | null
  /** `setlist_songs.notes` — por POSIÇÃO, não por content (bis tem notas próprias). */
  notes: string | null
}

export function resolveSong(
  song: SetlistSongDTO,
  contentById: Map<string, ContentDTO>,
): ResolvedSong {
  const content = contentById.get(song.content_id) ?? null
  const validity =
    content === null
      ? null
      : isValidContent(content.content_type, content.content_data, content.file_url)
  return { content, validity, notes: song.notes }
}

/**
 * Rótulo da linha na lista e no palco (T1-R11 + T1-R7):
 * - `loading` — sem content no cache e o sync ainda não terminou ("carregando…");
 * - `unavailable` — sem content e o sync terminou ("indisponível");
 * - `invalid` — content no cache, mas sem corpo renderizável (placeholder);
 * - `ready` — renderiza.
 * A song **nunca** é omitida: a posição 1..N não pode ter buraco visual.
 */
export type SongLabel = 'ready' | 'loading' | 'unavailable' | 'invalid'

export function labelFor(
  song: SetlistSongDTO,
  contentById: Map<string, ContentDTO>,
  syncDone: boolean,
): SongLabel {
  const { content, validity } = resolveSong(song, contentById)
  if (content === null) return syncDone ? 'unavailable' : 'loading'
  return validity !== null && validity.ok ? 'ready' : 'invalid'
}
