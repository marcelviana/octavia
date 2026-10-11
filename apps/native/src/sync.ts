/**
 * Orquestração do sync (PRD T1-R9, T1-R9b, T1-R13; aceites A4, A19, A21, A22).
 * Fino de propósito: busca, entrega ao `planSync` do core e grava pelo `store`
 * só quando o plano diz `apply`. Nenhuma decisão mora aqui.
 *
 * Custo por sync: **1 + ⌈N/100⌉ requests** — hoje 2 (66 content na conta de
 * audit, 63 na principal). Cache-first é da tela: ela já renderizou o cache
 * antes desta função ser chamada (T1-R13 passo 1).
 */
import {
  mergePages,
  naoRegredir,
  planSync,
  reconcileByUpdatedAt,
  type ContentDTO,
  type SetlistDTO,
} from '@octavia/core'
import { getContentPage, getSetlists, type ApiResult } from './api'
import { linhasConfirmadas } from './favoritar'
import { aplicarLeituraDeSetlists, emitirLeituraDeSetlists } from './geracao-das-setlists'
import { log } from './log'
import { estaOnline } from './net'
import { save, saveContent, type CacheSnapshot } from './store'

export type SyncOutcome =
  | {
      kind: 'ok'
      /** As setlists que ESTE sync leu (reconciliadas) — aplicadas só quando `setlistsAplicadas`. */
      setlists: SetlistDTO[]
      content: ContentDTO[]
      syncedAtMs: number
      /**
       * SY-PR2 (SY-D25) — `false` quando uma releitura de escrita emitida DEPOIS do `GET /api/setlists` deste sync já
       * aplicou (a geração da div. 232): o sync gravou e aplicou o conteúdo, e as setlists ficaram as da releitura.
       */
      setlistsAplicadas: boolean
    }
  | { kind: 'skipped-offline' }
  | {
      kind: 'failed'
      stage: 'setlists' | 'content'
      messageKey: string
      /**
       * SY-PR2 (SY-D33) — a falha SEM resposta HTTP: `true` exatamente quando a linha `sync fail` saiu com
       * `code=network` (o prazo de rede inclusive). É o que o intervalo dos gatilhos lê (SY-D18: depois de falha de rede
       * ele não vale), pelo `ultimoSyncNaRede` do executor.
       */
      falhaDeRede: boolean
    }

/**
 * SY-PR2 — o que o executor (`sincronizador.ts`) pendura num sync. Opcional: sem ganchos, o sync é o de sempre (é
 * assim que os testes do T1-R10 e do favoritar o chamam).
 */
export interface GanchosDoSync {
  /** No instante da linha `sync start`: o sync saiu à rede (a definição da A2.4 do `SY-PRECHECK.md`). */
  aoComecar?: () => void
  /**
   * **SY-D26 — a aplicação na raiz, no MESMO bloco síncrono** que lê as confirmadas do favoritar (`naoRegredir`) e
   * grava o disco: chamado logo antes do `return` do sync ok, sem nenhum `await` desde a leitura das confirmadas. É o
   * que fecha a janela da A6.1 (`SY-PRECHECK.md`): o executor aplicava numa microtarefa DEPOIS de o sync devolver, e um
   * favoritar que assentasse ali gravava a confirmada tarde demais para o sync e era desfeito na raiz. Com a aplicação
   * aqui, só há duas ordens: o favoritar antes (a confirmada está no mapa, e a `naoRegredir` a mantém) ou depois (ele lê
   * a raiz já com o sync e põe a estrela). Não toca no `updated_at`, na `naoRegredir` nem no `reconcile`.
   *
   * `setlists: null` (SY-D25): o sync PERDEU as setlists para uma releitura mais nova — aplica-se o conteúdo, e as
   * setlists da raiz ficam as de agora (que o executor não pode ler de um `dadosRef` defasado, A5).
   */
  aoAplicar?: (aplicado: { setlists: SetlistDTO[] | null; content: ContentDTO[]; syncedAtMs: number }) => void
}

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
  ganchos: GanchosDoSync = {},
): Promise<SyncOutcome> {
  if (!(await estaOnline())) {
    log('sync skip reason=offline')
    return { kind: 'skipped-offline' }
  }

  const t0 = Date.now()
  log('sync start')
  ganchos.aoComecar?.()

  // SY-D25: o número deste `GET /api/setlists` na ordem de emissão — a mesma das releituras das escritas (div. 232).
  const minha = emitirLeituraDeSetlists()
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
      falhaDeRede: code === 'network',
    }
  }

  // SY-D25 (a div. 232 estendida ao sync): uma releitura de escrita emitida DEPOIS do `GET` deste sync já aplicou? Então
  // a foto das setlists deste sync é mais velha que a do disco e da raiz, e não vence — o conteúdo se aplica, as setlists
  // não, e a `cache write kind=setlists` não sai (a assinatura do descarte da errata N2-PR2). Daqui até o `aoAplicar`,
  // nenhum `await`: outra leitura não aplica no meio.
  const setlistsValem = aplicarLeituraDeSetlists(minha)
  // T1-R10 (N2-D8): compara com o que o app já tem. Sem cache anterior, tudo
  // é novo. Quando nada mudou, o conjunto devolvido é o MESMO do anterior —
  // os derivados memoizados por referência não se recriam.
  const setlists = reconcileByUpdatedAt(anterior?.setlists ?? [], plano.setlists)
  const reconciliado = reconcileByUpdatedAt(anterior?.content ?? [], plano.content)
  // N4-D91: a linha que um favoritar confirmou depois de este sync ler o servidor é mais nova que a lida — fica. A
  // contagem `invalidated` é a do reconcile, de antes (o critério e o porquê: `naoRegredir`, no core).
  const content = { ...reconciliado, items: naoRegredir(reconciliado.items, linhasConfirmadas()) }

  const syncedAtMs = Date.now()
  const snapshot: CacheSnapshot = {
    setlists: setlists.items,
    content: content.items,
    syncedAtMs,
  }
  if (setlistsValem) save(uid, snapshot, { setlists: setlists.invalidated, content: content.invalidated })
  else saveContent(uid, snapshot, { content: content.invalidated })

  const paginas = rContent !== null && !rContent.failed ? rContent.paginas.length : 0
  const { duplicates } = mergePages(rContent !== null && !rContent.failed ? rContent.paginas : [])
  if (duplicates > 0) log(`sync dedupe n=${duplicates}`)
  log(
    `sync ok setlists=${plano.setlists.length} content=${plano.content.length} pages=${paginas} t=${Date.now() - t0}`,
  )
  // SY-D26: ainda no bloco síncrono que começou na leitura das confirmadas — nenhum `await` desde ela.
  ganchos.aoAplicar?.({ setlists: setlistsValem ? setlists.items : null, content: content.items, syncedAtMs })

  return { kind: 'ok', setlists: setlists.items, content: content.items, syncedAtMs, setlistsAplicadas: setlistsValem }
}
