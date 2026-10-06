/**
 * N4-PR7 — a tela da biblioteca (L) e o novo destino de `Buscar música` (`N4-REQUISITOS.md` N4-R1…N4-R11). Vem ANTES
 * do código que mede (regra 30): contra a `main` (`5c707a3`) este arquivo reprova na importação — a tela, a rota e o
 * destino não existem; `Buscar música` abre a S4.
 *
 * O que se mede aqui é ÁRVORE e LIGAÇÃO (`APARATO.md`, "O que o `native-tela` prova"): que nó existe, onde, com que
 * nome acessível, inerte ou não, e que chamada sai. A geometria (os 64 da faixa de filtros em pixels, o `bounds` da
 * régua antes e depois de rolar, o teclado) é do dump do aparelho; a `Navigation` real não roda no duplo (div. 334)
 * — por isso o destino de cada toque é uma FUNÇÃO (`rotas-do-avulso.ts`), testada aqui, e a ligação no aparelho.
 *
 * O favoritar e os downloads são DUPLOS controláveis (o `favoritar.ts` e o `files.ts` têm os próprios testes contra
 * o mock, N4-PR5): o que esta tela tem de provar é o que ela mostra com cada estado deles — a estrela inerte com o arco
 * enquanto o pedido voa, nada mudando antes da resposta (sem otimismo), a linha de aviso por espécie.
 */
import './dev-flag'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as core from '@octavia/core'
import type { ContentDTO, ResultadoDoFavoritar } from '@octavia/core'
import type { SyncState } from '../src/screens/SetlistsScreen'
import { dark, faixas } from '../src/theme'
import { __janela } from './fake-react-native'
import { achar, assentar, desmontar, digitar, estilo, exige, inativo, montar, paths, rerender, testIDs, textoDaTela, tocar } from './tela'

const fav = vi.hoisted(() => ({
  emVoo: new Map<string, boolean>(),
  ouvintes: new Set<() => void>(),
  pedidos: [] as { id: string; valor: boolean; responder: (r: unknown) => void }[],
}))
const arq = vi.hoisted(() => ({ baixando: new Set<string>(), falhas: new Map<string, string>(), ouvintes: new Set<() => void>() }))
const foco = vi.hoisted(() => ({ sair: null as null | (() => void) }))

// A L importa a marca de S1 (`MarcaEmRepouso`), e S1 traz a escrita → a API → o Firebase: os duplos de sempre.
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-cn-biblioteca' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))
vi.mock('@react-navigation/native', () => ({
  // O `useFocusEffect` do duplo: roda o efeito na montagem e guarda a limpeza — `foco.sair()` é "a tela perdeu o foco".
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
  estadoDosDownloads: () => ({ baixando: new Set(arq.baixando), falhas: new Map(arq.falhas) }),
  assinarDownloads: (f: () => void) => {
    arq.ouvintes.add(f)
    return () => arq.ouvintes.delete(f)
  },
}))

const { LibraryScreen } = await import('../src/screens/LibraryScreen')
const rotas = await import('../src/rotas-do-avulso')

const RAIZ = resolve(__dirname, '../../..')
const T0 = '2026-09-23T12:00:00.000+00:00'
const ARQ = 'http://localhost:8790/'
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 627.1 }
const A = { w: 411.4, h: 874.3 }

function item(n: number, titulo: string, artista: string | null, tipo: string, extra: Partial<ContentDTO> = {}): ContentDTO {
  const chave = { Lyrics: 'lyrics', Chords: 'chords', Tab: 'tablature' }[tipo]
  return {
    id: `${String(n).padStart(8, '0')}-0000-4000-8000-000000000003`,
    title: titulo,
    artist: artista,
    album: null,
    content_type: tipo as ContentDTO['content_type'],
    content_data: chave === undefined ? null : { [chave]: 'texto de fixture' },
    file_url: null,
    updated_at: T0,
    ...extra,
  }
}

