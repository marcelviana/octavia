/**
 * N4-PR6 — o palco avulso SEM HOSPEDEIRA (N4-R16), a busca dele (N4-R17) e o estado de formato no palco (N4-D43,
 * N4-D83). Vem ANTES do código que mede (regra 30): contra a `main` estes testes reprovam — hoje uma música aberta
 * fora de setlist entra no palco pendurada na primeira setlist da lista (`navigation.tsx`, o `replace` da busca:
 * `setlistId: setlist?.id ?? dados.lista[0]?.id ?? ''`), a barra mostra o nome dela, a barra de baixo tem o índice
 * dela, o prefetch sob demanda baixa os arquivos dela (div. 964), e com zero setlists o `''` cai no placeholder sem
 * controle (div. 1001).
 *
 * O que estes testes medem é ÁRVORE e LIGAÇÃO (`APARATO.md`, "O que o `native-tela` prova"): que nó existe, dentro de
 * quem, com que nome acessível, e que chamada sai. A geometria (a largura que o título ganha, os 66 dos controles,
 * as bordas) é do dump do aparelho; a `Navigation` real não roda no duplo (div. 334) — por isso o destino de cada
 * toque é uma FUNÇÃO (`rotas-do-avulso.ts`), testada aqui, e a ligação no aparelho.
 *
 * **O palco com setlist não muda** (N4-D30): os controles do bloco "com hospedeira" passam hoje e continuam passando;
 * a invariante de verdade dele é o G-inv 18/18 contra a `B3-referencia-paisagem/`.
 */
import './dev-flag'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import * as core from '@octavia/core'
import type { StageScreenProps } from '../src/screens/StageScreen'
import { colors } from '../src/theme'
import { __reset } from './fake-expo-file-system'
import { __janela } from './fake-react-native'
import { achar, assentar, desmontar, estilo, exige, montar, tocar } from './tela'

const prefetch = vi.hoisted(() => ({ chamadas: [] as unknown[][] }))
vi.mock('expo-keep-awake', () => ({ activateKeepAwakeAsync: async () => undefined, deactivateKeepAwake: () => undefined }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }))
vi.mock('../src/prefetch', () => ({
  prefetchDemanda: async (...args: unknown[]) => {
    prefetch.chamadas.push(args)
  },
}))

const RAIZ = resolve(__dirname, '../../..')
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }
const BUCKET = 'https://host/storage/v1/object/public/content-files'

const LETRA: ContentDTO = {
  id: 'c-1', title: 'Manhã de ensaio', artist: 'Banda da fixture', album: null,
  content_type: 'Lyrics', content_data: { lyrics: '[Intro] C Am F G' }, file_url: null, updated_at: T0,
}
const PDF: ContentDTO = {
  id: 'c-2', title: 'Partitura da fixture', artist: null, album: null,
  content_type: 'Sheet', content_data: null, file_url: `${BUCKET}/p.pdf`, updated_at: T0,
}
/** N4-D43 — o formato que o app ainda não mostra, pela extensão (a fixture do formato, `fixture-formato.py`). */
const JPG: ContentDTO = {
  id: 'c-3', title: 'Partitura escaneada de fixture', artist: 'Orquestra de fixture', album: null,
  content_type: 'Sheet', content_data: null, file_url: `${BUCKET}/partitura-escaneada.jpg`, updated_at: T0,
}
const TODOS = new Map([LETRA, PDF, JPG].map((c) => [c.id, c]))

/** A setlist hospedeira de hoje: a primeira da lista, com o nome que o avulso NÃO pode mostrar. */
function setlistDe(ids: string[]): SetlistDTO {
  return {
    id: SL, name: 'Ensaio de retrato', performance_date: null, venue: null, updated_at: T0,
    setlist_songs: ids.map((cid, i) => ({
      id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: cid, position: i + 1, notes: null, content: null,
    })),
  }
}

/** O palco avulso SEM hospedeira: `setlist: null`, e a origem que dá o nome ao voltar. */
function semHospedeira(contentId: string, extra: Partial<StageScreenProps> = {}): StageScreenProps {
  return {
    setlist: null,
    contentById: TODOS,
    posicao: 1,
    avulsaContentId: contentId,
    origemDoAvulso: 'busca',
    online: true,
    onPosicao: () => undefined,
    onFim: () => undefined,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
    ...extra,
  } as StageScreenProps
}

