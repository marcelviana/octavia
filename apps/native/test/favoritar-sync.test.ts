/**
 * N4-D91 `[Marcel, 2026-10-04]` (div. 1065) — o sync que ATRAVESSA um favoritar. Escrito ANTES do conserto: contra o
 * `e33801e`, os três casos da corrida reprovam — a estrela volta ao estado antigo.
 *
 * A corrida: o `GET /api/content` do sync lê o servidor ANTES do `PUT` do favoritar, e o sync grava o cache DEPOIS
 * da resposta do `PUT`. O `reconcileByUpdatedAt` substitui o conjunto pelo que o sync trouxe (T1-R9: sem merge item
 * a item), e a linha que o `PUT` devolveu — mais nova — some do cache e da raiz até o próximo sync.
 *
 * O instrumento: o `fetch` do teste segura a resposta do `GET /api/content` JÁ LIDA do mock (a foto é de antes do
 * `PUT`) até o favoritar terminar — o mesmo que uma rede lenta faz com a resposta de um servidor que leu na hora.
 *
 * Os casos: favoritar e desfavoritar no meio do sync (o cache fica com a linha do `PUT`); o `PUT` que falha no meio
 * do sync (o cache fica com o que o sync trouxe); e o caso normal que o conserto não pode quebrar — o site mudou a
 * música DEPOIS do favoritar (o sync traz a linha mais nova do servidor, e ela vence). Em todos, a linha
 * `cache write kind=content … invalidated=<n>` do sync é a de antes do conserto.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-favoritar-sync-${++tokens}` } },
}))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-favoritar-sync'
const T0 = '2026-09-01T00:00:00.000+00:00'
const ID = '00000000-0000-4000-8000-0000000000f1'
const OUTRO = '00000000-0000-4000-8000-0000000000f2'

function linha(id: string, title: string, favorita: boolean): ContentDTO {
  return {
    id,
    title,
    artist: null,
    album: null,
    content_type: 'Lyrics',
    content_data: { lyrics: `texto do projeto: ${title}` },
    file_url: null,
    updated_at: T0,
    is_favorite: favorita,
  }
}
const BIBLIOTECA = [linha(ID, 'Favorita do teste', false), linha(OUTRO, 'Outra do teste', true)]

let fav: typeof import('../src/favoritar')
let sync: typeof import('../src/sync')
let store: typeof import('../src/store')
let mock: Mock
let dir = ''
let linhas: string[] = []
let memoria: ContentDTO[] = []
const fetchReal = globalThis.fetch

/** O `GET /api/content` segurado: `lido` resolve quando a foto do servidor foi tirada; `soltar()` a entrega. */
let segurar = false
let lido: Promise<void> = Promise.resolve()
let soltar: () => void = () => undefined

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

function doDisco(): ContentDTO[] {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'content.json')
  return JSON.parse(f.textSync()) as ContentDTO[]
}

async function preparar(modo: string): Promise<void> {
  await mock.servir(modo, [], BIBLIOTECA)
  memoria = JSON.parse(JSON.stringify(BIBLIOTECA)) as ContentDTO[]
  store.save(UID, { setlists: [], content: memoria, syncedAtMs: 1 }, { setlists: 0, content: 0 })
  fav.ligarCacheDoFavoritar({ uid: UID, lerContent: () => memoria, aoGravar: (c) => (memoria = c) })
  linhas = []
}

