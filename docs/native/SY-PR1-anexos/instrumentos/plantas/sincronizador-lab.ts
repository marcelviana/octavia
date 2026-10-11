/**
 * SY-PR1 — O LABORATÓRIO DO EXECUTOR COM O VOO ÚNICO (SY-D9, SY-D17), para os controles negativos dos gates (i) e (ii).
 * Instrumento de anexo (fora de CI, lint e typecheck, N4-D117); **não é a implementação da PR-2** (que põe a máquina no
 * core, a geração das setlists compartilhada e o prazo). O `cn-sy.sh` o copia sobre `apps/native/src/sincronizador.ts`
 * e devolve o original com `git checkout`. É o executor literal da PR-1 (gerado dele: o corpo é o mesmo) com um voo
 * único por cima: um sync por vez, UM "de novo" ao terminar, o resultado descartado e o "de novo" cancelado quando a
 * sessão muda. As escritas (a geração) e o prazo ficam de fora: os casos delas seguem reprovando no laboratório.
 *
 * Com `SY_DEFEITO=<nome>`, uma regra se quebra:
 *   de-novo-apos-logout  o "de novo" roda depois do logout       → `ii:logout-cancela-de-novo`
 *   nao-aplica           o sync ok não chega à raiz              → `ii:escrita-conteudo-aplica`
 *   intervalo-em-tudo    o executor aplica 30 s a todo pedido     → `i:tentar-de-novo-fora-do-intervalo`
 */
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { SyncState } from './screens/SetlistsScreen'
import { sincronizar } from './sync'

export interface Dados {
  setlists: SetlistDTO[]
  content: ContentDTO[]
  contentById: Map<string, ContentDTO>
  /** `true` só depois de um sync bem-sucedido gravado neste aparelho. */
  temCache: boolean
  syncedAtMs: number | null
}

/** O que o executor recebe da raiz — o que o `rodarSync` lia por fechamento no `App.tsx`. */
export interface RaizDoSync {
  setSync: (sync: SyncState) => void
  setDados: (dados: Dados) => void
  dadosRef: { current: Dados }
  prefetchEArrumar: (setlists: SetlistDTO[], contentById: Map<string, ContentDTO>) => Promise<void>
  /**
   * **SY-PR1: contrato inerte** (SY-D17: o logout no meio). O uid da sessão de AGORA, `null` fora dela: o executor da
   * PR-2 descarta o resultado de um sync cuja sessão mudou enquanto ele voava, e cancela o "de novo". Opcional e
   * ignorado nesta PR — o `App.tsx` não o passa; a PR-2 o torna obrigatório e o liga. O gate (ii) já o entrega.
   */
  sessaoAtual?: () => string | null
}

const DEFEITO = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SY_DEFEITO ?? ''

let emVoo = false
let deNovo: { raiz: RaizDoSync; uid: string } | null = null
let ultimoFim = 0

export async function rodarSync(raiz: RaizDoSync, uid: string, anterior: Dados): Promise<void> {
  if (emVoo) {
    deNovo = { raiz, uid }
    return
  }
  if (DEFEITO === 'intervalo-em-tudo' && Date.now() - ultimoFim < 30_000) return
  emVoo = true
  try {
    await rodarUm(raiz, uid, anterior)
  } finally {
    emVoo = false
    ultimoFim = Date.now()
  }
  const proximo = deNovo
  deNovo = null
  if (proximo === null) return
  const sessaoMudou = proximo.raiz.sessaoAtual !== undefined && proximo.raiz.sessaoAtual() !== proximo.uid
  if (sessaoMudou && DEFEITO !== 'de-novo-apos-logout') return
  ultimoFim = 0 // o "de novo" fica fora do intervalo
  await rodarSync(proximo.raiz, proximo.uid, proximo.raiz.dadosRef.current)
}

/** Passo 2 do T1-R13 — roda depois de a tela já mostrar o cache. */
async function rodarUm(raiz: RaizDoSync, uid: string, anterior: Dados): Promise<void> {
  const { setSync, setDados, dadosRef, prefetchEArrumar } = raiz
  setSync({ fase: 'sincronizando' })
  const r = await sincronizar(
    uid,
    anterior.temCache ? { content: anterior.content, setlists: anterior.setlists } : null,
  )
  // LAB: a sessão mudou enquanto o sync voava → o resultado se descarta (SY-D17)
  if (DEFEITO !== 'nao-descarta' && raiz.sessaoAtual !== undefined && raiz.sessaoAtual() !== uid) return
  if (r.kind === 'ok') {
    // T1-R10: conjunto de content inalterado volta com a MESMA referência
    // (`reconcileByUpdatedAt`), e o índice por id é reaproveitado — senão
    // todo derivado que o lê se recriaria num sync com `invalidated=0`.
    const contentById =
      r.content === anterior.content
        ? anterior.contentById
        : new Map(r.content.map((c) => [c.id, c]))
    if (DEFEITO !== 'nao-aplica') setDados({
      setlists: r.setlists,
      content: r.content,
      contentById,
      temCache: true,
      syncedAtMs: r.syncedAtMs,
    })
    setSync({ fase: 'ok', syncedAtMs: r.syncedAtMs })
    // O `dadosRef` é atualizado à mão aqui porque o efeito que o segue o
    // `setDados` só corre no próximo render — e o LRU precisa das setlists
    // NOVAS para saber o que está garantido.
    dadosRef.current = {
      setlists: r.setlists,
      content: r.content,
      contentById,
      temCache: true,
      syncedAtMs: r.syncedAtMs,
    }
    await prefetchEArrumar(r.setlists, contentById)
    return
  }
  // Falha ou offline: o cache anterior fica exatamente como está (A21) e o
  // estado da tela conta o que houve, sem esconder e sem bloquear (T1-R18).
  setSync(
    r.kind === 'skipped-offline'
      ? { fase: 'offline', syncedAtMs: anterior.syncedAtMs }
      // T1-R36 / D-b: a chave do core viaja até a tela, que escolhe o texto.
      : { fase: 'falha', syncedAtMs: anterior.syncedAtMs, messageKey: r.messageKey },
  )
  // Sync falho ou pulado: o cache anterior é o que vale, e é sobre ele que
  // o prefetch e o LRU trabalham.
  await prefetchEArrumar(anterior.setlists, anterior.contentById)
}
