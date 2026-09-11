/**
 * Orquestração do sync (PRD T1-R9, T1-R9b, T1-R13; aceites A4, A19, A21, A22).
 * Fino de propósito: busca, entrega ao `planSync` do core e grava pelo `store`
 * só quando o plano diz `apply`. Nenhuma decisão mora aqui.
 *
 * Custo por sync: **1 + ⌈N/100⌉ requests** — hoje 2 (66 content na conta de
 * audit, 63 na principal). Cache-first é da tela: ela já renderizou o cache
 * antes desta função ser chamada (T1-R13 passo 1).
 */
import { mergePages, planSync, type ContentDTO, type SetlistDTO } from '@octavia/core'
import { getContentPage, getSetlists, type ApiResult } from './api'
import { log } from './log'
import { estaOnline } from './net'
import { save, type CacheSnapshot } from './store'

export type SyncOutcome =
  | { kind: 'ok'; setlists: SetlistDTO[]; content: ContentDTO[]; syncedAtMs: number }
  | { kind: 'skipped-offline' }
  | { kind: 'failed'; stage: 'setlists' | 'content'; messageKey: string }

/** Todas as páginas de content até `hasMore === false`. */
async function buscarContent(): Promise<
  | { failed: false; paginas: ContentDTO[][]; total: number }
  | { failed: true; erro: ApiResult<never>; page: number }
> {
  const paginas: ContentDTO[][] = []
  let page = 1
  let total = 0
  for (;;) {
    const r = await getContentPage(page)
    // D-d: a página que falhou viaja junto — o `sync fail` tinha `page=1`
    // hardcoded, e o aceite da N1-PR7 (§3.4) mediu a falha na página 2 sendo
    // reportada como 1. O catálogo define `page=<p>`.
    if (!r.ok) return { failed: true, erro: r as ApiResult<never>, page }
    paginas.push(r.data.data)
    total = r.data.total
    if (!r.data.hasMore) break
    page += 1
  }
  return { failed: false, paginas, total }
}

/**
 * Um sync completo. `anterior` é o cache já carregado — é ele que o
 * `planSync` devolve intacto quando qualquer etapa falha (A21).
 */
export async function sincronizar(
  uid: string,
  anterior: { content: ContentDTO[]; setlists: SetlistDTO[] } | null,
): Promise<SyncOutcome> {
  if (!(await estaOnline())) {
    log('sync skip reason=offline')
    return { kind: 'skipped-offline' }
  }

  const t0 = Date.now()
  log('sync start')

  const rSetlists = await getSetlists()
  const rContent = rSetlists.ok ? await buscarContent() : null

  const plano = planSync({
    pages:
      rContent === null
        ? [{ items: [], failed: true }]
        : rContent.failed
          ? [{ items: [], failed: true }]
          : rContent.paginas.map((items) => ({ items, failed: false })),
    setlists: rSetlists.ok ? rSetlists.data : null,
    previous: anterior,
  })

  if (plano.action === 'keep-previous') {
    const stage = rSetlists.ok ? 'content' : 'setlists'
    const erro = rSetlists.ok
      ? rContent !== null && rContent.failed
        ? rContent.erro
        : null
      : rSetlists
    const code = erro !== null && !erro.ok ? (erro.error.code ?? erro.error.kind) : 'net'
    const status = erro !== null && !erro.ok ? (erro.status ?? '-') : '-'
    // `setlists` não pagina (array na raiz, SETLISTS.md): a página é sempre 1.
    const page = rContent !== null && rContent.failed ? rContent.page : 1
    log(`sync fail stage=${stage} page=${page} code=${code} status=${status}`)
    return {
      kind: 'failed',
      stage,
      messageKey: erro !== null && !erro.ok ? erro.error.messageKey : 'erro.desconhecido',
    }
  }

  const syncedAtMs = Date.now()
  const snapshot: CacheSnapshot = {
    setlists: plano.setlists,
    content: plano.content,
    syncedAtMs,
  }
  save(uid, snapshot)

  const paginas = rContent !== null && !rContent.failed ? rContent.paginas.length : 0
  const { duplicates } = mergePages(rContent !== null && !rContent.failed ? rContent.paginas : [])
  if (duplicates > 0) log(`sync dedupe n=${duplicates}`)
  log(
    `sync ok setlists=${plano.setlists.length} content=${plano.content.length} pages=${paginas} t=${Date.now() - t0}`,
  )

  return { kind: 'ok', setlists: plano.setlists, content: plano.content, syncedAtMs }
}
