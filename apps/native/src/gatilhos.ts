/**
 * Os gatilhos do sync automático — o T1-R13 passo 4 (SY-D4): **a rede volta com o app aberto**, e **a volta do segundo
 * plano depois de 30 s**. Sem sync periódico, sem gesto manual.
 *
 * As regras (`docs/native/SY-PRECHECK.md` A2.3 e A2.4; SY-D17, SY-D18, SY-D28, SY-D39), como este arquivo as aplica:
 *   - **a rede**: a transição `false → true` do ouvinte do `expo-network`, reduzida pelo MESMO `alcancavel` do `useOnline`
 *     (`net.ts`); nunca a primeira leitura (`null → true`) nem o evento repetido (`true → true`);
 *   - **o segundo plano**: o `AppState` deixando o `active` marca a hora; a volta a `active` mede a ausência pelo relógio
 *     (`Date.now()`); 30 s ou mais é o gatilho (`AUSENCIA_MINIMA_MS`); menos, sem a marca, é `skip-short`;
 *   - **a marca**: a rede que volta com o app em segundo plano não dispara (`skip-background`) e deixa a marca; a volta
 *     curta com a marca conta como "a rede voltou" (`reason=net`); a marca se apaga quando qualquer sync sai à rede
 *     depois dela (SY-D17 (1)) — e se consome na volta;
 *   - **sem rede na volta**: `skip-offline`, e nenhuma chamada ao executor (nenhum `sync skip`); a rede, quando voltar,
 *     é o gatilho da rede. A rede da volta se lê na hora (`estaOnline`), não a do último evento;
 *   - **sem sessão**: nada, e nenhuma linha (a `sessao()` da raiz);
 *   - **o palco aberto** (SY-D49, SY-D56): nenhum gatilho dispara — `hold-stage`, e o pedido fica MARCADO (uma marca só,
 *     da sessão de agora). "Palco aberto" é o que a foto da sessão diz (`palco.palcoAberto()`): a sessão do palco, de
 *     entrar de fora até voltar a S1/S2 (com o índice ou a busca por cima), ou um palco avulso sem hospedeira montado;
 *     V não conta. **Ao fechar o palco**, o marcado passa pelas regras de sempre (SY-D49 (2)), com `reason=stage-exit`:
 *     a rede lida na hora (`skip-offline`; a rede, quando voltar, é o gatilho da rede), o voo, o intervalo. Fechar sem
 *     marca: nada, nenhuma linha. O sync da abertura e o *Tentar de novo* não passam por aqui e não mudam;
 *   - **o "de novo" do voo** (SY-D49 (2)): o executor pergunta `segurarDeNovo()` antes de rodá-lo; com o palco aberto, ele
 *     vira a marca do palco (`reason=again decision=hold-stage`) e roda ao fechar, pelas mesmas regras;
 *   - **o voo**: um sync em voo → `queued` — o pedido vai ao executor, e o voo único o marca "de novo" (SY-D9; o "de
 *     novo" fica fora do intervalo, SY-D18, SY-D39);
 *   - **o intervalo** (SY-D18): 30 s do FIM do último sync que saiu à rede (`ultimoSyncNaRede`), para os dois gatilhos;
 *     não vale depois de falha de rede (`falhaDeRede`); vale depois de falha com status → `skip-interval`. **Só conta um
 *     sync da sessão de agora** (SY-D44): o `ultimoSyncNaRede` do executor não se zera no logout, e carrega o `uid`;
 *   - **a linha** `sync trigger reason=<motivo> decision=<decisão>` (SY-D28): uma por gatilho AVALIADO, inclusive os que
 *     não disparam; nenhuma para a primeira leitura, o evento repetido e a falta de sessão. O `sync start` não muda.
 *     G3 70 → 71: é a única linha de log nova da PR-4 (o coletor do G3 lê comentário, div. 83: aqui nenhum a cita).
 *   - **nada tenta de novo sozinho** (SY-D32 (4)): os gatilhos são EVENTOS (a transição da rede, a volta do `AppState`),
 *     e a falha de um sync não é evento de nenhum dos dois.
 *
 * **O contrato** (SY-D33): `ligarGatilhos({ sessao, pedirSync, ultimoSyncNaRede, palco }) → desligar`, com o `AppState` e
 * o `expo-network` assinados AQUI DENTRO. O commit 1 da SY-PR4 o estendeu (o `palco`, o `uid` do `SyncNaRede`, o
 * `segurarDeNovo` — declarado, pergunta do aval). O commit 3 trouxe os gatilhos; o commit 4, o palco e a sessão do
 * intervalo.
 */
