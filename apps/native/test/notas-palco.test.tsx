/**
 * QL-PR4 — AS NOTAS DA MÚSICA NO PALCO, A DIVISA, O ESTADO LEMBRADO E A ÂNCORA COM AS NOTAS (E EM V)
 * (`docs/native/QL-REQUISITOS.md` §3, a PR-4; QL-R14…QL-R17, QL-R13; QL-D30, QL-D31, QL-D32, QL-D39, QL-D49, QL-D52).
 * Entram ANTES do código que medem (o rito): contra a `main` o palco não tem notas, o `preferencias.ts` não existe e o
 * leitor não exporta a âncora com o começo do corpo.
 *
 * Cinco grupos:
 *   - AS NOTAS (QL-R14): no topo do corpo, antes da letra, dentro da rolagem; a régua *notas da música*, o fio e a
 *     divisa; um parágrafo por linha escrita, sem passar pelo `quebrar` (a linha longa é a mesma cadeia, quebra como
 *     texto de UI); o tamanho 16 × zoom ÷ 22, o rótulo em 12; as tintas do tema; **sem nota, nada** — nem a régua, e o
 *     corpo é o de hoje; a nota da posição continua na barra; no palco com setlist e no avulso; em V, como estão;
 *   - O TOQUE NA RÉGUA (QL-R15): recolhe e abre; a divisa e o estado expandido acompanham;
 *   - O ESTADO LEMBRADO (QL-R16, QL-D39): a chave gravada ao recolher e apagada ao abrir; vale para todas as músicas;
 *     gravar, reabrir (o módulo de novo, com o armazenamento de antes) e ler; o armazenamento que falha não derruba;
 *   - A ÂNCORA COM AS NOTAS (QL-R13; a nota do fim da QL-PR3): a conta soma onde o corpo começa; com a marca de 32 ainda
 *     nas notas, a rolagem volta ao topo (QL-D52);
 *   - A ÂNCORA EM V (QL-D49): ao girar (C ↔ B), a lógica da marca volta à marca; em B contada a partir do começo do corpo
 *     dentro da rolagem que ele divide com os *Detalhes*; com a marca nos *Detalhes*, o topo (QL-D52).
 *
 * O "reabrir o app" da tela inteira (o palco que abre com as notas recolhidas, o zoom e o tema no padrão) está no
 * `notas-reabrir.test.tsx`: um arquivo de teste é um processo novo, com o armazenamento já gravado.
 *
 * O que NÃO medem: geometria (a régua de 48, o fio, a altura das notas, a divisa de 20 desenhada são do dump e da
 * captura, no aparelho); a rolagem de verdade (o duplo registra o que a tela PEDE). Texto: só o inventado pelo projeto —
 * a nota do `QL-BRIEF.md` §5.4 (regra 10).
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { quebrar, type ContentDTO, type SetlistDTO } from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { __reset } from './fake-expo-file-system'
import { __armazem, __falharArmazem, __limparArmazem } from './fake-async-storage'
import { __colunas, __janela, __limparRolagens, __medir, __rolar, __rolagens, caractereDoDuplo } from './fake-react-native'
import { achar, assentar, desmontar, estilo, exige, montar, paths, rerender, tocar } from './tela'
import { bar, colors, size } from '../src/theme'

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
const SL = 'bbbbbbbb-1111-4222-8333-444455556666'
const B = { w: 711.1, h: 1053.8 }
const lh = (zoom: number): number => zoom * 1.55

/** A nota do `QL-BRIEF.md` §5.4 — várias linhas, uma longa (texto do projeto). */
const NOTA = [
  'Capo na 2.',
  'Entrar depois da contagem de quatro do metrônomo da fixture.',
  'Segunda voz só no refrão; no fim, segurar o último acorde até a luz da sala apagar de vez.',
].join('\n')

/** Uma linha inventada de `n` colunas, de palavras curtas. */
const linhaDe = (n: number, semente = 'verso'): string => `${semente} `.repeat(Math.ceil(n / (semente.length + 1)) + 1).slice(0, n).trimEnd().padEnd(n, 'x')
/** A Letra longa: 30 linhas, as pares de 110 colunas, as ímpares curtas, uma vazia a cada 7 (a do `leitor-quebra`). */
const LETRA_LONGA = Array.from({ length: 30 }, (_, i) => (i % 7 === 6 ? '' : i % 2 === 0 ? linhaDe(110, `linha${i}`) : linhaDe(30, `curta${i}`))).join('\n')

