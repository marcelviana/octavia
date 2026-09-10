/**
 * Busca local (PRD T1-R20, T1-R21, T1-R22; aceite A11). Roda inteira sobre o
 * cache — funciona em modo avião (T1-R23) — e usa a mesma normalização do
 * `normalizeForSearch` (NFD, sem diacríticos, minúsculas, espaços colapsados).
 *
 * **Divergência da N1-PR2b, FECHADA na N1-PR6**: o T1-R20 manda indexar
 * `title`, `artist` e **`album`** mais o corpo. O `ContentDTO` (N1-D13) não
 * carregava `album`, e o índice cobria só três campos; agora o DTO tem o
 * campo e ele é indexado — é também o que o S4b promete ao usuário ("busca
 * em título, artista, álbum e letra de toda a biblioteca").
 */
import { bodyOf } from './content-contract'
import { normalizeForSearch } from './normalize'
import type { ContentDTO } from './types'

export interface SearchEntry {
  id: string
  /** Já normalizados na construção — a consulta normaliza uma vez. */
  title: string
  artist: string
  album: string
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
      album: normalizeForSearch(content.album ?? ''),
      body: normalizeForSearch(bodyOf(content.content_type, content.content_data) ?? ''),
    })),
  }
}

export interface SearchHit {
  id: string
  where: 'title' | 'artist' | 'album' | 'body'
}

/**
 * Substring normalizada. Um item casa uma vez só, pelo campo mais forte
 * (título > artista > álbum > corpo), e os resultados saem nessa mesma ordem
 * de força — dentro de cada grupo, a ordem do índice. A ordem dos campos é a
 * do texto que o S4b mostra ao usuário. Consulta vazia não busca.
 */
export function searchIndex(index: SearchIndex, query: string, limit = 50): SearchHit[] {
  const needle = normalizeForSearch(query)
  if (needle.length === 0) return []

  const byTitle: SearchHit[] = []
  const byArtist: SearchHit[] = []
  const byAlbum: SearchHit[] = []
  const byBody: SearchHit[] = []
  for (const entry of index.entries) {
    if (entry.title.includes(needle)) byTitle.push({ id: entry.id, where: 'title' })
    else if (entry.artist.includes(needle)) byArtist.push({ id: entry.id, where: 'artist' })
    else if (entry.album.includes(needle)) byAlbum.push({ id: entry.id, where: 'album' })
    else if (entry.body.includes(needle)) byBody.push({ id: entry.id, where: 'body' })
  }
  return [...byTitle, ...byArtist, ...byAlbum, ...byBody].slice(0, limit)
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