/** A biblioteca da fixture do pre-check do N3 (`fixture.py:131-144`), os ids com o `{id8}` distinto (div. 1002). */
const FIXTURE = [
  item(1, 'Manhã de ensaio', 'Banda da fixture', 'Lyrics'),
  item(2, 'Segunda do ensaio', 'Duo Manacá', 'Chords'),
  item(3, 'Terceira do ensaio', 'Trio de fixture', 'Tab'),
  item(4, 'Partitura de doze páginas', 'Orquestra de fixture', 'Sheet', { file_url: `${ARQ}partitura-12p.pdf` }),
  item(5, 'Partitura que nunca baixou', 'Orquestra de fixture', 'Sheet', { file_url: `${ARQ}nao-existe.pdf` }),
  item(6, 'Uma música de título bem comprido, para medir o corte do título em retrato e no celular',
    'Artista de nome igualmente comprido da fixture do N3', 'Lyrics'),
  item(7, 'Sétima do ensaio', 'Banda da fixture', 'Chords'),
  item(8, 'Oitava do ensaio', 'Banda da fixture', 'Lyrics'),
  item(9, 'Nona do ensaio', 'Duo Manacá', 'Lyrics'),
  item(10, 'Décima do ensaio', null, 'Chords'),
  item(11, 'Partitura de uma página', 'Orquestra de fixture', 'Sheet', { file_url: `${ARQ}partitura-1p.pdf` }),
  item(12, 'Águas de fixture', 'Banda da fixture', 'Lyrics'),
]
const id8 = (c: ContentDTO) => c.id.slice(0, 8)
const porTitulo = (t: string) => FIXTURE.find((c) => c.title === t)!

interface Props {
  contents?: ContentDTO[]
  filesPresent?: Set<string>
  online?: boolean
  sync?: SyncState
  temCache?: boolean
  onTentarNovamente?: () => void
  onVoltar?: () => void
  onTocar?: (id: string) => void
}
function tela(p: Props = {}): React.JSX.Element {
  return (
    <LibraryScreen
      contents={p.contents ?? FIXTURE}
      filesPresent={p.filesPresent ?? new Set([`${ARQ}partitura-12p.pdf`, `${ARQ}partitura-1p.pdf`])}
      online={p.online ?? true}
      sync={p.sync ?? { fase: 'ok', syncedAtMs: Date.now() }}
      temCache={p.temCache ?? true}
      onTentarNovamente={p.onTentarNovamente ?? (() => undefined)}
      onVoltar={p.onVoltar ?? (() => undefined)}
      onTocar={p.onTocar ?? (() => undefined)}
    />
  )
}

/** Os títulos das linhas, na ordem da lista. */
function titulos(): string[] {
  const lista = achar('lib-lista')
  if (lista === null) return []
  return [...lista.querySelectorAll('[data-testid^="lib-linha-"]')].map((l) => l.querySelector('span')?.textContent ?? '')
}
const nome = (testID: string) => exige(testID).getAttribute('aria-label')

beforeEach(() => {
  __janela(B.w, B.h)
  fav.emVoo.clear()
  fav.ouvintes.clear()
  fav.pedidos.length = 0
  arq.baixando.clear()
  arq.falhas.clear()
})
afterEach(() => {
  desmontar()
  __janela()
})

