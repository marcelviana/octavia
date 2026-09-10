/**
 * Prefetch e retenção (PRD T1-R14, T1-R15, T1-R16; aceites A9, A10).
 *
 * Fino de propósito: **quem decide o quê é o core** (`selectPrefetch`,
 * `prefetchOrder`, `lruEvict`, todos puros e testados em
 * `packages/core/src/offline.test.ts`); aqui só se lê o disco (`listFiles`),
 * se baixa (`ensureFile`) e se apaga (`remove`). Nenhuma regra nova mora
 * neste arquivo — se uma aparecer, ela pertence ao core.
 *
 * **Sem timer**: dispara na abertura (depois do sync, T1-R13 passo 3), ao
 * navegar no palco (T1-R16) e no botão "baixar esta setlist" (T1-R15). Um
 * relógio de fundo seria estado invisível num app que precisa ser previsível
 * no palco.
 */
import {
  isValidContent,
  lruEvict,
  prefetchOrder,
  selectPrefetch,
  type ContentDTO,
  type SetlistDTO,
} from '@octavia/core'
import { ensureFile, hasFile, listFiles, remove } from './files'
import { log } from './log'

/**
 * Teto de retenção, T1-R14. O PRD propôs 200 MB e o N0-H16 mediu o
 * repertório inteiro da conta de audit em 265.002 B — o teto é folga, não
 * risco: seriam ~830 PDFs do maior objeto medido para tocá-lo. **Valor final
 * em produção: 200 MB**; a prova de despejo da N1-PR5 baixou esta constante
 * temporariamente para forçar vítimas, e a devolveu antes do commit.
 */
export const CAP_BYTES = 200 * 1024 * 1024

/** Concorrência do prefetch — 3, como o web (`lib/advanced-content-cache.ts:158`). */
const CONCORRENCIA = 3

/** `YYYY-MM-DD` de hoje, no fuso do device (a coluna do banco é date-only). */
function hoje(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** URL de arquivo desta song, ou `null` (corpo de texto, inválida, ausente). */
function urlDe(contentId: string, contentById: Map<string, ContentDTO>): string | null {
  const content = contentById.get(contentId)
  if (content === undefined) return null
  const validade = isValidContent(content.content_type, content.content_data, content.file_url)
  if (!validade.ok || validade.body !== 'file') return null
  return content.file_url
}

/**
 * Conjunto **garantido** (T1-R14): todos os arquivos das setlists dos
 * próximos 7 dias, presentes ou não. É o mesmo `selectPrefetch` do plano,
 * chamado com "nada no disco" — assim a janela de 7 dias tem uma definição
 * só, no core, e não duas que podem divergir.
 */
export function urlsGarantidas(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
): Set<string> {
  return new Set(
    selectPrefetch(setlists, contentById, new Set<string>(), hoje()).map((item) => item.url),
  )
}

/** Baixa em ordem, `CONCORRENCIA` de cada vez; uma falha não derruba as outras. */
async function baixar(urls: string[], guaranteed: boolean): Promise<void> {
  for (let i = 0; i < urls.length; i += CONCORRENCIA) {
    const lote = urls.slice(i, i + CONCORRENCIA)
    await Promise.allSettled(lote.map((url) => ensureFile(url, { guaranteed })))
  }
}

/**
 * T1-R15 — plano de 7 dias, na abertura. As 3 setlists da conta de audit têm
 * `performance_date: null` (medido no pre-check A3), então aqui o plano real
 * é `n=0`: o caminho é o mesmo, o conjunto é que está vazio.
 */
export async function prefetch7Dias(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
): Promise<void> {
  const presentes = new Set(listFiles().map((f) => f.url))
  const plano = selectPrefetch(setlists, contentById, presentes, hoje())
  log(`prefetch plan n=${plano.length} reason=7d`)
  if (plano.length > 0) await baixar(plano.map((item) => item.url), true)
}

/**
 * T1-R16 — sob demanda a partir da posição no palco: atual, +1, +2, +3, −1 e
 * o resto por `position` (a ordem é do core). Já baixados não entram no `n=`:
 * o número no log é o que este disparo vai realmente buscar.
 */
export async function prefetchDemanda(
  setlist: SetlistDTO,
  contentById: Map<string, ContentDTO>,
  posicao: number,
): Promise<void> {
  const porId = new Map(setlist.setlist_songs.map((s) => [s.id, s]))
  const ordem = prefetchOrder(posicao, setlist.setlist_songs)
  const urls: string[] = []
  const vistas = new Set<string>()
  for (const songId of ordem) {
    const song = porId.get(songId)
    if (song === undefined) continue
    const url = urlDe(song.content_id, contentById)
    if (url === null || vistas.has(url) || hasFile(url)) continue
    vistas.add(url)
    urls.push(url)
  }
  log(`prefetch plan n=${urls.length} reason=demand`)
  if (urls.length > 0) await baixar(urls, false)
}

/**
 * T1-R15 manual — "baixar esta setlist" (o design mostra o botão só em
 * setlist sem data de show: as datadas já são cobertas pelo plano de 7 dias).
 */
export async function baixarSetlist(
  setlist: SetlistDTO,
  contentById: Map<string, ContentDTO>,
): Promise<void> {
  const urls: string[] = []
  const vistas = new Set<string>()
  for (const song of [...setlist.setlist_songs].sort((a, b) => a.position - b.position)) {
    const url = urlDe(song.content_id, contentById)
    if (url === null || vistas.has(url) || hasFile(url)) continue
    vistas.add(url)
    urls.push(url)
  }
  log(`prefetch plan n=${urls.length} reason=manual`)
  if (urls.length > 0) await baixar(urls, false)
}

/**
 * T1-R14 — LRU com teto, os garantidos como `protectedUrls`. Só loga quando
 * despeja: uma linha `lru evict n=0` por abertura seria ruído no instrumento
 * dos aceites.
 */
export function aplicarLru(setlists: SetlistDTO[], contentById: Map<string, ContentDTO>): void {
  const protegidos = urlsGarantidas(setlists, contentById)
  const { evict } = lruEvict(listFiles(), CAP_BYTES, protegidos)
  if (evict.length === 0) return
  const bytes = remove(evict)
  log(`lru evict n=${evict.length} bytes=${bytes}`)
}
