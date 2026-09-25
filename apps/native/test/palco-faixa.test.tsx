/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR5 (a barra superior do palco na faixa
 * B; moldura `N3-B-S3` e o quadro `N3-S3 · duas barras, um corpo` —
 * `DESIGN-N3/telas.html` §7, N3-D13).
 * Vêm ANTES do código que medem: contra a árvore de hoje os de B reprovam —
 * a barra superior do palco é uma linha só de 64 (posição, setlist e título
 * lado a lado, o título elidido em ≈ 405), em qualquer faixa.
 *
 * A folha, verbatim: *"B, topo 64 → 88: posição + setlist na primeira linha,
 * título · artista · tipo na segunda, com os 663 dp inteiros. O número 88 é o
 * de bar.top + 24 que S2 e S4 já usam. O corpo perde 24 dp de altura e fica
 * com 870; nada muda na escala. A barra inferior é a de C."* **Só a barra
 * superior muda** — a base, o corpo e as zonas de 15 % são os de C.
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`), como nos outros
 * testes de faixa: 711,1 × 1053,8 é o AVD em retrato. A faixa C é o padrão do
 * duplo. **Nenhum teste de tela do palco existia antes deste** (o palco do
 * V1/N1 se aceitou no aparelho: A12–A18) — então o CP de C mora aqui, no
 * bloco "C", e a invariante de verdade é o G-inv 18/18 contra a
 * `B3-referencia-paisagem/` (N3-D27), no aparelho.
 *
 * **Nenhum `testID` novo** (DESIGN-N3 §7): as duas linhas da barra se acham
 * pelo texto — a posição (`1 DE 8`, `AVULSA`) e o título — e pelo menor
 * ancestral comum dos dois, que é a barra.
 *
 * **O que estes CNs NÃO medem**: geometria. A barra de 88, o título de 663,
 * o corpo de 870, as zonas de 106,7 e a base igual à de C se medem no **dump
 * do aparelho** (commit 3). Aqui se mede o que a árvore sabe dizer: que nó
 * fica dentro de quem, em que ordem, e — onde a faixa é token — a altura que
 * a tela pediu ao `theme.ts`.
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { __reset } from './fake-expo-file-system'
import { __janela } from './fake-react-native'
import { achar, assentar, desmontar, estilo, exige, montar } from './tela'

vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: () => undefined }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }))
vi.mock('../src/prefetch', () => ({ prefetchDemanda: async () => undefined }))

const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }

/** A música da moldura `N3-B-S3`: `Manhã de ensaio · Banda da fixture · Letra`. */
const LETRA: ContentDTO = {
  id: 'c-1', title: 'Manhã de ensaio', artist: 'Banda da fixture', album: null,
  content_type: 'Lyrics', content_data: { lyrics: '[Intro] C Am F G' }, file_url: null, updated_at: T0,
}
/** Uma partitura que não está no disco — offline, vira o S3e. */
const PDF: ContentDTO = {
  id: 'c-2', title: 'Partitura da fixture', artist: null, album: null,
  content_type: 'Sheet', content_data: null, file_url: 'https://host/storage/v1/object/public/content-files/p.pdf',
  updated_at: T0,
}

function setlistDe(n: number, nota: string | null = null): SetlistDTO {
  return {
    id: SL, name: 'Ensaio de retrato', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: n }, (_, i) => ({
      id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: i === 1 ? PDF.id : LETRA.id,
      position: i + 1, notes: i === 0 ? nota : null, content: null,
    })),
  }
}

function props(extra: Partial<StageScreenProps> = {}): StageScreenProps {
  return {
    setlist: setlistDe(8),
    contentById: new Map([LETRA, PDF].map((c) => [c.id, c])),
    posicao: 1,
    avulsaContentId: null,
    online: true,
    onPosicao: () => undefined,
    onFim: () => undefined,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
    ...extra,
  }
}

/** O `span` cujo texto É `t` (o nó do `Text`, não um ancestral que o contém). */
function noDeTexto(t: string | RegExp): HTMLElement {
  const todos = [...document.querySelectorAll<HTMLElement>('span')]
  const achados = todos.filter((e) => {
    const x = (e.textContent ?? '').replace(/\s+/g, ' ').trim()
    return typeof t === 'string' ? x === t : t.test(x)
  })
  // o mais externo: o título tem `Text` aninhado (· artista · tipo) dentro dele
  const externo = achados.find((e) => !achados.some((o) => o !== e && o.contains(e)))
  if (externo === undefined) throw new Error(`sem nó de texto ${String(t)}`)
  return externo
}

function ancestralComum(a: HTMLElement, b: HTMLElement): HTMLElement {
  let x: HTMLElement | null = a
  while (x !== null && !x.contains(b)) x = x.parentElement
  if (x === null) throw new Error('sem ancestral comum')
  return x
}

/** Os filhos diretos de `pai` que contêm `e` — a "linha" em que ele está. */
function filhoQueContem(pai: HTMLElement, e: HTMLElement): HTMLElement {
  const f = [...pai.children].find((c) => c.contains(e))
  if (f === undefined) throw new Error('não é descendente')
  return f as HTMLElement
}

/** A barra superior: o menor ancestral comum da posição e do título. */
function barra(posicao: string, titulo: string | RegExp): { barra: HTMLElement; pos: HTMLElement; tit: HTMLElement } {
  const pos = noDeTexto(posicao)
  const tit = noDeTexto(titulo)
  return { barra: ancestralComum(pos, tit), pos, tit }
}

/** Os sete controles da base, na ordem de C (V1-PR3; Proposta A, div. 109). */
const BASE = ['auto-scroll', 'zoom-menos', 'zoom-mais', 'tema', 'indice', 'busca', 'sair'] as const

/** A base é a de C em qualquer faixa: os sete, na mesma ordem, no mesmo pai, com a altura de 96. */
function baseDeC(): void {
  const pai = exige('auto-scroll').parentElement as HTMLElement
  const ids = [...pai.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'))
  expect(ids).toEqual([...BASE])
  expect(estilo(pai).height).toBe(96)
}

/**
 * O que TODO estado do palco em B tem de mostrar: a barra de 88 com DUAS
 * linhas — a primeira com a posição e o nome da setlist, a segunda só com o
 * título · artista · tipo —, e a base de C.
 */
function barraDeB(posicao: string, titulo: string | RegExp): void {
  const { barra: b, pos, tit } = barra(posicao, titulo)
  expect(estilo(b).height).toBe(88)
  const linha1 = filhoQueContem(b, pos)
  const linha2 = filhoQueContem(b, tit)
  expect(linha1).not.toBe(linha2)
  expect([...b.children].indexOf(linha1)).toBeLessThan([...b.children].indexOf(linha2))
  expect(estilo(b).flexDirection).not.toBe('row')
  // linha 1: posição + setlist; linha 2: só o título (com artista e tipo dentro dele)
  expect(linha1.contains(noDeTexto('Ensaio de retrato'))).toBe(true)
  expect(linha2.contains(noDeTexto('Ensaio de retrato'))).toBe(false)
  expect((linha2.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe((tit.textContent ?? '').replace(/\s+/g, ' ').trim())
  // o título continua numa linha só, com reticência se não couber em 663
  expect(tit.getAttribute('data-numberoflines')).toBe('1')
  baseDeC()
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen

beforeAll(async () => {
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
})

beforeEach(() => {
  __reset()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  __janela()
  vi.restoreAllMocks()
})

// ----------------------------------------------------------------- faixa B

describe('N3-B-S3 — a barra superior de 88 em duas linhas (N3-D13)', () => {
  it('letra, 1ª: `1 DE 8` + setlist na linha 1; `Manhã de ensaio · Banda da fixture · Letra` na linha 2', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props()} />)
    barraDeB('1 DE 8', 'Manhã de ensaio · Banda da fixture · Letra')
  })

  it('a última (`8 DE 8`): a mesma barra', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props({ posicao: 8 })} />)
    barraDeB('8 DE 8', /^Manhã de ensaio/)
  })

  it('S3e (PDF não baixado, sem rede): a barra de duas linhas, e o ponto de sem rede na linha 1', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props({ posicao: 2, online: false })} />)
    await assentar(20)
    expect(achar('s3e')).not.toBeNull()
    barraDeB('2 DE 8', 'Partitura da fixture · Partitura')
  })

  it('avulsa (aberta pela busca): `AVULSA` na linha 1', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props({ avulsaContentId: LETRA.id })} />)
    barraDeB('AVULSA', /^Manhã de ensaio/)
  })

  it('placeholder (a música sumiu da biblioteca): `—` na linha 2', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props({ contentById: new Map() })} />)
    expect(achar('placeholder')).not.toBeNull()
    barraDeB('1 DE 8', '—')
  })

  it('com nota: a nota fica na linha 1, fora da linha do título', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...props({ setlist: setlistDe(8, 'capo 2') })} />)
    barraDeB('1 DE 8', /^Manhã de ensaio/)
    const { barra: b, pos } = barra('1 DE 8', /^Manhã de ensaio/)
    expect(filhoQueContem(b, pos).contains(noDeTexto('Nota: capo 2'))).toBe(true)
  })
})

// ----------------------------------------------------------------- faixa C (CP)

describe('C — a barra de 64 de uma linha, como hoje (a invariante em jsdom)', () => {
  for (const [nome, janela] of [['janela de C escrita', C], ['padrão do duplo', null]] as const) {
    it(`${nome}: posição, setlist e título lado a lado no mesmo nó de 64`, async () => {
      if (janela !== null) __janela(janela.w, janela.h)
      await montar(<StageScreen {...props({ setlist: setlistDe(8, 'capo 2') })} />)
      const { barra: b, pos, tit } = barra('1 DE 8', 'Manhã de ensaio · Banda da fixture · Letra')
      expect(estilo(b).height).toBe(64)
      expect(estilo(b).flexDirection).toBe('row')
      expect(pos.parentElement).toBe(b)
      expect(tit.parentElement).toBe(b)
      expect(noDeTexto('Ensaio de retrato').parentElement).toBe(b)
      expect(estilo(tit).textAlign).toBe('center')
      baseDeC()
    })
  }
})
