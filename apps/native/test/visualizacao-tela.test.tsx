/**
 * N4-PR8 — A VISUALIZAÇÃO (V) (`N4-REQUISITOS.md` N4-R12…N4-R15, e N4-R7…N4-R9 em V; `DESIGN-N4/telas.html`, as
 * molduras `N4-{C,B}-V-*`, com as erratas do `DESIGN-N4/README.md` §6 — a N4-E8 em especial). Vem ANTES do código que
 * mede (regra 30): contra a `main` (`836d5e6`) este arquivo reprova na importação — a tela não existe.
 *
 * O que se mede aqui é ÁRVORE e LIGAÇÃO (`APARATO.md`, "O que o `native-tela` prova"): que nó existe, onde, com que
 * nome acessível, inerte ou não, com que token, e que chamada sai. A geometria (a coluna de 340 em dp, as colunas
 * visíveis do leitor, o cabeçalho que cresce) é do dump do aparelho; a `Navigation` real não roda no duplo (div. 334)
 * — por isso o destino de cada toque é uma FUNÇÃO (`rotas-do-avulso.ts`), testada aqui, e a ligação no aparelho.
 *
 * O favoritar e o arquivo são DUPLOS controláveis (o `favoritar.ts` e o `files.ts` têm os próprios testes contra o
 * mock): o que a tela tem de provar é o que ela mostra com cada estado deles.
 */
import './dev-flag'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as core from '@octavia/core'
import type { ContentDTO, ResultadoDoFavoritar } from '@octavia/core'
import { desenhos } from '../src/icones/dados'
import { INEXISTENTE, dark, faixas, font, lineHeight, touch, zoomDefault } from '../src/theme'
import { __janela } from './fake-react-native'
import { achar, assentar, desmontar, estilo, exige, inativo, montar, paths, rerender, testIDs, textoDaTela, tocar } from './tela'

const fav = vi.hoisted(() => ({
  emVoo: new Map<string, boolean>(),
  ouvintes: new Set<() => void>(),
  pedidos: [] as { id: string; valor: boolean; responder: (r: unknown) => void }[],
}))
/** O arquivo, controlável: o que está no disco, e o `ensureFile` que o teste resolve ou rejeita quando quiser. */
const arq = vi.hoisted(() => ({
  noDisco: new Set<string>(),
  pedidos: [] as { url: string; resolver: (uri: string) => void; rejeitar: (e: unknown) => void }[],
}))
const foco = vi.hoisted(() => ({ sair: null as null | (() => void) }))

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-cn-visualizacao' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }))
vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (efeito: () => (() => void) | void) => {
    const { useEffect } = require('react') as typeof import('react')
    useEffect(() => {
      const limpar = efeito()
      foco.sair = typeof limpar === 'function' ? limpar : null
      return limpar ?? undefined
    }, [efeito])
  },
}))
vi.mock('../src/favoritar', () => ({
  estadoDoFavoritar: (id: string) => (fav.emVoo.has(id) ? (fav.emVoo.get(id) ? 'favoritando' : 'tirando') : null),
  assinarFavoritar: (f: () => void) => {
    fav.ouvintes.add(f)
    return () => fav.ouvintes.delete(f)
  },
  favoritar: (id: string, valor: boolean) =>
    new Promise((res) => {
      fav.emVoo.set(id, valor)
      for (const f of [...fav.ouvintes]) f()
      fav.pedidos.push({
        id,
        valor,
        responder: (r) => {
          fav.emVoo.delete(id)
          for (const f of [...fav.ouvintes]) f()
          res(r)
        },
      })
    }),
}))
vi.mock('../src/files', () => ({
  hasFile: (url: string) => arq.noDisco.has(url),
  knownBytes: (url: string) => (url.endsWith('partitura-12p.pdf') ? 2_202_009 : null),
  fileNameFromUrl: (url: string) => url.split('/').pop() ?? url,
  fraseDaFalha: (e: unknown) => (e as { fraseDeTela?: string }).fraseDeTela ?? 'não consegui baixar',
  ensureFile: (url: string) =>
    new Promise((res, rej) => {
      arq.pedidos.push({ url, resolver: (uri) => res({ uri, src: 'download', bytes: 1 }), rejeitar: rej })
    }),
  // a L (o bloco do N4-R6, no fim) lê o estado dos downloads para a segunda linha
  estadoDosDownloads: () => ({ baixando: new Set<string>(), falhas: new Map<string, string>() }),
  assinarDownloads: () => () => undefined,
}))

