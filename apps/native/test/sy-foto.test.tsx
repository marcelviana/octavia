/**
 * GATE (iii) — A FOTO (SY-D3, SY-D7, SY-D21, SY-D22, SY-D23, SY-D24; `docs/native/SY-PRECHECK.md` A4, A9). SY-PR1: entra
 * REPROVADO pela lista `sy-reprovados.txt`; a **PR-3** o esvazia (a foto do conteúdo no palco e em V; a foto da setlist
 * pela sessão em `src/foto-do-palco.ts`, que o `navigation.tsx` liga).
 *
 * O sync, visto da tela, é isto: a raiz troca o `contentById` e as setlists, e a tela montada re-renderiza com props
 * novas. O gate monta o palco (com a rolagem automática LIGADA) e V, e re-renderiza com um `contentById` e uma setlist
 * novos — a setlist passando pela foto da sessão, como o `navigation.tsx` a passará (`setlistDaSessao`). Mede:
 *
 *   - no palco: o nó `corpo` igual; nenhuma rolagem a `y: 0`; a rolagem segue ligada e andando; as notas da música, o
 *     título, a nota da posição e a barra (o "n DE N", o nome da setlist) congelados; o `file_url` congelado (nenhum
 *     download do arquivo novo); trocar de posição → o corpo NOVO (a abertura tira a foto de agora);
 *   - em V: o corpo, o título, os *Detalhes* e as notas congelados; **a estrela viva** (SY-D21: o favoritar tem de
 *     aparecer); o `file_url` congelado;
 *   - a sessão (SY-D22, na lógica do módulo): o índice, o fim e a busca na setlist leem a MESMA foto; ela se solta ao
 *     sair; outra setlist lê a viva;
 *   - o apagado (SY-D23, A4.3): a setlist apagada segura o palco; a música já aberta apagada volta com a última versão
 *     vista; a posição nunca aberta com a música apagada mostra o placeholder de hoje.
 *
 * **Os casos que passam hoje ficam FORA da lista** (a estrela viva, trocar de posição, a nunca aberta, a sessão que se
 * solta, a outra setlist): passar hoje não prova nada sobre eles — a tela de hoje não congela nada. A prova deles é o
 * controle negativo plantado (`docs/native/SY-PR1-anexos/instrumentos/cn-sy.sh`): `SY_PLANTA_TELA=congela` embrulha o
 * palco e V num componente que congela TODAS as props de conteúdo na montagem — o que a foto não pode ser —, e o
 * laboratório da foto da sessão com o defeito `nunca-solta`.
 *
 * **O que NÃO consegue ver**: geometria, o custo do quadro (o "antes" desta PR, no aparelho), e a `Navigation` real — a
 * ligação da foto da sessão no `navigation.tsx` se prova no aparelho (A-SY-17, PR-3). Texto: só o do projeto (regra 10).
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRef, type ComponentProps } from 'react'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { __iniciados, __reset, __responder } from './fake-expo-file-system'
import { __limparRolagens, __rolagens } from './fake-react-native'
import { achar, assentar, desmontar, exige, montar, rerender, texto, textoDaTela, tocar } from './tela'
import { musica, setlistCom } from './sy-arnes'
import { Checagens } from './sy-lista'

vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: () => undefined }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }))
vi.mock('../src/prefetch', () => ({ prefetchDemanda: async () => undefined }))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-foto' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }))

const SL = 'abababab-1111-4222-8333-444455556666'
const OUTRA = 'cdcdcdcd-1111-4222-8333-444455556666'
const DEPOIS = '2026-09-02T00:00:00.000+00:00'
const ARQ_A = 'http://127.0.0.1:9/sy-partitura-a.pdf'
const ARQ_B = 'http://127.0.0.1:9/sy-partitura-b.pdf'

/** Uma Letra de 40 linhas (texto do projeto) — comprida o bastante para a rolagem andar. */
const letra = (i: number, versao: string): string =>
  Array.from({ length: 40 }, (_, k) => `${versao}: linha ${k + 1} da música ${i} do gate da foto`).join('\n')

