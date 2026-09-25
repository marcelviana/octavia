/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR4 (reordenar, folha e diálogo na faixa
 * B; molduras `N3-B-reordenar` e `N3-B-F-validacao`, e o diálogo, que "em B
 * passa" — `DESIGN-N3/telas.html` §3, §4 e §6).
 * Vêm ANTES do código que medem: contra a árvore de hoje os de B reprovam —
 * a barra do reordenar é uma linha só (título, `Cancelar`, motivo e `Salvar a
 * ordem` disputando 663, e o título caía para 67,6 dp no pre-check), o artista
 * não cede antes do título, e a folha tem 720 × 420 a 100 do topo.
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`), como no
 * `s1-faixa.test.tsx` e no `s2-faixa.test.tsx`: 711,1 × 1053,8 é o AVD em
 * retrato. A faixa C é o padrão do duplo, e é por isso que o
 * `reordenar.test.tsx`, o `s2-edicao.test.tsx` e o `s1-criar.test.tsx` da N2
 * rodam em C **sem mudança** — o CP da invariante em jsdom. O bloco "C" deste
 * arquivo repete a forma de C com a janela de C escrita.
 *
 * **Os de B que passam contra a árvore de hoje**, declarados: a alça em toda
 * linha (`alca-<n>`, 48 × 72), o `form-data-limpar` quando há data e o
 * diálogo (620, botões lado a lado). São o que a folha diz que já está certo
 * em B — o reordenar "alça 48 × 72 nas duas faixas", o `Limpar` "só quando há
 * data", o diálogo "B: passa" —, e ficam aqui para que o commit 2 não os
 * quebre.
 *
 * **O que estes CNs NÃO medem**: geometria. A barra de 144, a linha de
 * 663 × 72, o artista com mínimo de 60, a folha de 663 × ≈ 486 acima do
 * teclado e o diálogo de 620 se medem no **dump do aparelho** (commit 3),
 * contra o `medidas.json`. Aqui se mede o que a árvore sabe dizer: que nó
 * existe, dentro de quem, em que ordem, com que texto — e, onde a faixa é
 * TOKEN (a largura da folha, o topo, o mínimo do artista), o valor que a tela
 * pediu ao `theme.ts`.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { IndexScreenProps } from '../src/screens/IndexScreen'
import type { SetlistsScreenProps } from '../src/screens/SetlistsScreen'
import { __reset } from './fake-expo-file-system'
import { __janela } from './fake-react-native'
import { Mock, portaLivre } from './mock'
import { achar, assentar, desmontar, estilo, exige, inativo, montar, pegar, texto, textoDaTela, tocar } from './tela'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-r-f-faixa-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-r-f-faixa'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }
/** Passo da coluna do reordenar: a linha de 72 mais o vão de 8. */
const PASSO = 80

const BIBLIOTECA: ContentDTO[] = [1, 2, 3].map((i) => ({
  id: `c-${i}`, title: `Música ${i}`, artist: 'Artista', album: null,
  content_type: 'Lyrics', content_data: { lyrics: `letra ${i}` },
  file_url: null, updated_at: T0,
}))

/** A setlist de `n` linhas, como a do `N3-B-reordenar` (8), com ou sem data. */
function setlistDe(n: number, data: string | null = null): SetlistDTO {
  return {
    id: SL, name: 'Ensaio de retrato', performance_date: data, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: n }, (_, i) => ({
      id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: `c-${(i % 3) + 1}`,
      position: i + 1, notes: null, content: null,
    })),
  }
}

let mock: Mock
let dir = ''
type TelaS2 = typeof import('../src/screens/IndexScreen')
type TelaS1 = typeof import('../src/screens/SetlistsScreen')
let S2: TelaS2
let S1: TelaS1

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

/** As props de S2 com edição (vinda de S1). */
async function propsS2(): Promise<IndexScreenProps> {
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
  }
}

/** As props de S1 — de onde a folha abre no modo criar. */
async function propsS1(): Promise<SetlistsScreenProps> {
  const doServidor = semEmbutido(await mock.doServidor())
  return {
    setlists: doServidor,
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
    estadoLocal: { uid: UID, setlists: doServidor, content: BIBLIOTECA, syncedAtMs: 1 },
    aoRelerNaEscrita: () => undefined,
  }
}

/** O nó FOLHA cujo texto é exatamente este — o `TextView` do dump. */
function folhaDeTexto(t: string): HTMLElement {
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
 * A linha de ações da barra do reordenar: o menor nó que contém
 * `reordenar-sair` e `reordenar-salvar` — a segunda linha da barra de 144 em
 * B; em C, a própria barra de 88.
 */
function linhaDeAcoes(): HTMLElement {
  return comum(exige('reordenar-sair'), exige('reordenar-salvar'))
}

/** O título da barra do reordenar (`Reordenar · <nome>`), em caixa alta no aparelho. */
const TITULO = 'Reordenar · Ensaio de retrato'

/** A folha: o cartão dentro da cortina do `Modal` que tem `form-nome`. */
function cartaoDaFolha(): HTMLElement {
  const nome = exige('form-nome')
  const cartao = [...document.querySelectorAll<HTMLElement>('[data-modal] > div > div')].find((e) => e.contains(nome))
  if (cartao === undefined) throw new Error('sem o cartão da folha')
  return cartao
}

/** O cartão do diálogo de apagar: o que contém os dois botões. */
function cartaoDoDialogo(): HTMLElement {
  const manter = exige('apagar-manter')
  const cartao = [...document.querySelectorAll<HTMLElement>('[data-modal] > div > div')].find((e) => e.contains(manter))
  if (cartao === undefined) throw new Error('sem o cartão do diálogo')
  return cartao
}

/** O `Text` do artista da linha `n` do reordenar (`· Artista`). */
function artistaDaLinha(n: number): HTMLElement {
  const linha = exige(`alca-${n}`).parentElement as HTMLElement
  const no = [...linha.querySelectorAll<HTMLElement>('span')].find((e) => (e.textContent ?? '').startsWith('· '))
  if (no === undefined) throw new Error(`sem artista na linha ${n}`)
  return no
}
function tituloDaLinha(n: number): HTMLElement {
  const artista = artistaDaLinha(n)
  const irmao = artista.previousElementSibling as HTMLElement | null
  if (irmao === null) throw new Error(`sem título na linha ${n}`)
  return irmao
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-r-f-faixa-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  S2 = await import('../src/screens/IndexScreen')
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

// ------------------------------------------------------- reordenar em B

describe('N3-B-reordenar — a barra de 144: o título em nó próprio, as ações abaixo', () => {
  it('título fora da linha de ações e acima dela; `Cancelar` à esquerda, motivo + `Salvar a ordem` à direita', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')

    const titulo = folhaDeTexto(TITULO)
    const linha = linhaDeAcoes()
    expect(linha.contains(titulo)).toBe(false)
    expect(antes(titulo, linha)).toBe(true)
    // O apoio fica com o título, na primeira parte da barra.
    const apoio = folhaDeTexto('arraste pela alça · a ordem só é salva no fim')
    expect(linha.contains(apoio)).toBe(false)
    expect(antes(apoio, linha)).toBe(true)
    // A ordem da linha 2: sair · motivo · salvar, os três dentro dela.
    expect(texto('reordenar-sair')).toBe('Cancelar')
    expect(texto('reordenar-salvar-motivo')).toBe('nada mudou desde que você abriu')
    expect(linha.contains(exige('reordenar-salvar-motivo'))).toBe(true)
    expect(antes(exige('reordenar-sair'), exige('reordenar-salvar-motivo'))).toBe(true)
    expect(antes(exige('reordenar-salvar-motivo'), exige('reordenar-salvar'))).toBe(true)
    expect(texto('reordenar-salvar')).toBe('Salvar a ordem')
    expect(inativo('reordenar-salvar')).toBe(true)
  })

  it('a alça 48 × 72 em toda linha (passa hoje — "nas duas faixas")', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')

    for (let n = 1; n <= 8; n++) {
      expect(achar(`alca-${n}`)).not.toBeNull()
      expect(estilo(exige(`alca-${n}`))).toMatchObject({ width: 48, height: 72 })
    }
  })

  it('título · artista numa linha, e o ARTISTA cede primeiro, com mínimo de 60', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')

    const artista = estilo(artistaDaLinha(1))
    const titulo = estilo(tituloDaLinha(1))
    expect(artista.minWidth).toBe(60)
    // "cede primeiro": encolhe com peso maior que o do título.
    expect(Number(artista.flexShrink)).toBeGreaterThan(Number(titulo.flexShrink ?? 0))
    expect(tituloDaLinha(1).getAttribute('data-numberoflines')).toBe('1')
    expect(artistaDaLinha(1).getAttribute('data-numberoflines')).toBe('1')
  })

  it('arrastando: a alça responde, e a linha de ações é a mesma', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')

    const g = await pegar('alca-5')
    await g.mover(-PASSO * 3)
    expect(textoDaTela()).toContain('soltar aqui · posição 2')
    expect(linhaDeAcoes().contains(folhaDeTexto(TITULO))).toBe(false)
    await g.soltar()
    expect(inativo('reordenar-salvar')).toBe(false)
    expect(achar('reordenar-salvar-motivo')).toBeNull()
  })

  it('falhou (500): `Sair sem salvar` e `Tentar de novo` na linha 2, o aviso ABAIXO da barra', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita-500', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')
    const g = await pegar('alca-5')
    await g.mover(-PASSO * 3)
    await g.soltar()
    await tocar('reordenar-salvar')
    await assentar(80)

    expect(texto('reordenar-sair')).toBe('Sair sem salvar')
    expect(texto('reordenar-salvar')).toBe('Tentar de novo')
    const linha = linhaDeAcoes()
    expect(linha.contains(folhaDeTexto(TITULO))).toBe(false)
    // A linha de aviso vem DEPOIS da barra inteira (a linha 2 incluída).
    expect(antes(linha, exige('aviso-motivo'))).toBe(true)
    expect(linha.contains(exige('aviso-motivo'))).toBe(false)
    expect(exige('aviso-motivo').getAttribute('data-numberoflines')).toBeNull()
  })
})

// ----------------------------------------------------------- folha em B

describe('N3-B-F — a folha de 663, topo 96, altura de conteúdo; botões numa linha', () => {
  it('criar, validação (N3-B-F-validacao): largura e topo de token, `Cancelar` · motivo · `Criar` na mesma linha', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await propsS1())} />)
    await tocar('criar-setlist')

    const cartao = estilo(cartaoDaFolha())
    expect(cartao.width).toBe(663)
    expect(cartao.marginTop).toBe(96)
    // Altura de conteúdo: nenhum mínimo de 420.
    expect(cartao.minHeight ?? 0).toBe(0)

    expect(texto('form-cancelar')).toBe('Cancelar')
    expect(texto('form-salvar')).toBe('Criar')
    expect(inativo('form-salvar')).toBe(true)
    expect(texto('form-salvar-motivo')).toBe('a setlist precisa de um nome')
    const linha = comum(exige('form-cancelar'), exige('form-salvar'))
    expect(linha.contains(exige('form-salvar-motivo'))).toBe(true)
    expect(estilo(linha).flexDirection).toBe('row')
    expect(antes(exige('form-cancelar'), exige('form-salvar-motivo'))).toBe(true)
    expect(antes(exige('form-salvar-motivo'), exige('form-salvar'))).toBe(true)
  })

  it('editar igual: `Salvar` inativo com "nada mudou", `form-data-limpar` quando há data (passa hoje)', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8, '2026-10-03')], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('setlist-editar')

    expect(estilo(cartaoDaFolha()).width).toBe(663)
    expect(texto('form-salvar')).toBe('Salvar')
    expect(inativo('form-salvar')).toBe(true)
    expect(texto('form-salvar-motivo')).toBe('nada mudou desde que você abriu')
    expect(texto('form-data')).toBe('03 / 10 / 2026')
    expect(texto('form-data-limpar')).toBe('Limpar')

    await tocar('form-data-limpar')
    expect(achar('form-data-limpar')).toBeNull()
    expect(texto('form-data')).toBe('dd / mm / aaaa')
    expect(inativo('form-salvar')).toBe(false)
  })
})

// --------------------------------------------------------- diálogo em B

describe('N3-B — o diálogo de apagar passa em B (620 em 711): nada muda', () => {
  it('620 de largura e os dois botões lado a lado, manter antes de apagar (passa hoje)', async () => {
    __janela(B.w, B.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('setlist-apagar')

    expect(estilo(cartaoDoDialogo()).width).toBe(620)
    expect(texto('apagar-manter')).toBe('Manter a setlist')
    expect(texto('apagar-confirmar')).toBe('Apagar')
    const linha = comum(exige('apagar-manter'), exige('apagar-confirmar'))
    expect(estilo(linha).flexDirection).toBe('row')
    expect(antes(exige('apagar-manter'), exige('apagar-confirmar'))).toBe(true)
  })
})

// ------------------------------------------------- faixa C: o CP em jsdom

describe('C — a forma do congelado, com a janela de C escrita', () => {
  it('reordenar: barra de uma linha só — título e ações no mesmo nó; o artista sem mínimo', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('reordenar')

    expect(linhaDeAcoes().contains(folhaDeTexto(TITULO))).toBe(true)
    expect(estilo(linhaDeAcoes()).height).toBe(88)
    expect(estilo(artistaDaLinha(1)).minWidth).toBeUndefined()
    expect(estilo(artistaDaLinha(1)).flexShrink).toBe(1)
  })

  it('folha: 720 × 420 mín., a 100 do topo', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await propsS1())} />)
    await tocar('criar-setlist')

    expect(estilo(cartaoDaFolha())).toMatchObject({ width: 720, minHeight: 420, marginTop: 100 })
  })

  it('diálogo: 620, lado a lado', async () => {
    __janela(C.w, C.h)
    await mock.servir('escrita', [setlistDe(8)], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await propsS2())} />)
    await tocar('setlist-apagar')

    expect(estilo(cartaoDoDialogo()).width).toBe(620)
    expect(estilo(comum(exige('apagar-manter'), exige('apagar-confirmar'))).flexDirection).toBe('row')
  })
})