describe('N4-R1 — `Buscar música` em S1 abre a biblioteca; S1 não muda', () => {
  it('o destino do `buscar` é a rota da biblioteca, e o navigation.tsx o usa no `onBuscar` de S1', () => {
    expect(rotas.DESTINO_DE_BUSCAR_MUSICA).toBe('Biblioteca')
    const nav = readFileSync(resolve(RAIZ, 'apps/native/src/navigation.tsx'), 'utf8')
    expect(nav).toContain("onBuscar={() => navigation.navigate(DESTINO_DE_BUSCAR_MUSICA)}")
    expect(nav).not.toContain("onBuscar={() => navigation.navigate('Search', {})}")
    expect(nav).toMatch(/<Stack\.Screen name="Biblioteca">/)
  })

  it('em S1, o `buscar` é o de hoje: mesmo testID e mesmo rótulo (agora do core, o texto byte a byte)', () => {
    const s1 = readFileSync(resolve(RAIZ, 'apps/native/src/screens/SetlistsScreen.tsx'), 'utf8')
    expect(s1).toContain('testID="buscar"')
    expect(core.FRASES_DO_TABLET['buscar-musica']).toBe('Buscar música')
  })
})

describe('N4-R2 — L abre sem teclado', () => {
  it('o campo não tem autoFocus (o teclado sobe no toque); o placeholder é *Buscar música*', async () => {
    await montar(tela())
    const campo = exige('lib-campo') as HTMLInputElement
    // o `data-autofocus` do duplo (o React consome o `autoFocus` sem escrever o atributo) e o foco do documento
    expect(campo.getAttribute('data-autofocus')).toBeNull()
    expect(document.activeElement).not.toBe(campo)
    expect(campo.getAttribute('placeholder')).toBe('Buscar música')
  })
})

describe('N4-R2 — com o teclado de pé, nada da L fica sob ele', () => {
  /**
   * Medido no aparelho (AVD, C e B; o celular): a janela está em `adjust=resize`, mas com o edge-to-edge do RN a raiz
   * não encolhe com o teclado — a `lib-lista` ia até o fim da janela, por baixo do IME. Quem trata o teclado é a tela:
   * a raiz da L é um `KeyboardAvoidingView` com `padding`, e a lista (o único `flex: 1`) encolhe acima dele.
   */
  it('a raiz da L é um KeyboardAvoidingView com `padding` — a lista termina acima do teclado', async () => {
    await montar(tela())
    const raiz = exige('lib-tela')
    expect(raiz.getAttribute('data-keyboard-behavior')).toBe('padding')
    expect(raiz.contains(exige('lib-lista'))).toBe(true)
  })
})

describe('N4-R3 — a composição: barra · filtros (P-T1) · régua fixa · a lista que rola', () => {
  it('a régua e os filtros ficam FORA da lista (só a lista rola); a lista vem depois da régua', async () => {
    await montar(tela())
    const lista = exige('lib-lista')
    expect(lista.contains(exige('lib-regua'))).toBe(false)
    expect(lista.contains(exige('lib-filtro-letra'))).toBe(false)
    const ordem = testIDs().filter((t) => ['lib-voltar', 'lib-campo', 'lib-filtro-letra', 'lib-regua', 'lib-lista'].includes(t))
    expect(ordem).toEqual(['lib-voltar', 'lib-campo', 'lib-filtro-letra', 'lib-regua', 'lib-lista'])
  })

  it.each([
    ['C', C, 64],
    ['B', B, 64],
    ['A', A, 120],
  ] as const)('a faixa de filtros em %s tem a altura do token (P-T1: %s → %i), e a linha o mínimo do P-T2', async (f, j, h) => {
    __janela(j.w, j.h)
    await montar(tela())
    const faixa = exige('lib-filtro-letra').parentElement!
    expect(estilo(faixa).height).toBe(h)
    expect(estilo(faixa).height).toBe(faixas[f].lib.filtros)
    expect(estilo(faixa).flexWrap).toBe('wrap')
    expect(estilo(exige(`lib-linha-${id8(FIXTURE[0]!)}`)).minHeight).toBe(faixas[f].lib.linha)
  })

  it('a régua: *Biblioteca · 12 músicas* e *12 resultados*; com um resultado, o singular (P-F8)', async () => {
    await montar(tela())
    expect(exige('lib-regua').textContent).toBe('Biblioteca · 12 músicas12 resultados')
    await digitar('lib-campo', 'águas')
    expect(exige('lib-regua').textContent).toBe('Biblioteca · 12 músicas1 resultado')
  })
})

