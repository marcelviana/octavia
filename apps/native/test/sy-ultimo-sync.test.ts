/**
 * SY-PR2 (SY-D33) — o `ultimoSyncNaRede` do EXECUTOR contra a definição da A2.4 (`SY-PRECHECK.md`), que o arnês dos
 * gates lê nas LINHAS do log (`Arnes.ultimoSyncNaRede`): começou no `sync start`, terminou no `sync ok`/`sync fail`,
 * `falhaDeRede` quando a falha saiu com `code=network`; o `sync skip reason=offline` não conta. Nesta PR nada lê o do
 * executor (os gatilhos da PR-4 lerão); este teste é o que garante que, quando lerem, ele diz o mesmo que as linhas.
 *
 * Os casos: antes de qualquer sync; um sync em voo (a resposta segurada); um sync ok; uma falha com status (o 500 na
 * página 1); uma falha de rede (a porta morta); e um sync pulado sem rede, que não muda nada.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { SyncNaRede } from '../src/gatilhos'
import { __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'
import { Arnes, SEM_DADOS, musica, segurarConteudo, setlistCom } from './sy-arnes'

let online = true
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-ultimo' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'sy-ultimo'
const BIBLIOTECA = [musica(1), musica(2)]
const SETLISTS = [setlistCom('abababab-1111-4222-8333-444455556666', 'SY último', BIBLIOTECA.map((c) => c.id))]

let mock: Mock
let dir = ''
let S: typeof import('../src/sincronizador')
let a: Arnes

/** O do executor e o das linhas, lado a lado; o instante com a folga de um passo de relógio (os dois leem `Date.now`). */
function concorda(): { executor: SyncNaRede | null; linhas: SyncNaRede | null } {
  const executor = S.ultimoSyncNaRede()
  const linhas = a.ultimoSyncNaRede()
  expect(executor === null, 'os dois nulos, ou nenhum').toBe(linhas === null)
  if (executor !== null && linhas !== null) {
    expect(executor.falhaDeRede).toBe(linhas.falhaDeRede)
    expect(executor.fimMs === null).toBe(linhas.fimMs === null)
    expect(Math.abs(executor.inicioMs - linhas.inicioMs)).toBeLessThanOrEqual(20)
    if (executor.fimMs !== null && linhas.fimMs !== null) {
      expect(Math.abs(executor.fimMs - linhas.fimMs)).toBeLessThanOrEqual(20)
      expect(executor.fimMs).toBeGreaterThanOrEqual(executor.inicioMs)
    }
  }
  return { executor, linhas }
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-ultimo-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  __reset()
  a = new Arnes(UID)
  a.registrar()
  S = await import('../src/sincronizador')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  online = true
})

describe('o ultimoSyncNaRede do executor = a definição da A2.4 lida nas linhas (SY-D33)', () => {
  it('antes de qualquer sync: nulo', () => {
    expect(concorda().executor).toBeNull()
  })

  it('um sync em voo: começou, sem fim; ao terminar ok, com fim e sem falha de rede', async () => {
    await mock.servir('normal', SETLISTS, BIBLIOTECA)
    const { lido, soltar } = segurarConteudo()
    const voo = S.rodarSync(a.raiz, UID, SEM_DADOS)
    await lido
    expect(concorda().executor).toMatchObject({ fimMs: null, falhaDeRede: false })
    soltar()
    await voo
    expect(concorda().executor).toMatchObject({ falhaDeRede: false })
    expect(S.ultimoSyncNaRede()?.fimMs).not.toBeNull()
    expect(a.desde(0, 'sync ok')).toHaveLength(1)
  })

  it('a falha COM status (500 na página 1): terminou, e não é falha de rede', async () => {
    await mock.servir('500-pagina-1', SETLISTS, BIBLIOTECA)
    const i = a.marca()
    await S.rodarSync(a.raiz, UID, a.dadosRef.current)
    expect(a.desde(i, 'sync fail')).toEqual([expect.stringMatching(/code=\S+ status=500$/)])
    expect(concorda().executor).toMatchObject({ falhaDeRede: false })
  })

  it('a falha DE REDE (a porta morta): terminou com `code=network`, e é falha de rede', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${await portaLivre()}`
    const i = a.marca()
    await S.rodarSync(a.raiz, UID, a.dadosRef.current)
    expect(a.desde(i, 'sync fail')).toEqual([expect.stringContaining('code=network status=-')])
    expect(concorda().executor).toMatchObject({ falhaDeRede: true })
  })

  it('o sync pulado sem rede não saiu à rede: o último continua o de antes', async () => {
    const antes = S.ultimoSyncNaRede()
    online = false
    const i = a.marca()
    await S.rodarSync(a.raiz, UID, a.dadosRef.current)
    expect(a.desde(i, 'sync skip')).toEqual(['sync skip reason=offline'])
    expect(a.desde(i, 'sync start')).toEqual([])
    expect(S.ultimoSyncNaRede()).toEqual(antes)
    concorda()
  })
})
