/**
 * GATE (i) — OS GATILHOS DO SYNC (SY-D4, SY-D17, SY-D18, SY-D32; `docs/native/SY-PRECHECK.md` A2.3, A2.4, A9). SY-PR1:
 * entra REPROVADO pela lista `sy-reprovados.txt`; a **PR-4** o esvazia implementando `src/gatilhos.ts`.
 *
 * Cada caso monta a sessão como o `App.tsx` a monta — os gatilhos ligados (`ligarGatilhos`) e o sync da abertura
 * (`rodarSync`, o executor de verdade, contra o `aceite.py`) — e então dirige o `AppState` (o duplo do
 * `fake-react-native.tsx`), a rede (o `fake-expo-network.ts`) e o relógio (só o `Date` é falso: `vi.setSystemTime`).
 * Mede a contagem de `sync start` depois do cenário — o que o aceite no aparelho mede pelo logcat.
 *
 * **Projeto `native-tela`, e não `native`** (divergência declarada contra a tabela da A9): os gatilhos assinam o
 * `AppState`, que é do `react-native`, e só este projeto troca o `react-native` pelo duplo.
 *
 * **O que entra na lista**: os casos "→ 1" (o contrato inerte não dispara nada). Os casos "→ 0" passam hoje e ficam
 * FORA dela — passar hoje não prova nada sobre eles, porque nada dispara; a prova deles é o controle negativo plantado
 * (`docs/native/SY-PR1-anexos/instrumentos/cn-sy.sh`: o laboratório dos gatilhos com um defeito por vez).
 *
 * **O que NÃO consegue ver**: o que o Android entrega de fato (o portal cativo, a troca Wi-Fi ↔ dados, o evento com o
 * app em segundo plano, a tela bloqueada como segundo plano — SY-D17 (2), A-SY-18, A-SY-19) e o JS suspenso em segundo
 * plano. Isso é do aparelho, na PR-4 (AVD com o mock).
 *
 * **SY-PR4, commit 1 — os casos novos** (SY-D49 (3): entram reprovando no primeiro commit da PR-4): o PALCO (A-SY-23,
 * SY-D49, SY-D56 — a foto da sessão de verdade, `criarFotoDaSessao`, é o que os gatilhos leem; `entrar`/`sair`/
 * `focoDoIndice`/`abrirAvulso` fazem o papel da navegação), o LOGOUT (SY-D44 — o caso lê o `ultimoSyncNaRede` do
 * EXECUTOR, que é o que o `App.tsx` passa) e as LINHAS `sync trigger` dos gatilhos que não disparam (SY-D28). Os casos
 * novos conferem a contagem de `sync start` **e** as linhas `sync trigger`, na ordem. A sessão (`sessao()`) passou a
 * ligar o `palco` (a foto, fechada) e o `segurarDeNovo` na raiz do arnês — mudança de instrumento, declarada: os casos
 * da PR-1 não mudaram de cenário nem de asserção. Os de TELA (S2 em edição, o banner da falha automática) moram em
 * `sy-gatilhos-telas.test.tsx`, a família `tela-` do mesmo gate.
 *
 * **O que estes casos NÃO veem**: a `Navigation` real (que tela chama `entrar`/`sair`/`focoDoIndice`/`abrirAvulso` é
 * do `navigation.tsx`, e a ligação se prova no aparelho, A-SY-23); a busca do palco por cima (ela não toca a sessão:
 * o caso do índice cobre a regra, o aparelho a tela); V aberta (V não está na sessão por construção — o caso confere que
 * a sessão solta não segura nada, o aparelho que o texto de V não muda).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { act } from 'react'
import { __appState, __limparAppState } from './fake-react-native'
import { __limparRede, __rede, __redeSemEvento } from './fake-expo-network'
import { __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'
import type { FotoDaSessao } from '../src/foto-do-palco'
import type { GatilhosLigados, LigacaoDosGatilhos } from '../src/gatilhos'
import { Arnes, SEM_DADOS, comPrazo, musica, segurarConteudo, setlistCom } from './sy-arnes'
import { Checagens, type Veredito } from './sy-lista'

vi.mock('expo-network', () => import('./fake-expo-network'))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-gatilhos' } } }))

const UID = 'sy-gatilhos'
const SL = 'cccccccc-1111-4222-8333-444455556666'
const BIBLIOTECA = [musica(1), musica(2)]
const SETLISTS = [setlistCom(SL, 'SY gatilhos', BIBLIOTECA.map((c) => c.id))]
const AGORA = Date.parse('2026-10-10T20:00:00.000Z')

let mock: Mock
let dir = ''
let portaMorta = 0
let S: typeof import('../src/sincronizador')
let G: typeof import('../src/gatilhos')
let F: typeof import('../src/foto-do-palco')
let a: Arnes
let foto: FotoDaSessao
let desligar: () => void = () => undefined
const C = new Checagens('i', 'os gatilhos')

const base = (porta: number): void => {
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
}
const passar = (ms: number): void => {
  vi.setSystemTime(Date.now() + ms)
}
async function evento(f: () => void): Promise<void> {
  await act(async () => {
    f()
  })
  await a.quieto()
}
const fundo = (): Promise<void> => evento(() => __appState('background'))
const frente = (): Promise<void> => evento(() => __appState('active'))
const redeCai = (): Promise<void> => evento(() => __rede(false))
const redeVolta = (): Promise<void> => evento(() => __rede(true))
/** Um sync pedido FORA dos gatilhos (a abertura, o *Tentar de novo*): o executor direto, como o `App.tsx` o chama. */
async function syncDireto(): Promise<void> {
  await S.rodarSync(a.raiz, UID, a.dadosRef.current)
  await a.quieto()
}