import { AppState } from 'react-native'
import * as Network from 'expo-network'
import { log } from './log'
import { alcancavel, estaOnline } from './net'

/**
 * O que disparou (o `reason=` da linha `sync trigger`, SY-D28): a rede, a volta do segundo plano, e — SY-PR4, SY-D49 —
 * o fechar do palco com um gatilho segurado (`stage-exit`) e o "de novo" do voo segurado pelo palco (`again`).
 */
export type MotivoDoGatilho = 'net' | 'foreground' | 'stage-exit' | 'again'

/** O que o gatilho decidiu (o `decision=` da linha `sync trigger`, SY-D28; `hold-stage` é da SY-D49). */
export type DecisaoDoGatilho =
  | 'run'
  | 'queued'
  | 'skip-interval'
  | 'skip-short'
  | 'skip-offline'
  | 'skip-background'
  | 'hold-stage'

/** A ausência mínima do T1-R13 passo 4: a volta do segundo plano só dispara depois de 30 s fora. */
export const AUSENCIA_MINIMA_MS = 30_000

/** O intervalo mínimo da SY-D18: 30 s do fim do último sync que saiu à rede. */
export const INTERVALO_MINIMO_MS = 30_000

/** O último sync que saiu à rede (emitiu `sync start`): de que sessão, quando começou, quando terminou (`null` = em voo) e como. */
export interface SyncNaRede {
  /** SY-PR4 (SY-D44): a sessão que pediu — o intervalo só vale contra um sync da sessão de agora. */
  uid: string
  inicioMs: number
  fimMs: number | null
  /** `true` quando terminou em `sync fail … code=network` — a falha sem resposta HTTP (o prazo inclusive). */
  falhaDeRede: boolean
}

/**
 * SY-PR4 (SY-D49, SY-D56) — o palco, como os gatilhos o leem: aberto ou não, e o aviso de quando fecha. Quem o
 * implementa é a foto da sessão (`foto-do-palco.ts`): a sessão do palco (de entrar de fora até voltar a S1/S2) ou um
 * palco avulso sem hospedeira montado.
 */
export interface PalcoDosGatilhos {
  palcoAberto(): boolean
  /** Chama `f` quando o palco passa de aberto a fechado; devolve o desligar. */
  aoFecharPalco(f: () => void): () => void
}

/** O que a raiz entrega aos gatilhos. */
export interface LigacaoDosGatilhos {
  /** O uid da sessão de agora; `null` fora dela (S0) — sem sessão, nenhum gatilho. */
  sessao: () => string | null
  /** Pede um sync ao executor — o voo único decide se ele roda ou fica marcado "de novo" (SY-D9, PR-2). */
  pedirSync: (motivo: MotivoDoGatilho) => void
  /** O último sync que saiu à rede, de qualquer origem (a abertura, o *Tentar de novo*, o "de novo", um gatilho). */
  ultimoSyncNaRede: () => SyncNaRede | null
  /** SY-PR4 (SY-D49) — o palco aberto segura os gatilhos. */
  palco: PalcoDosGatilhos
}

/**
 * O que `ligarGatilhos` devolve: o desligar (chamado como função, a forma da SY-D33) e — SY-PR4, SY-D49 (2) — o que o
 * executor pergunta antes de rodar o "de novo" do voo: `true` = o palco está aberto, o pedido ficou marcado para o
 * fechar dele, e o "de novo" não roda agora.
 */
export interface GatilhosLigados {
  (): void
  segurarDeNovo(): boolean
}

/** A linha do gatilho avaliado (SY-D28) — a única linha de log deste arquivo. */
function linha(motivo: MotivoDoGatilho, decisao: DecisaoDoGatilho): void {
  log(`sync trigger reason=${motivo} decision=${decisao}`)
}

