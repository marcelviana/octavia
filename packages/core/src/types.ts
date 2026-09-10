/**
 * Tipos estruturais do que a TELA 1 lê da API (N1-D13, 2026-09-10): o core
 * **não** importa `types/database.types.ts` do web — isso quebraria o
 * isolamento do projeto `core` do Vitest e o `tsc -p packages/core`
 * (lib ES2022, `types: []`, sem DOM). Aqui vive um subconjunto das formas
 * REAIS medidas em prod (`docs/native/N1-PRECHECK.md` A3, 2026-09-09):
 * só os campos que a tela 1 consome; as demais colunas existem na resposta
 * e são ignoradas.
 */

/**
 * Enum canônico do produto (`types/content.ts` no web; PRD §4).
 * O DTO abaixo descreve o CONTRATO; o validador (`isValidContent`) recebe
 * `string` de propósito, porque a regra (d) do T1-R7 manda não confiar no
 * dado ("tipo desconhecido" é um estado renderizável, não um erro de tipo).
 */
export type ContentType = 'Lyrics' | 'Chords' | 'Tab' | 'Sheet'

/** Item de `GET /api/content` (`data[]`) — 22 colunas medidas, 7 usadas. */
export interface ContentDTO {
  id: string
  title: string
  artist: string | null
  content_type: ContentType
  content_data: Record<string, unknown> | null
  file_url: string | null
  updated_at: string
}

/**
 * Linha de `setlist_songs` no 200 de `GET /api/setlists`.
 * `content` é o objeto EMBUTIDO da listagem: existe na resposta e o cache
 * o **descarta** (T1-R8 — o corpo vem sempre do cache de `content` por
 * `content_id`); está aqui só para tipar o payload que chega.
 */
export interface SetlistSongDTO {
  id: string
  setlist_id: string
  content_id: string
  position: number
  notes: string | null
  content: Pick<
    ContentDTO,
    'id' | 'title' | 'artist' | 'content_type' | 'content_data' | 'file_url'
  > | null
}

/** Item da raiz (array) de `GET /api/setlists`. */
export interface SetlistDTO {
  id: string
  name: string
  /** date-only `YYYY-MM-DD` ou `null` (B5 2026-08-10; T1-R15). */
  performance_date: string | null
  venue: string | null
  updated_at: string
  /** Ordenadas por `position` ascendente, contíguas 1..N (SETLISTS.md). */
  setlist_songs: SetlistSongDTO[]
}