/**
 * Liga os gatilhos como o `App.tsx` os liga: a sessão, o pedido (o executor), o último sync, o palco (a foto) — e o
 * `segurarDeNovo` na raiz do executor (SY-D49 (2)). Por omissão, o `ultimoSyncNaRede` é o das LINHAS (a definição da A2.4).
 */
function ligar(extra: Partial<LigacaoDosGatilhos> = {}): void {
  const g: GatilhosLigados = G.ligarGatilhos({
    sessao: () => a.sessao,
    pedirSync: () => {
      void S.rodarSync(a.raiz, UID, a.dadosRef.current)
    },
    ultimoSyncNaRede: () => a.ultimoSyncNaRede(),
    palco: foto,
    ...extra,
  })
  a.raiz.segurarDeNovo = () => g.segurarDeNovo()
  desligar = g
}

/** A sessão como o `App.tsx` a monta: os gatilhos ligados, o sync da abertura, e o relógio 10 min adiante. */
async function sessao(): Promise<void> {
  __limparAppState()
  __limparRede()
  __reset()
  base(mock.porta)
  a = new Arnes(UID)
  a.registrar()
  vi.setSystemTime(AGORA)
  foto = F.criarFotoDaSessao()
  ligar()
  await S.rodarSync(a.raiz, UID, SEM_DADOS)
  await a.quieto()
  passar(10 * 60_000)
}

/** O palco: a setlist da sessão (o `acharSetlist` do `navigation.tsx`), entrar de fora, sair a S1/S2. */
const acharSetlist = (id: string) => SETLISTS.find((s) => s.id === id)
const abrirPalco = (): Promise<void> => evento(() => foto.entrar(SL, acharSetlist))
const sairDoPalco = (): Promise<void> => evento(() => foto.sair())
/** A linha `sync trigger` esperada (SY-D28; `stage-exit`, `again` e `hold-stage` são da SY-D49, os nomes propostos pela PR-4). */
const T = (motivo: string, decisao: string): string => `sync trigger reason=${motivo} decision=${decisao}`

let caso = ''
function contar(i0: number, esperado: number, extra?: string): Veredito {
  const n = a.starts(i0)
  C.nota(caso, `sync start depois do cenário: ${n} (esperado ${esperado})`)
  if (extra !== undefined) return extra
  return n === esperado ? null : `${n} sync(s), esperado ${esperado}`
}

