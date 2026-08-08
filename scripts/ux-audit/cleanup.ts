/**
 * Cleanup da conta de UX audit contra a API pública de prod.
 *
 * Remove tudo que tem o prefixo [UX-AUDIT], na ordem que respeita as FKs:
 * setlists (a rota DELETE já remove setlist_songs antes) → content →
 * arquivos de storage associados (file_url dos itens removidos).
 *
 * NUNCA deleta a conta em si — ela fica para uso contínuo do audit.
 *
 * Uso:
 *   pnpm tsx scripts/ux-audit/cleanup.ts --dry-run   # só lista, não deleta
 *   pnpm tsx scripts/ux-audit/cleanup.ts             # deleta de fato
 */
import { apiFetch, sleep } from './auth'

const PREFIX = '[UX-AUDIT]'
const DELAY_MS = 300
const DRY_RUN = process.argv.includes('--dry-run')

const counts = { deleted: 0, failed: 0 }

function logItem(status: 'deleted' | 'failed' | 'would-delete', label: string, reason?: string): void {
  if (status !== 'would-delete') counts[status]++
  console.log(`[cleanup] ${status.padEnd(12)} ${label}${reason ? ` — ${reason}` : ''}`)
}

interface ContentRow {
  id: string
  title: string
  file_url: string | null
}

interface SetlistRow {
  id: string
  name: string
  setlist_songs: Array<{ id: string }>
}

async function fetchAllContent(): Promise<ContentRow[]> {
  const all: ContentRow[] = []
  let page = 1
  for (;;) {
    const res = await apiFetch(`/api/content?page=${page}&pageSize=100`)
    if (!res.ok) throw new Error(`GET /api/content página ${page}: HTTP ${res.status}`)
    const body = (await res.json()) as { data: ContentRow[]; hasMore: boolean }
    all.push(...body.data)
    if (!body.hasMore) break
    page++
    await sleep(DELAY_MS)
  }
  return all
}

/** Extrai o nome de arquivo no bucket a partir do file_url público. */
function storageFilename(fileUrl: string): string | null {
  try {
    const segment = new URL(fileUrl).pathname.split('/').pop()
    if (!segment) return null
    const decoded = decodeURIComponent(segment)
    // A rota de delete só aceita o padrão timestamp-nome gerado no upload
    return /^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(decoded) ? decoded : null
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  if (DRY_RUN) {
    console.log('[cleanup] MODO DRY-RUN: nada será deletado')
  }

  // 1. Setlists do audit. Três formas de identificar:
  //    - "UX-AUDIT ..." (prefixo SEM colchetes usado pelo seed — o
  //      sanitizador strict do setlistSchemas.create zera nomes com [ ])
  //    - "[UX-AUDIT] ..." (caso o sanitizador mude e o prefixo passe)
  //    - nome vazio: lixo das execuções antigas do seed, cujos nomes o
  //      sanitizador esvaziou (a conta é dedicada ao audit — toda setlist
  //      dela é nossa)
  const setlists = (await apiFetch('/api/setlists').then(async (res) => {
    if (!res.ok) throw new Error(`GET /api/setlists: HTTP ${res.status}`)
    return (await res.json()) as SetlistRow[]
  })).filter((s) => s.name.startsWith('UX-AUDIT') || s.name.startsWith(PREFIX) || s.name === '')

  console.log(`[cleanup] ${setlists.length} setlists do audit encontradas`)

  for (const setlist of setlists) {
    const label = `setlist "${setlist.name}" (${setlist.setlist_songs.length} músicas)`
    if (DRY_RUN) {
      logItem('would-delete', label)
      continue
    }
    const res = await apiFetch(`/api/setlists/${setlist.id}`, { method: 'DELETE' })
    logItem(res.ok ? 'deleted' : 'failed', label, res.ok ? undefined : `HTTP ${res.status}`)
    await sleep(DELAY_MS)
  }

  // 2. Content com prefixo (coletando file_urls antes de deletar)
  const content = (await fetchAllContent()).filter((row) => row.title.startsWith(PREFIX))
  console.log(`[cleanup] ${content.length} itens de conteúdo ${PREFIX} encontrados`)

  const filesToDelete: string[] = []
  for (const row of content) {
    if (row.file_url) {
      const filename = storageFilename(row.file_url)
      if (filename) filesToDelete.push(filename)
    }
    const label = `content "${row.title}"`
    if (DRY_RUN) {
      logItem('would-delete', label)
      continue
    }
    const res = await apiFetch(`/api/content?id=${row.id}`, { method: 'DELETE' })
    logItem(res.ok ? 'deleted' : 'failed', label, res.ok ? undefined : `HTTP ${res.status}`)
    await sleep(DELAY_MS)
  }

  // 3. Arquivos de storage associados
  console.log(`[cleanup] ${filesToDelete.length} arquivos de storage associados`)
  for (const filename of filesToDelete) {
    const label = `storage "${filename}"`
    if (DRY_RUN) {
      logItem('would-delete', label)
      continue
    }
    const res = await apiFetch('/api/storage/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
    logItem(res.ok ? 'deleted' : 'failed', label, res.ok ? undefined : `HTTP ${res.status}`)
    await sleep(DELAY_MS)
  }

  if (DRY_RUN) {
    console.log('[cleanup] DRY-RUN concluído — nada foi deletado')
    return
  }

  console.log(`[cleanup] Resumo: ${counts.deleted} deleted, ${counts.failed} failed`)
  process.exit(counts.failed > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  console.error(`[cleanup] ERRO: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
