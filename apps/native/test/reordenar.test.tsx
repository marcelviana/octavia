/**
 * CONTROLES NEGATIVOS DA TELA — N2-PR5 (o modo de reordenar: `Reordenar` na
 * faixa, a coluna única de linhas de 72 dp com alça, um único `PUT …/order`
 * ao salvar, o arrasto preservado depois de uma falha). Vêm ANTES do código
 * que medem: contra a árvore de hoje reprovam por ausência — não há
 * `reordenar` na faixa, não há `alca-<n>`, não há modo.
 *
 * **O que roda de verdade**: a `IndexScreen` e o modo renderizados com
 * `react-dom` sobre `jsdom` (`tela.tsx`), o `escrever()` da N2-PR2, a camada
 * `api.ts` com o `fetch` do Node, a classificação do core e o `store.ts` sobre
 * o duplo do `expo-file-system`, contra o mock `src/fixtures/aceite.py`.
 * **O que é duplo**: `react-native` (e com ele o `PanResponder`: aqui o gesto
 * é um REGISTRO que o teste alimenta — `pegar`/`mover`/`soltar`), o
 * `react-native-svg`, o Firebase, a sessão e o `expo-network`.
 *
 * **O que estes CNs NÃO medem**: o GESTO. Que o arrasto só começa pela alça,
 * que o corpo da linha rola, que a rolagem automática entra a 48 dp das
 * bordas, e os bounds de 48 × 72 da alça e de 72 da linha se medem no
 * aparelho (§4 da PR, `input swipe` + dump). Aqui se mede a MÁQUINA DE
 * ESTADOS: o que o modo mostra, o que ele escreve, e quando.
 *
 * **A releitura re-renderiza a tela pelo PAI**, como no app (o mesmo desenho
 * do `s2-edicao.test.tsx`): o `aoReler` guarda o conjunto e o teste
 * re-renderiza com ele. É isso que torna mensurável a R2·1 — a releitura
 * atualiza a setlist ATRÁS do modo e não pode sobrescrever o arrasto.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { act } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { IndexScreenProps } from '../src/screens/IndexScreen'
import { __reset } from './fake-expo-file-system'
import { __voltarDoSistema } from './fake-react-native'
import { Mock, portaLivre } from './mock'
import {
  achar,
  assentar,
  circulos,
  desmontar,
  estilo,
  exige,
  inativo,
  montar,
  pegar,
  rerender,
  texto,
  textoDaTela,
  tocar,
} from './tela'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-r-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-reordenar'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
/** Passo da coluna: a linha de 72 mais o vão de 8 (moldura `N2-S2e-reordenar`). */
const PASSO = 80

const TITULOS = ['Primeira', 'Segunda', 'Terceira', 'Quarta', 'Quinta']

function content(i: number): ContentDTO {
  return {
    id: `c-${i}`, title: TITULOS[i - 1] ?? `Faixa ${i}`, artist: `Artista ${i}`, album: null,
    content_type: 'Lyrics', content_data: { lyrics: `letra ${i}` },
    file_url: null, updated_at: T0,
  }
}

/** `setlist_songs.id` da linha `i` — é o que vai no `order` (T2-R8). */
const ss = (i: number): string => `${SL.slice(0, 8)}-ss00-4000-8000-${String(i).padStart(12, '0')}`

function setlistDe(n: number): SetlistDTO {
  return {
    id: SL, name: 'Show', performance_date: '2025-07-16', venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: n }, (_, k) => ({
      id: ss(k + 1), setlist_id: SL, content_id: `c-${(k % 5) + 1}`,
      position: k + 1, notes: null, content: null,
    })),
  }
}

const BIBLIOTECA = [1, 2, 3, 4, 5].map(content)
const contentById = new Map(BIBLIOTECA.map((c) => [c.id, c]))

let mock: Mock
let dir = ''
let linhas: string[] = []
type Escrita = typeof import('../src/escrita')
let escrita: Escrita
type TelaS2 = typeof import('../src/screens/IndexScreen')
let S2: TelaS2

