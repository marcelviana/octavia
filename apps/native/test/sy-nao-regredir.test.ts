/**
 * GATE (iv) — A JANELA DA `naoRegredir` (SY-D10, SY-D26; `docs/native/SY-PRECHECK.md` A6.1, A6.2, A9; div. 1262).
 * SY-PR1: entra REPROVADO pela lista `sy-reprovados.txt`; a **PR-2** o esvazia (a aplicação na raiz no MESMO bloco
 * síncrono que lê as confirmadas e grava o disco, sem tocar no `updated_at`, na `naoRegredir` nem no `reconcile`).
 *
 * **A janela** (A6.1): o `sincronizar` lê as confirmadas do favoritar, aplica a `naoRegredir`, grava o disco e DEVOLVE —
 * sem `await` no meio. O executor só troca a raiz numa microtarefa DEPOIS. Um favoritar que assenta nessa fronteira grava
 * a confirmada tarde demais para o sync, lê a raiz ainda de antes do sync, grava o disco com a estrela e avisa a raiz; o
 * executor retoma e troca a raiz pelo conteúdo do sync, SEM a estrela. Memória sem a estrela; disco com ela.
 *
 * **Por que o CN da N4-D91 não a vê**: o `favoritar-sync.test.ts` testa o `sincronizar()` — o trecho atômico; a janela
 * está no executor, e até a extração da SY-PR1 nenhum teste montava o `rodarSync` (div. 1262).
 *
 * **O instrumento** (A6.2): o `sincronizar` EMBRULHADO (`vi.mock` que delega ao de verdade) — depois de ele devolver e
 * antes de o executor aplicar, o embrulho solta a resposta segurada do `PUT` e espera o favoritar terminar: a fronteira,
 * posta em ordem fixa. A resposta do `GET /api/content` do sync é segurada também, para a foto do servidor ser de ANTES do
 * `PUT` (a corrida do N4-D91). Mede o que o executor entrega à raiz e o `content.json` do disco: os dois com a estrela.
 *
 *   - `janela`: o favoritar NA fronteira → hoje, a memória sem a estrela (REPROVA, na lista);
 *   - `controle-antes`: o MESMO embrulho, com o favoritar terminando ANTES de o sync ler as confirmadas → passa hoje (a
 *     `naoRegredir` cobre) — a prova de que o embrulho mede a fronteira, e não outra coisa.
 *
 * **O que NÃO consegue ver**: a intercalação natural no RN (duas respostas no mesmo lote do lado nativo) — não se
 * reproduz no aparelho de forma controlada (A6.1, `[hipótese]`).
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ContentDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'
import { Arnes, musica, setlistCom } from './sy-arnes'
import { Checagens, type Veredito } from './sy-lista'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-nao-regredir' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

/** O embrulho do `sincronizar`: depois de ele devolver, e antes de o executor aplicar, o que o caso pôs aqui. */
let naFronteira: (() => Promise<void>) | null = null
let fronteiras = 0
vi.mock('../src/sync', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/sync')>()
  return {
    ...real,
    sincronizar: async (...args: Parameters<typeof real.sincronizar>) => {
      const r = await real.sincronizar(...args)
      if (naFronteira !== null) {
        fronteiras++
        await naFronteira()
      }
      return r
    },
  }
})

const UID = 'sy-nao-regredir'
const SL = 'ffffffff-1111-4222-8333-444455556666'
const BIBLIOTECA = [musica(1), musica(2)]
const ID = BIBLIOTECA[0]!.id

let mock: Mock
let dir = ''
let S: typeof import('../src/sincronizador')
let F: typeof import('../src/favoritar')
let a: Arnes
const C = new Checagens('iv', 'a janela da naoRegredir')

function doDisco(): ContentDTO[] {
  return JSON.parse(new File(new Directory(Paths.document, `octavia-${UID}`), 'content.json').textSync()) as ContentDTO[]
}

/**
 * Segura, já lidas do servidor: a 1ª resposta de `GET /api/content` (a foto de ANTES do `PUT`) e a de `PUT
 * /api/content` (o servidor GRAVOU; o app ainda não sabe). Cada uma solta quando o caso mandar.
 */
function segurarAsDuas(): { getLido: Promise<void>; soltarGet: () => void; putLido: Promise<void>; soltarPut: () => void } {
  const real = globalThis.fetch
  const portao = (): { lido: Promise<void>; marcar: () => void; aberto: Promise<void>; abrir: () => void } => {
    let marcar: () => void = () => undefined
    let abrir: () => void = () => undefined
    const lido = new Promise<void>((r) => (marcar = r))
    const aberto = new Promise<void>((r) => (abrir = r))
    return { lido, marcar, aberto, abrir }
  }
  const g = portao()
  const p = portao()
  let get = true
  let put = true
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const r = await real(url, init)
    const metodo = (init?.method ?? 'GET').toUpperCase()
    const ehContent = String(url).includes('/api/content')
    const alvo = metodo === 'GET' && get && String(url).includes('/api/content?') ? g : metodo === 'PUT' && put && ehContent ? p : null
    if (alvo === null) return r
    if (alvo === g) get = false
    else put = false
    const corpo = await r.text()
    alvo.marcar()
    await alvo.aberto
    return new Response(corpo, { status: r.status, headers: r.headers })
  })
  return { getLido: g.lido, soltarGet: g.abrir, putLido: p.lido, soltarPut: p.abrir }
}