/** Começa um sync cujo `GET /api/content` lê o servidor AGORA e só entrega quando o teste soltar. */
// Devolve o voo DENTRO de um objeto: uma função `async` que devolvesse a promise do sync a adotaria, e o teste
// esperaria o sync que ele mesmo segura.
async function syncSegurado(): Promise<{ voo: ReturnType<typeof sync.sincronizar> }> {
  segurar = true
  let marcarLido: () => void = () => undefined
  lido = new Promise((r) => (marcarLido = r))
  const entregue = new Promise<void>((r) => (soltar = r))
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const r = await fetchReal(url, init)
    if (segurar && String(url).includes('/api/content?')) {
      segurar = false
      const corpo = await r.text() // a foto de ANTES do PUT
      marcarLido()
      await entregue
      return new Response(corpo, { status: r.status, headers: r.headers })
    }
    return r
  })
  const voo = sync.sincronizar(UID, { content: memoria, setlists: [] })
  await lido
  return { voo }
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-favoritar-sync-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  fav = await import('../src/favoritar')
  sync = await import('../src/sync')
  store = await import('../src/store')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  fav.limparFavoritar()
  segurar = false
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(() => {
  fav.ligarCacheDoFavoritar(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('N4-D91 — o sync que leu antes do favoritar não desfaz a estrela', () => {
  it('favoritar no meio do sync: o cache (disco e o que o sync devolve à raiz) fica com is_favorite=true', async () => {
    await preparar('escrita')
    const { voo } = await syncSegurado()
    const r = await fav.favoritar(ID, true)
    expect(r.especie).toBe('ok')
    soltar()
    const s = await voo
    expect(s.kind).toBe('ok')
    if (s.kind !== 'ok') return
    expect(s.content.find((c) => c.id === ID)?.is_favorite).toBe(true)
    expect(s.content.find((c) => c.id === ID)).toEqual(r.linha)
    expect(doDisco().find((c) => c.id === ID)).toEqual(r.linha)
    expect(doDisco().find((c) => c.id === OUTRO)).toEqual(BIBLIOTECA[1])
    // A contagem do sync é a de antes do conserto: contra o conjunto que o app tinha ao começar, a foto não mudou.
    expect(so('cache write kind=content')).toEqual([
      'cache write kind=content n=2 invalidated=1', // a do favoritar
      'cache write kind=content n=2 invalidated=0', // a do sync
    ])
  })

  it('desfavoritar no meio do sync: o cache fica com is_favorite=false', async () => {
    await preparar('escrita')
    const { voo } = await syncSegurado()
    const r = await fav.favoritar(OUTRO, false)
    expect(r.especie).toBe('ok')
    soltar()
    const s = await voo
    if (s.kind !== 'ok') throw new Error(s.kind)
    expect(s.content.find((c) => c.id === OUTRO)?.is_favorite).toBe(false)
    expect(doDisco().find((c) => c.id === OUTRO)?.is_favorite).toBe(false)
  })

  it('o PUT falha no meio do sync: o cache fica com o que o sync trouxe', async () => {
    await preparar('escrita-500')
    const { voo } = await syncSegurado()
    const r = await fav.favoritar(ID, true)
    expect(r.especie).toBe('servidor')
    soltar()
    const s = await voo
    if (s.kind !== 'ok') throw new Error(s.kind)
    expect(s.content).toEqual(BIBLIOTECA)
    expect(doDisco()).toEqual(BIBLIOTECA)
  })

  it('o caso normal: o site mudou a música DEPOIS do favoritar — o sync traz a linha mais nova, e ela vence', async () => {
    await preparar('escrita')
    const r = await fav.favoritar(ID, true)
    expect(r.especie).toBe('ok')
    await new Promise((res) => setTimeout(res, 20)) // o relógio do servidor anda
    // "O site": desfavorita e renomeia direto no servidor, sem passar pelo app.
    const site = await fetchReal(`http://127.0.0.1:${mock.porta}/api/content`, {
      method: 'PUT',
      body: JSON.stringify({ id: ID, is_favorite: false, title: 'Renomeada no site' }),
    })
    const doSite = (await site.json()) as ContentDTO
    expect(Date.parse(doSite.updated_at)).toBeGreaterThan(Date.parse(r.linha!.updated_at))
    const s = await sync.sincronizar(UID, { content: memoria, setlists: [] })
    if (s.kind !== 'ok') throw new Error(s.kind)
    expect(s.content.find((c) => c.id === ID)).toEqual(doSite)
    expect(doDisco().find((c) => c.id === ID)).toEqual(doSite)
  })
})