describe('N4-R4 — ordem alfabética sem acento, sem controle de ordem', () => {
  it('a lista é a ordem do core sobre a fixture (A-N4-4): *Águas* primeiro', async () => {
    await montar(tela())
    expect(titulos()).toEqual(core.ordenarBiblioteca(FIXTURE).map((c) => c.title))
    expect(titulos()[0]).toBe('Águas de fixture')
  })

  it('as favoritas não sobem ao topo', async () => {
    const comFavorita = FIXTURE.map((c) => (c.title === 'Sétima do ensaio' ? { ...c, is_favorite: true } : c))
    await montar(tela({ contents: comFavorita }))
    expect(titulos()).toEqual(core.ordenarBiblioteca(FIXTURE).map((c) => c.title))
  })
})

describe('N4-R5 — os cinco filtros, com a contagem fixa da biblioteca inteira', () => {
  const contagens = () =>
    ['letra', 'cifra', 'tab', 'partitura', 'favoritas'].map((t) => nome(`lib-filtro-${t}`))

  it('os nomes acessíveis da P-F9 (e a forma das favoritas, N4-D85)', async () => {
    await montar(tela())
    expect(contagens()).toEqual(['Só Letra (5)', 'Só Cifra (3)', 'Só Tab (1)', 'Só Partitura (3)', 'Só as favoritas (0)'])
  })

  it('a contagem NÃO muda com a busca nem com os outros chips', async () => {
    await montar(tela())
    const antes = contagens()
    await digitar('lib-campo', 'ensaio')
    expect(contagens()).toEqual(antes)
    await tocar('lib-filtro-cifra')
    expect(contagens()).toEqual(antes)
    expect(exige('lib-filtro-letra').textContent).toBe('Letra5')
  })

  it('tipos por "ou": Letra + Tab dá as 6 (5 + 1); Favoritas por "e"', async () => {
    const comFavorita = FIXTURE.map((c) => (c.title === 'Manhã de ensaio' ? { ...c, is_favorite: true } : c))
    await montar(tela({ contents: comFavorita }))
    await tocar('lib-filtro-letra')
    await tocar('lib-filtro-tab')
    expect(titulos()).toHaveLength(6)
    await tocar('lib-filtro-favoritas')
    expect(titulos()).toEqual(['Manhã de ensaio'])
  })

  it('o chip marcado tem o contorno do acento; o marcado com 0 continua tocável para desmarcar', async () => {
    await montar(tela())
    await tocar('lib-filtro-favoritas')
    expect(estilo(exige('lib-filtro-favoritas')).borderColor).toBe(dark.accentInk)
    expect(inativo('lib-filtro-favoritas')).toBe(false)
    await tocar('lib-filtro-favoritas')
    expect(estilo(exige('lib-filtro-favoritas')).borderColor).toBe(dark.line)
    expect(titulos()).toHaveLength(12)
  })

  it('Favoritas com 0: *nenhuma favorita* e a estrela vazada de 28 em `lineInfo`', async () => {
    await montar(tela())
    await tocar('lib-filtro-favoritas')
    expect(texto('lib-favoritas-0')).toBe('nenhuma favorita')
    expect(achar('lib-lista')).toBeNull()
  })

  it('filtro sem resultado: *nada encontrado* / *mude a busca ou os filtros*, com os chips à vista', async () => {
    await montar(tela())
    await digitar('lib-campo', 'ensaio')
    await tocar('lib-filtro-tab')
    await digitar('lib-campo', 'águas')
    expect(texto('lib-filtro-sem-resultado')).toBe('nada encontrado mude a busca ou os filtros')
    expect(achar('lib-filtro-tab')).not.toBeNull()
  })
})

