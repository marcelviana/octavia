/**
 * O executor do sync (T1-R13 passo 2) — o `rodarSync` que morava no `App.tsx`, **extraído sem mudar** (SY-PR1,
 * SY-D29; `docs/native/SY-PRECHECK.md` A8).
 *
 * Por que ele sai da raiz: nenhum teste monta o `App.tsx` (div. 1262), e os gates do SY — o voo único, a janela da
 * `naoRegredir` — precisam de um módulo para importar. A extração é **literal**: a mesma ordem de chamadas, os mesmos
 * `await`, a mesma troca da raiz. Nada de voo, nada de sessão conferida, nada de reordenar — isso é da PR-2, que
 * esvazia os gates (ii) e (iv) mudando ESTE arquivo.
 *
 * O que a raiz entrega (`RaizDoSync`) é o que o `rodarSync` usava por fechamento: os dois `set` do estado, o
 * `dadosRef` e o `prefetchEArrumar`. O `sincronizar` é importado aqui, como o `App.tsx` o importava.
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
}

/** Passo 2 do T1-R13 — roda depois de a tela já mostrar o cache. */
export async function rodarSync(raiz: RaizDoSync, uid: string, anterior: Dados): Promise<void> {
  const { setSync, setDados, dadosRef, prefetchEArrumar } = raiz
  setSync({ fase: 'sincronizando' })
  const r = await sincronizar(
    uid,
    anterior.temCache ? { content: anterior.content, setlists: anterior.setlists } : null,
  )
  if (r.kind === 'ok') {
    // T1-R10: conjunto de content inalterado volta com a MESMA referência
    // (`reconcileByUpdatedAt`), e o índice por id é reaproveitado — senão
    // todo derivado que o lê se recriaria num sync com `invalidated=0`.
    const contentById =
      r.content === anterior.content
        ? anterior.contentById
        : new Map(r.content.map((c) => [c.id, c]))
    setDados({
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
