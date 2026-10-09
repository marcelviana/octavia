/**
 * QL-PR4 — QL-D56 `[Marcel, 2026-10-09]`: NENHUMA BORDA INVISÍVEL DE TOQUE FICA SOBRE UM CONTROLE. As bordas de 15 % do
 * palco (avançar e voltar às cegas, T1-R27) continuam valendo sobre o texto do corpo — a letra e o texto das notas —, mas
 * **a régua das notas, com o rótulo e a divisa, fica fora delas**: um toque em qualquer ponto da régua recolhe ou abre, e
 * nunca avança nem volta a música. O defeito: o julgamento do Marcel no Tab (div. 1233) — a divisa (ponta direita) e o
 * rótulo (ponta esquerda) caíam sob as bordas, desenhadas por cima do corpo.
 *
 * Entram ANTES do conserto (o rito): contra o código de antes, o toque na divisa e no rótulo pela borda TROCA de música.
 *
 * O duplo não tem geometria: a posição do toque na borda (`locationX/Y`, relativos a ela, como o RN entrega) vem do teste
 * (`tocarEm`), e a do bloco das notas também (`__medir`). Prova-se a conta que a tela faz; a geometria de verdade é do
 * aparelho (o toque com a mão, nas duas pontas).
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { __reset } from './fake-expo-file-system'
import { __limparArmazem } from './fake-async-storage'
import { __colunas, __janela, __medir, __rolar, caractereDoDuplo } from './fake-react-native'
import { achar, assentar, desmontar, exige, montar, tocar, tocarEm } from './tela'

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
const SL = 'dddddddd-1111-4222-8333-444455556666'
const B = { w: 711.1, h: 1053.8 }
const NOTA = 'Capo na 2.\nEntrar depois da contagem de quatro do metrônomo da fixture.'
const LETRA = Array.from({ length: 40 }, (_, i) => `linha ${i} da letra de fixture para rolar o palco`).join('\n')

const c = (id: string, notes: string | null): ContentDTO =>
  ({ id, title: `QL4 ${id}`, artist: null, album: null, content_type: 'Lyrics', content_data: { lyrics: LETRA }, file_url: null, updated_at: T0, notes }) as ContentDTO

const IDS = ['b1', 'b2', 'b3']
const setlist: SetlistDTO = {
  id: SL, name: 'Ensaio das bordas', performance_date: null, venue: null, updated_at: T0,
  setlist_songs: IDS.map((cid, i) => ({ id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: cid, position: i + 1, notes: null, content: null })),
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen
let P: typeof import('../src/preferencias')
let onPosicao: ReturnType<typeof vi.fn<(p: number) => void>>
let onFim: ReturnType<typeof vi.fn<() => void>>

beforeAll(async () => {
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
  P = await import('../src/preferencias')
})

beforeEach(async () => {
  __reset()
  __limparArmazem()
  await P.definirNotasRecolhidas(false)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  onPosicao = vi.fn<(p: number) => void>()
  onFim = vi.fn<() => void>()
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  __janela()
  __colunas()
  vi.restoreAllMocks()
})

/** O palco na posição 2 de 3 (a do meio: avançar e voltar trocam de música), a música COM nota. */
function props(): StageScreenProps {
  return {
    setlist,
    contentById: new Map(IDS.map((id) => [id, c(id, NOTA)])),
    posicao: 2,
    avulsaContentId: null,
    online: true,
    onPosicao,
    onFim,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
  }
}

/** A largura do `meio` que o duplo dá em `n` colunas (a conta do `__colunas`), e a borda de 15 % dela. */
const larguraDoMeio = (n: number): number => (n + 0.5) * caractereDoDuplo(22) + 64
const borda = (n: number): number => Math.max(larguraDoMeio(n) * 0.15, 48)

/** O bloco das notas no topo do corpo: y 24 (o respiro de 32 menos os 8 que ele sobe), a régua de 48 por cima. */
const REGUA = { topo: 24, base: 24 + 48 }

async function palco(n: number, janela?: { w: number; h: number }): Promise<void> {
  if (janela !== undefined) __janela(janela.w, janela.h)
  __colunas(n)
  await montar(<StageScreen {...props()} />)
  await assentar(10)
  __medir('notas', { y: REGUA.topo, height: 163 })
  await assentar(10)
}

const abertas = (): boolean => achar('notas-texto') !== null
const naoTrocou = (): void => {
  expect(onPosicao, 'a música trocou (avançou ou voltou)').not.toHaveBeenCalled()
  expect(onFim).not.toHaveBeenCalled()
}