/** SY-PR4 — a contagem de `sync start` E as linhas `sync trigger`, na ordem (o "→ 0" é uma linha, não a ausência dela). */
function confere(i0: number, esperado: number, linhas: string[], extra?: string): Veredito {
  const n = a.starts(i0)
  const vistas = a.desde(i0, 'sync trigger')
  C.nota(caso, `sync start: ${n} (esperado ${esperado}) · sync trigger: ${JSON.stringify(vistas)}`)
  if (extra !== undefined) return extra
  if (n !== esperado) return `${n} sync(s), esperado ${esperado}`
  if (JSON.stringify(vistas) !== JSON.stringify(linhas)) return `linhas sync trigger ${JSON.stringify(vistas)}, esperado ${JSON.stringify(linhas)}`
  return null
}

async function rodar(id: string, f: () => Promise<Veredito>): Promise<void> {
  caso = id
  await C.caso(id, async () => {
    await sessao()
    return f()
  })
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-gatilhos-'))
  mock = new Mock(await portaLivre(), dir)
  await mock.servir('normal', SETLISTS, BIBLIOTECA)
  portaMorta = await portaLivre()
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  vi.useFakeTimers({ toFake: ['Date'] })
  S = await import('../src/sincronizador')
  G = await import('../src/gatilhos')
  F = await import('../src/foto-do-palco')
})

