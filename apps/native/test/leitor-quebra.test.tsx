/**
 * QL-PR3 — O LEITOR QUEBRA, NO PALCO E EM V (`docs/native/QL-REQUISITOS.md` §3, a PR-3; QL-R10, QL-R11, QL-R13, QL-R8;
 * QL-D43, QL-D45). Entram ANTES do código que medem (o rito): contra a `main` o arquivo nem importa — o `Leitor.tsx` não
 * exporta a conta das colunas nem a âncora, e o corpo é um `Text` só, sem quebra.
 *
 * Quatro grupos:
 *   - A PROTEÇÃO (QL-D43): o app só chama `quebrar` com a largura da coluna e a do caractere medidas e as colunas no
 *     domínio do contrato (inteiro > 2); até lá o corpo aparece como hoje. O palco e V não caem com a largura ainda não
 *     medida, medida em 0, nem com colunas fora do domínio;
 *   - O CORPO QUEBRADO no duplo (QL-R10): em B o corpo sai em linhas visuais que cabem na coluna e são uma quebra do
 *     texto (`ehQuebraDe`); em C, no zoom 22, a Letra de até 80 colunas sai IGUAL à de hoje, no mesmo nó (QL-R11); a Tab
 *     não quebra (QL-R8); o zoom refaz as colunas;
 *   - A EXCEÇÃO DA QL-D45: a linha da Cifra com um acorde maior que a coluna rola para o lado SÓ ELA (no par, as duas
 *     linhas do pedaço juntas, para o acorde continuar sobre a sílaba);
 *   - A ÂNCORA (QL-D18, QL-D37): ao mudar as colunas, o começo da linha lógica que estava no topo volta ao topo, a 32 da
 *     barra — as contas puras e o palco pedindo a rolagem certa num passo de zoom.
 *
 * O que NÃO medem: geometria (o duplo dá a largura pela mesma conta dos dois lados — `fake-react-native.tsx`,
 * `__colunas`); o giro, que o duplo não refaz (o `onLayout` sai uma vez, na montagem): o giro se prova pelas contas puras
 * e no aparelho. Texto: só inventado pelo projeto (regra 10).
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { quebrar, type ContentDTO, type SetlistDTO } from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { __reset } from './fake-expo-file-system'
import { __colunas, __janela, __larguraCrua, __limparRolagens, __rolagens, __rolar, caractereDoDuplo } from './fake-react-native'
import { assentar, desmontar, exige, montar, rerender, tocar } from './tela'
import { ehQuebraDe } from '../scripts/texto-logico.mjs'

vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: () => undefined }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }))
vi.mock('../src/prefetch', () => ({ prefetchDemanda: async () => undefined }))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-ql' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }))

const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
const B = { w: 711.1, h: 1053.8 }

/** Uma linha inventada de `n` colunas, de palavras curtas (o corte cai em espaço). */
const linhaDe = (n: number, semente = 'verso'): string => `${semente} `.repeat(Math.ceil(n / (semente.length + 1)) + 1).slice(0, n).trimEnd().padEnd(n, 'x')

/** A Letra longa: 30 linhas, as pares de 110 colunas (a forma da fixture do N3), as ímpares curtas, uma vazia a cada 7. */
const LETRA_LONGA = Array.from({ length: 30 }, (_, i) => (i % 7 === 6 ? '' : i % 2 === 0 ? linhaDe(110, `linha${i}`) : linhaDe(30, `curta${i}`))).join('\n')
/** A Letra de 77 colunas na maior linha — a forma do dado real (A-QL-16): no palco deitado, zoom 22, nada muda. */
const LETRA_77 = Array.from({ length: 12 }, (_, i) => linhaDe(i === 5 ? 77 : 20 + i * 4, `palavra${i}`)).join('\n')
/** A Cifra com seções e pares de 50 colunas. */
const CIFRA = ['[Verso]', 'Am            F              C', linhaDe(50, 'janela'), '', 'G   Am  F', linhaDe(40, 'acesa')].join('\n')
/** A Tab de 78 colunas, 6 linhas. */
const TAB = ['e', 'B', 'G', 'D', 'A', 'E'].map((c) => `${c}|${'-'.repeat(76)}`).join('\n')