describe('QL-D56 — a régua das notas fica fora das bordas de toque (o achado do Tab, div. 1233)', () => {
  it('B: um toque na DIVISA (a ponta direita da régua, sob a borda de avançar) recolhe — e não avança', async () => {
    await palco(48, B)
    expect(abertas()).toBe(true)
    await tocarEm('borda-avancar', borda(48) - 32 - 10, REGUA.topo + 24) // a divisa: 20 dp antes do respiro direito de 32
    naoTrocou()
    expect(abertas(), 'o toque na divisa não recolheu as notas').toBe(false)
  })

  it('B: um toque no RÓTULO (a ponta esquerda, sob a borda de voltar) abre — e não volta', async () => {
    await P.definirNotasRecolhidas(true)
    await palco(48, B)
    expect(abertas()).toBe(false)
    await tocarEm('borda-voltar', 32 + 40, REGUA.topo + 24) // dentro de "NOTAS DA MÚSICA"
    naoTrocou()
    expect(abertas(), 'o toque no rótulo não abriu as notas').toBe(true)
  })

  it('B: um toque no MEIO da régua (fora das bordas) recolhe e abre, como sempre', async () => {
    await palco(48, B)
    await tocar('notas-regua')
    expect(abertas()).toBe(false)
    await tocar('notas-regua')
    expect(abertas()).toBe(true)
    naoTrocou()
  })

  it('C: as duas pontas, na borda de 15 % de C', async () => {
    await palco(80)
    await tocarEm('borda-avancar', borda(80) - 32 - 10, REGUA.topo + 10)
    naoTrocou()
    expect(abertas()).toBe(false)
    await tocarEm('borda-voltar', 32 + 5, REGUA.base - 2)
    expect(abertas()).toBe(true)
    naoTrocou()
  })

  it('nas duas alturas da régua: a linha de cima e a de baixo dos 48 ainda são régua', async () => {
    await palco(48, B)
    await tocarEm('borda-avancar', borda(48) - 40, REGUA.topo + 0.5)
    naoTrocou()
    expect(abertas()).toBe(false)
    await tocarEm('borda-avancar', borda(48) - 40, REGUA.base - 0.5)
    expect(abertas()).toBe(true)
    naoTrocou()
  })

  it('as bordas CONTINUAM valendo sobre o texto: abaixo da régua (o texto das notas, a letra), avançam e voltam', async () => {
    await palco(48, B)
    await tocarEm('borda-avancar', 20, REGUA.base + 30) // o texto das notas
    expect(onPosicao).toHaveBeenLastCalledWith(3)
    await tocarEm('borda-voltar', 20, 600) // a letra
    expect(onPosicao).toHaveBeenLastCalledWith(1)
    expect(abertas(), 'o toque no texto mexeu nas notas').toBe(true)
  })

  it('no respiro de 32 ao lado da régua (fora dela), a borda segue valendo', async () => {
    await palco(48, B)
    await tocarEm('borda-voltar', 10, REGUA.topo + 24)
    expect(onPosicao).toHaveBeenLastCalledWith(1)
    expect(abertas()).toBe(true)
  })

  it('com o corpo rolado, a régua sai do topo, e a mesma altura da tela volta a ser texto: a borda avança', async () => {
    await palco(48, B)
    __rolar(200) // a régua (24–72 no conteúdo) passa a −176…−128 na tela
    await assentar(10)
    await tocarEm('borda-avancar', 20, REGUA.topo + 24)
    expect(onPosicao).toHaveBeenLastCalledWith(3)
    expect(abertas()).toBe(true)
  })

  it('rolado pouco, a régua segue na tela mais acima, e o toque nela continua sendo régua', async () => {
    await palco(48, B)
    __rolar(20) // a régua em 4…52 na tela
    await assentar(10)
    await tocarEm('borda-avancar', borda(48) - 40, 30)
    naoTrocou()
    expect(abertas()).toBe(false)
    naoTrocou()
  })

  it('sem nota não há régua: a borda na mesma altura avança, como sempre', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await montar(<StageScreen {...props()} contentById={new Map(IDS.map((id) => [id, c(id, null)]))} />)
    await assentar(10)
    expect(achar('notas')).toBeNull()
    await tocarEm('borda-avancar', 20, REGUA.topo + 24)
    expect(onPosicao).toHaveBeenLastCalledWith(3)
  })

  it('o estado do toque pela borda é o mesmo estado lembrado (o mesmo das outras músicas)', async () => {
    await palco(48, B)
    await tocarEm('borda-avancar', borda(48) - 40, REGUA.topo + 24)
    naoTrocou()
    expect(P.notasRecolhidas()).toBe(true)
    expect(exige('notas-regua').getAttribute('aria-expanded')).toBe('false')
  })
})