const { VisualizacaoScreen } = await import('../src/screens/VisualizacaoScreen')
const { LibraryScreen } = await import('../src/screens/LibraryScreen')
const rotas = await import('../src/rotas-do-avulso')

const RAIZ = resolve(__dirname, '../../..')
const ler = (rel: string): string => readFileSync(resolve(RAIZ, rel), 'utf8')
const ARQ = 'http://localhost:8790/'
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 627.1 }

/** A fixture da visualização (`N4-PR8-anexos/instrumentos/fixture-visualizacao.py`): texto escrito pelo projeto. */
const LETRA: ContentDTO = {
  id: '00000001-0000-4000-8000-000000000003',
  title: 'Manhã de ensaio',
  artist: 'Banda da fixture',
  album: 'Disco de fixture',
  content_type: 'Lyrics',
  content_data: { lyrics: '[Verso 1]\nQuando a noite chega o ensaio começa (fixture do projeto)\nA sala acende' },
  file_url: null,
  updated_at: '2026-09-30T12:00:00.000+00:00',
  created_at: '2026-03-14T12:00:00.000+00:00',
  key: 'G',
  bpm: 92,
  difficulty: 'Intermediate',
  genre: 'Toada de fixture',
  tags: ['ensaio', 'voz e violão'],
  notes: 'Entrar depois da contagem de quatro do metrônomo.',
  is_favorite: true,
  // o que o site NÃO salva de verdade (N4-D31): mesmo no dado, não aparece
  time_signature: '3/4',
  capo: 2,
  tuning: 'DADGAD',
} as ContentDTO
const CIFRA_SECOES: ContentDTO = {
  ...LETRA,
  id: '00000007-0000-4000-8000-000000000003',
  title: 'Sétima do ensaio',
  content_type: 'Chords',
  content_data: { chords: 'C G', sections: [{ name: 'Content', chords: 'C Am', lyrics: 'linha de fixture' }, { name: 'Verse 1', chords: 'G D', lyrics: '' }] },
  is_favorite: false,
}
const TAB: ContentDTO = { ...LETRA, id: '00000003-0000-4000-8000-000000000003', title: 'Terceira do ensaio', content_type: 'Tab', content_data: { tablature: 'e|---0-----0---|\nB|-----1-----1-|' } }
const PARTITURA: ContentDTO = {
  ...LETRA, id: '00000004-0000-4000-8000-000000000003', title: 'Partitura de doze páginas', artist: 'Orquestra de fixture',
  content_type: 'Sheet', content_data: null, file_url: `${ARQ}partitura-12p.pdf`, is_favorite: false,
}
const JPG: ContentDTO = { ...PARTITURA, id: '00000013-0000-4000-8000-000000000003', title: 'Partitura escaneada de fixture', file_url: `${ARQ}partitura-escaneada.jpg` }
/** Os campos vazios: nenhum campo salvo, nenhuma nota — sobra a linha das datas. */
const VAZIOS: ContentDTO = {
  id: '00000021-0000-4000-8000-000000000003', title: 'Estudo de fixture 21', artist: null, album: null, content_type: 'Lyrics',
  content_data: { lyrics: 'texto de fixture' }, file_url: null, updated_at: '2026-06-11T12:00:00.000+00:00',
  created_at: '2026-06-11T12:00:00.000+00:00', key: '', bpm: null, difficulty: null, genre: null, tags: [], notes: '',
} as ContentDTO
const SEM_TIPO: ContentDTO = { ...VAZIOS, id: '00000020-0000-4000-8000-000000000003', title: 'Item sem tipo da fixture', content_type: 'Piano' as ContentDTO['content_type'] }
const SEM_CORPO: ContentDTO = { ...VAZIOS, id: '00000022-0000-4000-8000-000000000003', title: 'Item sem conteúdo da fixture', content_data: null }