/** Os corpos dos `PUT …/songs/order` que saíram, na ordem em que saíram. */
let corposDeOrdem: unknown[] = []

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}
const pedidosDeOrdem = (): string[] => so('api').filter((l) => l.includes('/songs/order'))

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

let relido: SetlistDTO[] | null = null
let saiuParaS1: Array<import('../src/screens/IndexScreen').AvisoDeSaida> = []

async function props(extra: Partial<IndexScreenProps> = {}): Promise<IndexScreenProps> {
  const doServidor = semEmbutido(await mock.doServidor())
  const setlist = doServidor.find((s) => s.id === SL) ?? doServidor[0]
  return {
    setlist,
    contentById,
    syncDone: true,
    posicaoAtual: null,
    onVoltar: () => undefined,
    onAbrirPosicao: () => undefined,
    onBuscar: () => undefined,
    edicao: {
      estado: { uid: UID, setlists: doServidor, content: BIBLIOTECA, syncedAtMs: 1 },
      online,
      aoReler: (novas: SetlistDTO[]) => { relido = novas },
      aoSairParaS1: (aviso: import('../src/screens/IndexScreen').AvisoDeSaida) => { saiuParaS1.push(aviso) },
    },
    ...extra,
  }
}

/** O papel do pai: re-renderiza S2 com o conjunto que a releitura trouxe. */
async function comOReleitura(): Promise<void> {
  const setlist = (relido ?? []).find((s) => s.id === SL)
  if (setlist === undefined) throw new Error('a releitura não trouxe a setlist')
  await rerender(<S2.IndexScreen {...(await props({ setlist }))} />)
}

/** A ordem que o servidor tem agora, em `setlist_songs.id`. */
async function ordemNoServidor(): Promise<string[]> {
  const s = (await mock.doServidor()).find((x) => x.id === SL)
  return (s?.setlist_songs ?? []).slice().sort((a, b) => a.position - b.position).map((x) => x.id)
}

/** A linha do modo que contém a alça `n` — o nó de 72 dp. */
const linhaDaAlca = (n: number): HTMLElement => exige(`alca-${n}`).parentElement as HTMLElement

/** Arrasta a linha `de` (1-based) até a posição `para`, com passos no meio. */
async function arrastar(de: number, para: number): Promise<void> {
  const g = await pegar(`alca-${de}`)
  const total = (para - de) * PASSO
  await g.mover(total / 3)
  await g.mover((2 * total) / 3)
  await g.mover(total)
  await g.soltar()
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-reordenar-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  escrita = await import('../src/escrita')
  S2 = await import('../src/screens/IndexScreen')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  online = true
  relido = null
  saiuParaS1 = []
  corposDeOrdem = []
  escrita.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  // O espião do corpo: o `fetch` de verdade continua indo ao mock.
  const original = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
    if (String(url).includes('/songs/order') && typeof init?.body === 'string') {
      corposDeOrdem.push(JSON.parse(init.body))
    }
    return original(url, init)
  })
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  vi.restoreAllMocks()
})

// ------------------------------------------------------------ (a) entrar

