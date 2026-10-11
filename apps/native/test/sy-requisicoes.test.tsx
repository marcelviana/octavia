/**
 * GATE (v) — A CONTAGEM DE REQUISIÇÕES POR EVENTO DE GATILHO (`docs/native/SY-PRECHECK.md` A2.5, A9; SY-D13, SY-D30).
 * SY-PR1: entra REPROVADO pela lista `sy-reprovados.txt`; a **PR-4** o esvazia (os gatilhos de verdade).
 *
 * Por evento de gatilho, o sync custa `1 + ⌈N/100⌉` `GET`: **2** até 100 músicas (`/api/setlists` e uma página de
 * `/api/content`), **3** com 101. O gate conta as linhas `api status=… path=/api/setlists|/api/content` que o evento
 * produziu — a linha que o aceite no aparelho conta (a regra 38 (c) remedida no release, SY-D16). Os downloads ficam À
 * PARTE (SY-D30): são as linhas `file src=download`, contadas separadas; aqui o prefetch da raiz é inerte e elas são 0.
 *
 * **O servidor não é o `aceite.py`**: o mock pagina em 40 (para os aceites A21/A22 terem duas páginas com a fixture
 * pequena, `aceite.py` `_paginas`). Este gate quer a página do handler real, 100 (`api.ts` `getContentPage`,
 * `pageSize=100`, o teto medido em prod) — e por isso sobe, no próprio teste, um servidor das duas leituras com
 * `pageSize` de 100. Nenhuma requisição sai da máquina.
 *
 * **O que NÃO consegue ver**: o que prod responde (o tamanho, o tempo, o `hasMore` de verdade) — a contagem do release.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createServer, type Server } from 'node:http'
import { act } from 'react'
import { __appState, __limparAppState } from './fake-react-native'
import { __limparRede, __rede } from './fake-expo-network'
import { __reset } from './fake-expo-file-system'
import { portaLivre } from './mock'
import { Arnes, SEM_DADOS, musica, setlistCom } from './sy-arnes'
import { Checagens, type Veredito } from './sy-lista'

vi.mock('expo-network', () => import('./fake-expo-network'))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-requisicoes' } } }))

const UID = 'sy-requisicoes'
const SL = 'dddddddd-1111-4222-8333-444455556666'
const AGORA = Date.parse('2026-10-10T20:00:00.000Z')
const PAGINA = 100

let biblioteca = [musica(1)]
let servidor: Server
let porta = 0
let S: typeof import('../src/sincronizador')
let G: typeof import('../src/gatilhos')
let a: Arnes
let desligar: () => void = () => undefined
const C = new Checagens('v', 'a contagem')

/** As duas leituras do sync, com a página de 100 do handler real. */
function subir(): Promise<Server> {
  const s = createServer((req, res) => {
    const u = new URL(req.url ?? '/', 'http://x')
    const json = (corpo: unknown): void => {
      const raw = Buffer.from(JSON.stringify(corpo))
      res.writeHead(200, { 'content-type': 'application/json', 'content-length': String(raw.length) })
      res.end(raw)
    }
    if (u.pathname === '/api/setlists') return json([setlistCom(SL, 'SY contagem', biblioteca.slice(0, 3).map((c) => c.id))])
    if (u.pathname === '/api/content') {
      const page = Number(u.searchParams.get('page') ?? '1')
      const tamanho = Math.min(Number(u.searchParams.get('pageSize') ?? String(PAGINA)), PAGINA)
      const fatia = biblioteca.slice((page - 1) * tamanho, page * tamanho)
      const totalPages = Math.max(1, Math.ceil(biblioteca.length / tamanho))
      return json({ data: fatia, total: biblioteca.length, page, pageSize: tamanho, hasMore: page < totalPages, totalPages })
    }
    res.writeHead(404).end()
  })
  return new Promise((r) => s.listen(porta, '127.0.0.1', () => r(s)))
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

async function sessao(n: number): Promise<void> {
  __limparAppState()
  __limparRede()
  __reset()
  biblioteca = Array.from({ length: n }, (_, k) => musica(k + 1))
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

function contar(id: string, i0: number, esperado: number): Veredito {
  const api = a.desde(i0, 'api status=').filter((l) => /path=\/api\/(setlists|content)( |$)/.test(l))
  const downloads = a.desde(i0, 'file src=download').length
  C.nota(id, `GET por evento: ${api.length} (esperado ${esperado}) · downloads à parte: ${downloads} · ${JSON.stringify(api.map((l) => l.replace(/ ms=\d+/, '')))}`)
  return api.length === esperado ? null : `${api.length} GET, esperado ${esperado}`
}

beforeAll(async () => {
  porta = await portaLivre()
  servidor = await subir()
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  vi.useFakeTimers({ toFake: ['Date'] })
  S = await import('../src/sincronizador')
  G = await import('../src/gatilhos')
})

afterAll(async () => {
  vi.useRealTimers()
  await new Promise<void>((r) => servidor.close(() => r()))
})

afterEach(() => {
  desligar()
  desligar = () => undefined
  vi.restoreAllMocks()
})

describe('gate (v) — a contagem de GET por evento de gatilho (A2.5)', () => {
  it('a abertura (o controle do servidor): 2 GET com 100 músicas, 3 com 101 — o sync de hoje, sem gatilho', async () => {
    await sessao(100)
    const cem = a.desde(0, 'api status=').length
    await sessao(101)
    const cento1 = a.desde(0, 'api status=').length
    console.info(`gate (v), o controle: a abertura com 100 músicas → ${cem} GET; com 101 → ${cento1} GET`)
    expect([cem, cento1], 'o servidor do gate não pagina como o handler (100)').toEqual([2, 3])
  })

  it('a rede volta (100 músicas) → 2 GET', async () => {
    await C.caso('rede-volta-100', async () => {
      await sessao(100)
      const i0 = a.marca()
      await evento(() => __rede(false))
      await evento(() => __rede(true))
      return contar('rede-volta-100', i0, 2)
    })
  })

  it('a rede volta (101 músicas) → 3 GET', async () => {
    await C.caso('rede-volta-101', async () => {
      await sessao(101)
      const i0 = a.marca()
      await evento(() => __rede(false))
      await evento(() => __rede(true))
      return contar('rede-volta-101', i0, 3)
    })
  })

  it('a volta do segundo plano depois de 30 s (100 músicas) → 2 GET', async () => {
    await C.caso('fundo-100', async () => {
      await sessao(100)
      const i0 = a.marca()
      await evento(() => __appState('background'))
      passar(31_000)
      await evento(() => __appState('active'))
      return contar('fundo-100', i0, 2)
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
