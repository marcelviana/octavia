/**
 * O executor do sync (T1-R13 passo 2) — o `rodarSync` que morava no `App.tsx`, extraído sem mudar na SY-PR1 (SY-D29;
 * `docs/native/SY-PRECHECK.md` A8), e com as proteções do sync desde a SY-PR2:
 *
 *   - **o voo único** (SY-D9, SY-D25, SY-D35): `rodarSync(raiz, uid, anterior)` continua a ser a entrada de TODO pedido
 *     (a abertura da sessão, o *Tentar de novo* e, na PR-4, os gatilhos); quem decide se o pedido roda, fica marcado
 *     "de novo" ou não muda nada é a máquina do core (`pedirVoo`/`terminouVoo`). Um sync por vez; o "de novo" roda UMA
 *     vez, ao terminar, com os dados de AGORA (o `dadosRef`), e pela raiz de quem pediu por último;
 *   - **a sessão conferida** (SY-D17): o resultado de um sync cuja sessão mudou enquanto ele voava se descarta — nada
 *     chega à raiz —, e o "de novo" pedido pela sessão velha se cancela;
 *   - **o último sync que saiu à rede** (SY-D33, `ultimoSyncNaRede`): para os gatilhos da PR-4. Só exposto; nada o lê.
 *
 * O que a raiz entrega (`RaizDoSync`) é o que o `rodarSync` usava por fechamento: os dois `set` do estado, o
 * `dadosRef` e o `prefetchEArrumar` — e, desde a PR-2, a sessão de agora. O `sincronizar` é importado aqui, como o
 * `App.tsx` o importava.
 */
import { VOO_OCIOSO, pedirVoo, terminouVoo, type ContentDTO, type EstadoDoVoo, type SetlistDTO } from '@octavia/core'
import type { SyncNaRede } from './gatilhos'
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
   * SY-D17 (o logout no meio): o uid da sessão de AGORA, `null` fora dela — lido DEPOIS do `await`, no instante. O
   * executor descarta o resultado de um sync cuja sessão mudou enquanto ele voava, e cancela o "de novo" que a sessão
   * velha pediu. Era contrato inerte na SY-PR1 (opcional e ignorado); obrigatório desde a PR-2.
   */
  sessaoAtual: () => string | null
}

/** O voo (a máquina do core) e o "de novo" marcado: QUEM pediu por último — a raiz e o uid da sessão daquele pedido. */
let voo: EstadoDoVoo = VOO_OCIOSO
let deNovo: { raiz: RaizDoSync; uid: string } | null = null

/** O último sync que SAIU À REDE (emitiu `sync start`): quando começou, quando terminou (`null` = em voo) e como. */
let ultimo: SyncNaRede | null = null

/**
 * SY-D33 — o último sync que saiu à rede, de qualquer origem (a abertura, o *Tentar de novo*, o "de novo"): a definição
 * da A2.4 (`SY-PRECHECK.md`) — começou na linha `sync start`, terminou na `sync ok` ou na `sync fail`, e `falhaDeRede`
 * quando a falha saiu com `code=network`. O `sync skip reason=offline` não conta (não houve requisição). Os gatilhos da
 * PR-4 o leem para o intervalo de 30 s (SY-D18); nesta PR, nada o lê.
 */
export function ultimoSyncNaRede(): SyncNaRede | null {
  return ultimo === null ? null : { ...ultimo }
}

/**
 * Passo 2 do T1-R13 — roda depois de a tela já mostrar o cache. **A entrada de todo pedido de sync** (SY-D35): o voo
 * decide se este pedido roda agora; se há um sync em curso, ele vira o "de novo" e a promessa resolve já — o "de novo"
 * corre dentro da promessa de quem estava voando, logo depois do fim dele.
 */