afterAll(async () => {
  vi.useRealTimers()
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  desligar()
  desligar = () => undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('gate (i) — os gatilhos (SY-D4, SY-D17, SY-D18; A2.3, A2.4)', () => {
  it('a rede volta com o app na frente → 1', async () => {
    await rodar('rede-volta-na-frente', async () => {
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      return contar(i0, 1)
    })
  })

  it('segundo plano por MAIS de 30 s, com rede → 1', async () => {
    await rodar('fundo-mais-de-30s', async () => {
      const i0 = a.marca()
      await fundo()
      passar(31_000)
      await frente()
      return contar(i0, 1)
    })
  })

  it('segundo plano por MENOS de 30 s, sem a marca → 0', async () => {
    await rodar('fundo-menos-de-30s', async () => {
      const i0 = a.marca()
      await fundo()
      passar(10_000)
      await frente()
      return contar(i0, 0)
    })
  })

  it('a rede volta com o app em segundo plano → 0 (deixa a marca)', async () => {
    await rodar('rede-volta-no-fundo', async () => {
      const i0 = a.marca()
      await fundo()
      await redeCai()
      await redeVolta()
      return contar(i0, 0)
    })
  })

  it('a volta antes de 30 s COM a marca → 1 (conta como "a rede voltou", fora do intervalo)', async () => {
    await rodar('marca-volta-curta', async () => {
      const i0 = a.marca()
      await fundo()
      await redeCai()
      passar(2_000)
      await redeVolta()
      passar(8_000)
      await frente()
      return contar(i0, 1)
    })
  })

  it('a marca se apaga quando QUALQUER sync sai à rede → a volta curta seguinte → 0', async () => {
    await rodar('marca-apaga-com-sync', async () => {
      await fundo()
      await redeCai()
      passar(2_000)
      await redeVolta() // a marca
      passar(1_000)
      // um sync de fora dos gatilhos sai à rede e falha por rede: a marca se apaga, e o intervalo não vale (SY-D18)
      base(portaMorta)
      await syncDireto()
      base(mock.porta)
      const i0 = a.marca()
      passar(5_000)
      await frente()
      const falhou = a.desde(0, 'sync fail').some((l) => l.includes('code=network'))
      return contar(i0, 0, falhou ? undefined : 'o sync direto não falhou por rede — o cenário não se montou')
    })
  })

  it('os dois eventos juntos (a volta do segundo plano e a rede logo depois) → 1', async () => {
    await rodar('dois-eventos', async () => {
      const i0 = a.marca()
      await fundo()
      passar(31_000)
      await frente()
      passar(2_000)
      await redeCai()
      await redeVolta()
      return contar(i0, 1)
    })
  })

  it('a volta do segundo plano SEM rede → 0, e nenhuma chamada ao sincronizar (nenhum sync skip)', async () => {
    await rodar('volta-sem-rede', async () => {
      const i0 = a.marca()
      await fundo()
      await redeCai()
      passar(31_000)
      await frente()
      const skips = a.desde(i0, 'sync skip').length
      return contar(i0, 0, skips > 0 ? `${skips} linha(s) sync skip: o executor foi chamado sem rede` : undefined)
    })
  })

  it('sem sessão → 0 (nem a rede, nem o segundo plano)', async () => {
    await rodar('sem-sessao', async () => {
      a.sair()
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      await fundo()
      passar(31_000)
      await frente()
      return contar(i0, 0)
    })
  })

  it('a primeira leitura da rede (null → true) e o evento repetido (true → true) → 0', async () => {
    await rodar('primeira-leitura', async () => {
      // de novo do zero: os gatilhos religados com a rede de pé (a primeira leitura), e o evento repetido
      desligar()
      __redeSemEvento(true)
      const i0 = a.marca()
      ligar()
      await a.quieto()
      await redeVolta()
      return contar(i0, 0)
    })
  })

  it('dentro do intervalo (30 s do fim do último sync que saiu à rede) → 0', async () => {
    await rodar('dentro-do-intervalo', async () => {
      await syncDireto()
      passar(10_000)
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      return contar(i0, 0)
    })
  })

  it('depois de uma falha de REDE (code=network) o intervalo não vale → 1', async () => {
    await rodar('apos-falha-de-rede', async () => {
      base(portaMorta)
      await syncDireto()
      base(mock.porta)
      passar(5_000)
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      return contar(i0, 1)
    })
  })

  it('depois de uma falha COM STATUS (500) o intervalo vale → 0', async () => {
    await rodar('apos-falha-com-status', async () => {
      await mock.servir('500-pagina-1', SETLISTS, BIBLIOTECA)
      try {
        await syncDireto()
      } finally {
        await mock.servir('normal', SETLISTS, BIBLIOTECA)
      }
      passar(5_000)
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      const status = a.desde(0, 'sync fail').some((l) => l.includes('status=500'))
      return contar(i0, 0, status ? undefined : 'o sync direto não falhou com 500 — o cenário não se montou')
    })
  })

  it('o "de novo" fica FORA do intervalo: o gatilho durante um sync → um segundo sync logo ao terminar', async () => {
    await rodar('de-novo-fora-do-intervalo', async () => {
      const i0 = a.marca()
      const { lido, soltar } = segurarConteudo()
      const voo = S.rodarSync(a.raiz, UID, a.dadosRef.current)
      await comPrazo(lido, 5_000, 'o sync não chegou a ler o conteúdo')
      await act(async () => {
        __rede(false)
      })
      await act(async () => {
        __rede(true)
      })
      soltar()
      await voo
      await a.quieto()
      return contar(i0, 2)
    })
  })

  it('o *Tentar de novo* fica FORA do intervalo → 1, mesmo 5 s depois de um sync', async () => {
    await rodar('tentar-de-novo-fora-do-intervalo', async () => {
      await syncDireto()
      passar(5_000)
      const i0 = a.marca()
      await syncDireto() // o `tentarNovamente` do `App.tsx` chama o executor direto
      return contar(i0, 1)
    })
  })

  it('SY-D32 (4): a falha por prazo (code=network) não gera tentativa sozinha — em 60 s sem outro gatilho, só o sync que falhou', async () => {
    await rodar('falha-de-rede-nao-retenta', async () => {
      // a janela começa ANTES do sync que falha: uma tentativa que nasça já no assentar dele também conta
      const i0 = a.marca()
      base(portaMorta)
      await syncDireto()
      for (let k = 0; k < 6; k++) {
        passar(10_000)
        await new Promise((r) => setTimeout(r, 60))
      }
      await a.quieto()
      base(mock.porta)
      return contar(i0, 1) // o que falhou, e mais nenhum
    })
  })

  // ------------------------------------------------------------------------------------------------ SY-PR4, commit 1

  it('SY-D28: os gatilhos que NÃO disparam deixam a linha — skip-short, skip-interval, skip-offline, skip-background', async () => {
    await rodar('linhas-sem-disparo', async () => {
      const i0 = a.marca()
      await fundo()
      passar(10_000)
      await frente() // a volta curta, sem a marca
      await syncDireto()
      passar(5_000)
      await redeCai()
      await redeVolta() // dentro do intervalo
      await fundo()
      await redeCai()
      passar(31_000)
      await frente() // a volta longa, sem rede
      await fundo()
      await redeVolta() // a rede volta em segundo plano: a marca
      return confere(i0, 1, [
        T('foreground', 'skip-short'),
        T('net', 'skip-interval'),
        T('foreground', 'skip-offline'),
        T('net', 'skip-background'),
      ])
    })
  })

  it('A-SY-23: com o palco aberto, a rede volta → 0 sync e a marca (hold-stage)', async () => {
    await rodar('palco-rede', async () => {
      await abrirPalco()
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      return confere(i0, 0, [T('net', 'hold-stage')])
    })
  })

  it('A-SY-23: com o palco aberto, a volta do segundo plano depois de 30 s → 0 sync e a marca', async () => {
    await rodar('palco-fundo', async () => {
      await abrirPalco()
      const i0 = a.marca()
      await fundo()
      passar(31_000)
      await frente()
      return confere(i0, 0, [T('foreground', 'hold-stage')])
    })
  })

  it('A-SY-23: o índice do palco por cima (a mesma sessão, E6) → os dois gatilhos seguram', async () => {
    await rodar('palco-indice-por-cima', async () => {
      await abrirPalco()
      await evento(() => foto.focoDoIndice(3)) // o salto ao índice do palco: o foco do `Index` COM `posicaoAtual`
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      await fundo()
      passar(31_000)
      await frente()
      return confere(i0, 0, [T('net', 'hold-stage'), T('foreground', 'hold-stage')])
    })
  })

  it('A-SY-23: sair do palco com a marca → 1 sync (stage-exit, as regras de sempre)', async () => {
    await rodar('palco-sair-com-marca', async () => {
      await abrirPalco()
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      passar(5_000)
      await sairDoPalco()
      return confere(i0, 1, [T('net', 'hold-stage'), T('stage-exit', 'run')])
    })
  })

  it('A-SY-23: sair do palco DENTRO do intervalo → 0 (skip-interval), e a marca se consome', async () => {
    await rodar('palco-sair-no-intervalo', async () => {
      await abrirPalco()
      await syncDireto() // o *Tentar de novo* com o palco aberto: roda como hoje, e termina agora
      const i0 = a.marca()
      passar(5_000)
      await redeCai()
      await redeVolta()
      passar(5_000)
      await sairDoPalco()
      passar(60_000)
      await sairDoPalco() // um segundo foco de S1/S2: a marca já se consumiu, nada
      return confere(i0, 0, [T('net', 'hold-stage'), T('stage-exit', 'skip-interval')])
    })
  })

  it('A-SY-23: sair do palco SEM rede → 0 (skip-offline), a marca se consome, e a rede que volta depois dispara', async () => {
    await rodar('palco-sair-sem-rede', async () => {
      await abrirPalco()
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      await redeCai()
      await sairDoPalco()
      const noMeio = a.starts(i0)
      await redeVolta() // o palco já fechou: é o gatilho da rede de sempre
      return confere(
        i0,
        1,
        [T('net', 'hold-stage'), T('stage-exit', 'skip-offline'), T('net', 'run')],
        noMeio !== 0 ? `${noMeio} sync(s) ao sair sem rede` : undefined,
      )
    })
  })

  it('A-SY-23: sair do palco SEM marca → 0, e nenhuma linha', async () => {
    await rodar('palco-sair-sem-marca', async () => {
      await abrirPalco()
      const i0 = a.marca()
      passar(5_000)
      await sairDoPalco()
      return confere(i0, 0, [])
    })
  })

  it('A-SY-23: V aberta (fora da sessão do palco) → o gatilho roda', async () => {
    await rodar('palco-v-aberta', async () => {
      await abrirPalco()
      await sairDoPalco() // de volta a S1; de lá a L e V — nenhuma delas entra na sessão
      const i0 = a.marca()
      await redeCai()
      await redeVolta()
      return confere(i0, 1, [T('net', 'run')])
    })
  })

  it('A-SY-23: o "de novo" de um sync em voo quando o palco abre no meio → espera (again), e roda ao sair', async () => {
    await rodar('palco-de-novo-espera', async () => {
      const i0 = a.marca()
      const { lido, soltar } = segurarConteudo()
      const voo = S.rodarSync(a.raiz, UID, a.dadosRef.current)
      await comPrazo(lido, 5_000, 'o sync não chegou a ler o conteúdo')
      await act(async () => {
        __rede(false)
      })
      await act(async () => {
        __rede(true) // o palco ainda fechado: queued, o "de novo" marcado no voo
      })
      await act(async () => {
        foto.entrar(SL, acharSetlist) // o palco abre no meio do voo
      })
      soltar()
      await voo
      await a.quieto()
      const noPalco = a.starts(i0)
      passar(31_000)
      await sairDoPalco()
      return confere(
        i0,
        2,
        [T('net', 'queued'), T('again', 'hold-stage'), T('stage-exit', 'run')],
        noPalco !== 1 ? `${noPalco} sync(s) com o palco aberto (esperado 1: só o que voava)` : undefined,
      )
    })
  })

  it('A-SY-23: o sync da abertura e o *Tentar de novo* com o palco aberto → rodam como hoje, sem linha sync trigger', async () => {
    await rodar('palco-abertura-e-tentar', async () => {
      await abrirPalco()
      const i0 = a.marca()
      await S.rodarSync(a.raiz, UID, a.dadosRef.current) // a abertura (o `App.tsx` chama o executor direto)
      await a.quieto()
      passar(5_000)
      await syncDireto() // o *Tentar de novo*
      return confere(i0, 2, [])
    })
  })

  it('SY-D56: o palco avulso sem hospedeira montado segura os gatilhos; desmontado, o marcado roda', async () => {
    await rodar('palco-avulso', async () => {
      const i0 = a.marca()
      let fechar: () => void = () => undefined
      await act(async () => {
        fechar = foto.abrirAvulso() // ▶ na L ou em V: `Stage { avulsa, origem }`
      })
      await redeCai()
      await redeVolta()
      passar(5_000)
      await evento(() => fechar()) // o voltar desempilha o avulso
      return confere(i0, 1, [T('net', 'hold-stage'), T('stage-exit', 'run')])
    })
  })

  it('SY-D44: o último sync de OUTRA sessão não segura o gatilho desta (logout e login no meio)', async () => {
    await rodar('logout-intervalo-de-outra-sessao', async () => {
      const B = 'sy-gatilhos-b'
      desligar()
      // a ligação que o `App.tsx` faz: o `ultimoSyncNaRede` do EXECUTOR, e o pedido pela sessão de agora
      ligar({
        pedirSync: () => {
          const uid = a.sessao
          if (uid !== null) void S.rodarSync(a.raiz, uid, a.dadosRef.current)
        },
        ultimoSyncNaRede: () => S.ultimoSyncNaRede(),
      })
      await syncDireto() // a sessão A sai à rede e termina
      passar(2_000)
      a.sair() // o logout
      a.sessao = B // o login de outra conta
      await redeCai()
      await S.rodarSync(a.raiz, B, SEM_DADOS) // a abertura de B, sem rede: `sync skip`, nada sai à rede
      await a.quieto()
      const i0 = a.marca()
      passar(3_000)
      await redeVolta()
      return confere(i0, 1, [T('net', 'run')])
    })
  })

  it('reprova exatamente a lista de sy-reprovados.txt', () => {
    const j = C.julgar()
    console.info(j.texto)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
  })
})
