/**
 * GATE (ii) — O VOO ÚNICO (SY-D9, SY-D17, SY-D19, SY-D25, SY-D32; `docs/native/SY-PRECHECK.md` A5, A9). SY-PR1: entra
 * REPROVADO pela lista `sy-reprovados.txt`; a **PR-2** o esvazia (o voo no core, o executor no `sincronizador.ts`, a
 * geração das setlists compartilhada com as releituras, a sessão conferida, o prazo nas leituras do sync).
 *
 * O que roda é o executor de verdade (`rodarSync`), o `sincronizar`, o `escrita.ts` e a camada `api.ts`, contra o
 * `aceite.py`. A sobreposição se faz SEGURANDO a resposta de `GET /api/content` já lida do servidor (o instrumento do
 * `favoritar-sync.test.ts`): o sync leu as setlists, e o que acontece enquanto ele espera é o caso.
 *
 *   - nunca dois syncs em curso (o máximo de `sync start` sem fim, nas linhas);
 *   - exatamente UM "de novo" ao terminar, por mais pedidos que cheguem durante o voo;
 *   - AS ESCRITAS (SY-D25): a releitura de uma escrita de setlist no meio de um sync fica (na raiz e no disco); o sync
 *     que perdeu aplica o CONTEÚDO e não as setlists — e não emite `cache write kind=setlists`;
 *   - O LOGOUT NO MEIO (SY-D17): o resultado do sync em voo se descarta, e o "de novo" se cancela;
 *   - O PRAZO (SY-D19, SY-D32): com o mock `atraso` (45 s), o sync falha em até 20 s (`sync fail … code=network`) e o
 *     voo se libera — o pedido seguinte roda. Custa ~21 s de relógio, de propósito: é o número do app.
 *
 * **O que NÃO consegue ver**: a corrida no aparelho (a ordem de chegada de respostas no RN), e o tempo do prazo numa
 * rede de verdade — o `fetch` do Node não é o do RN (no RN ele resolve com o corpo todo; `SY-PR1-anexos` §5).
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'
import { Arnes, musica, segurarConteudo, setlistCom } from './sy-arnes'
import { Checagens, type Veredito } from './sy-lista'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-voo' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'sy-voo'
const SL = 'eeeeeeee-1111-4222-8333-444455556666'
const BIBLIOTECA = [musica(1), musica(2)]
/** O servidor com a música 2 mudada no site (título e `updated_at`): o conteúdo que o sync tem de aplicar. */
const BIBLIOTECA_NOVA = [musica(1), musica(2, { title: 'SY música 2, mudada no site', updated_at: '2026-09-02T00:00:00.000+00:00' })]
const SETLISTS: SetlistDTO[] = [setlistCom(SL, 'SY voo', BIBLIOTECA.map((c) => c.id))]

let mock: Mock
let dir = ''
let S: typeof import('../src/sincronizador')
let E: typeof import('../src/escrita')
let a: Arnes
const C = new Checagens('ii', 'o voo único')

function doDisco(nome: 'setlists.json' | 'content.json'): unknown {
  return JSON.parse(new File(new Directory(Paths.document, `octavia-${UID}`), nome).textSync())
}

/** A sessão com cache: a raiz e o disco com a biblioteca e a setlist de antes. */
async function comCache(servidor: ContentDTO[] = BIBLIOTECA, modo = 'normal'): Promise<void> {
  __reset()
  E.limparGatesDeEscrita()
  await mock.servir(modo, SETLISTS, servidor)
  a = new Arnes(UID)
  a.registrar()
  const store = await import('../src/store')
  store.save(UID, { setlists: SETLISTS, content: BIBLIOTECA, syncedAtMs: 1 }, { setlists: 0, content: 0 })
  a.comecarCom({ setlists: SETLISTS, content: BIBLIOTECA, contentById: new Map(BIBLIOTECA.map((c) => [c.id, c])), temCache: true, syncedAtMs: 1 })
}

/** O `aceite.py` num modo, numa porta própria, pronto quando o socket aceita (sem `GET`: o `atraso` segura 45 s). */
async function subirCru(modo: string): Promise<{ porta: number; parar: () => Promise<void> }> {
  const porta = await portaLivre()
  const fs = path.join(dir, `cru-setlists.json`)
  const fc = path.join(dir, `cru-content.json`)
  writeFileSync(fs, JSON.stringify(SETLISTS))
  writeFileSync(fc, JSON.stringify(BIBLIOTECA))
  const p = spawn('python3', [path.resolve(__dirname, '../src/fixtures/aceite.py'), 'servidor', String(porta), modo, fs, fc], {
    stdio: 'ignore',
  })
  for (let k = 0; k < 100; k++) {
    const ok = await new Promise<boolean>((r) => {
      const s = createConnection(porta, '127.0.0.1', () => {
        s.destroy()
        r(true)
      })
      s.once('error', () => r(false))
    })
    if (ok) break
    await new Promise((r) => setTimeout(r, 100))
  }
  return {
    porta,
    parar: () =>
      new Promise<void>((r) => {
        if (p.exitCode !== null) return r()
        p.once('exit', () => r())
        p.kill('SIGKILL')
      }),
  }
}