const M1 = musica(1, { title: 'SY foto 1', content_data: { lyrics: letra(1, 'antes') }, notes: 'notas da música 1, antes', key: 'G', bpm: 90 })
const M2 = musica(2, { title: 'SY foto 2', content_data: { lyrics: letra(2, 'antes') } })
const M3 = musica(3, { title: 'SY foto 3', content_type: 'Sheet', content_data: null, file_url: ARQ_A })
const M4 = musica(4, { title: 'SY foto 4' })
/** O que o sync traz: a 1 e a 2 mudadas no site, a 3 com outro arquivo, a 4 nova. */
const N1 = { ...M1, title: 'SY foto 1, mudada no site', content_data: { lyrics: letra(1, 'depois') }, notes: 'notas da música 1, depois', key: 'A', bpm: 120, is_favorite: true, updated_at: DEPOIS }
const N2 = { ...M2, content_data: { lyrics: letra(2, 'depois') }, updated_at: DEPOIS }
const N3 = { ...M3, file_url: ARQ_B, updated_at: DEPOIS }

const mapa = (cs: ContentDTO[]): Map<string, ContentDTO> => new Map(cs.map((c) => [c.id, c]))
function setlistA(): SetlistDTO {
  const s = setlistCom(SL, 'SY foto', [M1.id, M2.id, M3.id])
  s.setlist_songs[0]!.notes = 'nota da posição, antes'
  return s
}
function setlistDepois(): SetlistDTO {
  const s = setlistCom(SL, 'SY foto, renomeada no site', [M1.id, M2.id, M3.id, M4.id], DEPOIS)
  s.setlist_songs[0]!.notes = 'nota da posição, depois'
  return s
}

const PLANTA = process.env.SY_PLANTA_TELA ?? ''
const C = new Checagens('iii', 'a foto')

let Stage: typeof import('../src/screens/StageScreen').StageScreen
let V: typeof import('../src/screens/VisualizacaoScreen').VisualizacaoScreen
let FP: typeof import('../src/foto-do-palco')

/**
 * O CONTROLE NEGATIVO da tela (`SY_PLANTA_TELA=congela`): congela TODAS as props de conteúdo na montagem — o mapa, a
 * setlist, a música de V — e deixa só a posição viva. É o que a foto NÃO pode ser (a estrela, a troca de posição).
 */
function Congela<P extends object>(Tela: (p: P) => React.JSX.Element | null, chaves: (keyof P)[]): (p: P) => React.JSX.Element | null {
  return function Congelada(p: P) {
    const primeira = useRef<P>(p)
    const q = { ...p }
    for (const k of chaves) q[k] = primeira.current[k]
    return <Tela {...q} />
  }
}

type PropsDoPalco = ComponentProps<typeof import('../src/screens/StageScreen').StageScreen>
type PropsDeV = ComponentProps<typeof import('../src/screens/VisualizacaoScreen').VisualizacaoScreen>
let Palco: (p: PropsDoPalco) => React.JSX.Element | null
let Visualizacao: (p: PropsDeV) => React.JSX.Element | null

function propsDoPalco(setlist: SetlistDTO | null, contentById: Map<string, ContentDTO>, posicao: number): PropsDoPalco {
  return {
    setlist,
    contentById,
    posicao,
    avulsaContentId: null,
    origemDoAvulso: null,
    online: true,
    onPosicao: () => undefined,
    onFim: () => undefined,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
  }
}
function propsDeV(content: ContentDTO | null): PropsDeV {
  return { content, online: true, onVoltar: () => undefined, onTocar: () => undefined, onArquivosMudaram: () => undefined }
}

/** A raiz e a navegação de mentira: as setlists vivas, e a foto da sessão como o `navigation.tsx` a lerá. */
let vivas: SetlistDTO[] = []
const acharViva = (id: string): SetlistDTO | undefined => vivas.find((s) => s.id === id)

beforeAll(async () => {
  Stage = (await import('../src/screens/StageScreen')).StageScreen
  V = (await import('../src/screens/VisualizacaoScreen')).VisualizacaoScreen
  FP = await import('../src/foto-do-palco')
  F = await import('../src/files')
  Palco = PLANTA === 'congela' ? Congela<PropsDoPalco>(Stage, ['contentById', 'setlist']) : Stage
  Visualizacao = PLANTA === 'congela' ? Congela<PropsDeV>(V, ['content']) : V
})

