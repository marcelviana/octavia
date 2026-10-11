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
let a: Arnes
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

/** A sessão como o `App.tsx` a monta: os gatilhos ligados, o sync da abertura, e o relógio 10 min adiante. */
async function sessao(): Promise<void> {
  __limparAppState()
  __limparRede()
  __reset()
  base(mock.porta)
  a = new Arnes(UID)
  a.registrar()
  vi.setSystemTime(AGORA)
  desligar = G.ligarGatilhos({
    sessao: () => a.sessao,
    pedirSync: () => {
      void S.rodarSync(a.raiz, UID, a.dadosRef.current)
    },
    ultimoSyncNaRede: () => a.ultimoSyncNaRede(),
  })
  await S.rodarSync(a.raiz, UID, SEM_DADOS)
  await a.quieto()
  passar(10 * 60_000)
}

let caso = ''
function contar(i0: number, esperado: number, extra?: string): Veredito {
  const n = a.starts(i0)
  C.nota(caso, `sync start depois do cenário: ${n} (esperado ${esperado})`)
  if (extra !== undefined) return extra
  return n === esperado ? null : `${n} sync(s), esperado ${esperado}`
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
      desligar = G.ligarGatilhos({
        sessao: () => a.sessao,
        pedirSync: () => {
          void S.rodarSync(a.raiz, UID, a.dadosRef.current)
        },
        ultimoSyncNaRede: () => a.ultimoSyncNaRede(),
      })
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

  it('reprova exatamente a lista de sy-reprovados.txt', () => {
    const j = C.julgar()
    console.info(j.texto)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
  })
})
