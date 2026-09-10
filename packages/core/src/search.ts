/**
 * Busca local (PRD T1-R20, T1-R21, T1-R22; aceite A11). Roda inteira sobre o
 * cache — funciona em modo avião (T1-R23) — e usa a mesma normalização do
 * `normalizeForSearch` (NFD, sem diacríticos, minúsculas, espaços colapsados).
 *
 * **Divergência declarada (N1-PR2b)**: o T1-R20 manda indexar `title`,
 * `artist` e **`album`** mais o corpo. O `ContentDTO` do core (N1-D13) não
 * carrega `album` — a coluna existe na resposta (`N1-PRECHECK.md` A3) mas
 * ficou fora do subconjunto da PR2a. Este índice cobre `title`, `artist` e o
 * corpo; `album` fecha quando o DTO ganhar o campo (proposta: N1-PR3, uma
 * linha em `types.ts` + uma no índice).
 */
import { bodyOf } from './content-contract'
import { normalizeForSearch } from './normalize'
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

/** Reconstruído por item a cada invalidação do cache (T1-R10). */
export function buildIndex(contents: ContentDTO[]): SearchIndex {
  return {
    entries: contents.map((content) => ({
      id: content.id,
      title: normalizeForSearch(content.title),
      artist: normalizeForSearch(content.artist ?? ''),
      body: normalizeForSearch(bodyOf(content.content_type, content.content_data) ?? ''),
    })),
  }
}

export interface SearchHit {
  id: string
  where: 'title' | 'artist' | 'body'
}

/**
 * Substring normalizada. Um item casa uma vez só, pelo campo mais forte
 * (título > artista > corpo), e os resultados saem nessa mesma ordem de força
 * — dentro de cada grupo, a ordem do índice. Consulta vazia não busca.
 */
export function searchIndex(index: SearchIndex, query: string, limit = 50): SearchHit[] {
  const needle = normalizeForSearch(query)
  if (needle.length === 0) return []

  const byTitle: SearchHit[] = []
  const byArtist: SearchHit[] = []
  const byBody: SearchHit[] = []
  for (const entry of index.entries) {
    if (entry.title.includes(needle)) byTitle.push({ id: entry.id, where: 'title' })
    else if (entry.artist.includes(needle)) byArtist.push({ id: entry.id, where: 'artist' })
    else if (entry.body.includes(needle)) byBody.push({ id: entry.id, where: 'body' })
  }
  return [...byTitle, ...byArtist, ...byBody].slice(0, limit)
}

/**
 * T1-R22 — escopo é a biblioteca inteira; o que já está na setlist atual
 * aparece agrupado primeiro quando a busca é aberta de dentro do palco.
 * A ordem relativa dentro de cada grupo é a de `searchIndex`.
 */
export function groupResults(
  hits: SearchHit[],
  currentSetlistContentIds: Set<string>,
): { inSetlist: SearchHit[]; library: SearchHit[] } {
  return {
    inSetlist: hits.filter((hit) => currentSetlistContentIds.has(hit.id)),
    library: hits.filter((hit) => !currentSetlistContentIds.has(hit.id)),
  }
}
