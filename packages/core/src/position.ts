/**
 * Navegação no palco (PRD T1-R24, T1-R27, T1-R29; aceites A12, A14).
 * Posições são **1-based**, como a API (`SETLISTS.md`, invariante 1..N
 * contíguo). Nada circula: na última música o "avançar" abre a tela de fim de
 * setlist (T1-R29), nunca volta à primeira nem sai do app.
 */
import type { SetlistSongDTO } from './types'

/** Próxima posição; na última, devolve a própria (quem chama abre o fim). */
export function nextPosition(pos: number, n: number): number {
  return pos >= n ? n : pos + 1
}

/** Posição anterior; na primeira, devolve 1 (não circula). */
export function prevPosition(pos: number, _n: number): number {
  return pos <= 1 ? 1 : pos - 1
}

export function endOfSetlist(pos: number, n: number): boolean {
  return pos >= n
}

/**
 * Identidade de uma música NA setlist: `setlist_songs.id`, nunca `content_id`
 * (T1-R24). Um bis é o mesmo content em duas posições — duas telas distintas,
 * cada uma com suas `notes`.
 */
export function songKey(song: SetlistSongDTO): string {
  return song.id
}