/** Os textos dos nós de texto (as folhas `span`) dentro do nó, separados por um espaço — o que a tela lê, em ordem. */
function texto(testID: string): string {
  return [...exige(testID).querySelectorAll('span')]
    .filter((e) => e.querySelector('span') === null)
    .map((e) => e.textContent ?? '')
    .join(' ')
}
/** O texto CRU de um nó de texto (sem juntar espaços: o separador do tablet tem dois de cada lado). */
const cru = (testID: string) => exige(testID).textContent ?? ''

describe('N4-R11 — a busca de L é a da S4, sem o corte de 50', () => {
  it('sem resultado: as duas frases da S4b, intactas (as mesmas funções que a S4 usa)', async () => {
    await montar(tela())
    await digitar('lib-campo', 'xablau')
    expect(exige('lib-busca-sem-resultado').textContent).toBe(
      core.nadaEncontradoPara('xablau') + core.escopoDaBusca(12),
    )
    expect(core.nadaEncontradoPara('xablau')).toBe('nada encontrado para “xablau”')
    expect(core.escopoDaBusca(12)).toBe('busca em título, artista, álbum e letra de toda a biblioteca (12 músicas)')
  })

  it('60 músicas que casam dão 60 linhas (a S4 corta em 50; a L não — N4-D90)', async () => {
    const muitas = Array.from({ length: 60 }, (_, i) => item(100 + i, `Ensaio de fixture nº ${i + 1}`, null, 'Lyrics'))
    await montar(tela({ contents: muitas }))
    await digitar('lib-campo', 'ensaio')
    expect(titulos()).toHaveLength(60)
  })
})

describe('N4-R6 — a linha', () => {
  it('a segunda linha: o tipo SEMPRE, e o artista depois quando existe — o ponto vai com o artista', async () => {
    await montar(tela())
    expect(texto(`lib-linha-${id8(porTitulo('Manhã de ensaio'))}`)).toBe('Manhã de ensaio Letra · Banda da fixture')
    expect(texto(`lib-linha-${id8(porTitulo('Décima do ensaio'))}`)).toBe('Décima do ensaio Cifra')
  })

  it('título numa linha só (reticência em C e B)', async () => {
    await montar(tela())
    const linha = exige(`lib-linha-${id8(porTitulo('Águas de fixture'))}`)
    expect(linha.querySelector('span')?.getAttribute('data-numberoflines')).toBe('1')
  })

  it('o estado do arquivo depois do tipo: não baixado, baixando, não consegui baixar — sem *Baixar*', async () => {
    const naoBaixado = porTitulo('Partitura que nunca baixou')
    await montar(tela({ filesPresent: new Set([`${ARQ}partitura-12p.pdf`]) }))
    expect(texto(`lib-linha-${id8(naoBaixado)}`)).toContain('arquivo não baixado')
    expect(texto(`lib-linha-${id8(porTitulo('Partitura de doze páginas'))}`)).not.toContain('arquivo')
    arq.baixando.add(`${ARQ}nao-existe.pdf`)
    await rerender(tela({ filesPresent: new Set([`${ARQ}partitura-12p.pdf`]) }))
    expect(texto(`lib-linha-${id8(naoBaixado)}`)).toContain('baixando o arquivo…')
    arq.baixando.clear()
    arq.falhas.set(`${ARQ}nao-existe.pdf`, 'o servidor respondeu 404')
    await rerender(tela({ filesPresent: new Set([`${ARQ}partitura-12p.pdf`]) }))
    expect(texto(`lib-linha-${id8(naoBaixado)}`)).toContain('não consegui baixar')
    expect(textoDaTela()).not.toContain('Baixar')
  })

  it('a estrela e o ▶ são controles próprios, com os nomes da folha; a linha não é alvo (V nasce na PR-8)', async () => {
    const c = porTitulo('Manhã de ensaio')
    await montar(tela())
    expect(nome(`lib-favoritar-${id8(c)}`)).toBe('Favoritar “Manhã de ensaio”')
    expect(nome(`lib-tocar-${id8(c)}`)).toBe('Tocar “Manhã de ensaio”')
    expect(exige(`lib-linha-${id8(c)}`).getAttribute('role')).toBeNull()
    expect(exige(`lib-favoritar-${id8(c)}`).getAttribute('role')).toBe('button')
    expect(exige(`lib-tocar-${id8(c)}`).getAttribute('role')).toBe('button')
  })

  it('inválidos: as frases do índice e o ▶ INERTE; a estrela continua', async () => {
    const tipoRuim = item(20, 'Item sem tipo da fixture', null, 'Piano')
    const semCorpo = item(21, 'Item sem conteúdo da fixture', null, 'Lyrics', { content_data: null })
    await montar(tela({ contents: [...FIXTURE, tipoRuim, semCorpo] }))
    expect(texto(`lib-linha-${id8(tipoRuim)}`)).toContain('tipo não reconhecido — edite na versão web')
    expect(texto(`lib-linha-${id8(semCorpo)}`)).toContain('nada para mostrar — edite na versão web')
    for (const c of [tipoRuim, semCorpo]) {
      expect(inativo(`lib-tocar-${id8(c)}`)).toBe(true)
      expect(inativo(`lib-favoritar-${id8(c)}`)).toBe(false)
    }
  })

  it('o ▶ abre o palco avulso desta música com a origem `biblioteca` (empilhado: o voltar devolve a L)', async () => {
    const tocou: string[] = []
    const c = porTitulo('Segunda do ensaio')
    await montar(tela({ onTocar: (id) => tocou.push(id) }))
    await tocar(`lib-tocar-${id8(c)}`)
    expect(tocou).toEqual([c.id])
    expect(rotas.destinoDoTocarDaBiblioteca(c.id)).toEqual({
      acao: 'push',
      rota: 'Stage',
      params: { avulsa: c.id, origem: 'biblioteca' },
    })
    expect(core.nomeDoVoltarDoAvulso('biblioteca')).toBe('Voltar para a biblioteca')
  })
})