beforeEach(() => {
  __reset()
  __limparRolagens()
  F.setFilesUser('sy-foto')
  // o "servidor" dos arquivos do duplo: os dois PDFs existem (1 byte de PDF de mentira); o que se mede é QUAL é pedido
  for (const u of [ARQ_A, ARQ_B]) __responder(u, { corpo: '%PDF-1.4 sy' })
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(10)
  desmontar()
  vi.restoreAllMocks()
})

const rotulo = (testID: string): string => exige(testID).getAttribute('aria-label') ?? ''
/** O arquivo do disco: o `files.ts` exige a sessão antes (o `App.tsx` a dá na entrada, `setFilesUser`). */
let F: typeof import('../src/files')

describe('gate (iii) — a foto (A4)', () => {
  it('o PALCO aberto com a rolagem ligada, e um sync que muda a música, a nota da posição e a setlist', async () => {
    const foto = FP.criarFotoDaSessao()
    vivas = [setlistA()]
    foto.entrar(SL, acharViva)
    await montar(<Palco {...propsDoPalco(foto.setlistDaSessao(SL, acharViva) ?? null, mapa([M1, M2, M3]), 1)} />)
    await assentar(10)
    await tocar('auto-scroll')
    await assentar(150)
    const antes = { corpo: texto('corpo'), notas: texto('notas-texto'), tela: textoDaTela(), rolagens: __rolagens().length }
    const yAntes = __rolagens().at(-1) ?? 0
    // o sync: a raiz troca as setlists e o mapa; o palco re-renderiza com a setlist da sessão e o mapa novo
    vivas = [setlistDepois()]
    await rerender(<Palco {...propsDoPalco(foto.setlistDaSessao(SL, acharViva) ?? null, mapa([N1, N2, N3, M4]), 1)} />)
    const kDoSync = __rolagens().length
    await assentar(150)
    const depois = textoDaTela()
    const rolagens = __rolagens()
    C.nota('palco-sem-topo', `rolagens antes do sync: ${antes.rolagens} (a última em y=${yAntes}) · depois: ${rolagens.length - kDoSync}, a última em y=${rolagens.at(-1)}`)

    await C.caso('palco-corpo', async () => (texto('corpo') === antes.corpo ? null : 'o corpo mudou no meio da música'))
    await C.caso('palco-sem-topo', async () =>
      rolagens.slice(antes.rolagens).includes(0) ? 'a rolagem voltou ao topo (scrollTo y: 0) com o sync' : null,
    )
    await C.caso('palco-rolagem-segue', async () => {
      const ligada = rotulo('auto-scroll') === 'Rolagem automática, ligada'
      const andou = rolagens.length > kDoSync && (rolagens.at(-1) ?? 0) > yAntes
      C.nota('palco-rolagem-segue', `o controle: "${rotulo('auto-scroll')}" · andou depois do sync: ${andou}`)
      return ligada && andou ? null : `a rolagem parou com o sync (ligada: ${ligada}, andou: ${andou})`
    })
    await C.caso('palco-notas', async () => (texto('notas-texto') === antes.notas ? null : 'as notas da música mudaram'))
    await C.caso('palco-titulo', async () =>
      depois.includes('SY foto 1') && !depois.includes('mudada no site') ? null : 'o título mudou',
    )
    await C.caso('palco-nota-da-posicao', async () =>
      depois.includes('Nota: nota da posição, antes') && !depois.includes('depois') ? null : 'a nota da posição mudou',
    )
    await C.caso('palco-barra', async () => {
      const ok = depois.includes('1 DE 3') && !depois.includes('1 DE 4') && !depois.includes('renomeada')
      C.nota('palco-barra', `antes: "${antes.tela.includes('1 DE 3') ? '1 DE 3' : '?'}" · depois: "${depois.includes('1 DE 4') ? '1 DE 4' : depois.includes('1 DE 3') ? '1 DE 3' : '?'}"`)
      return ok ? null : 'a barra mudou (o "n DE N" ou o nome da setlist)'
    })

    // trocar de posição é ABERTURA: a posição 2 abre com a versão de agora (a do sync)
    await rerender(<Palco {...propsDoPalco(foto.setlistDaSessao(SL, acharViva) ?? null, mapa([N1, N2, N3, M4]), 2)} />)
    await assentar(10)
    await C.caso('palco-trocar-posicao', async () =>
      texto('corpo').startsWith('depois: linha 1 da música 2') ? null : 'trocar de posição não abriu a versão nova',
    )
  })

  it('o PALCO com uma Partitura aberta: o sync troca o file_url — o arquivo novo não é pedido', async () => {
    vivas = [setlistA()]
    const foto = FP.criarFotoDaSessao()
    foto.entrar(SL, acharViva)
    await montar(<Palco {...propsDoPalco(foto.setlistDaSessao(SL, acharViva) ?? null, mapa([M1, M2, M3]), 3)} />)
    await assentar(30)
    const pedidosAntes = [...__iniciados()]
    await rerender(<Palco {...propsDoPalco(foto.setlistDaSessao(SL, acharViva) ?? null, mapa([M1, M2, N3]), 3)} />)
    await assentar(30)
    const novos = __iniciados().slice(pedidosAntes.length)
    C.nota('palco-file-url', `downloads antes do sync: ${JSON.stringify(pedidosAntes.map((u) => u.split('/').at(-1)))} · depois: ${JSON.stringify(novos.map((u) => u.split('/').at(-1)))}`)
    await C.caso('palco-file-url', async () => {
      if (!pedidosAntes.some((u) => u.includes('partitura-a'))) return 'o palco não pediu nem o arquivo da abertura — o caso não se montou'
      return novos.some((u) => u.includes('partitura-b')) ? 'o palco pediu o arquivo novo com a música aberta' : null
    })
  })

  it('o APAGADO com o palco aberto: a música aberta apagada volta com a última versão; a nunca aberta mostra o placeholder', async () => {
    vivas = [setlistA()]
    const foto = FP.criarFotoDaSessao()
    foto.entrar(SL, acharViva)
    const setlist = (): SetlistDTO | null => foto.setlistDaSessao(SL, acharViva) ?? null
    await montar(<Palco {...propsDoPalco(setlist(), mapa([M1, M2, M3]), 1)} />)
    await assentar(10)
    const corpo1 = texto('corpo')
    // o sync apaga as músicas 1 e 2 do cache (a setlist viva fica igual: isola o conteúdo)
    await rerender(<Palco {...propsDoPalco(setlist(), mapa([M3]), 1)} />)
    await assentar(10)
    await C.caso('palco-musica-apagada-aberta', async () =>
      achar('corpo') !== null && texto('corpo') === corpo1 ? null : 'a música aberta, apagada pelo sync, virou placeholder',
    )
    await rerender(<Palco {...propsDoPalco(setlist(), mapa([M3]), 2)} />)
    await assentar(10)
    await C.caso('palco-musica-apagada-nunca-aberta', async () =>
      achar('placeholder') !== null ? null : 'a posição nunca aberta, com a música apagada, não mostrou o placeholder de hoje',
    )
  })

  it('a SESSÃO (na lógica do módulo): o índice, o fim e a busca leem a mesma foto; a setlist apagada segura; ao sair, solta', async () => {
    vivas = [setlistA(), setlistCom(OUTRA, 'SY outra', [M4.id])]
    const foto = FP.criarFotoDaSessao()
    foto.entrar(SL, acharViva)
    vivas = [setlistDepois(), setlistCom(OUTRA, 'SY outra, mudada', [M4.id, M2.id])]
    // como o `navigation.tsx` os lê: o índice (a setlist), o fim (o total) e a busca na setlist (a setlist)
    const indice = foto.setlistDaSessao(SL, acharViva)
    const total = foto.setlistDaSessao(SL, acharViva)?.setlist_songs.length ?? 0
    const busca = foto.setlistDaSessao(SL, acharViva)
    const da = (s: SetlistDTO | undefined): string => (s === undefined ? 'nenhuma' : `${s.setlist_songs.length} músicas, "${s.name}"`)
    C.nota('sessao-indice', `o índice lê: ${da(indice)} (a foto: 3 músicas, "SY foto")`)
    C.nota('sessao-fim', `o fim lê: ${total} (a foto: 3)`)
    C.nota('sessao-busca', `a busca lê: ${da(busca)}`)
    await C.caso('sessao-indice', async () => (indice?.setlist_songs.length === 3 && indice.name === 'SY foto' ? null : 'o índice leu a setlist viva'))
    await C.caso('sessao-fim', async () => (total === 3 ? null : `o fim leu ${total} músicas (a viva)`))
    await C.caso('sessao-busca', async () => (busca?.setlist_songs.length === 3 && busca.name === 'SY foto' ? null : 'a busca leu a setlist viva'))
    await C.caso('sessao-outra-setlist', async () =>
      foto.setlistDaSessao(OUTRA, acharViva)?.setlist_songs.length === 2 ? null : 'outra setlist não leu a viva',
    )
    vivas = [setlistCom(OUTRA, 'SY outra, mudada', [M4.id, M2.id])] // o sync apaga a setlist aberta
    await C.caso('setlist-apagada', async () => {
      const s = foto.setlistDaSessao(SL, acharViva)
      C.nota('setlist-apagada', `com a setlist apagada pelo sync, o palco lê: ${da(s)}`)
      return s !== undefined && s.setlist_songs.length === 3 ? null : 'a setlist apagada derruba o palco (o placeholder "não está no cache")'
    })
    vivas = [setlistDepois()]
    foto.sair()
    await C.caso('sessao-solta', async () => {
      const s = foto.setlistDaSessao(SL, acharViva)
      C.nota('sessao-solta', `depois de sair, lê: ${da(s)} (a viva: 4 músicas)`)
      return s?.setlist_songs.length === 4 ? null : 'a foto não se soltou ao sair do palco'
    })
  })

  it('V aberta, e um sync que muda a música: o texto congela, a ESTRELA fica viva', async () => {
    await montar(<Visualizacao {...propsDeV(M1)} />)
    await assentar(10)
    const antes = { corpo: texto('corpo'), titulo: texto('view-titulo'), detalhes: texto('view-detalhes'), notas: texto('view-notas'), estrela: rotulo('view-favoritar') }
    await rerender(<Visualizacao {...propsDeV(N1)} />)
    await assentar(10)
    C.nota('v-estrela-viva', `a estrela antes: "${antes.estrela}" · depois: "${rotulo('view-favoritar')}"`)
    await C.caso('v-corpo', async () => (texto('corpo') === antes.corpo ? null : 'o corpo de V mudou'))
    await C.caso('v-titulo', async () => (texto('view-titulo') === antes.titulo ? null : 'o título de V mudou'))
    await C.caso('v-detalhes', async () => (texto('view-detalhes') === antes.detalhes ? null : 'os Detalhes de V mudaram'))
    await C.caso('v-notas', async () => (texto('view-notas') === antes.notas ? null : 'as notas de V mudaram'))
    await C.caso('v-estrela-viva', async () =>
      rotulo('view-favoritar') !== antes.estrela ? null : 'a estrela não acompanhou o favoritar (congelou)',
    )
  })

  it('V com uma Partitura aberta: o sync troca o file_url — o arquivo novo não é pedido', async () => {
    await montar(<Visualizacao {...propsDeV(M3)} />)
    await assentar(30)
    const pedidosAntes = [...__iniciados()]
    await rerender(<Visualizacao {...propsDeV(N3)} />)
    await assentar(30)
    const novos = __iniciados().slice(pedidosAntes.length)
    C.nota('v-file-url', `downloads antes: ${JSON.stringify(pedidosAntes.map((u) => u.split('/').at(-1)))} · depois: ${JSON.stringify(novos.map((u) => u.split('/').at(-1)))}`)
    await C.caso('v-file-url', async () => {
      if (!pedidosAntes.some((u) => u.includes('partitura-a'))) return 'V não pediu nem o arquivo da abertura — o caso não se montou'
      return novos.some((u) => u.includes('partitura-b')) ? 'V pediu o arquivo novo com a música aberta' : null
    })
  })

  it('reprova exatamente a lista de sy-reprovados.txt', () => {
    const j = C.julgar()
    console.info(`${PLANTA !== '' ? `[planta: SY_PLANTA_TELA=${PLANTA}]\n` : ''}${j.texto}`)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
  })
})
