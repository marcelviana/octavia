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

/** Item de `GET /api/content` (`data[]`) — 22 colunas medidas, 8 usadas. */
export interface ContentDTO {
  id: string
  title: string
  artist: string | null
  /**
   * T1-R20 manda indexar `title`, `artist` e **`album`** — os mesmos campos
   * do ILIKE do servidor. O campo entrou na N1-PR6, fechando a divergência 1
   * declarada na N1-PR2b (`search.ts`). **Não** entra no `Pick` do
   * `SetlistSongDTO` abaixo: o objeto `content` embutido na listagem de
   * setlists não traz `album` (medido em `N1-PRECHECK.md` A3), e o corpo vem
   * sempre do cache de `content` por `content_id` (T1-R8).
   */
  album: string | null
  content_type: ContentType
  content_data: Record<string, unknown> | null
  file_url: string | null
  updated_at: string
  /**
   * N4-PR5 — o favorito (N4-R5, N4-R7). O servidor manda a coluna em todo item (`select('*')`; B1 do
   * `N4-PRECHECK.md`: 63 de 63 no `content.json` do Tab), e o sync a grava sem mapear — o campo já estava no cache, só
   * não estava no tipo. Opcional porque a fixture do mock do N3 não a traz; ausente ou `null` = não favorita
   * (`ehFavorita`). Muda só pelo `PUT /api/content` do favoritar, e o cache recebe a linha que ele devolve (N4-D35).
   */
  is_favorite?: boolean | null
  /**
   * N4-PR8 — os campos que a visualização (V) mostra (N4-R14; N4-D31: **só os que o site salva de verdade**,
   * `N4-PRECHECK.md` A4). Como o `is_favorite`: o servidor manda as colunas em todo item (`select('*')`) e o sync as
   * grava sem mapear — já estavam no cache, não estavam no tipo. Opcionais porque a fixture do mock do N3 não as traz.
   * Compasso (`time_signature`), capo e afinação (`tuning`) NÃO entram: o site não os salva de verdade (herança D).
   */
  difficulty?: string | null
  genre?: string | null
  key?: string | null
  bpm?: number | null
  tags?: string[] | null
  /** As notas DO CONTENT (P-F3, *notas da música*) — não a nota da posição na setlist (`SetlistSongDTO.notes`). */
  notes?: string | null
  created_at?: string | null
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