const conteudo = (id: string, tipo: ContentDTO['content_type'], corpo: string): ContentDTO => {
  const chave = tipo === 'Chords' ? 'chords' : tipo === 'Tab' ? 'tablature' : 'lyrics'
  return { id, title: `QL ${id}`, artist: null, album: null, content_type: tipo, content_data: { [chave]: corpo }, file_url: null, updated_at: T0 }
}

function setlistCom(ids: string[]): SetlistDTO {
  return {
    id: SL, name: 'Ensaio da quebra', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: ids.map((cid, i) => ({ id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: cid, position: i + 1, notes: null, content: null })),
  }
}

function propsDo(c: ContentDTO): StageScreenProps {
  return {
    setlist: setlistCom([c.id]),
    contentById: new Map([[c.id, c]]),
    posicao: 1,
    avulsaContentId: null,
    online: true,
    onPosicao: () => undefined,
    onFim: () => undefined,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
  }
}

/** As linhas desenhadas sob o nó `corpo` — a leitura dos três instrumentos (um `Text` é um bloco partido no `\n`). */
function linhasDoCorpo(): string[] {
  const corpo = exige('corpo')
  const ler = (el: Element): string[] => (el.tagName === 'SPAN' ? (el.textContent ?? '').split('\n') : [...el.children].flatMap(ler))
  return ler(corpo)
}

