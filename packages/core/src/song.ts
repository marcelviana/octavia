/**
 * Da linha de setlist ao que a tela mostra (PRD T1-R8 e T1-R11; aceites A7,
 * A8): o corpo vem SEMPRE do cache de `content` por `content_id`, nunca do
 * objeto embutido na resposta de setlists.
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { ContentValidity } from './content-contract'
import type { ContentDTO, SetlistSongDTO } from './types'

export interface ResolvedSong {
  /** Do cache por `content_id`; `null` quando o cache ainda não tem o item. */
  content: ContentDTO | null
  validity: ContentValidity | null
  /** `setlist_songs.notes` — por POSIÇÃO, não por content (bis tem notas próprias). */
  notes: string | null
}

export function resolveSong(
  _song: SetlistSongDTO,
  _contentById: Map<string, ContentDTO>,
): ResolvedSong {
  throw new Error('not implemented')
}

export type SongLabel = 'ready' | 'loading' | 'unavailable' | 'invalid'

export function labelFor(
  _song: SetlistSongDTO,
  _contentById: Map<string, ContentDTO>,
  _syncDone: boolean,
): SongLabel {
  throw new Error('not implemented')
}