async function comCache(): Promise<void> {
  __reset()
  F.limparFavoritar()
  naFronteira = null
  fronteiras = 0
  await mock.servir('normal', [setlistCom(SL, 'SY janela', BIBLIOTECA.map((c) => c.id))], BIBLIOTECA)
  a = new Arnes(UID)
  a.registrar()
  const store = await import('../src/store')
  const setlists = [setlistCom(SL, 'SY janela', BIBLIOTECA.map((c) => c.id))]
  store.save(UID, { setlists, content: BIBLIOTECA, syncedAtMs: 1 }, { setlists: 0, content: 0 })
  a.comecarCom({ setlists, content: BIBLIOTECA, contentById: new Map(BIBLIOTECA.map((c) => [c.id, c])), temCache: true, syncedAtMs: 1 })
  // a ligação do `App.tsx` (o `aoGravar` atualiza o `dadosRef` à mão e a raiz)
  F.ligarCacheDoFavoritar({
    uid: UID,
    lerContent: () => a.dadosRef.current.content,
    aoGravar: (content) => {
      const contentById = new Map(content.map((c) => [c.id, c]))
      a.dadosRef.current = { ...a.dadosRef.current, content, contentById }
      a.aplicacoes.push({ t: Date.now(), sessao: a.sessao, dados: { ...a.dados, content, contentById } })
    },
  })
}

function estrelas(): { memoria: boolean | null | undefined; disco: boolean | null | undefined } {
  return {
    memoria: a.dados.content.find((c) => c.id === ID)?.is_favorite,
    disco: doDisco().find((c) => c.id === ID)?.is_favorite,
  }
}

function julgar(id: string): Veredito {
  const e = estrelas()
  C.nota(id, `a estrela — na memória (o que o executor entregou à raiz): ${e.memoria} · no disco: ${e.disco} · fronteiras: ${fronteiras}`)
  if (fronteiras !== 1) return `o embrulho passou ${fronteiras} vez(es) pela fronteira — o caso não se montou`
  return e.memoria === true && e.disco === true ? null : `a estrela regrediu — memória ${e.memoria}, disco ${e.disco}`
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-nao-regredir-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  S = await import('../src/sincronizador')
  F = await import('../src/favoritar')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

afterEach(() => {
  F.ligarCacheDoFavoritar(null)
  naFronteira = null
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('gate (iv) — a janela da naoRegredir (A6)', () => {
  it('o favoritar NA FRONTEIRA (depois de o sincronizar devolver, antes de o executor aplicar): a estrela fica, na memória e no disco', async () => {
    await C.caso('janela', async () => {
      await comCache()
      const h = segurarAsDuas()
      const voo = S.rodarSync(a.raiz, UID, a.dadosRef.current)
      await h.getLido // o sync leu o servidor ANTES do PUT
      const fav = F.favoritar(ID, true)
      await h.putLido // o servidor gravou a estrela; a resposta está segurada
      naFronteira = async () => {
        h.soltarPut()
        const r = await fav
        if (r.especie !== 'ok') throw new Error(`o favoritar não deu ok: ${r.especie}`)
      }
      h.soltarGet()
      await voo
      await a.quieto()
      return julgar('janela')
    })
  })

  it('o CONTROLE: o mesmo embrulho, com o favoritar terminando ANTES de o sync ler as confirmadas → a estrela fica (passa hoje)', async () => {
    await C.caso('controle-antes', async () => {
      await comCache()
      const h = segurarAsDuas()
      const voo = S.rodarSync(a.raiz, UID, a.dadosRef.current)
      await h.getLido
      const fav = F.favoritar(ID, true)
      await h.putLido
      h.soltarPut()
      const r = await fav // a confirmada entra no mapa ANTES de o sync o ler
      if (r.especie !== 'ok') throw new Error(`o favoritar não deu ok: ${r.especie}`)
      naFronteira = async () => undefined
      h.soltarGet()
      await voo
      await a.quieto()
      return julgar('controle-antes')
    })
  })

  it('reprova exatamente a lista de sy-reprovados.txt', () => {
    const j = C.julgar()
    console.info(j.texto)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
    expect(j.listaNaoVazia, 'lista não vazia: desde a SY-PR4 reprovação declarada não é mais aceita').toEqual([])
  })
})
