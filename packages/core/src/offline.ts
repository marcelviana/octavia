/**
 * Garantia offline, prefetch e retenção de arquivos (PRD T1-R14, T1-R15,
 * T1-R16, T1-R17; aceites A9, A10). Puro: o "hoje" e o conjunto de arquivos
 * já baixados entram por parâmetro; nada aqui toca disco, rede ou relógio.
 */
import { isValidContent } from './content-contract'
import type { ContentDTO, SetlistDTO, SetlistSongDTO } from './types'

export type OfflineKind = 'guaranteed' | 'partial' | 'never'

export interface OfflineStatus {
  kind: OfflineKind
  /** Arquivos distintos já no aparelho. */
  have: number
  /** Arquivos distintos que a setlist precisa. */
  need: number
}

/** URLs distintas de arquivo que a setlist precisa, na ordem de `position`. */
function fileUrlsOf(
  songs: SetlistSongDTO[],
  contentById: Map<string, ContentDTO>,
): { urls: string[]; missingContent: number } {
  const urls: string[] = []
  const seen = new Set<string>()
  let missingContent = 0
  for (const song of [...songs].sort((a, b) => a.position - b.position)) {
    const content = contentById.get(song.content_id)
    if (content === undefined) {
      missingContent++
      continue
    }
    const validity = isValidContent(content.content_type, content.content_data, content.file_url)
    if (!validity.ok || validity.body !== 'file') continue
    const url = content.file_url
    if (url === null || seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }
  return { urls, missingContent }
}

/**
 * T1-R17 — ✓ garantida · ◔ parcial ("n de m arquivos") · ✗ nunca sincronizada.
 *
 * Leitura declarada (PRD T1-R17 + aceite A10, que diz "antes do download →
 * ◔ 0 de 2"): **`never` é "nunca sincronizada"** — nenhuma das songs tem
 * content no cache. Zero arquivos baixados COM os contents presentes é
 * `partial` com `have: 0`, não `never`. Um bis conta o arquivo uma vez (URLs
 * distintas). Setlist sem songs está garantida por vacuidade.
 */
export function offlineStatus(
  setlist: SetlistDTO,
  contentById: Map<string, ContentDTO>,
  filesPresent: Set<string>,
): OfflineStatus {
  const songs = setlist.setlist_songs
  const { urls, missingContent } = fileUrlsOf(songs, contentById)
  const have = urls.filter((url) => filesPresent.has(url)).length
  const need = urls.length

  if (songs.length > 0 && missingContent === songs.length) return { kind: 'never', have: 0, need: 0 }
  if (missingContent === 0 && have === need) return { kind: 'guaranteed', have, need }
  return { kind: 'partial', have, need }
}

export interface PrefetchItem {
  url: string
  setlistId: string
  reason: '7d'
}

/** `YYYY-MM-DD` + dias, em UTC — sem timezone, como a coluna `date` do banco. */
function addDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split('-').map(Number)
  if (y === undefined || m === undefined || d === undefined) return dateOnly
  const ms = Date.UTC(y, m - 1, d) + days * 86_400_000
  const out = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${out.getUTCFullYear()}-${pad(out.getUTCMonth() + 1)}-${pad(out.getUTCDate())}`
}

/**
 * T1-R15 — arquivos das setlists com `performance_date` entre hoje e hoje+7
 * (date-only, comparação por string `YYYY-MM-DD`: mesma ordem lexicográfica e
 * cronológica, sem fuso). Ordem: data mais próxima primeiro, depois
 * `position`. Setlist sem data **não** entra (só sob demanda ou por "baixar
 * esta setlist"). Arquivo já presente não entra; URL repetida entra uma vez.
 */
export function selectPrefetch(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
  filesPresent: Set<string>,
  today: string,
): PrefetchItem[] {
  const limit = addDays(today, 7)
  const janela = setlists
    .filter((setlist) => {
      const date = setlist.performance_date
      return date !== null && date >= today && date <= limit
    })
    .sort((a, b) => (a.performance_date ?? '').localeCompare(b.performance_date ?? ''))

  const out: PrefetchItem[] = []
  const seen = new Set<string>()
  for (const setlist of janela) {
    for (const url of fileUrlsOf(setlist.setlist_songs, contentById).urls) {
      if (filesPresent.has(url) || seen.has(url)) continue
      seen.add(url)
      out.push({ url, setlistId: setlist.id, reason: '7d' })
    }
  }
  return out
}

/**
 * T1-R16 — prioridade sob demanda ao entrar no palco: **atual, +1, +2, +3,
 * −1**, e o resto em ordem de `position` crescente (as já listadas não
 * repetem). Ex.: posição 5 de 12 → 5, 6, 7, 8, 4, 1, 2, 3, 9, 10, 11, 12.
 * Devolve `setlist_songs.id` (identidade de posição — T1-R24), não `content_id`:
 * um bis pode precisar do mesmo arquivo em duas posições.
 */
export function prefetchOrder(pos: number, songs: SetlistSongDTO[]): string[] {
  const byPosition = [...songs].sort((a, b) => a.position - b.position)
  const at = (p: number): SetlistSongDTO | undefined => byPosition.find((s) => s.position === p)
  const out: string[] = []
  const seen = new Set<string>()
  const push = (song: SetlistSongDTO | undefined): void => {
    if (song === undefined || seen.has(song.id)) return
    seen.add(song.id)
    out.push(song.id)
  }
  push(at(pos))
  push(at(pos + 1))
  push(at(pos + 2))
  push(at(pos + 3))
  push(at(pos - 1))
  for (const song of byPosition) push(song)
  return out
}

export interface CachedFile {
  url: string
  bytes: number
  lastUsedMs: number
}

/**
 * T1-R14 — retenção LRU com teto (200 MB proposto no PRD; H16 mediu 265.002 B
 * no repertório inteiro da conta de audit, maior objeto 242.176 B: o teto é
 * folga). Os arquivos garantidos das setlists dos próximos 7 dias entram em
 * `protectedUrls` e **nunca** são despejados — se mesmo sem eles não couber,
 * despeja tudo o que pode e devolve o `bytesAfter` real (quem chama decide o
 * que fazer com o estouro; T1-R37 manda a falha aparecer).
 */
export function lruEvict(
  files: CachedFile[],
  capBytes: number,
  protectedUrls: Set<string>,
): { evict: string[]; bytesAfter: number } {
  let total = files.reduce((sum, file) => sum + file.bytes, 0)
  if (total <= capBytes) return { evict: [], bytesAfter: total }

  const candidates = files
    .filter((file) => !protectedUrls.has(file.url))
    .sort((a, b) => a.lastUsedMs - b.lastUsedMs)

  const evict: string[] = []
  for (const file of candidates) {
    if (total <= capBytes) break
    evict.push(file.url)
    total -= file.bytes
  }
  return { evict, bytesAfter: total }
}
