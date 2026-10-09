/**
 * QL-PR4 — QL-D58 `[Marcel, 2026-10-09]` (div. 1230): AS NOTAS DA MÚSICA APARECEM TAMBÉM QUANDO O CORPO NÃO É TEXTO —
 * na Partitura (o PDF) e nos estados sem corpo de texto (o formato que o app ainda não mostra, o arquivo não baixado, o
 * baixando, o item sem corpo). A mesma régua, a mesma divisa, o mesmo estado lembrado e a mesma QL-D56 (a régua fora das
 * bordas). No topo da área, ACIMA do PDF ou da mensagem do estado: o PDF segue com as mesmas props (a paginação não
 * muda), as bordas são os mesmos nós, e nenhum controle fica sob as notas (o *Baixar* do S3e segue abaixo delas).
 * **Sem nota, a árvore é a de hoje** (o S3e, o formato e o PDF continuam filhos diretos do `meio`).
 *
 * Entram ANTES do código (o rito): contra o código de antes, nenhum estado sem texto mostra as notas.
 *
 * O S3d (o PDF pronto) não se alcança no duplo (o arquivo não baixa no `jsdom`); ele passa pelo MESMO invólucro do
 * arquivo que o S3e e o baixando (`Arquivo`), e se mede no aparelho.
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { __reset } from './fake-expo-file-system'
import { __limparArmazem } from './fake-async-storage'
import { __colunas, __janela, __medir, caractereDoDuplo } from './fake-react-native'
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
const SL = 'eeeeeeee-1111-4222-8333-444455556666'
const B = { w: 711.1, h: 1053.8 }
const NOTA = 'Capo na 2.\nEntrar depois da contagem de quatro do metrônomo da fixture.'
const ARQ = 'https://host/storage/v1/object/public/content-files/'

const sheet = (id: string, arquivo: string, notes: string | null): ContentDTO =>
  ({ id, title: `QL4 ${id}`, artist: null, album: null, content_type: 'Sheet', content_data: null, file_url: ARQ + arquivo, updated_at: T0, notes }) as ContentDTO
const semCorpo = (id: string, notes: string | null): ContentDTO =>
  ({ id, title: `QL4 ${id}`, artist: null, album: null, content_type: 'Lyrics', content_data: null, file_url: null, updated_at: T0, notes }) as ContentDTO

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen
let P: typeof import('../src/preferencias')
let onPosicao: ReturnType<typeof vi.fn<(p: number) => void>>

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
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  __janela()
  __colunas()
  vi.restoreAllMocks()
})

/** O palco na posição 2 de 3 com a música `c` (as outras duas, Letras sem nota). */
function props(c: ContentDTO, online = true): StageScreenProps {
  const outra = (id: string): ContentDTO =>
    ({ id, title: id, artist: null, album: null, content_type: 'Lyrics', content_data: { lyrics: 'linha' }, file_url: null, updated_at: T0, notes: null }) as ContentDTO
  const lista = [outra('x1'), c, outra('x3')]
  const setlist: SetlistDTO = {
    id: SL, name: 'Ensaio fora do texto', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: lista.map((m, i) => ({ id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: m.id, position: i + 1, notes: null, content: null })),
  }
  return {
    setlist, contentById: new Map(lista.map((m) => [m.id, m])), posicao: 2, avulsaContentId: null, online,
    onPosicao, onFim: () => undefined, onIndice: () => undefined, onBusca: () => undefined, onSair: () => undefined,
    onArquivosMudaram: () => undefined,
  }
}

async function palco(p: StageScreenProps): Promise<void> {
  await montar(<StageScreen {...p} />)
  await assentar(20)
}

const paragrafos = (): string[] => [...exige('notas-texto').children].map((x) => x.textContent ?? '')
/** As notas vêm ANTES do nó do estado, na ordem do desenho. */
const antes = (a: string, b: string): boolean => (exige(a).compareDocumentPosition(exige(b)) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

describe('QL-D58 — as notas quando o corpo não é texto', () => {
  it('o arquivo não baixado (S3e, sem rede): as notas acima da mensagem, com o Baixar abaixo delas', async () => {
    await palco(props(sheet('p1', 'p.pdf', NOTA), false))
    expect(achar('s3e')).not.toBeNull()
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(antes('notas', 's3e')).toBe(true)
    expect(antes('notas', 'baixar')).toBe(true)
  })

  it('o baixando (o PDF ainda vindo): as notas acima da mensagem', async () => {
    await palco(props(sheet('p2', 'p.pdf', NOTA), true))
    const estado = achar('s3-baixando') !== null ? 's3-baixando' : 's3e'
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(antes('notas', estado)).toBe(true)
  })

  it('o formato que o app ainda não mostra (.jpg): as notas acima do placeholder', async () => {
    await palco(props(sheet('p3', 'partitura-escaneada.jpg', NOTA)))
    expect(achar('s3-formato')).not.toBeNull()
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(antes('notas', 's3-formato')).toBe(true)
  })

  it('o item sem corpo (o placeholder do motivo): as notas acima do placeholder', async () => {
    await palco(props(semCorpo('p4', NOTA)))
    expect(achar('placeholder')).not.toBeNull()
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(antes('notas', 'placeholder')).toBe(true)
  })

  it('o mesmo estado lembrado: recolhidas numa Letra, recolhidas no S3e', async () => {
    await P.definirNotasRecolhidas(true)
    await palco(props(sheet('p1', 'p.pdf', NOTA), false))
    expect(achar('notas-regua')).not.toBeNull()
    expect(achar('notas-texto')).toBeNull()
    await tocar('notas-regua')
    expect(paragrafos()).toEqual(NOTA.split('\n'))
    expect(P.notasRecolhidas()).toBe(false)
  })

  it('a mesma QL-D56 fora do texto: a divisa sob a borda de avançar recolhe, e não avança', async () => {
    __janela(B.w, B.h)
    __colunas(48)
    await palco(props(sheet('p1', 'p.pdf', NOTA), false))
    __medir('notas', { y: 24, height: 130 })
    await assentar(10)
    const borda = Math.max(((48 + 0.5) * caractereDoDuplo(22) + 64) * 0.15, 48)
    await tocarEm('borda-avancar', borda - 42, 48)
    expect(onPosicao, 'a música trocou').not.toHaveBeenCalled()
    expect(achar('notas-texto')).toBeNull()
    await tocarEm('borda-avancar', 20, 400) // fora da régua: a borda avança, como sempre
    expect(onPosicao).toHaveBeenLastCalledWith(3)
  })

  it.each([
    ['o S3e', () => props(sheet('p1', 'p.pdf', null), false), 's3e'],
    ['o formato', () => props(sheet('p3', 'partitura-escaneada.jpg', null)), 's3-formato'],
  ])('sem nota (%s): nada, e o nó do estado continua filho direto da área do corpo, como hoje', async (_r, p, id) => {
    __colunas(48) // o `meio` medido: as bordas existem, e são irmãs do nó do estado
    await palco(p())
    expect(achar('notas')).toBeNull()
    const no = exige(id)
    // como hoje: o nó do estado (ou o invólucro do PDF) fica direto no `meio` — nenhum invólucro novo
    const meio = no.closest('[data-testid="s3e"], [data-testid="s3-formato"]')!.parentElement!
    expect(meio.querySelector(':scope > [data-testid="borda-avancar"]')).not.toBeNull()
  })
})
