/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR3 (S2 com e sem edição na faixa B;
 * molduras `N3-B-S2e` e `N3-B-S2p`, amostras `N3-B-X-…`; N3-D17, N3-D19).
 * Vêm ANTES do código que medem: contra a árvore de hoje os de B reprovam por
 * AUSÊNCIA — S2 não lê a faixa, a faixa de edição mostra os rótulos longos e
 * a lista é a grade de duas colunas.
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`), como no
 * `s1-faixa.test.tsx`: 711,1 × 1053,8 é o AVD em retrato, o canvas medido de
 * B. A faixa C é o padrão do duplo, e é por isso que o `s2-edicao.test.tsx`,
 * o `reordenar.test.tsx` e o `picker.test.tsx` da N2 rodam em C **sem
 * mudança** — o CP da invariante em jsdom. O bloco "C" deste arquivo repete a
 * forma de C com a janela de C escrita.
 *
 * **A coluna única** se lê no `data-numcolumns` do `FlatList` do duplo: no
 * aparelho ela é "todo `song-<n>` com a mesma coordenada x", e isso é do dump
 * (commit 3), como a faixa de 687,1, a linha de 663 × 116 e o título de 377.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { IndexScreenProps } from '../src/screens/IndexScreen'
import { __reset } from './fake-expo-file-system'
import { __janela } from './fake-react-native'
import { Mock, portaLivre } from './mock'
import { achar, assentar, desmontar, exige, inativo, montar, texto, tocar } from './tela'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-s2-faixa-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-s2-faixa'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }

const BIBLIOTECA: ContentDTO[] = [1, 2, 3].map((i) => ({
  id: `c-${i}`, title: `Música ${i}`, artist: 'Artista', album: null,
  content_type: 'Lyrics', content_data: { lyrics: `letra ${i}` },
  file_url: null, updated_at: T0,
}))

/** A setlist de `n` linhas, como a do `N3-B-S2e` (8) ou a do teto (101). */
function setlistDe(n: number): SetlistDTO {
  return {
    id: SL, name: 'Ensaio de retrato', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: n }, (_, i) => ({
      id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: `c-${(i % 3) + 1}`,
      position: i + 1, notes: null, content: null,
    })),
  }
}

let mock: Mock
let dir = ''
type TelaS2 = typeof import('../src/screens/IndexScreen')
let S2: TelaS2

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

/** As props de S2 — vinda de S1 (com edição) por padrão. */
async function props(extra: Partial<IndexScreenProps> = {}): Promise<IndexScreenProps> {
  const doServidor = semEmbutido(await mock.doServidor())
  const setlist = doServidor.find((s) => s.id === SL) ?? doServidor[0]
  return {
    setlist,
    contentById: new Map(BIBLIOTECA.map((c) => [c.id, c])),
    syncDone: true,
    posicaoAtual: null,
    onVoltar: () => undefined,
    onAbrirPosicao: () => undefined,
    onBuscar: () => undefined,
    edicao: {
      estado: { uid: UID, setlists: doServidor, content: BIBLIOTECA, syncedAtMs: 1 },
      online,
      aoReler: () => undefined,
      aoSairParaS1: () => undefined,
    },
    ...extra,
  }
}

/** Quantas colunas a lista de músicas tem — `numColumns` do `FlatList`. */
function colunas(): string | null {
  const lista = document.querySelector<HTMLElement>('[data-flatlist]')
  if (lista === null) throw new Error('sem FlatList')
  return lista.getAttribute('data-numcolumns')
}

/** O nome acessível: o `accessibilityLabel`, ou o texto quando não há um. */
function nomeAcessivel(testID: string): string {
  return exige(testID).getAttribute('aria-label') ?? texto(testID)
}

/** Os quatro controles da faixa, na ordem do congelado: esquerda, depois direita. */
const FAIXA = ['picker-abrir', 'reordenar', 'setlist-editar', 'setlist-apagar'] as const

/** O que TODO estado de S2e em B tem de mostrar, com ou sem aviso. */
function faixaDeB(): void {
  expect(FAIXA.map((id) => texto(id))).toEqual(['Adicionar', 'Reordenar', 'Renomear e datar', 'Apagar'])
  expect(colunas()).toBe('1')
}

/** O motivo inteiro e sem teto de linhas (N3-D19: a linha cresce, nunca elide). */
function avisoInteiro(esperado: string | RegExp): void {
  const motivo = exige('aviso-motivo')
  if (typeof esperado === 'string') expect(texto('aviso-motivo')).toBe(esperado)
  else expect(texto('aviso-motivo')).toMatch(esperado)
  expect(motivo.getAttribute('data-numberoflines')).toBeNull()
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-s2-faixa-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  S2 = await import('../src/screens/IndexScreen')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  online = true
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  __janela()
  vi.restoreAllMocks()
})

// ----------------------------------------------------------------- faixa B

describe('N3-B-S2e — a faixa de 64 com os rótulos curtos (N3-D17)', () => {
  it('os quatro controles, `Adicionar` e `Apagar` visíveis, e o nome acessível continua o longo', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    faixaDeB()
    expect(FAIXA.map((id) => nomeAcessivel(id))).toEqual([
      'Adicionar música', 'Reordenar', 'Renomear e datar', 'Apagar setlist',
    ])
    for (const id of FAIXA) expect(inativo(id)).toBe(false)
    // A barra de 88 é a de C: voltar, título e busca, com o mesmo texto.
    expect(texto('buscar')).toBe('Buscar na biblioteca')
    expect(nomeAcessivel('voltar')).toBe('Voltar para as setlists')
  })
})

describe('N3-B-S2e — coluna única 663 × 116, `remover` no fim de toda linha', () => {
  it('a grade de duas colunas vira uma; cada `song-<n>` com o seu `remover-<n>`', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(colunas()).toBe('1')
    for (let n = 1; n <= 8; n++) {
      const linha = exige(`song-${n}`)
      expect(linha.contains(exige(`remover-${n}`))).toBe(true)
      expect(nomeAcessivel(`remover-${n}`)).toBe('Remover da setlist')
    }
  })
})

describe('N3-B-S2p — a mesma coluna, sem faixa e sem `remover`', () => {
  it('vinda do palco: zero controle de escrita, a posição atual marcada, e a coluna única', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props({ posicaoAtual: 3, edicao: null }))} />)

    expect(colunas()).toBe('1')
    for (const id of FAIXA) expect(achar(id)).toBeNull()
    for (let n = 1; n <= 8; n++) {
      expect(achar(`song-${n}`)).not.toBeNull()
      expect(achar(`remover-${n}`)).toBeNull()
    }
    expect(achar('aviso-motivo')).toBeNull()
    expect(nomeAcessivel('voltar')).toBe('Voltar para o palco')
    expect(achar('buscar')).not.toBeNull()
  })
})

describe('N3-B-X — os cinco estados de S2 pela `LinhaDeAviso`, com o texto inteiro', () => {
  it('sem rede (N3-B-X-sem-rede): a faixa inteira inerte, com os rótulos curtos', async () => {
    __janela(B.w, B.h)
    online = false
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    faixaDeB()
    for (const id of FAIXA) expect(inativo(id)).toBe(true)
    expect(inativo('remover-1')).toBe(true)
    avisoInteiro(
      'Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.',
    )
    expect(achar('aviso-acao')).toBeNull()
  })

  it('salvo, não relido (N3-B-X-salvo-nao-relido): remover com 2xx e a releitura em 500', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita-resync-500', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-8')
    await assentar(80)

    faixaDeB()
    avisoInteiro('Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.')
    expect(texto('aviso-acao')).toBe('Tentar recarregar')
  })

  it('falhou (N3-B-X-falhou): as três orações e `Tentar de novo`', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita-500', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-8')
    await assentar(80)

    faixaDeB()
    avisoInteiro(
      'Não foi possível salvar · falha no servidor — nada foi alterado aqui · a lista abaixo é a que o servidor acabou de devolver',
    )
    expect(texto('aviso-acao')).toBe('Tentar de novo')
  })

  it('limite (N3-B-X-limite): a frase com o prazo, sem ação — a amostra que S1 não tem (div. 413)', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita-429', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-8')
    await assentar(80)

    faixaDeB()
    avisoInteiro(/^muitas alterações seguidas — tente de novo em \d+ s$/)
    expect(achar('aviso-acao')).toBeNull()
  })

  it('acima de 100 (N3-B-X-100): 101 linhas, só `Reordenar` inerte, e a coluna vai até a 101', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(101)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    faixaDeB()
    expect(inativo('reordenar')).toBe(true)
    for (const id of ['picker-abrir', 'setlist-editar', 'setlist-apagar']) expect(inativo(id)).toBe(false)
    avisoInteiro('Acima de 100 músicas, reordenar por arrasto fica inativo. Adicionar e remover continuam.')
    expect(achar('song-101')).not.toBeNull()
    expect(inativo('remover-101')).toBe(false)
  })
})

// ------------------------------------------------- faixa C: o CP em jsdom

describe('C — a forma do congelado, com a janela de C escrita', () => {
  it('rótulos longos, grade de duas colunas; o nome acessível é o mesmo de B', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(FAIXA.map((id) => texto(id))).toEqual([
      'Adicionar música', 'Reordenar', 'Renomear e datar', 'Apagar setlist',
    ])
    expect(FAIXA.map((id) => nomeAcessivel(id))).toEqual([
      'Adicionar música', 'Reordenar', 'Renomear e datar', 'Apagar setlist',
    ])
    expect(colunas()).toBe('2')
    for (let n = 1; n <= 8; n++) expect(achar(`remover-${n}`)).not.toBeNull()
  })

  it('S2p em C: a grade de duas colunas, sem faixa', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props({ posicaoAtual: 3, edicao: null }))} />)

    expect(colunas()).toBe('2')
    for (const id of FAIXA) expect(achar(id)).toBeNull()
  })
})
