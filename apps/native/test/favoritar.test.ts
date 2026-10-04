/**
 * N4-PR5 — o favoritar no tablet (N4-R7, N4-R8, N4-R9; N4-D22, N4-D23, N4-D35, N4-D89), contra o mock de verdade
 * (`src/fixtures/aceite.py`, que ganhou o `PUT /api/content` neste commit). Escrito ANTES do código: contra a
 * `main`, reprova — `src/favoritar.ts` não existe, e o mock respondia 404 a esta rota.
 *
 * O que roda de verdade: `favoritar()` (`src/favoritar.ts`), a camada `api.ts` com o `fetch` do Node, a classificação
 * do core e o `store.ts` sobre o duplo do `expo-file-system`. Duplos: o Firebase, a sessão (o espião da N2-D9) e o
 * `expo-network`.
 *
 * - **o corpo, byte a byte, contra a fixture da N4-PR1** (`packages/core/fixtures/favoritar-put.json`) — o lado do
 *   tablet do gate do corpo do favoritar: o que SAI pelo fio, lido no `fetch`;
 * - **sem otimismo**: durante o voo, o `content.json` está intacto e o estado da música é "em voo"; só a resposta
 *   muda o cache — com **a linha que o `PUT` devolveu**, sem `GET` nenhum (N4-D35);
 * - **o estado em andamento é por música, vive fora de tela e sobrevive a ela**: outra música favorita em paralelo;
 *   a mesma música, de novo, é barrada (`busy`); quem assina e sai não cancela o pedido;
 * - **só online** (N4-D23): sem rede, nenhuma request, `write blocked … reason=offline`;
 * - **as espécies do N2**, cada uma com a frase do tablet; a família do limite é `content-mutate`.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'

const deslogou = vi.fn()
vi.mock('../src/session', () => ({ signOutSession: async () => { deslogou() } }))
let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-favoritar-${++tokens}` } },
}))
let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const FIXTURE = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../packages/core/fixtures/favoritar-put.json'), 'utf8'),
) as { id: string; favoritar: string; desfavoritar: string }

const UID = 'cn-favoritar'
const T0 = '2026-09-01T00:00:00.000+00:00'
const ID = FIXTURE.id
const OUTRO = '00000000-0000-4000-8000-0000000000f2'

function linha(id: string, title: string, favorita: boolean): ContentDTO & { is_favorite: boolean } {
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

type Mod = typeof import('../src/favoritar')
let mod: Mod
let store: typeof import('../src/store')
let mock: Mock
let dir = ''
let linhas: string[] = []
let enviados: { metodo: string; url: string; corpo: string | null }[] = []
let memoria: ContentDTO[] = []
let gravacoes = 0
const fetchReal = globalThis.fetch

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

function contentDoCache(): string | null {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'content.json')
  return f.exists ? f.textSync() : null
}

/** Sobe o mock no modo pedido, grava o cache inicial e liga o favoritar a ele. */
async function preparar(modo: string): Promise<void> {
  await mock.servir(modo, [], BIBLIOTECA)
  memoria = JSON.parse(JSON.stringify(BIBLIOTECA)) as ContentDTO[]
  store.save(UID, { setlists: [], content: memoria, syncedAtMs: 1 }, { setlists: 0, content: 0 })
  gravacoes = 0
  mod.ligarCacheDoFavoritar({
    uid: UID,
    lerContent: () => memoria,
    aoGravar: (content) => {
      memoria = content
      gravacoes++
    },
  })
  linhas = []
  enviados = []
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-favoritar-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  mod = await import('../src/favoritar')
  store = await import('../src/store')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  online = true
  deslogou.mockClear()
  mod.limparFavoritar()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  // O fio: tudo o que o app manda ao servidor passa por aqui e é anotado ANTES de seguir para o mock.
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    enviados.push({ metodo: init?.method ?? 'GET', url: String(url), corpo: init?.body == null ? null : String(init.body) })
    return fetchReal(url, init)
  })
})