interface Props { content?: ContentDTO; online?: boolean; onVoltar?: () => void; onTocar?: (id: string) => void }
function tela(p: Props = {}): React.JSX.Element {
  return (
    <VisualizacaoScreen
      content={p.content ?? LETRA}
      online={p.online ?? true}
      onVoltar={p.onVoltar ?? (() => undefined)}
      onTocar={p.onTocar ?? (() => undefined)}
      onArquivosMudaram={() => undefined}
    />
  )
}
const nome = (testID: string) => exige(testID).getAttribute('aria-label')
/** O texto das FOLHAS (os nós de texto sem outro dentro), juntas por um espaço — o helper do teste da L. */
function texto(testID: string): string {
  const e = exige(testID)
  // o nó de texto com o `testID` nele mesmo (o título, as datas): ele é a folha
  if (e.tagName === 'SPAN' && e.querySelector('span') === null) return e.textContent ?? ''
  return [...e.querySelectorAll('span')]
    .filter((e) => e.querySelector('span') === null)
    .map((e) => e.textContent ?? '')
    .join(' ')
}
/** Os `d` do desenho `normal` de um ícone do catálogo — o que a tela tem de desenhar pelo NOME (N4-E6). */
const dDoCatalogo = (n: keyof typeof desenhos): string[] =>
  (desenhos[n].normal as readonly Record<string, unknown>[]).filter((e) => typeof e.d === 'string').map((e) => e.d as string)
/** O nó de texto mais externo cujo texto é exatamente `t`. */
function temTexto(t: string): boolean {
  return [...document.querySelectorAll('span')].some((s) => (s.textContent ?? '').trim() === t)
}