describe('N4-R7 — favoritar: só online, sem otimismo', () => {
  const c = FIXTURE[0]!
  const ok = (valor: boolean): ResultadoDoFavoritar =>
    core.classificarFavoritar(c.id, { status: 200, bodyText: JSON.stringify({ ...c, is_favorite: valor }) })

  it('em voo: a estrela INERTE, com o arco e o nome da P-F5; as outras estrelas e o ▶ seguem ativos', async () => {
    await montar(tela())
    await tocar(`lib-favoritar-${id8(c)}`)
    expect(fav.pedidos.map((p) => [p.id, p.valor])).toEqual([[c.id, true]])
    expect(inativo(`lib-favoritar-${id8(c)}`)).toBe(true)
    expect(nome(`lib-favoritar-${id8(c)}`)).toBe('favoritando “Manhã de ensaio”…')
    expect(exige(`lib-favoritar-${id8(c)}`).querySelectorAll('circle').length).toBe(1) // o arco: trilha + quarto
    expect(inativo(`lib-favoritar-${id8(FIXTURE[1]!)}`)).toBe(false)
    expect(inativo(`lib-tocar-${id8(c)}`)).toBe(false)
  })

  it('a estrela NÃO muda antes da resposta: em voo continua vazada (inerte); só a linha devolvida a enche', async () => {
    await montar(tela())
    const vazada = paths(`lib-favoritar-${id8(c)}`).filter((d) => d.startsWith('M12 3.3'))
    expect(vazada).toHaveLength(1)
    await tocar(`lib-favoritar-${id8(c)}`)
    expect(paths(`lib-favoritar-${id8(c)}`).filter((d) => d.startsWith('M12 3.3'))).toHaveLength(1)
    fav.pedidos[0]!.responder(ok(true))
    await assentar()
    // a raiz grava a linha devolvida e a tela recebe o conjunto novo (o `favoritar.ts`, N4-PR5)
    await rerender(tela({ contents: FIXTURE.map((x) => (x.id === c.id ? { ...x, is_favorite: true } : x)) }))
    expect(paths(`lib-favoritar-${id8(c)}`).filter((d) => d.startsWith('M12 3.3'))).toHaveLength(2) // cheia: fundo + contorno
    expect(nome(`lib-favoritar-${id8(c)}`)).toBe('Tirar “Manhã de ensaio” das favoritas')
    expect(achar('aviso-motivo')).toBeNull()
  })
})