describe('(a) N2-D27 / N2-S2e-reordenar — `Reordenar` entra no modo de coluna única', () => {
  it('a faixa ganha o terceiro controle, e os dois da PR-4 continuam', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(texto('reordenar')).toBe('Reordenar')
    expect(inativo('reordenar')).toBe(false)
    // A alça normal: seis marcadores (anexo D).
    expect(circulos('reordenar')).toBe(6)
    expect(achar('setlist-editar')).not.toBeNull()
    expect(achar('setlist-apagar')).not.toBeNull()
  })

  it('o modo: barra própria, linhas de 72 com alça de 48 × 72, grade e `remover` ausentes', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')

    const tela = textoDaTela()
    expect(tela).toContain('Reordenar · Show')
    expect(tela).toContain('arraste pela alça · a ordem só é salva no fim')
    expect(texto('reordenar-sair')).toBe('Cancelar')
    expect(texto('reordenar-salvar')).toBe('Salvar a ordem')
    // N2-D36 revista: ao abrir, a ordem é a do servidor — inativo, com o motivo.
    expect(inativo('reordenar-salvar')).toBe(true)
    expect(texto('reordenar-salvar-motivo')).toBe('nada mudou desde que você abriu')

    for (const n of [1, 2, 3, 4, 5]) {
      expect(achar(`alca-${n}`)).not.toBeNull()
      // R1·7b: o ALVO é 48 × 72 — toda a altura da linha —, e a linha é 72.
      expect(estilo(exige(`alca-${n}`))).toMatchObject({ width: 48, height: 72 })
      expect(estilo(linhaDaAlca(n))).toMatchObject({ height: 72 })
      expect(circulos(`alca-${n}`)).toBe(6)
    }
    // Número, título e "· artista" — sem tipo, sem remover.
    expect(linhaDaAlca(5).textContent).toContain('5')
    expect(linhaDaAlca(5).textContent).toContain('Quinta')
    expect(linhaDaAlca(5).textContent).toContain('· Artista 5')
    expect(linhaDaAlca(5).textContent).not.toContain('Letra')

    // A grade some enquanto o modo dura, e com ela a faixa e os `remover`.
    expect(achar('song-1')).toBeNull()
    expect(achar('remover-1')).toBeNull()
    expect(achar('setlist-editar')).toBeNull()
    expect(achar('reordenar')).toBeNull()
    expect(so('api')).toEqual([])
  })
})

// --------------------------------------------- (b) arrastar e salvar

describe('(b) T2-R8 — arrastar 5 → 2 e salvar: UM `PUT` com a ordem inteira', () => {
  it('durante o gesto: rótulo, buraco, nenhuma renumeração e NADA escrito', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')

    const g = await pegar('alca-5')
    await g.mover(-3 * PASSO)
    const tela = textoDaTela()
    expect(tela).toContain('de 5 para 2')
    expect(tela).toContain('soltar aqui · posição 2')
    // "Os números das outras linhas só se renumeram depois de soltar."
    expect(linhaDaAlca(2).textContent).toContain('Segunda')
    expect(linhaDaAlca(2).textContent?.trim().startsWith('2')).toBe(true)
    // Nada é escrito durante o gesto.
    expect(so('api')).toEqual([])
    expect(so('write')).toEqual([])

    /**
     * Div. 286, achada no §4: no Tab S6 o buraco tracejado aparecia DENTRO da
     * linha erguida. O desenho dela é uma cópia que tem de ser o ÚLTIMO filho
     * da lista (a ordem da árvore é a ordem de desenho que o Android respeita),
     * e a linha que segura o toque fica no lugar, invisível.
     */
    const lista = linhaDaAlca(1).parentElement as HTMLElement
    const ultimo = lista.lastElementChild as HTMLElement
    expect(ultimo.textContent).toContain('de 5 para 2')
    expect(ultimo.querySelector('[data-testid]')).toBeNull()
    expect(estilo(linhaDaAlca(5))).toMatchObject({ opacity: 0 })

    await g.soltar()
    // Soltou: renumera, e a linha 2 é a que era 5.
    expect(linhaDaAlca(2).textContent).toContain('Quinta')
    expect(linhaDaAlca(3).textContent).toContain('Segunda')
    expect(textoDaTela()).not.toContain('de 5 para 2')
    expect(textoDaTela()).not.toContain('soltar aqui')
    expect(so('api')).toEqual([])
  })

  it('salvar: um `PUT`, `write op=reorder … status=200`, releitura, modo fechado', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)

    await tocar('reordenar-salvar')
    // Salvando: o estado da regra 1 — a lista inteira inativa, alças sem tinta.
    expect(textoDaTela()).toContain('Salvando a ordem no servidor…')
    expect(inativo('reordenar-salvar')).toBe(true)
    expect(inativo('alca-1')).toBe(true)
    expect(achar('reordenar-sair')).toBeNull()
    await assentar(80)

    const esperada = [ss(1), ss(5), ss(2), ss(3), ss(4)]
    expect(pedidosDeOrdem()).toHaveLength(1)
    expect(corposDeOrdem).toEqual([{ order: esperada }])
    expect(so('write op=reorder')).toHaveLength(1)
    expect(so('write op=reorder')[0]).toMatch(
      /^write op=reorder setlist=aaaaaaaa items=5 status=200 code=- ms=\d+$/,
    )
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=write op=reorder status=200/)
    expect(await ordemNoServidor()).toEqual(esperada)

    // Modo fechado; a grade volta e mostra a ordem que a releitura trouxe.
    expect(achar('alca-1')).toBeNull()
    await comOReleitura()
    expect(achar('alca-1')).toBeNull()
    expect(achar('song-2')?.textContent).toContain('Quinta')
    expect(achar('reordenar')).not.toBeNull()
  })
})

