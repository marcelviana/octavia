/**
 * QL-PR4 (QL-D39, A-QL-18) — REABRIR O APP COM AS NOTAS RECOLHIDAS. Um arquivo de teste é um processo novo: aqui o
 * armazenamento do aparelho JÁ tem a chave que o `notas-palco.test.tsx` mostra o palco gravando ao recolher
 * (`octavia:palco:notas-recolhidas` = `"1"`), e o app abre do zero — o `preferencias.ts` lê na carga, o palco abre com
 * as notas recolhidas. **O zoom e o tema voltam ao padrão** (22, escuro): seguem como hoje, estado do palco (T1-R31,
 * T1-R32), e nada deles se grava. E o controle: sem a chave, as notas abrem.
 */
import './dev-flag'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { __armazem, __limparArmazem } from './fake-async-storage'
import { achar, assentar, desmontar, estilo, exige, montar, paths } from './tela'

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

const CHAVE = 'octavia:palco:notas-recolhidas'
const T0 = '2026-09-01T00:00:00.000+00:00'
const NOTA = 'Capo na 2.\nEntrar depois da contagem de quatro do metrônomo da fixture.'
const c: ContentDTO = {
  id: 'r1', title: 'QL4 reabrir', artist: null, album: null, content_type: 'Lyrics',
  content_data: { lyrics: 'Primeira linha da fixture\nSegunda linha da fixture' }, file_url: null, updated_at: T0, notes: NOTA,
} as ContentDTO
const sl: SetlistDTO = {
  id: 'cccccccc-1111-4222-8333-444455556666', name: 'Ensaio de reabrir', performance_date: null, venue: null, updated_at: T0,
  setlist_songs: [{ id: 'cccccccc-ss-1', setlist_id: 'cccccccc-1111-4222-8333-444455556666', content_id: 'r1', position: 1, notes: null, content: null }],
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen

beforeAll(async () => {
  // o que uma sessão anterior gravou ao recolher (o `notas-palco.test.tsx`: "recolher GRAVA a chave")
  __limparArmazem()
  const g = globalThis as { __octaviaArmazem?: { dados: Map<string, string> } }
  g.__octaviaArmazem!.dados.set(CHAVE, '1')
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
  await (await import('../src/preferencias')).preferenciasCarregadas
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  vi.restoreAllMocks()
})

const props = {
  setlist: sl, contentById: new Map([[c.id, c]]), posicao: 1, avulsaContentId: null, online: true,
  onPosicao: () => undefined, onFim: () => undefined, onIndice: () => undefined, onBusca: () => undefined,
  onSair: () => undefined, onArquivosMudaram: () => undefined,
}

describe('A-QL-18 — reabrir o app: as notas recolhidas; o zoom e o tema no padrão', () => {
  it('o palco abre com as notas RECOLHIDAS (a régua, a divisa para baixo, sem o texto)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    expect(__armazem().get(CHAVE)).toBe('1')
    await montar(<StageScreen {...props} />)
    await assentar(10)
    expect(achar('notas-texto')).toBeNull()
    expect(exige('notas-regua').getAttribute('aria-expanded')).toBe('false')
    expect(paths('notas-regua')).toEqual(['M5.5 8.75L12 15.25l6.5-6.5'])
  })

  it('o zoom e o tema voltam ao padrão: o corpo em 22, o tema escuro (o controle oferece o claro)', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await montar(<StageScreen {...props} />)
    await assentar(10)
    expect(estilo(exige('corpo')).fontSize).toBe(22)
    expect(exige('tema').getAttribute('aria-label')).toBe('Mudar para o tema claro')
    expect(__armazem().size, 'só a chave das notas no armazenamento').toBe(1)
  })
})
