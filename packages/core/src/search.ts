/**
 * Busca local sobre o cache (PRD T1-R20, T1-R21, T1-R22, T1-R23; aceite A11).
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */
import type { ContentDTO } from './types'

export interface SearchEntry {
  id: string
  /** Já normalizados na construção — a consulta normaliza uma vez. */
  title: string
  artist: string
  body: string
}

export interface SearchIndex {
  entries: SearchEntry[]
}

export function buildIndex(_contents: ContentDTO[]): SearchIndex {
  throw new Error('not implemented')
}

export interface SearchHit {
  id: string
  where: 'title' | 'artist' | 'body'
}

export function searchIndex(_index: SearchIndex, _query: string, _limit = 50): SearchHit[] {
  throw new Error('not implemented')
}

export function groupResults(
  _hits: SearchHit[],
  _currentSetlistContentIds: Set<string>,
): { inSetlist: SearchHit[]; library: SearchHit[] } {
  throw new Error('not implemented')
}