/** O corpo é UM nó de texto dentro de uma rolagem horizontal — a forma da `main` (N4-PR8). */
function corpoNumNoSo(): boolean {
  const corpo = exige('corpo')
  return corpo.tagName === 'SPAN' && corpo.parentElement?.getAttribute('data-horizontal') === 'true'
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen
let VisualizacaoScreen: typeof import('../src/screens/VisualizacaoScreen').VisualizacaoScreen
let L: typeof import('../src/screens/Leitor')
let colunasDesenhadas: typeof import('@octavia/core').colunasDesenhadas

beforeAll(async () => {
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
  VisualizacaoScreen = (await import('../src/screens/VisualizacaoScreen')).VisualizacaoScreen
  L = await import('../src/screens/Leitor')
  colunasDesenhadas = (await import('@octavia/core')).colunasDesenhadas
})

beforeEach(() => {
  __reset()
  __limparRolagens()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  __janela()
  __colunas()
  vi.restoreAllMocks()
})

async function palco(c: ContentDTO): Promise<void> {
  await montar(<StageScreen {...propsDo(c)} />)
  await assentar(10)
}

async function visualizacao(c: ContentDTO): Promise<void> {
  await montar(<VisualizacaoScreen content={c} online onVoltar={() => undefined} onTocar={() => undefined} onArquivosMudaram={() => undefined} />)
  await assentar(10)
}

// ──────────────────────────────────────────────────────────────────────────────── a proteção (QL-D43)

describe('QL-D43 — a proteção: quebrar só com as duas medidas feitas e as colunas no domínio', () => {
  it('colunasDoLeitor: ⌊(contêiner − 2 × 32) ÷ caractere⌋, e null sem medida ou fora do domínio (inteiro > 2)', () => {
    const c22 = 1333.3 / 100
    expect(L.colunasDoLeitor(1137.8, c22)).toBe(80)
    expect(L.colunasDoLeitor(711.1, c22)).toBe(48)
    expect(L.colunasDoLeitor(797.8, c22)).toBe(55)
    expect(L.colunasDoLeitor(1137.8, 24)).toBe(44)
    expect(L.colunasDoLeitor(711.1, 24)).toBe(26)
    // ainda não medidas
    expect(L.colunasDoLeitor(null, c22)).toBeNull()
    expect(L.colunasDoLeitor(1137.8, null)).toBeNull()
    // medidas, mas sem coluna: 0, só o respiro, colunas ≤ 2
    expect(L.colunasDoLeitor(0, c22)).toBeNull()
    expect(L.colunasDoLeitor(64, c22)).toBeNull()
    expect(L.colunasDoLeitor(64 + 2.9 * c22, c22)).toBeNull()
    expect(L.colunasDoLeitor(64 + 3.1 * c22, c22)).toBe(3)
    // o caractere absurdo
    expect(L.colunasDoLeitor(1137.8, 0)).toBeNull()
    expect(L.colunasDoLeitor(1137.8, Number.NaN)).toBeNull()
    expect(L.colunasDoLeitor(Number.POSITIVE_INFINITY, c22)).toBeNull()
    expect(L.colunasDoLeitor(-10, c22)).toBeNull()
  })

  it('linhasDoLeitor: null sem colunas, sem corpo e na Tab — o corpo aparece como hoje', () => {
    expect(L.linhasDoLeitor(LETRA_LONGA, 'Lyrics', null)).toBeNull()
    expect(L.linhasDoLeitor(null, 'Lyrics', 48)).toBeNull()
    expect(L.linhasDoLeitor(TAB, 'Tab', 26)).toBeNull()
    expect(L.linhasDoLeitor(LETRA_LONGA, 'Lyrics', 48)?.some((l) => l.continuacao)).toBe(true)
  })

  const casos: [string, () => void][] = [
    ['a largura ainda não medida (nenhum onLayout)', () => __colunas()],
    ['o contêiner medido em 0', () => __larguraCrua(0)],
    ['o contêiner medido só com o respiro (64)', () => __larguraCrua(64)],
    ['2 colunas (fora do domínio)', () => __colunas(2)],
    ['0 colunas', () => __colunas(0)],
  ]

  it.each(casos)('o palco não cai e mostra o corpo como hoje — %s', async (_r, preparar) => {
    __janela(B.w, B.h)
    preparar()
    await palco(conteudo('l1', 'Lyrics', LETRA_LONGA))
    expect(linhasDoCorpo()).toEqual(LETRA_LONGA.split('\n'))
    expect(corpoNumNoSo()).toBe(true)
  })

  it.each(casos)('V não cai e mostra o corpo como hoje — %s', async (_r, preparar) => {
    __janela(B.w, B.h)
    preparar()
    await visualizacao(conteudo('l1', 'Lyrics', LETRA_LONGA))
    expect(linhasDoCorpo()).toEqual(LETRA_LONGA.split('\n'))
    expect(corpoNumNoSo()).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────── o corpo quebrado (QL-R10)

describe('QL-R10 — o corpo quebrado no duplo, no palco e em V', () => {
  it('o palco em B (48 colunas): toda linha cabe, há continuações, e o desenho é uma quebra do texto — num nó só', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(conteudo('l1', 'Lyrics', LETRA_LONGA))
    const linhas = linhasDoCorpo()
    const r = ehQuebraDe(linhas, LETRA_LONGA)
    expect(r.ok, r.motivo ?? '').toBe(true)
    expect(r.continuacoes).toBeGreaterThan(0)
    for (const l of linhas) expect(colunasDesenhadas(l), JSON.stringify(l)).toBeLessThanOrEqual(48)
    expect(linhas).toEqual(quebrar(LETRA_LONGA, 'Lyrics', 48).map((l) => l.texto))
    expect(corpoNumNoSo()).toBe(true)
  })

  it('o palco deitado, zoom 22 (80 colunas): a Letra de 77 colunas sai IGUAL à de hoje, no mesmo nó (A-QL-16)', async () => {
    __colunas(80)
    await palco(conteudo('l77', 'Lyrics', LETRA_77))
    expect(exige('corpo').textContent).toBe(LETRA_77)
    expect(corpoNumNoSo()).toBe(true)
  })

  it('a Tab não quebra (QL-R8): o texto inteiro, no mesmo nó, rolando para o lado, mesmo em 26 colunas', async () => {
    __colunas(26)
    await palco(conteudo('t1', 'Tab', TAB))
    expect(exige('corpo').textContent).toBe(TAB)
    expect(corpoNumNoSo()).toBe(true)
  })

  it('a Cifra em 26 colunas: o par recuado, o acorde sobre a sílaba (ehQuebraDe confere o mesmo começo)', async () => {
    __colunas(26)
    await palco(conteudo('c1', 'Chords', CIFRA))
    const r = ehQuebraDe(linhasDoCorpo(), CIFRA)
    expect(r.ok, r.motivo ?? '').toBe(true)
    expect(r.continuacoes).toBeGreaterThan(0)
    expect(linhasDoCorpo()).toEqual(quebrar(CIFRA, 'Chords', 26).map((l) => l.texto))
  })

  it('o zoom refaz as colunas: B no zoom 22 (48) → três passos → zoom 40 (26)', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(conteudo('l1', 'Lyrics', LETRA_LONGA))
    expect(linhasDoCorpo()).toEqual(quebrar(LETRA_LONGA, 'Lyrics', 48).map((l) => l.texto))
    for (let i = 0; i < 3; i++) await tocar('zoom-mais')
    expect(linhasDoCorpo()).toEqual(quebrar(LETRA_LONGA, 'Lyrics', 26).map((l) => l.texto))
  })

  it('V em C (55 colunas) e em B (48): o corpo quebrado, num nó só', async () => {
    __colunas(55)
    await visualizacao(conteudo('l1', 'Lyrics', LETRA_LONGA))
    expect(linhasDoCorpo()).toEqual(quebrar(LETRA_LONGA, 'Lyrics', 55).map((l) => l.texto))
    expect(corpoNumNoSo()).toBe(true)
    desmontar()
    __janela(B.w, B.h)
    __colunas(48)
    await visualizacao(conteudo('l1', 'Lyrics', LETRA_LONGA))
    expect(linhasDoCorpo()).toEqual(quebrar(LETRA_LONGA, 'Lyrics', 48).map((l) => l.texto))
  })
})

// ──────────────────────────────────────────────────────────────────────────────── a exceção da QL-D45

describe('QL-D45 — a linha da Cifra com o acorde maior que a coluna rola para o lado, só ela', () => {
  /** Os grupos do corpo: cada filho direto, com as linhas e se rola para o lado. */
  function grupos(): { linhas: string[]; rola: boolean }[] {
    const corpo = exige('corpo')
    expect(corpo.tagName, 'com a exceção o corpo é um contêiner de grupos').toBe('DIV')
    return [...corpo.children].map((g) => {
      const rola = g.getAttribute('data-horizontal') === 'true'
      const ler = (el: Element): string[] => (el.tagName === 'SPAN' ? (el.textContent ?? '').split('\n') : [...el.children].flatMap(ler))
      return { linhas: ler(g), rola }
    })
  }

  it('a linha de acordes sozinha: só ela numa rolagem horizontal; o resto em texto que não rola', async () => {
    const t = ['F#m7(11)/G#  Am', '', 'Cada janela acesa no fim da rua', 'Am  F'].join('\n')
    __colunas(9)
    await palco(conteudo('c2', 'Chords', t))
    const g = grupos()
    const rolam = g.filter((x) => x.rola)
    expect(rolam).toEqual([{ linhas: ['F#m7(11)/G#'], rola: true }])
    for (const x of g.filter((y) => !y.rola)) for (const l of x.linhas) expect(colunasDesenhadas(l)).toBeLessThanOrEqual(9)
    const r = ehQuebraDe(g.flatMap((x) => x.linhas), t)
    expect(r.ok, r.motivo ?? '').toBe(true)
  })

  it('no par: o pedaço de acordes e o de letra que passam da coluna rolam JUNTOS (o acorde fica sobre a sílaba)', async () => {
    const t = ['Am  F#m7(11)/G#', 'Cada janela acesa'].join('\n')
    __colunas(8)
    await palco(conteudo('c3', 'Chords', t))
    const rolam = grupos().filter((x) => x.rola)
    expect(rolam).toHaveLength(1)
    expect(rolam[0]!.linhas).toHaveLength(2)
    expect(rolam[0]!.linhas[0]).toContain('F#m7(11)/G#')
    const r = ehQuebraDe(grupos().flatMap((x) => x.linhas), t)
    expect(r.ok, r.motivo ?? '').toBe(true)
  })

  it('na Letra a mesma linha quebra como letra (QL-D22): nada rola, um nó só', async () => {
    const t = ['F#m7(11)/G#  Am', '', 'Cada janela acesa no fim da rua'].join('\n')
    __colunas(9)
    await palco(conteudo('l2', 'Lyrics', t))
    expect(corpoNumNoSo()).toBe(true)
    for (const l of linhasDoCorpo()) expect(colunasDesenhadas(l)).toBeLessThanOrEqual(9)
  })
})

// ──────────────────────────────────────────────────────────────────────────────── a âncora (QL-D18)

describe('QL-D18 / QL-R13 — a âncora: o começo da linha lógica do topo volta ao topo, a 32 da barra', () => {
  const lh22 = 22 * 1.55

  it('logicaNoTopo: a linha visual que cobre o topo da rolagem (o respiro de 32 conta), e a lógica dela', () => {
    const logicas = [0, 0, 1, 2, 2, 2, 3]
    expect(L.logicaNoTopo(logicas, 0, lh22)).toBe(0)
    expect(L.logicaNoTopo(logicas, 32 + lh22 - 0.5, lh22)).toBe(0)
    expect(L.logicaNoTopo(logicas, 32 + lh22, lh22)).toBe(0) // a 2ª linha visual: a continuação da lógica 0
    expect(L.logicaNoTopo(logicas, 32 + 2 * lh22, lh22)).toBe(1)
    expect(L.logicaNoTopo(logicas, 32 + 4 * lh22 + 3, lh22)).toBe(2)
    expect(L.logicaNoTopo(logicas, 10_000, lh22)).toBe(3)
  })

  it('yDaLogica: a rolagem que põe a 1ª linha visual da lógica a 32 do topo (o respiro), e 0 para a primeira', () => {
    const logicas = [0, 0, 1, 2, 2, 2, 3]
    expect(L.yDaLogica(logicas, 0, lh22)).toBe(0)
    expect(L.yDaLogica(logicas, 2, lh22)).toBeCloseTo(3 * lh22)
    expect(L.yDaLogica(logicas, 3, lh22)).toBeCloseTo(6 * lh22)
  })

  it('inicioDoBloco: na Cifra, a letra de um par ancora na linha de acordes de cima; na Letra, não', () => {
    expect(L.inicioDoBloco(CIFRA, 'Chords', 2)).toBe(1)
    expect(L.inicioDoBloco(CIFRA, 'Chords', 5)).toBe(4)
    expect(L.inicioDoBloco(CIFRA, 'Chords', 1)).toBe(1)
    expect(L.inicioDoBloco(CIFRA, 'Lyrics', 2)).toBe(2)
  })

  it('o giro C → B, nas contas: a lógica do topo em 80 colunas volta ao topo em 48', () => {
    const em80 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 80))
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    const v = em80.indexOf(10) + 1 // a continuação da linha lógica 10, no topo
    const y80 = 32 + v * lh22 + 4
    const logica = L.logicaNoTopo(em80, y80, lh22)
    expect(logica).toBe(10)
    expect(L.yDaLogica(em48, logica, lh22)).toBeCloseTo(em48.indexOf(10) * lh22)
  })

  it('o palco num passo de zoom: com a continuação da lógica 10 no topo, a rolagem pedida põe o começo da 10 a 32', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(conteudo('l1', 'Lyrics', LETRA_LONGA))
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    __rolar(32 + (em48.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    await tocar('zoom-mais')
    await assentar(10)
    const em41 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 41))
    const lh26 = 26 * 1.55
    const pedidas = __rolagens()
    expect(pedidas.length, 'o palco não pediu rolagem nenhuma').toBeGreaterThan(0)
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(em41.indexOf(10) * lh26)
    expect(caractereDoDuplo(26) * 41).toBeLessThanOrEqual(711.1 - 64)
  })

  it('a troca de música não ancora: volta ao topo (0), como hoje', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    const a = conteudo('l1', 'Lyrics', LETRA_LONGA)
    const b = conteudo('l2', 'Lyrics', LETRA_77)
    const p = { ...propsDo(a), setlist: setlistCom([a.id, b.id]), contentById: new Map([[a.id, a], [b.id, b]]) }
    await montar(<StageScreen {...p} />)
    await assentar(10)
    __rolar(500)
    __limparRolagens()
    await rerender(<StageScreen {...p} posicao={2} />)
    await assentar(10)
    expect(__rolagens().every((y) => y === 0)).toBe(true)
  })
})