beforeEach(() => {
  __janela(B.w, B.h)
  fav.emVoo.clear()
  fav.ouvintes.clear()
  fav.pedidos.length = 0
  arq.noDisco.clear()
  arq.pedidos.length = 0
  foco.sair = null
})
afterEach(() => {
  desmontar()
  __janela()
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R12 — o cabeçalho, igual nas faixas', () => {
  it('voltar · título · artista · tipo · a estrela · o ▶ só ícone', async () => {
    await montar(tela())
    expect(nome('view-voltar')).toBe('Voltar para a biblioteca')
    expect(texto('view-titulo')).toBe('Manhã de ensaio')
    expect(texto('view-meta')).toBe('Banda da fixture · Letra')
    expect(nome('view-favoritar')).toBe('Tirar “Manhã de ensaio” das favoritas')
    expect(nome('view-tocar')).toBe('Tocar “Manhã de ensaio”')
    expect(texto('view-tocar')).toBe('') // só ícone (N4-D61)
    // o ▶ é o controle da linha da L (m26): 48 × 48, com borda
    expect(estilo(exige('view-tocar'))).toMatchObject({ width: touch.min, height: touch.min, borderWidth: 1 })
    expect(estilo(exige('view-favoritar'))).toMatchObject({ width: touch.min, height: touch.min })
    expect(estilo(exige('view-favoritar')).borderWidth).toBeUndefined()
  })

  it('o título não elide (cresce quando quebra); a altura mínima é 88 = bar.top + space.xl (m12)', async () => {
    await montar(tela())
    expect(exige('view-titulo').getAttribute('data-numberoflines')).toBeNull()
    expect(estilo(exige('view-cabecalho')).minHeight).toBe(88)
  })

  it('sem artista: a meta é só o tipo; nunca *artista desconhecido*', async () => {
    await montar(tela({ content: { ...LETRA, artist: null } }))
    expect(texto('view-meta')).toBe('Letra')
    expect(textoDaTela()).not.toContain('desconhecido')
  })

  it('o tipo vem com o ícone de 20 do catálogo, e o tipo desconhecido em `offlineInk`, com o ▶ inerte', async () => {
    await montar(tela())
    expect(paths('view-meta').length).toBeGreaterThan(0)
    await rerender(tela({ content: SEM_TIPO }))
    expect(texto('view-meta')).toBe('tipo desconhecido')
    expect(estilo(exige('view-meta').querySelector<HTMLElement>('span')!).color).toBe(dark.offlineInk)
    expect(inativo('view-tocar')).toBe(true)
    expect(inativo('view-favoritar')).toBe(false)
  })

  // N4-PR8, achado do Marcel no aceite (o ▶ inerte com a borda MAIS CLARA que a do ativo): a folha (`DESIGN-N4`, P-I2,
  // os quatro estados — normal, pressionado, inerte, em andamento) desenha a borda `line` (#2A2836) em TODOS; o que
  // muda no inerte é só o ícone, em `lineInfo` com o traço do inerte. Vale na linha da L e em V (o mesmo controle).
  it('o ▶ inerte tem a MESMA borda do ativo (`line`, a da folha); só o ícone muda, para `lineInfo` (P-I2)', async () => {
    await montar(tela())
    const ativo = estilo(exige('view-tocar'))
    expect(ativo.borderColor).toBe(dark.line)
    await rerender(tela({ content: SEM_TIPO }))
    expect(inativo('view-tocar')).toBe(true)
    expect(estilo(exige('view-tocar')).borderColor).toBe(ativo.borderColor)
    // o `Icone` desenha em `currentColor`: a tinta é o `color` do `<svg>`
    expect(exige('view-tocar').querySelector('svg')?.getAttribute('color')).toBe(dark.lineInfo)
  })

  it('o corpo inválido (sem conteúdo) também deixa o ▶ inerte, como na linha da L', async () => {
    await montar(tela({ content: SEM_CORPO }))
    expect(inativo('view-tocar')).toBe(true)
  })

  it('o voltar devolve a biblioteca (o goBack da pilha: a L na mesma posição)', async () => {
    let voltou = 0
    await montar(tela({ onVoltar: () => voltou++ }))
    await tocar('view-voltar')
    expect(voltou).toBe(1)
    expect(rotas.destinoDoVerDaBiblioteca(LETRA.id)).toEqual({ acao: 'push', rota: 'Visualizacao', params: { contentId: LETRA.id } })
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R13 — o corpo: duas colunas em C (P-T3), uma em B', () => {
  it('C: a coluna de detalhes tem a largura do token P-T3 (340), à esquerda, e o leitor à direita', async () => {
    __janela(C.w, C.h)
    await montar(tela())
    const coluna = exige('view-detalhes')
    expect(estilo(coluna).width).toBe(faixas.C.view.coluna)
    expect(faixas.C.view.coluna).toBe(340)
    const leitor = exige('view-leitor')
    expect(coluna.parentElement).toBe(leitor.parentElement)
    expect(coluna.compareDocumentPosition(leitor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(achar('view-rolagem')).toBeNull()
  })

  it('C: a coluna da esquerda fica MESMO vazia (sem campos e sem notas: só as datas) — o corpo não muda de lugar', async () => {
    __janela(C.w, C.h)
    await montar(tela({ content: VAZIOS }))
    expect(estilo(exige('view-detalhes')).width).toBe(340)
    expect(texto('view-detalhes')).toBe('criado 2026-06-11 · alterado 2026-06-11')
  })

  it('B: uma coluna só — os detalhes sobre o corpo, numa rolagem só; nenhuma largura de coluna', async () => {
    await montar(tela())
    const rolagem = exige('view-rolagem')
    const detalhes = exige('view-detalhes')
    const leitor = exige('view-leitor')
    expect(rolagem.contains(detalhes) && rolagem.contains(leitor)).toBe(true)
    expect(detalhes.compareDocumentPosition(leitor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(estilo(detalhes).width).toBeUndefined()
    expect(faixas.B.view.coluna).toBe(INEXISTENTE)
  })

  it('o leitor é o do palco: mono 22, entrelinha do texto, ESCURO, sem quebra de linha (o corpo dentro de uma rolagem horizontal)', async () => {
    await montar(tela())
    const corpo = exige('corpo')
    expect(estilo(corpo)).toMatchObject({
      fontFamily: font.mono,
      fontSize: zoomDefault,
      lineHeight: zoomDefault * lineHeight.text,
      color: dark.text,
    })
    expect(corpo.closest('[data-horizontal="true"]')).not.toBeNull()
  })

  it('sem os controles de tocar: nenhuma rolagem automática, nenhum zoom, nenhuma borda de virar página', async () => {
    await montar(tela())
    for (const id of ['auto-scroll', 'zoom-menos', 'zoom-mais', 'tema', 'borda-voltar', 'borda-avancar', 'indice', 'busca', 'sair']) {
      expect(achar(id), id).toBeNull()
    }
  })

  it('a grade de Detalhes por faixa (N4-D99): 2 por linha em C, 3 em B — as etiquetas na largura inteira', async () => {
    const porLinha = (): number[] => [...document.querySelectorAll('[data-testid="view-grade-linha"]')].map((l) => l.children.length)
    __janela(C.w, C.h)
    await montar(tela())
    expect(porLinha()).toEqual([2, 2, 2]) // álbum|tom · andamento|dificuldade · gênero|(vazia)
    expect(exige('view-campo-etiquetas').closest('[data-testid="view-grade-linha"]')).toBeNull()
    desmontar()
    __janela(B.w, B.h)
    await montar(tela())
    expect(porLinha()).toEqual([3, 3]) // álbum|tom|andamento · dificuldade|gênero|(vazia)
    expect(faixas.A.view.grade).toBe(2)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R14 — os campos: só os salvos de verdade, com o nome do site', () => {
  it('na ordem da folha, com o rótulo do site; a dificuldade como *Intermediário*; o andamento em BPM; as etiquetas com ·', async () => {
    await montar(tela())
    const campos = [...document.querySelectorAll<HTMLElement>('[data-testid^="view-campo-"]')].map((e) => (e.textContent ?? '').trim())
    expect(campos).toEqual([
      'álbumDisco de fixture',
      'tomG',
      'andamento92 BPM',
      'dificuldadeIntermediário',
      'gêneroToada de fixture',
      'etiquetasensaio · voz e violão',
    ])
    expect(texto('view-detalhes')).toContain('Detalhes')
  })

  it('compasso, capo e afinação NÃO aparecem, mesmo no dado (herança D, N4-D31)', async () => {
    await montar(tela())
    for (const t of ['compasso', 'capo', 'afinação', '3/4', 'DADGAD']) expect(textoDaTela(), t).not.toContain(t)
  })

  it('as notas da música com o rótulo da P-F3 — só em V', async () => {
    await montar(tela())
    expect(texto('view-notas')).toBe('notas da música Entrar depois da contagem de quatro do metrônomo.')
    expect(ler('apps/native/src/screens/StageScreen.tsx')).not.toContain('notas-da-musica')
  })

  it('as duas datas numa linha, no FIM dos detalhes (o formato de data de S1, YYYY-MM-DD)', async () => {
    await montar(tela())
    expect(texto('view-datas')).toBe('criado 2026-03-14 · alterado 2026-09-30')
    const detalhes = exige('view-detalhes')
    const ultimo = [...detalhes.querySelectorAll<HTMLElement>('[data-testid]')].pop()
    expect(ultimo?.getAttribute('data-testid')).toBe('view-datas')
  })

  it('campo vazio não aparece; sem nenhum campo e sem notas, sobra só a linha das datas (sem o título *Detalhes*)', async () => {
    await montar(tela({ content: VAZIOS }))
    expect(document.querySelectorAll('[data-testid^="view-campo-"]').length).toBe(0)
    expect(achar('view-notas')).toBeNull()
    expect(textoDaTela()).not.toContain('Detalhes')
    expect(texto('view-datas')).toBe('criado 2026-06-11 · alterado 2026-06-11')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R15 — o corpo por tipo e os arquivos', () => {
  it('a Cifra com seções: o nome de cada seção como o editor gravou (*Content*, *Verse 1*), o texto do core', async () => {
    await montar(tela({ content: CIFRA_SECOES }))
    expect(exige('corpo').textContent).toBe(core.bodyOf('Chords', CIFRA_SECOES.content_data))
    expect(exige('corpo').textContent).toContain('Content')
    expect(exige('corpo').textContent).toContain('Verse 1')
  })

  it('a Tab como foi importada, sem quebra', async () => {
    await montar(tela({ content: TAB }))
    expect(exige('corpo').textContent).toBe('e|---0-----0---|\nB|-----1-----1-|')
    expect(estilo(exige('corpo')).lineHeight).toBe(zoomDefault * lineHeight.tab)
  })

  it('a Partitura pelo leitor de PDF do palco (o arquivo do disco)', async () => {
    arq.noDisco.add(PARTITURA.file_url!)
    await montar(tela({ content: PARTITURA }))
    expect(arq.pedidos.map((p) => p.url)).toEqual([PARTITURA.file_url])
    arq.pedidos[0].resolver('file:///disco/partitura-12p.pdf')
    await assentar()
    expect(exige('view-pdf').querySelector('[data-pdf="true"]')?.getAttribute('data-uri')).toBe('file:///disco/partitura-12p.pdf')
  })

  it('o corpo vazio: *este item não tem conteúdo*, o mesmo para os quatro tipos', async () => {
    for (const tipo of ['Lyrics', 'Chords', 'Tab', 'Sheet'] as const) {
      await montar(tela({ content: { ...SEM_CORPO, content_type: tipo } }))
      expect(texto('view-placeholder')).toBe('este item não tem conteúdo')
      desmontar()
    }
  })

  it('o tipo desconhecido: *tipo desconhecido*, com o ícone do catálogo em `offlineInk`', async () => {
    await montar(tela({ content: SEM_TIPO }))
    expect(texto('view-placeholder')).toBe('tipo desconhecido')
    expect(paths('view-placeholder').length).toBeGreaterThan(0)
  })

  it('baixando: *baixando o arquivo…* com o arco (o ícone `baixando` do catálogo, N4-E6)', async () => {
    await montar(tela({ content: PARTITURA }))
    expect(texto('view-baixando')).toBe('baixando o arquivo…')
    expect(paths('view-baixando')).toEqual(dDoCatalogo('baixando'))
  })

  it('não baixado: o placeholder do S3e — *arquivo não baixado*, o título · tipo (tamanho) — com o BAIXAR COMO ÍCONE (N4-E8)', async () => {
    await montar(tela({ content: PARTITURA, online: false }))
    expect(texto('view-nao-baixado')).toBe(
      'arquivo não baixado Partitura de doze páginas · partitura (2,1 MB) não está neste aparelho. Sem conexão agora — toque em Baixar quando a rede voltar.',
    )
    const baixar = exige('view-baixar')
    expect(nome('view-baixar')).toBe('Baixar')
    expect(baixar.textContent).toBe('') // nenhum nó de texto *Baixar* em V
    expect(estilo(baixar)).toMatchObject({ width: touch.min, height: touch.min, borderWidth: 1 })
    expect(paths('view-baixar')).toEqual(dDoCatalogo('baixar-setlist')) // o ícone do catálogo pelo nome (div. 1025)
    expect(temTexto('Baixar')).toBe(false)
    // o ▶ continua ativo no arquivo não baixado
    expect(inativo('view-tocar')).toBe(false)
  })

  it('não baixado COM rede: a segunda frase é a de sempre; tocar no Baixar pede o arquivo e mostra o baixando', async () => {
    await montar(tela({ content: PARTITURA, online: false }))
    await rerender(tela({ content: PARTITURA, online: true }))
    // com rede o leitor já pede o arquivo sozinho (disco primeiro, rede se preciso — o palco)
    expect(arq.pedidos.length).toBe(1)
    arq.pedidos[0].rejeitar(Object.assign(new Error('x'), { fraseDeTela: 'arquivo incompleto: 1048576 de 2202009 bytes' }))
    await assentar()
    expect(texto('view-falha')).toBe('não consegui baixar arquivo incompleto: 1048576 de 2202009 bytes')
    expect(nome('view-baixar')).toBe('Baixar')
    await tocar('view-baixar')
    expect(arq.pedidos.length).toBe(2)
    expect(texto('view-baixando')).toBe('baixando o arquivo…')
  })

  it('a falha genérica não se repete embaixo: *não consegui baixar* uma vez só', async () => {
    await montar(tela({ content: PARTITURA }))
    arq.pedidos[0].rejeitar(new Error('sem frase'))
    await assentar()
    expect(texto('view-falha')).toBe('não consegui baixar')
  })

  it('o formato que o app ainda não mostra: a frase do site e o nome do arquivo em mono — sem Baixar', async () => {
    await montar(tela({ content: JPG }))
    expect(texto('view-formato')).toBe('não foi possível abrir o arquivo — confira o formato partitura-escaneada.jpg · Partitura')
    expect(achar('view-baixar')).toBeNull()
    expect(arq.pedidos.length).toBe(0) // nenhum ensureFile
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R7, N4-R8 — o favoritar em V: a estrela com o arco, sem otimismo, a falha por espécie', () => {
  it('em voo: a estrela INERTE com o arco e o nome da P-F5; nada muda antes da resposta; o ▶ segue ativo', async () => {
    await montar(tela({ content: CIFRA_SECOES }))
    await tocar('view-favoritar')
    expect(fav.pedidos.map((p) => [p.id, p.valor])).toEqual([[CIFRA_SECOES.id, true]])
    expect(inativo('view-favoritar')).toBe(true)
    expect(nome('view-favoritar')).toBe('favoritando “Sétima do ensaio”…')
    expect(exige('view-favoritar').querySelectorAll('circle').length).toBeGreaterThan(0) // o arco (N4-D96)
    expect(inativo('view-tocar')).toBe(false)
    // sem otimismo: em voo o desenho é o da VAZADA (um traço da estrela; a cheia são dois — fundo e contorno). Era um
    // "o desenho muda depois", que o CN 5 (a estrela cheia em voo) não reprovava: consertado no instrumento (regra 32).
    const estrela = (): string[] => paths('view-favoritar').filter((d) => d.startsWith('M12 3.3'))
    expect(estrela()).toHaveLength(1)
    fav.pedidos[0].responder(
      core.classificarFavoritar(CIFRA_SECOES.id, { status: 200, bodyText: JSON.stringify({ ...CIFRA_SECOES, is_favorite: true }) }) satisfies ResultadoDoFavoritar,
    )
    await assentar()
    await rerender(tela({ content: { ...CIFRA_SECOES, is_favorite: true } }))
    expect(inativo('view-favoritar')).toBe(false)
    expect(nome('view-favoritar')).toBe('Tirar “Sétima do ensaio” das favoritas')
    expect(estrela()).toHaveLength(2) // cheia: só a linha devolvida a enche
  })

  it('a falha: a linha de aviso sob o cabeçalho, com o nome do controle · a frase da espécie; some no próximo favoritar', async () => {
    await montar(tela({ content: CIFRA_SECOES }))
    await tocar('view-favoritar')
    fav.pedidos[0].responder(core.classificarFavoritar(CIFRA_SECOES.id, { status: 500, bodyText: '{}' }))
    await assentar()
    expect(texto('aviso-motivo')).toBe('Favoritar “Sétima do ensaio”  ·  falha no servidor — nada foi alterado aqui')
    expect(exige('aviso-motivo').getAttribute('data-numberoflines')).toBeNull() // nunca elide
    expect(inativo('view-favoritar')).toBe(false)
    await tocar('view-favoritar')
    expect(achar('aviso-motivo')).toBeNull()
  })

  it('o pedido continua se o músico sai de V, e NÃO há aviso na volta (o estado final aparece onde a estrela estiver)', async () => {
    await montar(tela({ content: CIFRA_SECOES }))
    await tocar('view-favoritar')
    foco.sair?.() // V perde o foco (o palco avulso por cima, ou o voltar)
    fav.pedidos[0].responder(core.classificarFavoritar(CIFRA_SECOES.id, { status: 500, bodyText: '{}' }))
    await assentar()
    expect(achar('aviso-motivo')).toBeNull()
    expect(fav.pedidos.length).toBe(1) // nada foi cancelado nem repetido
  })
})

describe('N4-R9 — sem rede em V', () => {
  it('só a estrela fica inerte (em `lineInfo`), e o motivo numa linha de aviso: a P-F4; a leitura e o ▶ funcionam', async () => {
    await montar(tela({ online: false }))
    expect(inativo('view-favoritar')).toBe(true)
    expect(texto('aviso-motivo')).toBe(core.FRASES_N4['sem-rede-favoritar'])
    expect(inativo('view-tocar')).toBe(false)
    expect(achar('corpo')).not.toBeNull()
    await tocar('view-favoritar')
    expect(fav.pedidos.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('o ▶ de V — o palco avulso com a origem `visualizacao`', () => {
  it('abre o avulso desta música, empilhado: o voltar devolve V e se chama *Voltar para a visualização*', async () => {
    const tocou: string[] = []
    await montar(tela({ onTocar: (id) => tocou.push(id) }))
    await tocar('view-tocar')
    expect(tocou).toEqual([LETRA.id])
    expect(rotas.destinoDoTocarDaVisualizacao(LETRA.id)).toEqual({
      acao: 'push',
      rota: 'Stage',
      params: { avulsa: LETRA.id, origem: 'visualizacao' },
    })
    expect(core.nomeDoVoltarDoAvulso('visualizacao')).toBe('Voltar para a visualização')
  })
})

// ---------------------------------------------------------------------------------------------------------------
describe('N4-R6 — a linha da biblioteca fica tocável: o toque visualiza', () => {
  const lista = [LETRA, CIFRA_SECOES]
  function biblioteca(onVisualizar: (id: string) => void, onTocar: (id: string) => void = () => undefined): React.JSX.Element {
    return (
      <LibraryScreen
        contents={lista}
        filesPresent={new Set()}
        online
        sync={{ fase: 'ok', syncedAtMs: Date.now() }}
        temCache
        onTentarNovamente={() => undefined}
        onVoltar={() => undefined}
        onTocar={onTocar}
        onVisualizar={onVisualizar}
      />
    )
  }

  it('a linha é um alvo com o nome *Ver “{título}”* (P-F7); o toque abre V desta música', async () => {
    const viu: string[] = []
    await montar(biblioteca((id) => viu.push(id)))
    const linha = exige('lib-linha-00000001')
    expect(linha.getAttribute('role')).toBe('button')
    expect(nome('lib-linha-00000001')).toBe('Ver “Manhã de ensaio”')
    await tocar('lib-linha-00000001')
    expect(viu).toEqual([LETRA.id])
  })

  it('a estrela e o ▶ continuam controles próprios: o toque neles NÃO visualiza', async () => {
    const viu: string[] = []
    const tocou: string[] = []
    await montar(biblioteca((id) => viu.push(id), (id) => tocou.push(id)))
    await tocar('lib-tocar-00000001')
    await tocar('lib-favoritar-00000001')
    expect(tocou).toEqual([LETRA.id])
    expect(fav.pedidos.length).toBe(1)
    expect(viu).toEqual([])
  })

  it('os testIDs novos de V são todos `view-*` (G2: adição); os da linha não mudam', async () => {
    await montar(tela())
    const novos = testIDs().filter((t) => !['corpo', 'aviso-motivo', 'aviso-acao'].includes(t))
    for (const t of novos) expect(t, t).toMatch(/^view-/)
  })
})