// ---------------------------------------------------- (c) cancelar

describe('(c) `Cancelar` devolve a ordem do servidor sem escrever nada', () => {
  it('zero request, zero linha de escrita, grade de volta na ordem de antes', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)

    await tocar('reordenar-sair')
    await assentar(30)
    expect(so('api')).toEqual([])
    expect(so('write')).toEqual([])
    expect(achar('alca-1')).toBeNull()
    expect(achar('song-2')?.textContent).toContain('Segunda')
    expect(await ordemNoServidor()).toEqual([1, 2, 3, 4, 5].map(ss))
  })

  it('o voltar do sistema é o `Cancelar`: sai do modo, e não da tela', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)

    let consumiu = false
    await act(async () => {
      consumiu = __voltarDoSistema()
    })
    await assentar(20)
    expect(consumiu).toBe(true)
    expect(achar('alca-1')).toBeNull()
    expect(achar('song-1')).not.toBeNull()
    expect(so('api')).toEqual([])
  })
})

// ------------------------------------------- (d) N2-D36, nada mudou

describe('(d) N2-D36 revista — `Salvar a ordem` INATIVO enquanto a ordem é a do servidor', () => {
  /**
   * A primeira forma da N2-D36 (commit 2) fechava o modo sem request. A
   * revista (Marcel, 2026-09-22; div. 276) é a leitura do formulário: o botão
   * nasce inativo com o motivo escrito ao lado (N2-D23), e o toque nele não
   * fecha nada — só deixa a linha `write blocked … nada-mudou`.
   */
  it('entrar: inativo com o motivo; tocar: zero request, `nada-mudou`, e o modo FICA', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    expect(inativo('reordenar-salvar')).toBe(true)
    expect(texto('reordenar-salvar-motivo')).toBe('nada mudou desde que você abriu')

    await tocar('reordenar-salvar')
    await assentar(30)
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=reorder reason=nada-mudou'])
    expect(achar('alca-1')).not.toBeNull()
  })

  it('ativa ao primeiro movimento, e volta a inativo quando o arrasto devolve a ordem', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)
    expect(inativo('reordenar-salvar')).toBe(false)
    expect(achar('reordenar-salvar-motivo')).toBeNull()

    await arrastar(2, 5)
    expect(inativo('reordenar-salvar')).toBe(true)
    expect(texto('reordenar-salvar-motivo')).toBe('nada mudou desde que você abriu')
    await tocar('reordenar-salvar')
    await assentar(30)
    expect(so('api')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=reorder reason=nada-mudou'])
  })
})

// ------------------------------------ (e0) N2-D37, o 400 de permutação