/** Um pedido de sync, como os gatilhos e o *Tentar de novo* o fazem: o executor com os dados de agora. */
function pedir(): Promise<void> {
  return S.rodarSync(a.raiz, UID, a.dadosRef.current)
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-voo-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  S = await import('../src/sincronizador')
  E = await import('../src/escrita')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('gate (ii) — o voo único (SY-D9, SY-D25)', () => {
  it('nunca dois syncs em curso: um pedido durante o voo não começa outro sync', async () => {
    await C.caso('nunca-dois-em-curso', async () => {
      await comCache()
      const i0 = a.marca()
      const { lido, soltar } = segurarConteudo()
      const voo = pedir()
      await lido
      const segundo = pedir()
      await new Promise((r) => setTimeout(r, 50))
      soltar()
      await Promise.all([voo, segundo])
      await a.quieto()
      const max = a.maxEmVoo(i0)
      C.nota('nunca-dois-em-curso', `máximo em voo: ${max} · sync start: ${a.starts(i0)}`)
      return max === 1 ? null : `${max} syncs em curso ao mesmo tempo`
    })
  })

  it('exatamente UM "de novo" ao terminar, com dois pedidos durante o voo', async () => {
    await C.caso('um-de-novo', async () => {
      await comCache()
      const i0 = a.marca()
      const { lido, soltar } = segurarConteudo()
      const voo = pedir()
      await lido
      const outros = [pedir(), pedir()]
      await new Promise((r) => setTimeout(r, 50))
      soltar()
      await Promise.all([voo, ...outros])
      await a.quieto()
      const n = a.starts(i0)
      // o "de novo" começa DEPOIS do fim do primeiro
      const linhas = a.linhas.slice(i0).map((x) => x.l)
      const fimDoPrimeiro = linhas.findIndex((l) => l.startsWith('sync ok') || l.startsWith('sync fail'))
      const segundoStart = linhas.findIndex((l, k) => l === 'sync start' && k > linhas.indexOf('sync start'))
      C.nota('um-de-novo', `sync start: ${n} (esperado 2) · o 2º começa ${segundoStart > fimDoPrimeiro ? 'depois' : 'antes'} do fim do 1º`)
      if (n !== 2) return `${n} syncs, esperado 2 (o primeiro e um "de novo")`
      return segundoStart > fimDoPrimeiro ? null : 'o "de novo" começou antes de o primeiro terminar'
    })
  })

  it('AS ESCRITAS: a releitura de uma escrita de setlist no meio de um sync fica; o sync aplica o conteúdo e não as setlists', async () => {
    let criada = ''
    let iSync = 0
    let fim = 0
    const montar = async (): Promise<void> => {
      await comCache(BIBLIOTECA_NOVA)
      iSync = a.marca()
      const { lido, soltar } = segurarConteudo()
      const voo = pedir() // o sync lê as setlists AGORA (antes da escrita) e espera no content
      await lido
      const d = a.dadosRef.current
      const saida = await E.escrever(E.pedidoCriar({ name: 'SY criada no meio do sync', performance_date: null }), {
        uid: UID,
        setlists: d.setlists,
        content: d.content,
        syncedAtMs: d.syncedAtMs,
      })
      if (saida.setlists === null) throw new Error(`a escrita não releu: ${saida.resultado.especie}`)
      criada = saida.setlists.find((s) => !SETLISTS.some((x) => x.id === s.id))?.id ?? ''
      // o `aoRelerNaEscrita` do `App.tsx`: a raiz recebe as setlists relidas (sem tocar no `dadosRef`)
      a.aplicacoes.push({ t: Date.now(), sessao: a.sessao, dados: { ...a.dados, setlists: saida.setlists, syncedAtMs: saida.syncedAtMs } })
      fim = a.marca()
      soltar()
      await voo
      await a.quieto()
    }
    await C.caso('escrita-setlists-ficam', async () => {
      await montar()
      if (criada === '') return 'a escrita não criou a setlist no mock — o cenário não se montou'
      const naRaiz = a.dados.setlists.some((s) => s.id === criada)
      // o `setlists.json` é `{ setlists, syncedAtMs }` (o `ArquivoSetlists` do `store.ts`), não a lista: na SY-PR1 este
      // caso lia o arquivo como lista e reprovava por EXCEÇÃO, sem medir o disco (div. 1277, SY-PR2)
      const noDisco = (doDisco('setlists.json') as { setlists: SetlistDTO[] }).setlists.some((s) => s.id === criada)
      C.nota('escrita-setlists-ficam', `a criada na raiz: ${naRaiz} · no disco: ${noDisco}`)
      return naRaiz && noDisco ? null : `o sync gravou por cima da releitura — a criada na raiz: ${naRaiz}, no disco: ${noDisco}`
    })
    await C.caso('escrita-conteudo-aplica', async () => {
      const titulo = a.dados.content.find((c) => c.id === BIBLIOTECA[1]!.id)?.title
      const noDisco = (doDisco('content.json') as ContentDTO[]).find((c) => c.id === BIBLIOTECA[1]!.id)?.title
      C.nota('escrita-conteudo-aplica', `o título na raiz: ${JSON.stringify(titulo)} · no disco: ${JSON.stringify(noDisco)}`)
      return titulo === BIBLIOTECA_NOVA[1]!.title && noDisco === BIBLIOTECA_NOVA[1]!.title
        ? null
        : 'o sync que perdeu as setlists não aplicou o conteúdo'
    })
    await C.caso('escrita-sync-sem-cache-write-setlists', async () => {
      const doSync = a.desde(fim, 'cache write kind=setlists')
      const daEscrita = a.linhas.slice(iSync, fim).map((x) => x.l).filter((l) => l.startsWith('cache write kind=setlists'))
      C.nota('escrita-sync-sem-cache-write-setlists', `cache write kind=setlists — da releitura: ${daEscrita.length} · do sync, depois dela: ${doSync.length}`)
      return doSync.length === 0 ? null : `o sync que perdeu emitiu ${doSync.length} cache write kind=setlists`
    })
  })

  it('O LOGOUT NO MEIO: o resultado do sync em voo se descarta, e o "de novo" se cancela', async () => {
    const montar = async (): Promise<{ iLogout: number; nAplic: number }> => {
      await comCache(BIBLIOTECA_NOVA)
      const { lido, soltar } = segurarConteudo()
      const voo = pedir()
      await lido
      const deNovo = pedir() // marcado "de novo" pelo voo da PR-2
      await new Promise((r) => setTimeout(r, 30))
      a.sair()
      const iLogout = a.marca()
      const nAplic = a.aplicacoes.length
      soltar()
      await Promise.all([voo, deNovo])
      await a.quieto()
      return { iLogout, nAplic }
    }
    const { iLogout, nAplic } = await montar()
    await C.caso('logout-descarta', async () => {
      const depois = a.aplicacoes.slice(nAplic)
      C.nota('logout-descarta', `aplicações na raiz depois do logout: ${depois.length}`)
      return depois.length === 0 ? null : `${depois.length} aplicação(ões) da sessão velha na raiz depois do logout`
    })
    await C.caso('logout-cancela-de-novo', async () => {
      const n = a.starts(iLogout)
      C.nota('logout-cancela-de-novo', `sync start depois do logout: ${n}`)
      return n === 0 ? null : `${n} sync(s) começaram depois do logout`
    })
  })

  it('O PRAZO (SY-D19, SY-D32): o sync pendurado falha em até 20 s, e o voo se libera — o pedido seguinte roda', async () => {
    await C.caso('prazo-libera-o-voo', async () => {
      await comCache()
      // o `aceite.py` no modo `atraso` (45 s antes de responder) numa porta própria: o `Mock.servir` espera um `GET`
      // responder para dizer que subiu, e no `atraso` isso leva os 45 s — aqui a prontidão é o socket aceitar
      const lento = await subirCru('atraso')
      process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${lento.porta}`
      const i0 = a.marca()
      const t0 = performance.now()
      const voo = pedir()
      let ms = -1
      while (performance.now() - t0 < 21_500) {
        if (a.desde(i0, 'sync fail').some((l) => l.includes('code=network'))) {
          ms = Math.round(performance.now() - t0)
          break
        }
        await new Promise((r) => setTimeout(r, 100))
      }
      // o `atraso` morre, e a conexão pendurada com ele: o sync de hoje termina aqui, em falha de rede
      await lento.parar()
      process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
      await voo
      await a.quieto()
      const i1 = a.marca()
      await pedir()
      await a.quieto()
      const liberou = a.starts(i1) === 1
      C.nota('prazo-libera-o-voo', `sync fail code=network em ${ms < 0 ? '> 21500' : ms} ms · o pedido seguinte rodou: ${liberou}`)
      if (ms < 0) return 'nenhum sync fail code=network em 21,5 s: o sync não tem prazo'
      return liberou ? null : 'o voo não se liberou depois da falha por prazo'
    })
  }, 60_000)

  it('reprova exatamente a lista de sy-reprovados.txt', () => {
    const j = C.julgar()
    console.info(j.texto)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
    expect(j.listaNaoVazia, 'lista não vazia: desde a SY-PR4 reprovação declarada não é mais aceita').toEqual([])
  })
})
