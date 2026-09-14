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

/**
 * T1-R14 / N0-H16 §4 — quais arquivos JÁ presentes precisam ser **promovidos**
 * para o armazenamento não-purgável.
 *
 * Por que isto existe (defeito medido no aceite, N1-PR7 §3.1): o
 * `selectPrefetch` só devolve o que **falta** baixar, e a promoção do
 * `ensureFile` só corre para os itens do plano. Um arquivo baixado **sob
 * demanda** (T1-R16, que grava no `Paths.cache` purgável) e que **depois**
 * entra na janela de 7 dias ficava para sempre no cache: o LRU do app
 * respeitava a proteção, mas o Android — que não sabe dela — podia apagá-lo
 * na véspera do show.
 *
 * A regra é a interseção: garantido **e** já no disco **e** ainda não
 * durável. Quem não está na janela não é promovido — a promoção não pode ser
 * indiscriminada, senão o `Paths.cache` perderia o sentido.
 */
export function promoteList(
  guaranteedUrls: Set<string>,
  files: { url: string; guaranteed: boolean }[],
): string[] {
  return files.filter((file) => !file.guaranteed && guaranteedUrls.has(file.url)).map((f) => f.url)
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

// -------------------------------------------------- integridade de arquivo

/**
 * Por que um arquivo em disco é recusado. As três chaves são as do catálogo
 * (`LOGS-OCTAVIA.md`, linha `file-reject`), e respondem a perguntas
 * diferentes: **`empty`** não tem byte nenhum; **`short`** tem menos bytes do
 * que o servidor disse que mandaria; **`malformed`** tem os bytes e não tem a
 * forma.
 */
export type FileRejectKind = 'empty' | 'short' | 'malformed'

/**
 * O que se sabe de um arquivo sem interpretá-lo: o tamanho, o tamanho
 * ESPERADO quando há um (`Content-Length`; `null` quando o servidor não o
 * mandou — o `-1` do `DownloadProgress`), os primeiros e os últimos bytes, e
 * se ele é um PDF.
 */
export interface FileForm {
  bytes: number
  expected: number | null
  /** Os primeiros bytes, como latin1. */
  head: string
  /** Os últimos bytes (≥ 32 bastam para o rodapé de um PDF), como latin1. */
  tail: string
  /** `true` quando o nome termina em `.pdf`. */
  pdf: boolean
}

/**
 * **T1-R17 (ii), na redação que o W1 lhe deu**: um arquivo só conta como
 * presente se estiver COMPLETO. Esta função é o julgamento, e é pura de
 * propósito — quem lê disco é o `apps/native/src/files.ts`; quem decide é o
 * core, como todo o resto deste arquivo.
 *
 * **Não existe tamanho esperado no contrato** (div. 112): a tabela `content`
 * não tem coluna de tamanho e o `ContentDTO` não tem campo. O `bytes` do
 * `files-index.json` **não serve de oráculo** (div. 111): ele é escrito a
 * partir do próprio disco, no mesmo instante em que o download termina —
 * comparar disco com índice é comparar um número com ele mesmo. A única fonte
 * de tamanho esperado é o `Content-Length` da resposta, e ele só existe
 * durante o download. Daí a ordem das três checagens:
 *
 * 1. **vazio** — 0 byte nunca é arquivo;
 * 2. **curto** — só quando há `expected`: menos bytes do que o prometido;
 * 3. **sem forma** — a única checagem que vale DEPOIS, sobre o que já está no
 *    disco, e por isso a única que o saneamento pode usar.
 *
 * A forma julgada é a do PDF, e só a dela: `%PDF-` na cabeça, `%%EOF` na
 * cauda, e o `startxref` apontando para dentro do arquivo. **O que não é PDF
 * não é julgado** — julgar um `.png` pela cabeça do PDF o apagaria a cada
 * abertura, e o dano de um falso positivo seria um re-download por abertura,
 * para sempre.
 */
export function fileVerdict(form: FileForm): { ok: true } | { ok: false; kind: FileRejectKind } {
  if (form.bytes <= 0) return { ok: false, kind: 'empty' }
  if (form.expected !== null && form.expected >= 0) {
    if (form.bytes < form.expected) return { ok: false, kind: 'short' }
    if (form.bytes > form.expected) return { ok: false, kind: 'malformed' }
  }
  if (!form.pdf) return { ok: true }
  if (!form.head.startsWith('%PDF-')) return { ok: false, kind: 'malformed' }
  if (!form.tail.includes('%%EOF')) return { ok: false, kind: 'malformed' }
  const xref = /startxref\s+(\d+)/.exec(form.tail)
  if (xref === null) return { ok: false, kind: 'malformed' }
  return Number(xref[1]) <= form.bytes ? { ok: true } : { ok: false, kind: 'malformed' }
}