/** Liga os dois gatilhos e devolve o desligar. Uma ligação por raiz; desligada, nada mais sai. */
export function ligarGatilhos(l: LigacaoDosGatilhos): GatilhosLigados {
  let vivo = true
  /** O último estado de rede visto: `null` antes da primeira leitura — e a primeira leitura não é volta. */
  let online: boolean | null = null
  /** Desde quando o app está fora do `active` (`null` = na frente). */
  let foraDesde: number | null = AppState.currentState === 'active' ? null : Date.now()
  /** A rede voltou com o app em segundo plano: de que sessão, e quando (SY-D17). */
  let marcaDoFundo: { uid: string; t: number } | null = null
  /** Um gatilho (ou o "de novo") segurado pelo palco aberto, da sessão que o pediu (SY-D49): roda ao fechar o palco. */
  let marcaDoPalco: { uid: string } | null = null

  /** Um sync saiu à rede depois de `t`: a marca já foi atendida (SY-D17 (1)). */
  const saiuDepois = (t: number): boolean => {
    const u = l.ultimoSyncNaRede()
    return u !== null && u.inicioMs >= t
  }

  /** O gatilho valeu (sessão de pé, rede de pé): o palco, o voo e o intervalo decidem. */
  const decidir = (uid: string, motivo: MotivoDoGatilho): void => {
    if (l.palco.palcoAberto()) {
      marcaDoPalco = { uid }
      linha(motivo, 'hold-stage')
      return
    }
    const u = l.ultimoSyncNaRede()
    if (u !== null && u.fimMs === null) {
      linha(motivo, 'queued')
      l.pedirSync(motivo)
      return
    }
    // SY-D44: o intervalo só conta um sync DESTA sessão — o de outra (o logout no meio) não segura nada.
    if (u !== null && u.uid === uid && u.fimMs !== null && !u.falhaDeRede && Date.now() - u.fimMs < INTERVALO_MINIMO_MS) {
      linha(motivo, 'skip-interval')
      return
    }
    linha(motivo, 'run')
    l.pedirSync(motivo)
  }

  /** Com a rede lida AGORA (a volta do segundo plano): sem rede, a linha e nada mais; com rede, decide. */
  const comRede = (uid: string, motivo: MotivoDoGatilho): void => {
    void estaOnline().then((temRede) => {
      if (!vivo || l.sessao() !== uid) return
      if (!temRede) {
        linha(motivo, 'skip-offline')
        return
      }
      decidir(uid, motivo)
    })
  }

  void estaOnline().then((v) => {
    if (vivo && online === null) online = v
  })

  const rede = Network.addNetworkStateListener((estado) => {
    if (!vivo) return
    const agora = alcancavel(estado)
    const antes = online
    online = agora
    if (antes !== false || !agora) return // só a transição false → true
    const uid = l.sessao()
    if (uid === null) return
    if (AppState.currentState !== 'active') {
      marcaDoFundo = { uid, t: Date.now() }
      linha('net', 'skip-background')
      return
    }
    decidir(uid, 'net')
  })

  const app = AppState.addEventListener('change', (estado) => {
    if (!vivo) return
    if (estado !== 'active') {
      if (foraDesde === null) foraDesde = Date.now()
      return
    }
    if (foraDesde === null) return
    const ausencia = Date.now() - foraDesde
    foraDesde = null
    const marca = marcaDoFundo
    marcaDoFundo = null
    const uid = l.sessao()
    if (uid === null) return
    const comMarca = marca !== null && marca.uid === uid && !saiuDepois(marca.t)
    if (ausencia >= AUSENCIA_MINIMA_MS) comRede(uid, 'foreground')
    else if (comMarca) comRede(uid, 'net')
    else linha('foreground', 'skip-short')
  })

  // SY-D49 (2): o palco fechou — o marcado passa pelas regras de sempre, com a rede lida agora.
  const palco = l.palco.aoFecharPalco(() => {
    const marca = marcaDoPalco
    marcaDoPalco = null
    if (!vivo || marca === null) return
    if (l.sessao() !== marca.uid) return // outra sessão (ou nenhuma): a marca era da que saiu
    comRede(marca.uid, 'stage-exit')
  })

  /** O executor pergunta antes de rodar o "de novo" do voo: com o palco aberto, ele vira a marca do palco. */
  const segurarDeNovo = (): boolean => {
    if (!vivo || !l.palco.palcoAberto()) return false
    const uid = l.sessao()
    if (uid === null) return false
    marcaDoPalco = { uid }
    linha('again', 'hold-stage')
    return true
  }

  const desligar = (): void => {
    vivo = false
    marcaDoFundo = null
    marcaDoPalco = null
    rede.remove()
    app.remove()
    palco()
  }
  return Object.assign(desligar, { segurarDeNovo })
}