describe('(e0) N2-D37 — 400 de permutação inválida: o arrasto é DESCARTADO e a lista é a relida', () => {
  /**
   * O contrato não tem código próprio para isto: o `OB601` da RPC sai como
   * `400 VALIDATION_ERROR` com `details[].field = "order"` (`SETLISTS.md`
   * §order; `lib/rpc-errors.ts:23`). No `reorder` o core já o classifica como
   * `ordem-mudou` — *"a setlist mudou — a ordem foi recarregada"* —, e a N2-D37
   * faz a frase ser verdade: a tela mostra a ordem relida (div. 295).
   *
   * O 400 aqui é REAL no mock: outro aparelho remove uma música depois que o
   * modo abriu, e o arrasto deixa de ser permutação da setlist.
   */
  it('lista = releitura, sem "movida de", aviso com a frase, sem `Tentar de novo`; alça e `Sair sem salvar` ficam', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)

    // "Outro aparelho" tira a música 3 — direto no mock, fora do app.
    const porta = new URL(process.env.EXPO_PUBLIC_API_BASE_URL ?? '').port
    await globalThis.fetch(`http://127.0.0.1:${porta}/api/setlists/songs/${ss(3)}`, { method: 'DELETE' })
    linhas = []

    await tocar('reordenar-salvar')
    await assentar(80)
    expect(so('write op=reorder')[0]).toMatch(/ items=5 status=400 code=VALIDATION_ERROR /)
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=order op=reorder status=200/)

    // A lista é a RELIDA: quatro linhas, na ordem do servidor, sem rótulo.
    expect(achar('alca-4')).not.toBeNull()
    expect(achar('alca-5')).toBeNull()
    expect(linhaDaAlca(2).textContent).toContain('Segunda')
    expect(linhaDaAlca(3).textContent).toContain('Quarta')
    expect(textoDaTela()).not.toContain('movida de')
    // O aviso diz o que o servidor disse, e não promete o que não é verdade.
    const aviso = texto('aviso-motivo')
    expect(aviso).toContain('Não foi possível salvar a ordem')
    expect(aviso).toContain('a setlist mudou — a ordem foi recarregada')
    expect(aviso).not.toContain('a ordem dela não foi aplicada aqui')
    expect(textoDaTela()).not.toContain('a ordem abaixo é a que você arrastou')
    // Sem `Tentar de novo` — nem na linha, nem na barra.
    expect(achar('aviso-acao')).toBeNull()
    expect(texto('reordenar-salvar')).not.toBe('Tentar de novo')
    expect(inativo('reordenar-salvar')).toBe(true)
    // `Sair sem salvar` e a alça continuam.
    expect(texto('reordenar-sair')).toBe('Sair sem salvar')
    expect(inativo('alca-1')).toBe(false)
  })
})

// ------------------------------------------------ (e) a falha, R2·1

describe('(e) R2·1 / N2-S2e-ordem-falhou — 500: o modo fica, o arrasto é preservado', () => {
  it('aviso, "movida de 5", releitura atrás do modo, e `Tentar de novo` reenvia O ARRASTO', async () => {
    await mock.servir('escrita-500', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)
    await tocar('reordenar-salvar')
    await assentar(80)

    const arrastada = [ss(1), ss(5), ss(2), ss(3), ss(4)]
    expect(so('write op=reorder')[0]).toMatch(/ items=5 status=500 code=INTERNAL_ERROR /)
    // O modo está aberto, e a linha 2 é a que era 5 — com o rótulo.
    expect(achar('alca-1')).not.toBeNull()
    expect(linhaDaAlca(2).textContent).toContain('Quinta')
    expect(linhaDaAlca(2).textContent).toContain('movida de 5')
    // Só a linha ARRASTADA leva o rótulo; as que desceram um, não.
    expect(linhaDaAlca(3).textContent).not.toContain('movida de')

    const tela = textoDaTela()
    expect(tela).toContain('a ordem abaixo é a que você arrastou · a do servidor é outra')
    const aviso = texto('aviso-motivo')
    expect(aviso).toContain('Não foi possível salvar a ordem')
    expect(aviso).toContain('falha no servidor — nada foi alterado aqui')
    expect(aviso).toContain('a setlist foi relida; a ordem dela não foi aplicada aqui')
    expect(texto('reordenar-sair')).toBe('Sair sem salvar')
    expect(texto('reordenar-salvar')).toBe('Tentar de novo')
    expect(inativo('reordenar-salvar')).toBe(false)
    // A alça continua ativa: arrastar mais por cima do preservado é legítimo.
    expect(inativo('alca-1')).toBe(false)

    // A releitura da regra 3 aconteceu ANTES do `Tentar de novo` ficar ativo.
    expect(so('resync kind=setlists')).toHaveLength(1)
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=order op=reorder status=200/)

    // A releitura atualiza a setlist ATRÁS do modo e NÃO sobrescreve a lista.
    await comOReleitura()
    expect(achar('alca-1')).not.toBeNull()
    expect(linhaDaAlca(2).textContent).toContain('Quinta')
    expect(linhaDaAlca(2).textContent).toContain('movida de 5')

    // `Tentar de novo` reenvia o ARRASTO, não a ordem do servidor.
    await tocar('reordenar-salvar')
    await assentar(80)
    expect(pedidosDeOrdem()).toHaveLength(2)
    expect(corposDeOrdem).toEqual([{ order: arrastada }, { order: arrastada }])
  })

  it('`Sair sem salvar` descarta o arrasto: a grade volta com a ordem do servidor', async () => {
    await mock.servir('escrita-500', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)
    await tocar('reordenar-salvar')
    await assentar(80)
    await comOReleitura()

    linhas = []
    await tocar('reordenar-sair')
    await assentar(30)
    expect(so('api')).toEqual([])
    expect(achar('alca-1')).toBeNull()
    expect(achar('song-2')?.textContent).toContain('Segunda')
    expect(achar('song-5')?.textContent).toContain('Quinta')
    expect(achar('aviso-motivo')).toBeNull()
  })
})

