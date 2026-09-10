/**
 * Garantia offline, prefetch e retenção de arquivos (PRD T1-R14, T1-R15,
 * T1-R16, T1-R17; aceites A9, A10).
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { ContentDTO, SetlistDTO, SetlistSongDTO } from './types'

export type OfflineKind = 'guaranteed' | 'partial' | 'never'

export interface OfflineStatus {
  kind: OfflineKind
  /** Arquivos distintos já no aparelho. */
  have: number
  /** Arquivos distintos que a setlist precisa. */
  need: number
}

export function offlineStatus(
  _setlist: SetlistDTO,
  _contentById: Map<string, ContentDTO>,
  _filesPresent: Set<string>,
): OfflineStatus {
  throw new Error('not implemented')
}

export interface PrefetchItem {
  url: string
  setlistId: string
  reason: '7d'
}

export function selectPrefetch(
  _setlists: SetlistDTO[],
  _contentById: Map<string, ContentDTO>,
  _filesPresent: Set<string>,
  _today: string,
): PrefetchItem[] {
  throw new Error('not implemented')
}

export function prefetchOrder(_pos: number, _songs: SetlistSongDTO[]): string[] {
  throw new Error('not implemented')
}

export interface CachedFile {
  url: string
  bytes: number
  lastUsedMs: number
}

export function lruEvict(
  _files: CachedFile[],
  _capBytes: number,
  _protectedUrls: Set<string>,
): { evict: string[]; bytesAfter: number } {
  throw new Error('not implemented')
}
