/**
 * CONTROLE NEGATIVO DO T1-R10 — N2-D8, div. 157, caso 21 do `LOGS-OCTAVIA.md`.
 *
 * O `cache write kind=… invalidated=<n>` saía com `0` LITERAL (`store.ts`), e o
 * `diffByUpdatedAt` do core não tinha chamador fora dos testes. O aceite que
 * lia essa linha no aparelho lia uma constante: não havia valor que o fizesse
 * reprovar. Este arquivo é o gate que faltava, e vem ANTES do conserto — no
 * código de antes ele TEM de reprovar no caso `updated_at` diferente; se
 * passasse lá, o instrumento estaria quebrado (div. 127).
 *
 * O MECANISMO é o do N1: o mock HTTP de `apps/native/src/fixtures/aceite.py`
 * (`servidor <porta> normal <setlists.json> <content.json>`), o mesmo que os
 * aceites de falha usaram em `localhost:8788`. Aqui a porta é livre (o CI roda
 * em paralelo) e "mudar o servidor" é reiniciá-lo com outro JSON — o mock lê
 * os arquivos uma vez, na subida. O que roda de verdade: `sincronizar()`
 * (`src/sync.ts`), a camada `api.ts` com o `fetch` do Node, o `planSync` do
 * core e o `store.ts` sobre o duplo do `expo-file-system`. O que é duplo: o
 * Firebase (um usuário com token fixo), a sessão e o `expo-network` (online).
 *
 * "Derivados" (T1-R10: índice de busca, layout renderizado) no app são
 * MEMOIZADOS POR REFERÊNCIA: o índice da S4 é `useMemo(buildIndex, [contents])`
 * e o status da S1 é `useMemo(…, [setlists, contentById, …])`. Invalidar um
 * derivado é, então, entregar um conjunto NOVO; não invalidar é devolver o
 * MESMO. É isso que as asserções de identidade medem.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildIndex, searchIndex, type ContentDTO, type SetlistDTO } from '@octavia/core'
import { __reset } from './fake-expo-file-system'

vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => 'token-cn-t1r10' } },
}))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const ACEITE_PY = path.resolve(__dirname, '../src/fixtures/aceite.py')
const UID = 'cn-t1r10'
const T0 = '2026-09-01T00:00:00.000+00:00'
const T1 = '2026-09-16T12:00:00.000+00:00'

type Sincronizar = typeof import('../src/sync').sincronizar
let sincronizar: Sincronizar
let porta = 0
let dir = ''
let servidor: ChildProcess | null = null
let linhas: string[] = []

function content(id: string, title: string, updatedAt = T0): ContentDTO {
  return {
    id,
    title,
    artist: null,
    album: null,
    content_type: 'Lyrics',
    content_data: { lyrics: `letra de ${title}` },
    file_url: null,
    updated_at: updatedAt,
  }
}

function setlist(name: string, updatedAt = T0): SetlistDTO {
  return {
    id: 'sl-1',
    name,
    performance_date: null,
    venue: null,
    updated_at: updatedAt,
    setlist_songs: [
      { id: 'ss-1', setlist_id: 'sl-1', content_id: 'c-1', position: 1, notes: null, content: null },
      { id: 'ss-2', setlist_id: 'sl-1', content_id: 'c-2', position: 2, notes: null, content: null },
    ],
  }
}

const BIBLIOTECA = [content('c-1', 'Velha Cancao'), content('c-2', 'Outra'), content('c-3', 'Terceira')]

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const endereco = s.address()
      const p = typeof endereco === 'object' && endereco !== null ? endereco.port : 0
      s.close(() => resolve(p))
    })
  })
}

async function parar(): Promise<void> {
  const s = servidor
  servidor = null
  if (s === null || s.exitCode !== null) return
  await new Promise<void>((resolve) => {
    s.once('exit', () => resolve())
    s.kill('SIGTERM')
  })
}

/** Sobe (ou re-sobe) o mock do N1 servindo exatamente estes dois conjuntos. */
async function servir(setlists: SetlistDTO[], contents: ContentDTO[]): Promise<void> {
  await parar()
  const fs = path.join(dir, 'setlists.json')
  const fc = path.join(dir, 'content.json')
  writeFileSync(fs, JSON.stringify(setlists))
  writeFileSync(fc, JSON.stringify(contents))
  const s = spawn('python3', [ACEITE_PY, 'servidor', String(porta), 'normal', fs, fc], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  servidor = s
  await new Promise<void>((resolve, reject) => {
    let saida = ''
    const t = setTimeout(() => reject(new Error(`mock não subiu: ${saida}`)), 10_000)
    const ler = (b: Buffer): void => {
      saida += b.toString()
      if (saida.includes('fixture: servidor')) {
        clearTimeout(t)
        resolve()
      }
    }
    s.stdout?.on('data', ler)
    s.stderr?.on('data', ler)
    s.once('exit', (code) => {
      clearTimeout(t)
      reject(new Error(`mock saiu com ${code}: ${saida}`))
    })
  })
}

function cacheWrite(kind: 'setlists' | 'content'): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: cache write kind=${kind} `))
}

type Ok = Extract<Awaited<ReturnType<Sincronizar>>, { kind: 'ok' }>

async function syncOk(anterior: { content: ContentDTO[]; setlists: SetlistDTO[] } | null): Promise<Ok> {
  linhas = []
  const r = await sincronizar(UID, anterior)
  if (r.kind !== 'ok') throw new Error(`sync não fechou ok: ${JSON.stringify(r)}`)
  return r
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-t1r10-'))
  porta = await portaLivre()
  // `api.ts` lê a base e o `__DEV__` na carga do módulo: os dois antes do import.
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  sincronizar = (await import('../src/sync')).sincronizar
})

afterAll(async () => {
  await parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('T1-R10 — dois syncs sem mudança no servidor', () => {
  it('o segundo loga invalidated=0 nos dois conjuntos', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    const r1 = await syncOk(null)
    const r2 = await syncOk(r1)
    expect(cacheWrite('setlists')).toEqual(['OCTAVIA: cache write kind=setlists n=1 invalidated=0'])
    expect(cacheWrite('content')).toEqual(['OCTAVIA: cache write kind=content n=3 invalidated=0'])
    expect(r2.content.map((c) => c.id)).toEqual(['c-1', 'c-2', 'c-3'])
  })

  it('e não recria derivado nenhum: os conjuntos devolvidos são os MESMOS do anterior', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    const r1 = await syncOk(null)
    const r2 = await syncOk(r1)
    expect(r2.content).toBe(r1.content)
    expect(r2.setlists).toBe(r1.setlists)
  })
})

describe('T1-R10 — CN: o servidor devolve updated_at diferente para um item', () => {
  it('content: invalidated=1, e o índice de busca não tem mais a versão velha', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    const r1 = await syncOk(null)
    await syncOk(r1)

    const editada = [content('c-1', 'Nova Cancao', T1), BIBLIOTECA[1]!, BIBLIOTECA[2]!]
    await servir([setlist('Show')], editada)
    const r3 = await syncOk(r1)

    expect(cacheWrite('content')).toEqual(['OCTAVIA: cache write kind=content n=3 invalidated=1'])
    expect(cacheWrite('setlists')).toEqual(['OCTAVIA: cache write kind=setlists n=1 invalidated=0'])
    // O derivado do item foi recriado: conjunto novo, e o índice construído
    // sobre ele acha a versão nova e não acha a velha.
    expect(r3.content).not.toBe(r1.content)
    const indice = buildIndex(r3.content)
    expect(searchIndex(indice, 'velha')).toEqual([])
    expect(searchIndex(indice, 'nova')).toEqual([{ id: 'c-1', where: 'title' }])
    // O conjunto que não mudou não é recriado.
    expect(r3.setlists).toBe(r1.setlists)
  })

  it('setlist renomeada no web: kind=setlists invalidated=1, e volta a 0 no sync seguinte', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    const r1 = await syncOk(null)

    await servir([setlist('Show renomeado', T1)], BIBLIOTECA)
    const r2 = await syncOk(r1)
    expect(cacheWrite('setlists')).toEqual(['OCTAVIA: cache write kind=setlists n=1 invalidated=1'])
    expect(cacheWrite('content')).toEqual(['OCTAVIA: cache write kind=content n=3 invalidated=0'])
    expect(r2.setlists).not.toBe(r1.setlists)
    expect(r2.setlists[0]?.name).toBe('Show renomeado')

    const r3 = await syncOk(r2)
    expect(cacheWrite('setlists')).toEqual(['OCTAVIA: cache write kind=setlists n=1 invalidated=0'])
    expect(r3.setlists).toBe(r2.setlists)
  })

  it('item novo e item removido também invalidam (entram e saem dos derivados)', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    const r1 = await syncOk(null)

    await servir([setlist('Show')], [BIBLIOTECA[0]!, BIBLIOTECA[1]!, content('c-4', 'Quarta')])
    await syncOk(r1)
    // c-3 saiu e c-4 entrou: dois itens cujo derivado muda.
    expect(cacheWrite('content')).toEqual(['OCTAVIA: cache write kind=content n=3 invalidated=2'])
  })

  it('primeiro sync, sem cache anterior: todo item é novo', async () => {
    await servir([setlist('Show')], BIBLIOTECA)
    await syncOk(null)
    expect(cacheWrite('setlists')).toEqual(['OCTAVIA: cache write kind=setlists n=1 invalidated=1'])
    expect(cacheWrite('content')).toEqual(['OCTAVIA: cache write kind=content n=3 invalidated=3'])
  })
})
