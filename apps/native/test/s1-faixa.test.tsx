/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR2 (S1 na faixa B; N3-D28, N3-D19).
 * Vêm ANTES do código que medem: contra a árvore de hoje os de B reprovam por
 * AUSÊNCIA — S1 não lê a faixa, o título divide a linha com o chip e os
 * botões, o cartão é de duas colunas e a linha de aviso corta em duas linhas.
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`): 711,1 × 1053,8 é o
 * AVD `octavia_tab32` em retrato, o canvas medido da faixa B
 * (`DESIGN-N3/README.md` §6). A faixa C é o padrão do duplo (1138 × 627), e é
 * por isso que o `s1-criar.test.tsx` da N2 roda em C **sem mudança** — esse é
 * o CP da invariante em jsdom. O bloco "C" deste arquivo repete a forma de C
 * com a janela de C escrita, para que o CP não dependa de um padrão implícito.
 *
 * **O que estes CNs NÃO medem**: geometria. A barra de 144, o cartão de 184,
 * o nome de 583, o chip de 192,4 e a linha de aviso de 68 se medem no **dump
 * do aparelho** (commit 3), contra o `medidas.json`. Aqui se mede o que a
 * árvore sabe dizer: que nó existe, dentro de quem, em que ordem, com que
 * texto, e se o texto do aviso tem teto de linhas.
 *
 * **O chip de sync não tem `testID`** (div. 412): a folha manda os ids
 * inalterados, então ele se acha pelo texto.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { SetlistsScreenProps } from '../src/screens/SetlistsScreen'
import { __reset } from './fake-expo-file-system'
import { __janela } from './fake-react-native'
import { Mock, portaLivre } from './mock'
import { achar, assentar, desmontar, digitar, exige, inativo, montar, texto, tocar } from './tela'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-faixa-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-faixa'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }

const BIBLIOTECA: ContentDTO[] = [1, 2].map((i) => ({
  id: `c-${i}`, title: `Música ${i}`, artist: null, album: null,
  content_type: 'Lyrics', content_data: { lyrics: `letra ${i}` },
  file_url: null, updated_at: T0,
}))

function setlist(id: string, nome: string, songs: number): SetlistDTO {
  return {
    id, name: nome, performance_date: null, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: songs }, (_, i) => ({
      id: `${id}-ss-${i + 1}`, setlist_id: id, content_id: `c-${i + 1}`,
      position: i + 1, notes: null, content: null,
    })),
  }
}

let mock: Mock
let dir = ''
type Tela = typeof import('../src/screens/SetlistsScreen')
let S1: Tela

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

async function props(extra: Partial<SetlistsScreenProps> = {}): Promise<SetlistsScreenProps> {
  const doServidor = await mock.doServidor()
  return {
    setlists: semEmbutido(doServidor),
    contentById: new Map(BIBLIOTECA.map((c) => [c.id, c])),
    filesPresent: new Set<string>(),
    baixando: new Set<string>(),
    temCache: true,
    sync: { fase: 'ok' as const, syncedAtMs: Date.now() },
    online,
    onTentarNovamente: () => undefined,
    onAbrirSetlist: () => undefined,
    onBaixarSetlist: () => undefined,
    onBuscar: () => undefined,
    estadoLocal: { uid: UID, setlists: semEmbutido(doServidor), content: BIBLIOTECA, syncedAtMs: 1 },
    aoRelerNaEscrita: () => undefined,
    ...extra,
  }
}

/** O nó FOLHA cujo texto é exatamente este — o `TextView` do dump. */
function folha(t: string): HTMLElement {
  const nos = [...document.querySelectorAll<HTMLElement>('span')].filter(
    (e) => e.children.length === 0 && e.textContent === t,
  )
  if (nos.length === 0) throw new Error(`sem nó de texto "${t}"`)
  return nos[0] as HTMLElement
}

/** O ancestral mais próximo que contém os dois nós. */
function comum(a: HTMLElement, b: HTMLElement): HTMLElement {
  let p: HTMLElement | null = a
  while (p !== null && !p.contains(b)) p = p.parentElement
  if (p === null) throw new Error('sem ancestral comum')
  return p
}

const antes = (a: HTMLElement, b: HTMLElement): boolean =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

/**
 * A linha de botões da barra: o menor nó que contém `criar-setlist` e
 * `buscar` — o mesmo que o `uiautomator` desenharia como a segunda linha.
 */
function linhaDeBotoes(): HTMLElement {
  return comum(exige('criar-setlist'), exige('buscar'))
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-faixa-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  S1 = await import('../src/screens/SetlistsScreen')
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

describe('N3-B-S1 — a barra de 144: o título em linha própria', () => {
  it('SETLISTS fica fora da linha de botões, acima dela; chip, `criar-setlist` e `buscar` na mesma linha', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)

    const titulo = folha('SETLISTS')
    const linha = linhaDeBotoes()
    expect(linha.contains(titulo)).toBe(false)
    expect(antes(titulo, linha)).toBe(true)
    // A ordem do congelado continua: status de sync · escrever · ler.
    const chip = folha('sincronizado agora')
    expect(linha.contains(chip)).toBe(true)
    expect(antes(chip, exige('criar-setlist'))).toBe(true)
    expect(antes(exige('criar-setlist'), exige('buscar'))).toBe(true)
    expect(texto('criar-setlist')).toBe('Nova setlist')
    expect(texto('buscar')).toBe('Buscar música')
  })
})

describe('N3-B-S1 — o cartão de 184 em três andares', () => {
  it('nome · metadados · `Baixar` + estado, cada andar abaixo do anterior e nada sai', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlist(SL, 'Show de retrato', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)

    const cartao = exige(`setlist-${SL.slice(0, 8)}`)
    const nome = folha('Show de retrato')
    const meta = comum(folha('sem data'), folha('2 músicas'))
    const baixar = exige(`baixar-${SL.slice(0, 8)}`)
    const estado = folha('garantida offline')
    for (const n of [nome, meta, baixar, estado]) expect(cartao.contains(n)).toBe(true)
    expect(texto(`baixar-${SL.slice(0, 8)}`)).toBe('Baixar esta setlist')

    // Três andares: os filhos diretos do cartão são o nome, os metadados e o
    // andar de ação — em C são duas colunas (esquerda: nome + metadados;
    // direita: baixar + estado).
    const andares = [...cartao.children] as HTMLElement[]
    expect(andares).toHaveLength(3)
    expect(andares[0]?.contains(nome)).toBe(true)
    expect(andares[1]?.contains(meta)).toBe(true)
    expect(andares[2]?.contains(baixar)).toBe(true)
    expect(andares[2]?.contains(estado)).toBe(true)
  })
})

describe('N3-B-S1f — só a barra muda: `criar-setlist` nos dois lugares', () => {
  it('a barra de 144 e o alvo central, com o MESMO id', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)

    expect(achar('s1f')).not.toBeNull()
    const todos = [...document.querySelectorAll<HTMLElement>('[data-testid="criar-setlist"]')]
    expect(todos.map((e) => e.textContent)).toEqual(['Nova setlist', 'Criar a primeira setlist'])
    expect(linhaDeBotoes().contains(folha('SETLISTS'))).toBe(false)
  })
})

describe('N3-B-S1-sem-rede — o chip empilha, `Nova setlist` inerte, o aviso inteiro', () => {
  it('as duas partes do chip em dois nós, sem o "·"; o motivo sem teto de linhas (N3-D19)', async () => {
    __janela(B.w, B.h)
    online = false
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props({ online: false, sync: { fase: 'offline', syncedAtMs: Date.now() } }))} />)

    // N3-D21: a quebra faz o papel do separador — a frase não muda.
    const sem = folha('sem conexão')
    const ultima = folha('última sincronização agora')
    expect(linhaDeBotoes().contains(sem)).toBe(true)
    expect(antes(sem, ultima)).toBe(true)
    expect(linhaDeBotoes().contains(folha('SETLISTS'))).toBe(false)

    expect(inativo('criar-setlist')).toBe(true)
    expect(inativo('buscar')).toBe(false)
    const motivo = exige('aviso-motivo')
    expect(texto('aviso-motivo')).toBe(
      'Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.',
    )
    // "Nunca elide": sem `numberOfLines` — nenhum teto que corte o motivo.
    expect(motivo.getAttribute('data-numberoflines')).toBeNull()
    expect(achar('aviso-acao')).toBeNull()
  })
})

describe('N3-B-X-salvo-nao-relido em S1 — a ação continua na linha', () => {
  it('201 com a releitura em 500: a linha avisa, nomeia a setlist e traz `aviso-acao`', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita-resync-500', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    expect(achar('form-nome')).toBeNull()
    expect(texto('aviso-motivo')).toBe(
      'Season 4 foi criada. Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda.',
    )
    expect(exige('aviso-motivo').getAttribute('data-numberoflines')).toBeNull()
    expect(texto('aviso-acao')).toBe('Tentar recarregar')
    expect(linhaDeBotoes().contains(folha('SETLISTS'))).toBe(false)
  })
})

// ------------------------------------------------- faixa C: o CP em jsdom

describe('C — a forma do congelado, com a janela de C escrita', () => {
  it('SETLISTS divide a linha com chip e botões; o cartão tem duas colunas', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)

    expect(linhaDeBotoes().contains(folha('SETLISTS'))).toBe(true)
    expect(linhaDeBotoes().contains(folha('sincronizado agora'))).toBe(true)
    const cartao = exige(`setlist-${SL.slice(0, 8)}`)
    expect(cartao.children).toHaveLength(2)
  })
})