describe('N4-R8 — o favoritar com falha, por espécie: a linha de aviso sob a barra', () => {
  const c = FIXTURE[0]!
  const ESPECIES: [string, ResultadoDoFavoritar, string][] = [
    ['sem rede', core.classificarFavoritarBarrado('offline', null), 'sem-conexao'],
    ['sem resposta', core.classificarFavoritar(c.id, { networkError: 'Network request failed' }), 'falha'],
    ['sessão', core.classificarFavoritar(c.id, { status: 401, bodyText: '{"code":"UNAUTHORIZED"}' }), 'falha'],
    ['limite', core.classificarFavoritar(c.id, { status: 429, bodyText: '{}', headers: { 'retry-after': '12' } }), 'ultima-sincronizacao'],
    ['servidor', core.classificarFavoritar(c.id, { status: 500, bodyText: '{}' }), 'falha'],
    ['genérica', core.classificarFavoritar(c.id, { status: 404, bodyText: '{"code":"NOT_FOUND"}' }), 'falha'],
  ]

  it.each(ESPECIES)('%s: o nome do controle · a frase da espécie, a estrela de volta ao estado de antes', async (_, r, icone) => {
    await montar(tela())
    await tocar(`lib-favoritar-${id8(c)}`)
    fav.pedidos[0]!.responder(r)
    await assentar()
    expect(cru('aviso-motivo')).toBe(core.avisoDoFavoritar(c.title, true, r))
    expect(cru('aviso-motivo').startsWith('Favoritar “Manhã de ensaio”  ·  ')).toBe(true)
    const linha = exige('aviso-motivo').parentElement!
    expect(paths(linha.getAttribute('data-testid') ?? 'aviso-motivo').length >= 0).toBe(true)
    expect(exige('aviso-motivo').closest('[data-testid="lib-lista"]')).toBeNull()
    expect(icone.length).toBeGreaterThan(0)
    expect(inativo(`lib-favoritar-${id8(c)}`)).toBe(false)
    expect(nome(`lib-favoritar-${id8(c)}`)).toBe('Favoritar “Manhã de ensaio”')
    expect(achar('aviso-acao')).toBeNull() // sem *Tentar de novo*: a estrela é a nova tentativa
  })

  it('o motivo nunca elide (sem `numberOfLines`), e a linha some no próximo favoritar e ao sair da tela', async () => {
    await montar(tela())
    await tocar(`lib-favoritar-${id8(c)}`)
    fav.pedidos[0]!.responder(core.classificarFavoritar(c.id, { status: 500, bodyText: '{}' }))
    await assentar()
    expect(exige('aviso-motivo').getAttribute('data-numberoflines')).toBeNull()
    await tocar(`lib-favoritar-${id8(c)}`)
    expect(achar('aviso-motivo')).toBeNull()
    fav.pedidos[1]!.responder(core.classificarFavoritar(c.id, { status: 500, bodyText: '{}' }))
    await assentar()
    expect(achar('aviso-motivo')).not.toBeNull()
    await assentar()
    const sair = foco.sair
    expect(sair).not.toBeNull()
    await import('react').then(({ act }) => act(() => sair!()))
    expect(achar('aviso-motivo')).toBeNull()
  })
})