// ------------------------------------------------------- (f) o 404

describe('(f) T2-R10 — 404 no reorder: o modo fecha, e S2 sai para S1 já relida', () => {
  it('`sumiu`, com a lista da releitura entregue antes da saída', async () => {
    await mock.servir('escrita-404', [setlistDe(5)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('reordenar')
    await arrastar(5, 2)
    await tocar('reordenar-salvar')
    await assentar(80)

    expect(so('write op=reorder')[0]).toMatch(/ status=404 code=NOT_FOUND /)
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=404 op=reorder status=200/)
    expect(saiuParaS1).toEqual(['sumiu'])
    expect(relido).not.toBeNull()
  })
})

// ---------------------------------------------------- (g) o teto de 100

describe('(g) N2-X-100 / A-N2-9 — acima de 100 músicas, `Reordenar` inativo com a frase', () => {
  it('101 músicas: só `Reordenar` inativa, a linha de aviso diz por quê, zero request', async () => {
    await mock.servir('escrita', [setlistDe(101)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(inativo('reordenar')).toBe(true)
    // Amputação do anexo D: a alça inativa perde dois marcadores.
    expect(circulos('reordenar')).toBe(4)
    expect(texto('aviso-motivo')).toBe(
      'Acima de 100 músicas, reordenar por arrasto fica inativo. Adicionar e remover continuam.',
    )
    expect(achar('aviso-acao')).toBeNull()
    // Regra 8: os outros da faixa e o `remover` seguem ativos.
    expect(inativo('setlist-editar')).toBe(false)
    expect(inativo('setlist-apagar')).toBe(false)
    expect(inativo('remover-101')).toBe(false)

    await tocar('reordenar')
    await assentar(30)
    expect(achar('alca-1')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=reorder reason=ceiling'])
  })

  it('100 músicas ainda reordena', async () => {
    await mock.servir('escrita', [setlistDe(100)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    expect(inativo('reordenar')).toBe(false)
    expect(achar('aviso-motivo')).toBeNull()
  })
})

// ------------------------------------------------------ (h) sem rede

describe('(h) T2-R12 / N2-X-sem-rede — sem rede, `Reordenar` inativa com o resto da faixa', () => {
  it('desenho amputado, a frase de sem rede, e o toque não abre o modo', async () => {
    await mock.servir('escrita', [setlistDe(5)], BIBLIOTECA)
    online = false
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(inativo('reordenar')).toBe(true)
    expect(circulos('reordenar')).toBe(4)
    expect(texto('aviso-motivo')).toBe(
      'Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.',
    )
    await tocar('reordenar')
    await assentar(30)
    expect(achar('alca-1')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
  })
})