const conteudo = (id: string, corpo: string, notes: string | null, tipo: ContentDTO['content_type'] = 'Lyrics'): ContentDTO => {
  const chave = tipo === 'Chords' ? 'chords' : tipo === 'Tab' ? 'tablature' : 'lyrics'
  return { id, title: `QL4 ${id}`, artist: null, album: null, content_type: tipo, content_data: { [chave]: corpo }, file_url: null, updated_at: T0, notes } as ContentDTO
}

function setlistCom(ids: string[], notaDaPosicao: string | null = null): SetlistDTO {
  return {
    id: SL, name: 'Ensaio das notas', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: ids.map((cid, i) => ({ id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: cid, position: i + 1, notes: i === 0 ? notaDaPosicao : null, content: null })),
  }
}

function propsDo(cs: ContentDTO[], notaDaPosicao: string | null = null): StageScreenProps {
  return {
    setlist: setlistCom(cs.map((c) => c.id), notaDaPosicao),
    contentById: new Map(cs.map((c) => [c.id, c])),
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

/** Os parágrafos das notas, na ordem — cada `Text` filho do texto das notas. */
function paragrafos(): string[] {
  return [...exige('notas-texto').children].map((p) => p.textContent ?? '')
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen
let VisualizacaoScreen: typeof import('../src/screens/VisualizacaoScreen').VisualizacaoScreen
let L: typeof import('../src/screens/Leitor')
let P: typeof import('../src/preferencias')

beforeAll(async () => {
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
  VisualizacaoScreen = (await import('../src/screens/VisualizacaoScreen')).VisualizacaoScreen
  L = await import('../src/screens/Leitor')
  P = await import('../src/preferencias')
})

beforeEach(async () => {
  __reset()
  __limparRolagens()
  __limparArmazem()
  await P.definirNotasRecolhidas(false)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  __janela()
  __colunas()
  vi.restoreAllMocks()
})

async function palco(p: StageScreenProps): Promise<void> {
  await montar(<StageScreen {...p} />)
  await assentar(10)
}

// ──────────────────────────────────────────────────────────────────────────────── as notas (QL-R14)

describe('QL-R14 — as notas da música no topo do corpo', () => {
  it('com nota: o bloco é o PRIMEIRO filho da rolagem do corpo, antes do corpo; a régua, o rótulo, a divisa aberta e um parágrafo por linha', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    const notas = exige('notas')
    const rolagem = notas.parentElement!
    expect(rolagem.firstElementChild, 'as notas vêm antes de tudo no corpo').toBe(notas)
    expect(rolagem.contains(exige('corpo')), 'as notas e o corpo na MESMA rolagem: rolam juntos').toBe(true)
    const regua = exige('notas-regua')
    expect(regua.getAttribute('aria-label')).toBe('notas da música')
    expect(regua.getAttribute('aria-expanded')).toBe('true')
    expect(regua.textContent).toBe('notas da música')
    expect(paths('notas-regua'), 'a divisa aberta (para cima)').toEqual(['M5.5 15.25L12 8.75l6.5 6.5'])
    expect(paragrafos()).toEqual(NOTA.split('\n'))
  })

  it('a linha longa NÃO passa pelo quebrar: o parágrafo é a linha inteira, mesmo em 26 colunas (quebra como texto de UI)', async () => {
    __janela(B.w, B.h)
    __colunas(26)
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    const longa = NOTA.split('\n')[2]!
    expect(longa.length).toBeGreaterThan(26)
    expect(paragrafos()[2]).toBe(longa)
    for (const p of paragrafos()) expect(p).not.toContain('\n')
    // o corpo, ao lado, quebra (a prova de que as colunas estavam lá)
    expect(exige('corpo').textContent).toBe(quebrar(LETRA_LONGA, 'Lyrics', 26).map((l) => l.texto).join('\n'))
  })

  it('o tamanho acompanha o zoom (QL-D32): 16 × zoom ÷ 22, entrelinha 1,55; o rótulo da régua fica em 12', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    const tam = (): number => estilo(exige('notas-texto').firstElementChild as HTMLElement).fontSize as number
    const ent = (): number => estilo(exige('notas-texto').firstElementChild as HTMLElement).lineHeight as number
    expect(tam()).toBeCloseTo(16)
    expect(ent()).toBeCloseTo(16 * 1.55)
    expect(L.tamanhoDasNotas(22)).toBeCloseTo(16)
    for (const [z, t] of [[18, 13.09], [26, 18.91], [32, 23.27], [40, 29.09]] as const) expect(L.tamanhoDasNotas(z)).toBeCloseTo(t, 1)
    await tocar('zoom-mais')
    expect(tam()).toBeCloseTo((16 * 26) / 22)
    for (let i = 0; i < 2; i++) await tocar('zoom-mais')
    expect(tam()).toBeCloseTo((16 * 40) / 22)
    expect(ent()).toBeCloseTo(((16 * 40) / 22) * 1.55)
    const rotulo = exige('notas-regua').querySelector('span') as HTMLElement
    expect(estilo(rotulo).fontSize).toBe(size.labelSmall)
    expect(size.labelSmall).toBe(12)
  })

  it('as tintas do tema (QL-R12): o texto em text, o rótulo em muted, o fio em line — e só elas trocam no claro', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    const ler = (): { texto: unknown; rotulo: unknown; fio: unknown } => ({
      texto: estilo(exige('notas-texto').firstElementChild as HTMLElement).color,
      rotulo: estilo(exige('notas-regua').querySelector('span') as HTMLElement).color,
      fio: estilo(exige('notas')).borderBottomColor,
    })
    expect(ler()).toEqual({ texto: colors.dark.text, rotulo: colors.dark.muted, fio: colors.dark.line })
    await tocar('tema')
    expect(ler()).toEqual({ texto: colors.light.text, rotulo: colors.light.muted, fio: colors.light.line })
  })

  it.each([
    ['null', null],
    ['vazia', ''],
    ['só espaço e quebra', '  \n \n'],
  ])('sem nota (%s): nada — nem a régua —, e o corpo é o primeiro filho da rolagem, como hoje', async (_r, notes) => {
    await palco(propsDo([conteudo('n0', LETRA_LONGA, notes)]))
    expect(achar('notas')).toBeNull()
    expect(achar('notas-regua')).toBeNull()
    const corpo = exige('corpo')
    const rolagemHorizontal = corpo.parentElement!
    expect(rolagemHorizontal.parentElement!.firstElementChild).toBe(rolagemHorizontal)
  })

  it('a nota DA POSIÇÃO continua na barra de cima, e as notas da música no corpo — uma não vira a outra', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)], 'entrar só no segundo verso'))
    expect(document.body.textContent).toContain('Nota: entrar só no segundo verso')
    expect(exige('notas').textContent).not.toContain('segundo verso')
    expect(paragrafos()).toEqual(NOTA.split('\n'))
  })

  it('no palco avulso (sem hospedeira) também', async () => {
    const c = conteudo('n1', LETRA_LONGA, NOTA)
    await palco({ ...propsDo([c]), setlist: null, avulsaContentId: c.id, origemDoAvulso: 'biblioteca' })
    expect(paragrafos()).toEqual(NOTA.split('\n'))
  })

  it('na Tab e na Cifra as notas também ficam no topo do corpo', async () => {
    const tab = ['e', 'B', 'G', 'D', 'A', 'E'].map((c) => `${c}|${'-'.repeat(40)}`).join('\n')
    await palco(propsDo([conteudo('t1', tab, NOTA, 'Tab')]))
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    desmontar()
    await palco(propsDo([conteudo('c1', 'Am  F\nCada janela acesa', NOTA, 'Chords')]))
    expect(paragrafos()).toEqual(NOTA.split('\n'))
  })

  it('em V as notas continuam onde estão (nos Detalhes), e o corpo de V não ganha o bloco do palco', async () => {
    await montar(<VisualizacaoScreen content={conteudo('n1', LETRA_LONGA, NOTA)} online onVoltar={() => undefined} onTocar={() => undefined} onArquivosMudaram={() => undefined} />)
    await assentar(10)
    expect(exige('view-notas').textContent).toContain('Capo na 2.')
    expect(achar('notas')).toBeNull()
    expect(achar('notas-regua')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────── o toque na régua (QL-R15)

describe('QL-R15 — um toque na régua recolhe; outro abre', () => {
  it('recolhe: some o texto, fica a régua com a divisa para baixo e o estado expandido falso; abre de novo', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    await tocar('notas-regua')
    expect(achar('notas-texto')).toBeNull()
    expect(exige('notas-regua').getAttribute('aria-expanded')).toBe('false')
    expect(paths('notas-regua'), 'a divisa recolhida (para baixo)').toEqual(['M5.5 8.75L12 15.25l6.5-6.5'])
    expect(exige('corpo')).toBeTruthy()
    await tocar('notas-regua')
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(exige('notas-regua').getAttribute('aria-expanded')).toBe('true')
  })

  it('o estado vale para todas as músicas: recolhidas na 1, recolhidas na 2', async () => {
    const a = conteudo('n1', LETRA_LONGA, NOTA)
    const b = conteudo('n2', LETRA_LONGA, 'Outra nota da fixture.')
    const p = propsDo([a, b])
    await palco(p)
    await tocar('notas-regua')
    await rerender(<StageScreen {...p} posicao={2} />)
    await assentar(10)
    expect(achar('notas-texto')).toBeNull()
    expect(exige('notas-regua').getAttribute('aria-expanded')).toBe('false')
  })

  it('reabrir o PALCO (sair e entrar de novo) volta como estava', async () => {
    const p = propsDo([conteudo('n1', LETRA_LONGA, NOTA)])
    await palco(p)
    await tocar('notas-regua')
    desmontar()
    await palco(p)
    expect(achar('notas-texto')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────── o estado lembrado (QL-R16, QL-D39)

describe('QL-R16 / QL-D39 — o estado recolhido gravado no aparelho', () => {
  it('a chave é declarada: `octavia:palco:notas-recolhidas`', () => {
    expect(P.CHAVE_NOTAS_RECOLHIDAS).toBe('octavia:palco:notas-recolhidas')
  })

  it('recolher GRAVA a chave ("1"); abrir a APAGA (aberta é o padrão, e o aparelho volta ao que era)', async () => {
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    expect(__armazem().has(P.CHAVE_NOTAS_RECOLHIDAS)).toBe(false)
    await tocar('notas-regua')
    await assentar(0)
    expect(__armazem().get(P.CHAVE_NOTAS_RECOLHIDAS)).toBe('1')
    await tocar('notas-regua')
    await assentar(0)
    expect(__armazem().has(P.CHAVE_NOTAS_RECOLHIDAS)).toBe(false)
    expect(__armazem().size, 'nada além da chave das notas').toBe(0)
  })

  it('gravar, reabrir, ler: o módulo de novo (a memória do app perdida) lê o que foi gravado', async () => {
    await P.definirNotasRecolhidas(true)
    vi.resetModules()
    const reaberto = await import('../src/preferencias')
    expect(reaberto).not.toBe(P)
    await reaberto.preferenciasCarregadas
    expect(reaberto.notasRecolhidas()).toBe(true)
    await reaberto.definirNotasRecolhidas(false)
    vi.resetModules()
    const deNovo = await import('../src/preferencias')
    await deNovo.preferenciasCarregadas
    expect(deNovo.notasRecolhidas()).toBe(false)
  })

  it('o armazenamento que falha não derruba o palco: as notas abrem (o padrão) e o toque recolhe na tela', async () => {
    __falharArmazem(true)
    vi.resetModules()
    const reaberto = await import('../src/preferencias')
    await reaberto.preferenciasCarregadas
    expect(reaberto.notasRecolhidas()).toBe(false)
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    await tocar('notas-regua')
    await assentar(0)
    expect(achar('notas-texto')).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────────────────── a âncora com as notas (QL-R13)

describe('QL-R13 — a âncora com as notas acima do corpo: a conta soma onde o corpo começa', () => {
  const lh22 = lh(22)

  it('logicaNaMarca e yDaAncora: sem nada acima (início 0), as contas da QL-PR3', () => {
    const logicas = [0, 0, 1, 2, 2, 2, 3]
    for (const y of [lh22 - 1, 2 * lh22, 4 * lh22 + 3, 10_000]) expect(L.logicaNaMarca(logicas, y, lh22, 0)).toBe(L.logicaNoTopo(logicas, y, lh22))
    for (const g of [0, 1, 2, 3]) expect(L.yDaAncora(logicas, g, lh22, 0)).toBeCloseTo(L.yDaLogica(logicas, g, lh22))
  })

  it('a rolagem no topo fica no topo (nada rolado): null — no palco sem notas dá o mesmo 0 de antes', () => {
    const logicas = [0, 0, 1, 2]
    expect(L.logicaNaMarca(logicas, 0, lh22, 0)).toBeNull()
    expect(L.logicaNaMarca(logicas, 0.4, lh22, 0)).toBeNull()
    expect(L.yDaAncora(logicas, null, lh22, 0)).toBe(L.yDaLogica(logicas, 0, lh22))
  })

  it('com o corpo começando 176 abaixo: a lógica da marca e a rolagem que a põe na marca somam o início', () => {
    const logicas = [0, 0, 1, 2, 2, 2, 3]
    expect(L.logicaNaMarca(logicas, 176 + 2 * lh22, lh22, 176)).toBe(1)
    expect(L.yDaAncora(logicas, 2, lh22, 176)).toBeCloseTo(176 + 3 * lh22)
    expect(L.yDaAncora(logicas, 0, lh22, 176), 'a 1ª linha da letra na marca: as notas saem por cima').toBeCloseTo(176)
  })

  it('QL-D52: com a marca ainda nas notas, a lógica é null e a rolagem volta ao topo (0)', () => {
    const logicas = [0, 0, 1, 2]
    expect(L.logicaNaMarca(logicas, 0, lh22, 176)).toBeNull()
    expect(L.logicaNaMarca(logicas, 175, lh22, 176)).toBeNull()
    expect(L.logicaNaMarca(logicas, 176, lh22, 176)).toBe(0)
    expect(L.yDaAncora(logicas, null, lh22, 176)).toBe(0)
  })

  /** O começo do corpo com as notas medidas: o bloco em `y`, com `altura`, mais os 24 até a letra, menos o respiro. */
  const inicio = (y: number, altura: number): number => y + altura + 24 - 32

  async function palcoComNotasMedidas(alturaDasNotas: number): Promise<void> {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(propsDo([conteudo('n1', LETRA_LONGA, NOTA)]))
    __medir('notas', { y: 24, height: alturaDasNotas })
    await assentar(10)
  }

  it('um passo de zoom com as notas ABERTAS: a lógica 10 volta à marca, contando a altura NOVA das notas', async () => {
    await palcoComNotasMedidas(163)
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    __rolar(inicio(24, 163) + (em48.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    await tocar('zoom-mais')
    __medir('notas', { y: 24, height: 190 }) // as notas no 26 ficam mais altas
    await assentar(50)
    const em41 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 41))
    const pedidas = __rolagens()
    expect(pedidas.length).toBeGreaterThan(0)
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(inicio(24, 190) + em41.indexOf(10) * lh(26))
    expect(caractereDoDuplo(26) * 41).toBeLessThanOrEqual(B.w - 64)
  })

  it('um passo de zoom com as notas RECOLHIDAS: a mesma conta, com a altura da régua e do fio', async () => {
    await palcoComNotasMedidas(163)
    await tocar('notas-regua')
    __medir('notas', { y: 24, height: 57 })
    await assentar(10)
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    __rolar(inicio(24, 57) + (em48.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    await tocar('zoom-mais')
    await assentar(50)
    const em41 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 41))
    const pedidas = __rolagens()
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(inicio(24, 57) + em41.indexOf(10) * lh(26))
  })

  it('QL-D52 no palco: com a marca nas notas, o passo de zoom volta ao topo', async () => {
    await palcoComNotasMedidas(163)
    __rolar(60)
    __limparRolagens()
    await tocar('zoom-mais')
    __medir('notas', { y: 24, height: 190 })
    await assentar(50)
    const pedidas = __rolagens()
    expect(pedidas.length).toBeGreaterThan(0)
    expect(pedidas.every((y) => y === 0), JSON.stringify(pedidas)).toBe(true)
  })

  it('abrir o palco com notas não rola nada para longe do topo (a medida das notas não é uma mudança de desenho)', async () => {
    await palcoComNotasMedidas(163)
    expect(__rolagens().every((y) => y === 0), JSON.stringify(__rolagens())).toBe(true)
  })

  it('recolher e abrir no topo: a rolagem fica no topo', async () => {
    await palcoComNotasMedidas(163)
    __limparRolagens()
    await tocar('notas-regua')
    __medir('notas', { y: 24, height: 57 })
    await assentar(50)
    await tocar('notas-regua')
    __medir('notas', { y: 24, height: 163 })
    await assentar(50)
    expect(__rolagens().every((y) => y === 0), JSON.stringify(__rolagens())).toBe(true)
  })

  it('sem nota, a âncora é a da QL-PR3, byte a byte na conta', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(propsDo([conteudo('n0', LETRA_LONGA, null)]))
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    __rolar((em48.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    await tocar('zoom-mais')
    await assentar(50)
    const em41 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 41))
    const pedidas = __rolagens()
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(L.yDaLogica(em41, 10, lh(26)))
  })
})

// ──────────────────────────────────────────────────────────────────────────────── a âncora em V (QL-D49)

describe('QL-D49 — a âncora em V, ao girar (C ↔ B, 55 ↔ 48 colunas)', () => {
  const lh22 = lh(22)
  const c22 = caractereDoDuplo(22)
  const larguraB = (48 + 0.5) * c22 + 64

  async function v(c: ContentDTO): Promise<void> {
    await montar(<VisualizacaoScreen content={c} online onVoltar={() => undefined} onTocar={() => undefined} onArquivosMudaram={() => undefined} />)
    await assentar(10)
  }
  const elementoV = (c: ContentDTO): React.JSX.Element => (
    <VisualizacaoScreen content={c} online onVoltar={() => undefined} onTocar={() => undefined} onArquivosMudaram={() => undefined} />
  )

  it('C → B: a lógica da marca em 55 colunas volta à marca em 48, contada a partir do começo do corpo na rolagem com os Detalhes', async () => {
    const c = conteudo('v1', LETRA_LONGA, NOTA)
    __colunas(55)
    await v(c)
    const em55 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 55))
    __rolar((em55.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    __janela(B.w, B.h)
    __colunas(48)
    await rerender(elementoV(c))
    __medir('view-leitor', { y: 300, width: larguraB, height: 3000 })
    await assentar(50)
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    const pedidas = __rolagens()
    expect(pedidas.length, 'V não pediu rolagem nenhuma').toBeGreaterThan(0)
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(300 + bar.hairline + em48.indexOf(10) * lh22)
  })

  it('B → C: a lógica da marca (contada depois dos Detalhes) volta à marca no leitor de C, que começa no topo', async () => {
    const c = conteudo('v1', LETRA_LONGA, NOTA)
    __janela(B.w, B.h)
    __colunas(48)
    await v(c)
    __medir('view-leitor', { y: 300, width: larguraB, height: 3000 })
    await assentar(10)
    const em48 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 48))
    __rolar(300 + bar.hairline + (em48.indexOf(10) + 1) * lh22 + 4)
    __limparRolagens()
    __janela()
    __colunas(55)
    await rerender(elementoV(c))
    await assentar(50)
    const em55 = L.logicasDasVisuais(LETRA_LONGA, quebrar(LETRA_LONGA, 'Lyrics', 55))
    const pedidas = __rolagens()
    expect(pedidas.length).toBeGreaterThan(0)
    expect(pedidas[pedidas.length - 1]).toBeCloseTo(em55.indexOf(10) * lh22)
  })

  it('QL-D52 em V: com a marca nos Detalhes (B), o giro para C volta ao topo', async () => {
    const c = conteudo('v1', LETRA_LONGA, NOTA)
    __janela(B.w, B.h)
    __colunas(48)
    await v(c)
    __medir('view-leitor', { y: 300, width: larguraB, height: 3000 })
    await assentar(10)
    __rolar(120)
    __limparRolagens()
    __janela()
    __colunas(55)
    await rerender(elementoV(c))
    await assentar(50)
    const pedidas = __rolagens()
    expect(pedidas.length).toBeGreaterThan(0)
    expect(pedidas.every((y) => y === 0), JSON.stringify(pedidas)).toBe(true)
  })

  it('abrir V sem rolar e girar para B: os Detalhes continuam à vista (o topo)', async () => {
    const c = conteudo('v1', LETRA_LONGA, NOTA)
    __colunas(55)
    await v(c)
    __limparRolagens()
    __janela(B.w, B.h)
    __colunas(48)
    await rerender(elementoV(c))
    __medir('view-leitor', { y: 300, width: larguraB, height: 3000 })
    await assentar(50)
    // o giro É uma mudança de desenho: V pede a rolagem — e o pedido é o topo, não o corpo (sem esta linha, V sem
    // âncora nenhuma passava aqui por não pedir nada)
    expect(__rolagens().length, 'V não ancorou o giro').toBeGreaterThan(0)
    expect(__rolagens().every((y) => y === 0), JSON.stringify(__rolagens())).toBe(true)
  })
})