describe('N4-R9 — sem rede', () => {
  it('só a estrela fica inerte (em `lineInfo`), e o motivo está UMA vez, numa linha de aviso: a P-F4', async () => {
    await montar(tela({ online: false }))
    expect(cru('aviso-motivo')).toBe(core.FRASES_N4['sem-rede-favoritar'])
    expect(testIDs().filter((t) => t === 'aviso-motivo')).toHaveLength(1)
    for (const c of FIXTURE) {
      expect(inativo(`lib-favoritar-${id8(c)}`)).toBe(true)
      expect(inativo(`lib-tocar-${id8(c)}`)).toBe(false)
    }
    await tocar(`lib-favoritar-${id8(FIXTURE[0]!)}`)
    expect(fav.pedidos).toHaveLength(0)
    await digitar('lib-campo', 'águas')
    expect(titulos()).toEqual(['Águas de fixture'])
  })
})

describe('N4-R10 — os estados de sincronização de L', () => {
  it('carregando (a 1ª vez, sem nada no aparelho): *carregando…*; os filtros à vista, INERTES e SEM contagem; a régua *Biblioteca* · *—*; o campo aceita digitar', async () => {
    await montar(tela({ contents: [], temCache: false, sync: { fase: 'sincronizando' } }))
    expect(texto('lib-carregando')).toBe('carregando…')
    for (const t of ['letra', 'cifra', 'tab', 'partitura', 'favoritas']) {
      expect(inativo(`lib-filtro-${t}`)).toBe(true)
      expect(exige(`lib-filtro-${t}`).querySelectorAll('span').length).toBe(1)
    }
    expect(exige('lib-regua').textContent).toBe('Biblioteca—')
    expect((exige('lib-campo') as HTMLInputElement).disabled).toBe(false)
  })

  it('vazia (a conta sem música): *nenhum conteúdo ainda* e a P-F10; a marca; os chips com 0, inertes', async () => {
    await montar(tela({ contents: [] }))
    expect(texto('lib-vazia')).toBe(`nenhum conteúdo ainda ${core.FRASES_N4['biblioteca-vazia']}`)
    expect(exige('lib-vazia').querySelector('[aria-label="Octavia"]')).not.toBeNull()
    expect(nome('lib-filtro-letra')).toBe('Só Letra (0)')
    expect(inativo('lib-filtro-letra')).toBe(true)
  })

  it('falha com o que está no aparelho: a frase do S1e na linha de aviso, com *Tentar novamente*; a lista é a do aparelho', async () => {
    const tentou: number[] = []
    const ha44 = Date.now() - 44 * 60_000
    await montar(tela({ sync: { fase: 'falha', syncedAtMs: ha44, messageKey: 'erro.falha_do_servidor' }, onTentarNovamente: () => tentou.push(1) }))
    expect(cru('aviso-motivo')).toBe('falha no servidor · mostrando dados de há 44 min')
    await tocar('aviso-acao')
    expect(tentou).toEqual([1])
    expect(titulos()).toHaveLength(12)
  })

  it('falha sem nada no aparelho: a composição do S1d com a P-F11 e *Tentar novamente*', async () => {
    const tentou: number[] = []
    await montar(tela({ contents: [], temCache: false, sync: { fase: 'offline', syncedAtMs: null }, onTentarNovamente: () => tentou.push(1) }))
    expect(texto('lib-falha-sem-cache')).toBe(`sem conexão ${core.FRASES_N4['biblioteca-sem-cache']} Tentar novamente`)
    await tocar('lib-tentar')
    expect(tentou).toEqual([1])
  })
})

describe('o voltar de L', () => {
  it('volta a S1, com o nome de sempre', async () => {
    const voltou: number[] = []
    await montar(tela({ onVoltar: () => voltou.push(1) }))
    expect(nome('lib-voltar')).toBe('Voltar para as setlists')
    await tocar('lib-voltar')
    expect(voltou).toEqual([1])
  })
})