export async function rodarSync(raiz: RaizDoSync, uid: string, anterior: Dados): Promise<void> {
  const pedido = pedirVoo(voo)
  voo = pedido.estado
  if (pedido.acao !== 'rodar') {
    deNovo = { raiz, uid }
    return
  }
  let vez = { raiz, uid, anterior }
  for (;;) {
    try {
      await rodarUm(vez.raiz, vez.uid, vez.anterior)
    } catch (e) {
      // Um sync que LANÇOU (o disco, por exemplo — o `save` é síncrono e não tem `try`) libera o voo e não encadeia o
      // "de novo": sem isso, um erro deixaria o voo em curso para sempre, e todo pedido seguinte só marcaria.
      if (ultimo !== null && ultimo.fimMs === null) ultimo = { ...ultimo, fimMs: Date.now() }
      deNovo = null
      voo = terminouVoo(voo, { cancelarDeNovo: true }).estado
      throw e
    }
    const marcado = deNovo
    deNovo = null
    const fim = terminouVoo(voo, {
      cancelarDeNovo: marcado === null || marcado.raiz.sessaoAtual() !== marcado.uid,
    })
    voo = fim.estado
    if (fim.acao !== 'rodar' || marcado === null) return
    // O "de novo" parte do que a raiz tem AGORA — o sync que acabou de terminar já atualizou o `dadosRef` à mão.
    vez = { raiz: marcado.raiz, uid: marcado.uid, anterior: marcado.raiz.dadosRef.current }
  }
}

/** UM sync, do `setSync` ao prefetch — o corpo do `rodarSync` da SY-PR1, com a sessão conferida e o `ultimo`. */
async function rodarUm(raiz: RaizDoSync, uid: string, anterior: Dados): Promise<void> {
  const { setSync, setDados, dadosRef, prefetchEArrumar, sessaoAtual } = raiz
  setSync({ fase: 'sincronizando' })
  // O que a aplicação entregou, para o prefetch de depois do `await` (um objeto, e não um `let`: quem escreve é o gancho).
  const aplicado: { v: { setlists: SetlistDTO[]; contentById: Map<string, ContentDTO> } | null } = { v: null }
  const r = await sincronizar(
    uid,
    anterior.temCache ? { content: anterior.content, setlists: anterior.setlists } : null,
    {
      aoComecar: () => {
        ultimo = { inicioMs: Date.now(), fimMs: null, falhaDeRede: false }
      },
      // SY-D26 — a aplicação na raiz DENTRO do bloco síncrono do sync (o gancho é chamado antes de o `sincronizar`
      // devolver, sem `await` desde a leitura das confirmadas do favoritar): a janela da A6.1 deixa de existir.
      aoAplicar: (a) => {
        // SY-D17: a sessão mudou enquanto o sync voava — nada chega à raiz (o disco do uid dele já foi gravado, como
        // sempre foi: é o cache DAQUELE uid).
        if (sessaoAtual() !== uid) return
        // T1-R10: conjunto de content inalterado volta com a MESMA referência
        // (`reconcileByUpdatedAt`), e o índice por id é reaproveitado — senão
        // todo derivado que o lê se recriaria num sync com `invalidated=0`.
        const contentById =
          a.content === anterior.content
            ? anterior.contentById
            : new Map(a.content.map((c) => [c.id, c]))
        setDados({
          setlists: a.setlists,
          content: a.content,
          contentById,
          temCache: true,
          syncedAtMs: a.syncedAtMs,
        })
        setSync({ fase: 'ok', syncedAtMs: a.syncedAtMs })
        // O `dadosRef` é atualizado à mão aqui porque o efeito que o segue o
        // `setDados` só corre no próximo render — e o LRU precisa das setlists
        // NOVAS para saber o que está garantido.
        dadosRef.current = {
          setlists: a.setlists,
          content: a.content,
          contentById,
          temCache: true,
          syncedAtMs: a.syncedAtMs,
        }
        aplicado.v = { setlists: a.setlists, contentById }
      },
    },
  )
  if (r.kind !== 'skipped-offline' && ultimo !== null && ultimo.fimMs === null) {
    ultimo = { ...ultimo, fimMs: Date.now(), falhaDeRede: r.kind === 'failed' && r.falhaDeRede }
  }
  // SY-D17: a sessão mudou enquanto o sync voava (o logout, ou outra conta) — o resultado é de uma sessão que já não
  // existe, e nada dele chega à raiz: nem os dados, nem o estado do sync, nem o prefetch (que trabalharia sobre o disco
  // de outra sessão). O disco do uid dele o `sincronizar` já gravou, como sempre gravou — é o cache DAQUELE uid.
  if (sessaoAtual() !== uid) return
  if (r.kind === 'ok') {
    if (aplicado.v !== null) await prefetchEArrumar(aplicado.v.setlists, aplicado.v.contentById)
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