function comSetlist(extra: Partial<StageScreenProps> = {}): StageScreenProps {
  return {
    setlist: setlistDe([LETRA.id, PDF.id, JPG.id]),
    contentById: TODOS,
    posicao: 1,
    avulsaContentId: null,
    origemDoAvulso: null,
    online: true,
    onPosicao: () => undefined,
    onFim: () => undefined,
    onIndice: () => undefined,
    onBusca: () => undefined,
    onSair: () => undefined,
    onArquivosMudaram: () => undefined,
    ...extra,
  } as StageScreenProps
}

function noDeTexto(t: string | RegExp): HTMLElement {
  const todos = [...document.querySelectorAll<HTMLElement>('span')]
  const achados = todos.filter((e) => {
    const x = (e.textContent ?? '').replace(/\s+/g, ' ').trim()
    return typeof t === 'string' ? x === t : t.test(x)
  })
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

/** Os `testID` da barra de baixo, na ordem. */
function base(): string[] {
  const pai = exige('auto-scroll').parentElement as HTMLElement
  return [...pai.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid') ?? '')
}

/** O texto de todos os `span` folha — o que a tela escreve. */
function textos(): string[] {
  return [...document.querySelectorAll<HTMLElement>('span')]
    .filter((e) => e.querySelector('span') === null)
    .map((e) => (e.textContent ?? '').trim())
    .filter((t) => t.length > 0)
}

let StageScreen: typeof import('../src/screens/StageScreen').StageScreen

beforeAll(async () => {
  StageScreen = (await import('../src/screens/StageScreen')).StageScreen
})

beforeEach(() => {
  __reset()
  prefetch.chamadas = []
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  __janela()
  vi.restoreAllMocks()
})

// ------------------------------------------------------------------ N4-R16: a barra de cima

describe('N4-R16 — a barra de cima sem o nome de setlist', () => {
  it('C: `AVULSA` e o título no nó de 64; nenhum nome de setlist em lugar nenhum da tela', async () => {
    __janela(C.w, C.h)
    await montar(<StageScreen {...semHospedeira(LETRA.id)} />)
    const pos = noDeTexto('AVULSA')
    const tit = noDeTexto('Manhã de ensaio · Banda da fixture · Letra')
    const barra = ancestralComum(pos, tit)
    expect(estilo(barra).height).toBe(64)
    expect(pos.parentElement).toBe(barra)
    expect(tit.parentElement).toBe(barra)
    // a barra tem SÓ a posição e o título (o ponto de sem rede, a página e a nota só quando existem)
    expect(barra.children.length).toBe(2)
    expect(textos()).not.toContain('Ensaio de retrato')
  })

  it('B: `AVULSA` na linha 1, sem nome de setlist; o título na linha 2', async () => {
    __janela(B.w, B.h)
    await montar(<StageScreen {...semHospedeira(LETRA.id)} />)
    const pos = noDeTexto('AVULSA')
    const tit = noDeTexto('Manhã de ensaio · Banda da fixture · Letra')
    const barra = ancestralComum(pos, tit)
    expect(estilo(barra).height).toBe(88)
    const linha1 = [...barra.children].find((c) => c.contains(pos)) as HTMLElement
    expect(linha1.contains(tit)).toBe(false)
    expect((linha1.textContent ?? '').trim()).toBe('AVULSA')
    expect(textos()).not.toContain('Ensaio de retrato')
  })

  it('os dois temas: no claro a tinta da barra é `light.text` (N4-E3)', async () => {
    __janela(C.w, C.h)
    await montar(<StageScreen {...semHospedeira(LETRA.id)} />)
    await tocar('tema')
    expect(estilo(noDeTexto('AVULSA')).color).toBe(colors.light.text)
    expect(colors.light.text).toBe('#100F16')
    expect(textos()).not.toContain('Ensaio de retrato')
  })
})

// ------------------------------------------------------------------ N4-R16: a barra de baixo e o voltar

describe('N4-R16 — a barra de baixo sem o índice, e o voltar pela origem', () => {
  it('os quatro de leitura · busca · voltar — sem `indice`', async () => {
    await montar(<StageScreen {...semHospedeira(LETRA.id)} />)
    expect(base()).toEqual(['auto-scroll', 'zoom-menos', 'zoom-mais', 'tema', 'busca', 'sair'])
    expect(achar('indice')).toBeNull()
  })

  const ORIGENS = [
    ['busca', 'Voltar para a busca'],
    ['biblioteca', 'Voltar para a biblioteca'],
    ['visualizacao', 'Voltar para a visualização'],
  ] as const
  for (const [origem, nome] of ORIGENS) {
    it(`origem ${origem}: o voltar se chama "${nome}" e chama o onSair`, async () => {
      let saiu = 0
      await montar(
        <StageScreen {...semHospedeira(LETRA.id, { origemDoAvulso: origem, onSair: () => saiu++ } as Partial<StageScreenProps>)} />,
      )
      expect(exige('sair').getAttribute('aria-label')).toBe(nome)
      await tocar('sair')
      expect(saiu).toBe(1)
    })
  }

  it('a busca do avulso chama o onBusca (a raiz abre a S4 sem setlist — `rotas-do-avulso.ts`)', async () => {
    let buscou = 0
    await montar(<StageScreen {...semHospedeira(LETRA.id, { onBusca: () => buscou++ })} />)
    await tocar('busca')
    expect(buscou).toBe(1)
  })
})

// ------------------------------------------------------------------ div. 964: o prefetch desta música

describe('div. 964 — o prefetch sob demanda do avulso é ESTA música', () => {
  it('sem hospedeira: o palco pede o prefetch sem setlist, com o id desta música', async () => {
    await montar(<StageScreen {...semHospedeira(PDF.id)} />)
    await assentar(20)
    expect(prefetch.chamadas.length).toBeGreaterThan(0)
    for (const args of prefetch.chamadas) {
      expect(args[0]).toBeNull()
      expect(args[3]).toBe(PDF.id)
    }
  })

  it('com setlist (o controle): o prefetch é o da setlist, da posição — como hoje', async () => {
    await montar(<StageScreen {...comSetlist({ posicao: 2 })} />)
    await assentar(20)
    expect(prefetch.chamadas.length).toBeGreaterThan(0)
    expect((prefetch.chamadas[0]![0] as SetlistDTO).id).toBe(SL)
    expect(prefetch.chamadas[0]![2]).toBe(2)
  })
})

// ------------------------------------------------------------------ o arquivo não baixado (N4-D78)

describe('N4-D78 — o S3e do avulso: o de hoje, com o título, e o *Baixar* com a palavra', () => {
  it('sem rede: `s3e` com o título da música e o `baixar` com o texto "Baixar"', async () => {
    await montar(<StageScreen {...semHospedeira(PDF.id, { online: false })} />)
    await assentar(20)
    expect(achar('s3e')).not.toBeNull()
    expect(exige('s3e').textContent).toContain('Partitura da fixture · partitura não está neste aparelho.')
    expect((exige('baixar').textContent ?? '').trim()).toBe('Baixar')
  })
})

// ------------------------------------------------------------------ N4-D43 / N4-D83: o formato

describe('N4-D43, N4-D83 — o formato que o app ainda não mostra, nos dois palcos', () => {
  const FRASE = 'não foi possível abrir o arquivo — confira o formato'

  it('avulso sem hospedeira com `.jpg`: o placeholder de formato com o nome do arquivo; nem S3d nem S3e', async () => {
    await montar(<StageScreen {...semHospedeira(JPG.id)} />)
    await assentar(20)
    expect(achar('s3-formato')).not.toBeNull()
    expect(textos()).toContain(FRASE)
    expect(exige('s3-formato').textContent).toContain('partitura-escaneada.jpg')
    expect(achar('s3d')).toBeNull()
    expect(achar('s3e')).toBeNull()
    expect(achar('s3-baixando')).toBeNull()
  })

  it('palco COM setlist na posição do `.jpg`: o mesmo placeholder (é o mesmo componente)', async () => {
    await montar(<StageScreen {...comSetlist({ posicao: 3 })} />)
    await assentar(20)
    expect(achar('s3-formato')).not.toBeNull()
    expect(textos()).toContain(FRASE)
  })

  it('o controle: o `.pdf` não é formato (o palco segue para o S3d/S3e de hoje)', async () => {
    await montar(<StageScreen {...comSetlist({ posicao: 2, online: false })} />)
    await assentar(20)
    expect(achar('s3-formato')).toBeNull()
    expect(achar('s3e')).not.toBeNull()
  })

  it('a base do G-inv não tem esse caso: todo arquivo da fixture do pre-check do N3 é `.pdf` (div. 1028)', () => {
    const fixture = readFileSync(resolve(RAIZ, 'docs/native/N3-PRECHECK-anexos/instrumentos/fixture.py'), 'utf8')
    const arquivos = [...fixture.matchAll(/arquivo="([^"]+)"/g)].map((m) => m[1]!)
    expect(arquivos.length).toBeGreaterThan(0)
    for (const a of arquivos) expect(core.ehFormatoQueOAppMostra(`${BUCKET}/${a}`), a).toBe(true)
  })
})

// ------------------------------------------------------------------ com hospedeira: não muda (N4-D30)

describe('N4-D30 — o avulso aberto pela busca DENTRO de uma setlist fica como está (controle)', () => {
  it('C: `AVULSA`, o nome da setlist e o índice continuam', async () => {
    __janela(C.w, C.h)
    await montar(<StageScreen {...comSetlist({ avulsaContentId: LETRA.id })} />)
    expect(textos()).toContain('AVULSA')
    expect(textos()).toContain('Ensaio de retrato')
    expect(base()).toEqual(['auto-scroll', 'zoom-menos', 'zoom-mais', 'tema', 'indice', 'busca', 'sair'])
    expect(exige('sair').getAttribute('aria-label')).toBe('Voltar para a busca')
  })
})

// ------------------------------------------------------------------ as rotas (a raiz decide)

describe('rotas-do-avulso — o destino de cada toque, sem `Navigation`', () => {
  let rotas: typeof import('../src/rotas-do-avulso')
  beforeAll(async () => {
    // Pelo caminho numa variável: na `main` o módulo não existe, e o import estático derrubaria o ARQUIVO inteiro
    // na transformação — assim cada teste reprova pelo que mede (o commit 2 mostra a saída).
    const caminho = '../src/rotas-do-avulso'
    rotas = await import(/* @vite-ignore */ caminho).catch(() => ({}) as typeof rotas)
  })
  const sl = setlistDe([LETRA.id, PDF.id])

  it('div. 1001 — da S4 sem setlist (aberta de S1, ou do avulso): EMPILHA o avulso sem hospedeira, origem busca', () => {
    const d = rotas.destinoDoResultado(null, null, JPG.id, null)
    expect(d).toEqual({ acao: 'push', rota: 'Stage', params: { avulsa: JPG.id, origem: 'busca' } })
    // nenhum id de setlist: zero setlists não importa, e nenhuma setlist alheia entra
    expect(JSON.stringify(d)).not.toContain(SL)
  })

  it('da S4 de uma setlist, música dela: o SALTO de hoje (controle)', () => {
    expect(rotas.destinoDoResultado(sl, 1, PDF.id, 2)).toEqual({
      acao: 'navigate', rota: 'Stage', params: { setlistId: SL, position: 2 },
    })
  })

  it('da S4 de uma setlist, música de fora: o avulso COM hospedeira de hoje, no lugar da busca (controle)', () => {
    expect(rotas.destinoDoResultado(sl, 2, JPG.id, null)).toEqual({
      acao: 'replace', rota: 'Stage', params: { setlistId: SL, position: 2, avulsa: JPG.id },
    })
  })

  it('N4-R17 — a busca do avulso sem hospedeira abre a S4 SEM setlist (sem *Nesta setlist*)', () => {
    expect(rotas.destinoDaBuscaDoPalco(null, 1)).toEqual({ acao: 'push', rota: 'Search', params: {} })
  })

  it('a busca do palco com setlist: a de hoje (controle)', () => {
    expect(rotas.destinoDaBuscaDoPalco(SL, 3)).toEqual({
      acao: 'navigate', rota: 'Search', params: { setlistId: SL, posicao: 3 },
    })
  })
})

// ------------------------------------------------------------------ N4-R17: a S4 sem setlist

describe('N4-R17 — a S4 aberta sem setlist não tem *Nesta setlist*', () => {
  it('o termo que acha uma música não traz a régua *Nesta setlist*', async () => {
    const { SearchScreen } = await import('../src/screens/SearchScreen')
    const { digitar } = await import('./tela')
    await montar(
      <SearchScreen contents={[LETRA, PDF, JPG]} setlist={null} posicao={null} online onFechar={() => undefined} onAbrir={() => undefined} />,
    )
    await digitar('campo-busca', 'fixture')
    expect(textos().some((t) => t.startsWith('Nesta setlist'))).toBe(false)
    expect(textos().some((t) => t.startsWith('Biblioteca · '))).toBe(true)
  })
})