afterEach(() => {
  mod.ligarCacheDoFavoritar(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('o corpo, byte a byte, contra a fixture da N4-PR1 (o lado do tablet do gate)', () => {
  it('favoritar e desfavoritar: o que sai pelo fio é o corpo da fixture, num PUT /api/content', async () => {
    await preparar('escrita')
    await mod.favoritar(ID, true)
    await mod.favoritar(ID, false)
    const puts = enviados.filter((e) => e.metodo === 'PUT')
    expect(puts.map((e) => new URL(e.url).pathname)).toEqual(['/api/content', '/api/content'])
    expect(puts.map((e) => e.corpo)).toEqual([FIXTURE.favoritar, FIXTURE.desfavoritar])
  })
})

describe('N4-R7 / N4-D35 — sem otimismo; a resposta atualiza o cache, sem sync', () => {
  it('durante o voo: estado "favoritando", content.json intacto; depois do 200: a linha devolvida, sem GET', async () => {
    await preparar('escrita-lenta')
    const antes = contentDoCache()
    const voo = mod.favoritar(ID, true)
    await new Promise((r) => setTimeout(r, 250))
    expect(mod.estadoDoFavoritar(ID)).toBe('favoritando')
    expect(contentDoCache()).toBe(antes)
    expect(gravacoes).toBe(0)

    const r = await voo
    expect(r.especie).toBe('ok')
    expect(mod.estadoDoFavoritar(ID)).toBeNull()
    const doServidor = (await (await fetchReal(`http://127.0.0.1:${mock.porta}/api/content?page=1`)).json()) as {
      data: ContentDTO[]
    }
    const gravado = JSON.parse(contentDoCache() ?? '[]') as ContentDTO[]
    expect(gravado.find((c) => c.id === ID)).toEqual(doServidor.data.find((c) => c.id === ID))
    expect(gravado.find((c) => c.id === ID)?.is_favorite).toBe(true)
    expect(gravado.find((c) => c.id === OUTRO)).toEqual(BIBLIOTECA[1])
    expect(memoria).toEqual(gravado)
    expect(gravacoes).toBe(1)
    // Sem sync: nenhum GET depois do PUT.
    expect(enviados.map((e) => e.metodo)).toEqual(['PUT'])
    expect(so('cache write')).toEqual(['cache write kind=content n=2 invalidated=1'])
    expect(so('write op=')).toHaveLength(1)
    expect(so('write op=')[0]).toMatch(/^write op=favorite content=00000000 status=200 code=- ms=\d+$/)
  })

  it('tirar das favoritas: estado "tirando", e o cache com is_favorite=false', async () => {
    await preparar('escrita-lenta')
    const voo = mod.favoritar(OUTRO, false)
    await new Promise((r) => setTimeout(r, 250))
    expect(mod.estadoDoFavoritar(OUTRO)).toBe('tirando')
    await voo
    expect(memoria.find((c) => c.id === OUTRO)?.is_favorite).toBe(false)
    expect(so('write op=')[0]).toMatch(/^write op=unfavorite content=00000000 /)
  })
})

describe('N4-R7 — o estado em andamento é por música, fora de tela, e sobrevive à troca de tela', () => {
  it('duas músicas em voo ao mesmo tempo; as duas terminam; nenhuma barra a outra', async () => {
    await preparar('escrita-lenta')
    const a = mod.favoritar(ID, true)
    const b = mod.favoritar(OUTRO, false)
    await new Promise((r) => setTimeout(r, 250))
    expect([mod.estadoDoFavoritar(ID), mod.estadoDoFavoritar(OUTRO)]).toEqual(['favoritando', 'tirando'])
    const [ra, rb] = await Promise.all([a, b])
    expect([ra.especie, rb.especie]).toEqual(['ok', 'ok'])
    expect(memoria.find((c) => c.id === ID)?.is_favorite).toBe(true)
    expect(memoria.find((c) => c.id === OUTRO)?.is_favorite).toBe(false)
    expect(so('write blocked')).toEqual([])
  })

  it('a MESMA música de novo, em voo: barrada (busy), nenhuma segunda request', async () => {
    await preparar('escrita-lenta')
    const a = mod.favoritar(ID, true)
    const b = await mod.favoritar(ID, true)
    expect(b.especie).toBe('generica')
    expect(so('write blocked')).toEqual(['write blocked op=favorite reason=busy'])
    await a
    expect(enviados.filter((e) => e.metodo === 'PUT')).toHaveLength(1)
  })

  it('quem assina é avisado no começo e no fim; quem sai (a tela fechou) não cancela o pedido', async () => {
    await preparar('escrita-lenta')
    const vistos: (string | null)[] = []
    const sair = mod.assinarFavoritar(() => vistos.push(mod.estadoDoFavoritar(ID)))
    const voo = mod.favoritar(ID, true)
    expect(vistos).toEqual(['favoritando'])
    sair() // a tela saiu
    const r = await voo
    expect(r.especie).toBe('ok')
    expect(vistos).toEqual(['favoritando'])
    expect(memoria.find((c) => c.id === ID)?.is_favorite).toBe(true)
  })
})

describe('N4-R9 / N4-D23 — só online', () => {
  it('sem rede: nenhuma request, `write blocked … reason=offline`, frase do N2, cache intacto', async () => {
    await preparar('escrita')
    online = false
    const antes = contentDoCache()
    const r = await mod.favoritar(ID, true)
    expect([r.especie, r.frase]).toEqual(['rede', 'sem conexão — nada foi salvo'])
    expect(enviados).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=favorite reason=offline'])
    expect(so('write op=')).toEqual([])
    expect(contentDoCache()).toBe(antes)
    expect(mod.estadoDoFavoritar(ID)).toBeNull()
  })
})

describe('N4-R8 — as espécies do N2, cada uma com a frase do tablet; o cache não muda em nenhuma', () => {
  const casos: [modo: string, especie: string, frase: RegExp, status: string][] = [
    ['escrita-401', 'auth', /^não foi possível salvar — confira sua conta no site$/, 'status=401 code=AUTH_REQUIRED'],
    ['escrita-429', 'limite', /^muitas alterações seguidas — tente de novo em 30 s$/, 'status=429 code=RATE_LIMITED'],
    ['escrita-500', 'servidor', /^falha no servidor — nada foi alterado aqui$/, 'status=500 code=INTERNAL_ERROR'],
    ['escrita-404', 'generica', /^não foi possível salvar$/, 'status=404 code=NOT_FOUND'],
    ['escrita-corta', 'sem-resposta', /^sem resposta do servidor$/, 'status=net code=net'],
  ]
  for (const [modo, especie, frase, status] of casos) {
    it(`${modo} → ${especie}`, async () => {
      await preparar(modo)
      const antes = contentDoCache()
      const r = await mod.favoritar(ID, true)
      expect(r.especie).toBe(especie)
      expect(r.frase).toMatch(frase)
      expect(so('write op=')[0]).toMatch(new RegExp(`^write op=favorite content=00000000 ${status} ms=\\d+$`))
      expect(contentDoCache()).toBe(antes)
      expect(gravacoes).toBe(0)
      expect(so('cache write')).toEqual([])
      expect(mod.estadoDoFavoritar(ID)).toBeNull()
    })
  }

  it('o 401 de uma escrita NÃO desloga (N2-D9)', async () => {
    await preparar('escrita-401')
    await mod.favoritar(ID, true)
    expect(deslogou).not.toHaveBeenCalled()
  })

  it('o 429 fecha a família `content-mutate`: a linha do limite diz a família certa, e o próximo é barrado', async () => {
    await preparar('escrita-429')
    await mod.favoritar(ID, true)
    expect(so('ratelimit')).toEqual(['ratelimit retry-after=30 family=content-mutate'])
    const r = await mod.favoritar(OUTRO, false)
    expect(r.especie).toBe('limite')
    expect(r.frase).toMatch(/^muitas alterações seguidas — tente de novo em \d+ s$/)
    expect(so('write blocked')).toEqual(['write blocked op=unfavorite reason=ratelimit'])
    expect(enviados.filter((e) => e.metodo === 'PUT')).toHaveLength(1)
  })

  it('o prazo de rede (N2-D35) vale: escrita pendurada → sem resposta, e a música sai do "em voo"', async () => {
    await preparar('escrita-pendurada')
    const r = await mod.favoritar(ID, true, { prazoMs: 300 })
    expect(r.especie).toBe('sem-resposta')
    expect(mod.estadoDoFavoritar(ID)).toBeNull()
  })
})
