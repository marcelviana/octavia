/**
 * CONTROLES NEGATIVOS DA TELA — N2-PR6 (o picker, sobre S2: o quarto controle
 * da faixa, `Adicionar música`; a S4 com um rodapé; adição por linha com
 * releitura por adição; as marcas "já na setlist · n×"; os cinco estados por
 * linha). Vêm ANTES do código que medem: contra a árvore de hoje reprovam por
 * ausência — não há `picker-abrir` na faixa, não há picker.
 *
 * **O que roda de verdade**: a `IndexScreen` e o picker renderizados com
 * `react-dom` sobre `jsdom` (`tela.tsx`), o `escrever()` da N2-PR2, a camada
 * `api.ts` com o `fetch` do Node, a classificação e a BUSCA do core
 * (`buildIndex`/`searchIndex`/`groupResults`), e o `store.ts` sobre o duplo
 * do `expo-file-system`, contra o mock `src/fixtures/aceite.py`.
 * **O que é duplo**: `react-native`, `react-native-svg`, o Firebase, a sessão
 * e o `expo-network`.
 *
 * **A releitura re-renderiza a tela pelo PAI**, como no app — e aqui o pai é
 * uma raiz de verdade (`Raiz`, abaixo), com o conjunto em `useState`: o
 * `aoReler` o troca, e S2 e o picker se redesenham com ele. É isso que torna
 * mensurável a N2-D30 — a marca `n×`, o total do rodapé e o "n músicas" de S2
 * só sobem com a releitura, nunca com o 201.
 *
 * **A ordem dos eventos** é medida no tempo, não por relógio fixo: o modo
 * `escrita-releitura-fora-de-ordem` segura a PRIMEIRA releitura depois de uma
 * escrita por 600 ms (a foto é tirada ANTES do atraso). Entre o `write op=add
 * … status=201` e o `resync … status=200` há, então, uma janela real — e é
 * nela que o CN olha a tela. A linha do tempo de cada CN de ordem vai para o
 * arquivo de `PICKER_LINHA_DO_TEMPO`, quando a variável existe — e é ela que
 * vai para o anexo (o `stdout` do `afterEach` o Vitest não mostra).
 *
 * **O que estes CNs NÃO medem**: geometria (o campo de 900 × 48, a linha de
 * 80, o rodapé de 64 e de 112, o `Adicionar` ≥ 48) — é do dump do aparelho,
 * §4 da PR.
 */
import './dev-flag'
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { useState } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildIndex, groupResults, searchIndex, type ContentDTO, type SetlistDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { __voltarDoSistema } from './fake-react-native'
import { Mock, portaLivre } from './mock'
import {
  achar,
  assentar,
  desmontar,
  digitar,
  estilo,
  exige,
  inativo,
  montar,
  paths,
  texto,
  textoDaTela,
  tocar,
} from './tela'

let logouts = 0
vi.mock('../src/session', () => ({
  signOutSession: async () => {
    logouts++
  },
}))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-p-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-picker'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'
const NOME = 'Ensaio do picker'

/**
 * A biblioteca da fixture — **escrita por este projeto** (regra "anexo não
 * carrega texto de música"). Doze itens, montados para que "man" case nos
 * QUATRO campos de força diferente do `searchIndex` (título > artista > álbum
 * > corpo) e nos dois grupos do `groupResults`:
 *   - título:  `Manhã de ensaio` (na setlist) e `Romance da fixture` (fora);
 *   - artista: `Duo Manacá`, de `Segunda do ensaio` (na setlist);
 *   - corpo:   `Sétima do ensaio`, cuja letra fala de um comandante (fora).
 * É o que faz "mesma ordem da S4" medir alguma coisa: com um campo só, a
 * ordem seria a do índice e qualquer lista passaria.
 */
const ITENS: Array<[string, string, string]> = [
  ['Manhã de ensaio', 'Banda da fixture', 'letra um'],
  ['Segunda do ensaio', 'Duo Manacá', 'letra dois'],
  ['Terceira do ensaio', 'Banda da fixture', 'letra três'],
  ['Quarta do ensaio', 'Banda da fixture', 'letra quatro'],
  ['Quinta do ensaio', 'Banda da fixture', 'letra cinco'],
  ['Sexta do ensaio', 'Banda da fixture', 'letra seis'],
  ['Abertura do ensaio', 'Banda da fixture', 'letra sete'],
  ['Romance da fixture', 'Banda da fixture', 'letra oito'],
  ['Sétima do ensaio', 'Banda da fixture', 'o comandante chegou'],
  ['Oitava do ensaio', 'Banda da fixture', 'letra dez'],
  ['Nona do ensaio', 'Banda da fixture', 'letra onze'],
  ['Décima do ensaio', 'Banda da fixture', 'letra doze'],
]

const BIBLIOTECA: ContentDTO[] = ITENS.map(([title, artist, lyrics], k) => ({
  id: `c-${k + 1}`,
  title,
  artist,
  album: null,
  content_type: 'Lyrics',
  content_data: { lyrics },
  file_url: null,
  updated_at: T0,
}))
const contentById = new Map(BIBLIOTECA.map((c) => [c.id, c]))
const tituloDe = (id: string): string => contentById.get(id)?.title ?? '?'

const ss = (i: number): string => `${SL.slice(0, 8)}-ss00-4000-8000-${String(i).padStart(12, '0')}`

/** A setlist da fixture: `n` linhas, as sete primeiras da biblioteca em ciclo. */
function setlistDe(n: number, nome = NOME): SetlistDTO {
  return {
    id: SL, name: nome, performance_date: null, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: n }, (_, k) => ({
      id: ss(k + 1), setlist_id: SL, content_id: `c-${(k % 7) + 1}`,
      position: k + 1, notes: null, content: null,
    })),
  }
}

let mock: Mock
let dir = ''
let linhas: string[] = []
type Escrita = typeof import('../src/escrita')
let escrita: Escrita
type TelaS2 = typeof import('../src/screens/IndexScreen')
let S2: TelaS2
type TelaS4 = typeof import('../src/screens/SearchScreen')
let S4: TelaS4

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}
const pedidosDeAdicao = (): string[] => so('api').filter((l) => /path=\/api\/setlists\/\w+\/songs /.test(l))

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

function doCache(): { setlists: SetlistDTO[] } | null {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'setlists.json')
  return f.exists ? (JSON.parse(f.textSync()) as { setlists: SetlistDTO[] }) : null
}

/** O que a raiz recebeu — cada releitura que chegou, e cada saída para S1. */
let relidos: SetlistDTO[][] = []
let saiuParaS1: Array<'sumiu' | null> = []

/**
 * A RAIZ do app, reduzida ao que S2 precisa: o conjunto em `useState`, o
 * `aoReler` que o troca, e o `aoSairParaS1` que mostra "S1" no lugar. É o
 * papel do `App.tsx` + `navigation.tsx`, sem navegação.
 */
function Raiz({ inicial, palco = false }: { inicial: SetlistDTO[]; palco?: boolean }): React.JSX.Element {
  const [conjunto, setConjunto] = useState(inicial)
  const [emS1, setEmS1] = useState(false)
  const setlist = conjunto.find((s) => s.id === SL)
  if (emS1 || setlist === undefined) return <div data-testid="s1">S1</div>
  return (
    <S2.IndexScreen
      setlist={setlist}
      contentById={contentById}
      syncDone
      posicaoAtual={palco ? 3 : null}
      onVoltar={() => undefined}
      onAbrirPosicao={() => undefined}
      onBuscar={() => undefined}
      edicao={
        palco
          ? null
          : {
              estado: { uid: UID, setlists: conjunto, content: BIBLIOTECA, syncedAtMs: 1 },
              online,
              aoReler: (novas: SetlistDTO[]) => {
                relidos.push(novas)
                setConjunto(novas)
              },
              aoSairParaS1: (aviso: 'sumiu' | null) => {
                saiuParaS1.push(aviso)
                setEmS1(true)
              },
            }
      }
    />
  )
}

async function abrir(modo: string, setlist: SetlistDTO = setlistDe(7)): Promise<void> {
  await mock.servir(modo, [setlist], BIBLIOTECA)
  const doServidor = semEmbutido(await mock.doServidor())
  await montar(<Raiz inicial={doServidor} />)
  await tocar('picker-abrir')
}

/** Espera uma condição, sem relógio fixo: o mock é rápido demais. */
async function ate(condicao: () => boolean, oQue: string, limiteMs = 5_000): Promise<void> {
  const limite = Date.now() + limiteMs
  while (!condicao()) {
    if (Date.now() > limite) throw new Error(`não aconteceu em ${limiteMs} ms: ${oQue}`)
    await assentar(5)
  }
}

/** A linha inteira do resultado `n` (o nó que contém o estado dela). */
const linhaDoResultado = (n: number): string =>
  ((exige(`picker-estado-${n}`).parentElement?.textContent ?? '').replace(/\s+/g, ' ').trim())

/** O texto do primeiro nó da linha `n` — o número, quando a música está na setlist. */
const primeiroDaLinha = (n: number): string =>
  (exige(`picker-estado-${n}`).parentElement?.firstElementChild?.textContent ?? '').trim()

/** Quantos resultados o picker mostra agora. */
function nResultados(): number {
  let n = 0
  while (achar(`picker-estado-${n + 1}`) !== null) n++
  return n
}

/** Os títulos dos resultados do picker, na ordem da tela. */
function titulosDoPicker(): string[] {
  const out: string[] = []
  for (let n = 1; n <= nResultados(); n++) {
    const linha = linhaDoResultado(n)
    const achado = BIBLIOTECA.find((c) => linha.includes(c.title))
    out.push(achado?.title ?? `?${linha}`)
  }
  return out
}

/** A linha do tempo de um CN de ordem — vai para o anexo (ver o cabeçalho). */
let tempo: string[] = []
/** Até onde o log já foi transcrito na linha do tempo. */
let transcrito = 0
function marcar(momento: string): void {
  tempo.push(`— ${momento}`)
  const novas = linhas.slice(transcrito)
  transcrito = linhas.length
  if (novas.length === 0) tempo.push('    log: (nenhuma linha nova)')
  for (const l of novas) tempo.push(`    log: ${l}`)
  tempo.push(`    tela: estado-1=${JSON.stringify(achar('picker-estado-1') === null ? null : texto('picker-estado-1'))} · rodapé=${JSON.stringify(achar('picker-rodape') === null ? null : texto('picker-rodape'))}`)
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-picker-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  escrita = await import('../src/escrita')
  S2 = await import('../src/screens/IndexScreen')
  S4 = await import('../src/screens/SearchScreen')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  tempo = []
  transcrito = 0
  online = true
  logouts = 0
  relidos = []
  saiuParaS1 = []
  escrita.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  vi.restoreAllMocks()
  const arquivo = process.env.PICKER_LINHA_DO_TEMPO
  if (tempo.length > 0 && arquivo !== undefined) {
    appendFileSync(arquivo, `\n## ${expect.getState().currentTestName ?? '?'}\n${tempo.join('\n')}\n`)
  }
})

// ------------------------------------------------------------ (a) a porta

describe('(a) regra 7 — a única porta é `Adicionar música` na faixa de S2 com edição', () => {
  it('a faixa ganha o quarto controle, à esquerda de `Reordenar`, com o `+` acentuado', async () => {
    await mock.servir('escrita', [setlistDe(7)], BIBLIOTECA)
    await montar(<Raiz inicial={semEmbutido(await mock.doServidor())} />)

    expect(texto('picker-abrir')).toBe('Adicionar música')
    expect(inativo('picker-abrir')).toBe(false)
    // Anexo D, o par: o mesmo círculo r 8,5 e a corda de 8 — com a haste.
    expect(paths('picker-abrir')).toEqual(['M12 8v8M8 12h8'])
    // §3 "contorno em accentInk porque é o ato principal desta tela".
    expect(estilo(exige('picker-abrir'))).toMatchObject({ borderColor: '#777CE8' })
    // À esquerda de `Reordenar`: vem antes na árvore, no mesmo grupo.
    const faixaEsq = exige('picker-abrir').parentElement as HTMLElement
    expect(faixaEsq.contains(exige('reordenar'))).toBe(true)
    const ordem = [...faixaEsq.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid'))
    expect(ordem.indexOf('picker-abrir')).toBeLessThan(ordem.indexOf('reordenar'))
  })

  it('abrir: o picker toma a tela — campo, fechar do S4, vazio e rodapé; zero request', async () => {
    await abrir('escrita')

    expect(achar('picker-campo')).not.toBeNull()
    expect(achar('fechar-busca')).not.toBeNull()
    expect(achar('picker-concluir')).not.toBeNull()
    expect(texto('picker-vazio')).toBe(
      `Digite para achar na biblioteca e adicionar a ${NOME}. ${BIBLIOTECA.length} músicas disponíveis.`,
    )
    expect(texto('picker-rodape')).toBe(`${NOME} · 7 músicas · nada adicionado nesta visita`)
    // S2 some enquanto o picker dura: grade, faixa e `remover`.
    expect(achar('song-1')).toBeNull()
    expect(achar('picker-abrir')).toBeNull()
    expect(achar('remover-1')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write')).toEqual([])
  })

  it('a S2 vinda do PALCO não tem porta nenhuma (T2-R19)', async () => {
    await mock.servir('escrita', [setlistDe(7)], BIBLIOTECA)
    await montar(<Raiz inicial={semEmbutido(await mock.doServidor())} palco />)
    expect(achar('picker-abrir')).toBeNull()
    expect(textoDaTela()).not.toContain('Adicionar música')
  })
})

// --------------------------------------------------------- (b) placeholder

describe('(b) R1·5 — o placeholder é `Adicionar a <nome>`, com ellipsis acima de 34 caracteres', () => {
  const NOME34 = 'Ensaio geral da turnê de primavera'
  it('34 caracteres: o nome inteiro', async () => {
    expect([...NOME34]).toHaveLength(34)
    await abrir('escrita', setlistDe(7, NOME34))
    expect(exige('picker-campo').getAttribute('placeholder')).toBe(`Adicionar a ${NOME34}`)
  })

  it('35 caracteres: os 34 primeiros e a reticência', async () => {
    await abrir('escrita', setlistDe(7, `${NOME34}s`))
    expect(exige('picker-campo').getAttribute('placeholder')).toBe(`Adicionar a ${NOME34}…`)
  })
})

// ------------------------------------------------------------- (c) a busca

describe('(c) T1-R21/R22 — a busca do picker É a do S4: mesmo módulo, mesmas linhas, mesma ordem', () => {
  it('"man": a ordem do `searchIndex` + `groupResults`, nesta setlist primeiro', async () => {
    // O ESPERADO vem do módulo, não de um literal.
    const setlist = setlistDe(7)
    const noSetlist = new Set(setlist.setlist_songs.map((s) => s.content_id))
    const g = groupResults(searchIndex(buildIndex(BIBLIOTECA), 'man'), noSetlist)
    const esperado = [...g.inSetlist, ...g.library].map((h) => tituloDe(h.id))
    // A fixture tem de exercitar os dois grupos e mais de um campo.
    expect(g.inSetlist.length).toBeGreaterThan(0)
    expect(g.library.length).toBeGreaterThan(0)
    expect(new Set(searchIndex(buildIndex(BIBLIOTECA), 'man').map((h) => h.where)).size).toBeGreaterThan(2)

    // E o S4 de hoje, com a mesma setlist e o mesmo termo, diz a mesma coisa.
    await mock.servir('escrita', [setlist], BIBLIOTECA)
    await montar(
      <S4.SearchScreen
        contents={BIBLIOTECA}
        setlist={setlist}
        posicao={null}
        online
        onFechar={() => undefined}
        onAbrir={() => undefined}
      />,
    )
    await digitar('campo-busca', 'man')
    const doS4 = [...document.querySelectorAll('[data-testid^="resultado-"]')].map((e) => {
      const id8 = (e.getAttribute('data-testid') ?? '').slice('resultado-'.length)
      return tituloDe(BIBLIOTECA.find((c) => c.id.slice(0, 8) === id8)?.id ?? '')
    })
    expect(doS4).toEqual(esperado)
    desmontar()

    await montar(<Raiz inicial={semEmbutido(await mock.doServidor())} />)
    await tocar('picker-abrir')
    await digitar('picker-campo', 'man')
    expect(titulosDoPicker()).toEqual(esperado)
    // As réguas: "Nesta setlist · <nome>" e "Biblioteca · <n> músicas".
    const tela = textoDaTela()
    expect(tela).toContain(`Nesta setlist · ${NOME}`)
    expect(tela).toContain(`Biblioteca · ${BIBLIOTECA.length} músicas`)
    expect(tela.indexOf('Nesta setlist')).toBeLessThan(tela.indexOf('Biblioteca ·'))
    // "O número à esquerda existe só nos resultados que já estão na setlist."
    // (O primeiro FILHO da linha, e não o começo do `textContent`: o DOM junta
    // os nós sem separador, e "1Manhã…" nunca começaria com "1 ".)
    expect(primeiroDaLinha(1)).toBe('1')
    expect(primeiroDaLinha(esperado.length)).not.toMatch(/^\d+$/)
    // A normalização é a mesma: "mãn" acha o que "man" acha.
    await digitar('picker-campo', 'mãn')
    expect(titulosDoPicker()).toEqual(esperado)
  })

  it('a marca "já na setlist" e o "n×" contam as posições da setlist; `Adicionar` ativo mesmo com marca (N2-D15)', async () => {
    // Manhã de ensaio (c-1) duas vezes: posições 1 e 8.
    await abrir('escrita', setlistDe(8))
    await digitar('picker-campo', 'manhã')
    expect(linhaDoResultado(1)).toContain('já na setlist · 2×')
    expect(inativo('picker-adicionar-1')).toBe(false)
    expect(texto('picker-adicionar-1')).toBe('Adicionar')
    await digitar('picker-campo', 'segunda')
    expect(linhaDoResultado(1)).toContain('já na setlist')
    expect(linhaDoResultado(1)).not.toContain('×')
    await digitar('picker-campo', 'romance')
    expect(linhaDoResultado(1)).not.toContain('já na setlist')
  })
})

// ------------------------------------------------- (d) adicionar, e a ordem

describe('(d) T2-R6 / N2-D30 — adicionar: 201, releitura, e só então a marca e o total', () => {
  it('a ordem dos eventos: adicionando… → 201 → relendo… → resync 200 → 2× e 8 músicas', async () => {
    await abrir('escrita-releitura-fora-de-ordem')
    await digitar('picker-campo', 'manhã')
    marcar('antes do toque')
    expect(linhaDoResultado(1)).toContain('já na setlist')
    expect(linhaDoResultado(1)).not.toContain('2×')

    await tocar('picker-adicionar-1')
    marcar('no toque (o request em voo)')
    expect(texto('picker-estado-1')).toBe('adicionando…')
    expect(achar('picker-adicionar-1')).toBeNull()

    // O request voltou; a releitura dele está em voo (o mock a segura 600 ms).
    await ate(() => so('write op=add').length === 1, 'o 201')
    await assentar(20)
    marcar('201 recebido, releitura em voo')
    expect(so('write op=add')[0]).toMatch(/^write op=add setlist=aaaaaaaa items=- status=201 code=- ms=\d+$/)
    expect(so('resync')).toEqual([])
    // "relendo…": sem botão — tocar aqui somaria um bis não pedido.
    expect(texto('picker-estado-1')).toBe('relendo…')
    expect(achar('picker-adicionar-1')).toBeNull()
    // O `k` é LOCAL e conta o 201 — já subiu. O total e a marca, NÃO.
    expect(texto('picker-rodape')).toBe(`${NOME} · 7 músicas · 1 adicionada nesta visita`)
    expect(linhaDoResultado(1)).not.toContain('2×')

    await ate(() => so('resync').length === 1, 'a releitura')
    await assentar(20)
    marcar('resync 200')
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=write op=add status=200 setlists=1 ms=\d+$/)
    // Só agora: a marca, o total, e a linha "adicionada" (sem contorno).
    expect(texto('picker-estado-1')).toBe('adicionada')
    expect(linhaDoResultado(1)).toContain('já na setlist · 2×')
    expect(texto('picker-rodape')).toBe(`${NOME} · 8 músicas · 1 adicionada nesta visita`)
    // Um POST, com `{content_id}` e sem `position` (C7) — o corpo é do mock.
    expect(pedidosDeAdicao()).toHaveLength(1)
    const noServidor = (await mock.doServidor()).find((s) => s.id === SL)
    expect(noServidor?.setlist_songs.filter((s) => s.content_id === 'c-1')).toHaveLength(2)
    // O picker continua aberto para a próxima (T2-R6).
    expect(achar('picker-campo')).not.toBeNull()
  })

  it('duas adições sobrepostas: a segunda sai durante o relendo… da primeira; cache = último 200', async () => {
    await abrir('escrita-releitura-fora-de-ordem')
    await digitar('picker-campo', 'man')
    const alvoB = titulosDoPicker().indexOf('Romance da fixture') + 1

    await tocar('picker-adicionar-1')
    // Durante o REQUEST, os outros ficam ocupados (T2-R11): nada de `busy`.
    expect(inativo(`picker-adicionar-${alvoB}`)).toBe(true)
    await ate(() => so('write op=add').length === 1, 'o 201 da primeira')
    await assentar(20)
    marcar('201 da primeira, releitura dela em voo')
    expect(texto('picker-estado-1')).toBe('relendo…')
    // "As outras linhas seguem ativas."
    expect(inativo(`picker-adicionar-${alvoB}`)).toBe(false)

    await tocar(`picker-adicionar-${alvoB}`)
    marcar('segunda adição disparada')
    await ate(() => so('resync').length === 2, 'as duas releituras', 5_000)
    await assentar(40)
    marcar('as duas releituras voltaram')

    expect(so('write blocked')).toEqual([])
    expect(so('write op=add')).toHaveLength(2)
    expect(pedidosDeAdicao()).toHaveLength(2)
    expect(so('resync')).toHaveLength(2)
    expect(so('resync').every((l) => l.includes('status=200'))).toBe(true)
    // A foto velha (a primeira releitura, que chegou por último) não venceu.
    const noServidor = semEmbutido(await mock.doServidor())
    expect(noServidor[0]?.setlist_songs).toHaveLength(9)
    expect(doCache()?.setlists).toEqual(noServidor)
    expect(texto('picker-rodape')).toBe(`${NOME} · 9 músicas · 2 adicionadas nesta visita`)
    expect(texto('picker-estado-1')).toBe('adicionada')
  })
})

// ------------------------------------------- (e) a releitura que falha

describe('(e) N2-D22 / N2-D32 — 201 com a releitura em 500: o aviso assume o rodapé', () => {
  it('rodapé de 112: a frase do picker, o total em offlineInk, o `k` não; `Tentar recarregar` relê', async () => {
    await abrir('escrita-resync-500')
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    await ate(() => so('resync').length === 1, 'a releitura')
    await assentar(20)

    expect(so('write op=add')[0]).toMatch(/ status=201 code=- /)
    expect(so('resync')[0]).toMatch(/reason=write op=add status=500/)
    expect(texto('aviso-motivo')).toBe(
      'Salvo. Não foi possível recarregar a setlist, então a contagem abaixo pode estar velha.',
    )
    expect(texto('aviso-acao')).toBe('Tentar recarregar')
    // O total NÃO relido fica âmbar; o `k` é local e não tem dúvida.
    expect(estilo(exige('picker-total'))).toMatchObject({ color: '#C9923B' })
    expect(texto('picker-total')).toBe('7 músicas')
    expect(texto('picker-rodape')).toBe(`${NOME} · 7 músicas · 1 adicionada nesta visita`)
    // A linha é "adicionada" (o 201 veio) e NÃO tem botão (N2-D32).
    expect(texto('picker-estado-1')).toBe('adicionada')
    expect(achar('picker-adicionar-1')).toBeNull()

    linhas = []
    await tocar('aviso-acao')
    await assentar(50)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=/)
    // Recarregar NÃO reescreve (Q8).
    expect(so('write op=')).toEqual([])
  })
})

// -------------------------------------------- (f) a adição que falha

describe('(f) T2-R11 — a adição que falha: a frase inteira na linha, e `Tentar de novo` só depois de reler', () => {
  it('500: "não entrou na setlist" + a frase do servidor; a releitura antes do botão', async () => {
    await abrir('escrita-500')
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    expect(texto('picker-estado-1')).toBe('adicionando…')
    await ate(() => so('resync').length === 1, 'a releitura da regra 3')
    await assentar(20)

    const w = linhas.findIndex((l) => l.includes('write op=add'))
    const r = linhas.findIndex((l) => l.includes('resync kind=setlists'))
    expect(so('write op=add')[0]).toMatch(/ status=500 code=INTERNAL_ERROR /)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=200/)
    expect(w).toBeLessThan(r)

    const estado = texto('picker-estado-1')
    expect(estado).toContain('não entrou na setlist')
    expect(estado).toContain('falha no servidor — nada foi alterado aqui')
    expect(texto('picker-adicionar-1')).toBe('Tentar de novo')
    expect(inativo('picker-adicionar-1')).toBe(false)
    // Nenhum 201 nesta visita.
    expect(texto('picker-rodape')).toBe(`${NOME} · 7 músicas · nada adicionado nesta visita`)
    // Uma única request de escrita (nenhuma repetição automática).
    expect(pedidosDeAdicao()).toHaveLength(1)
  })

  it('rede (pode ter passado): sem botão enquanto relê; depois, o aviso de que pode ter gravado', async () => {
    // `escrita-corta-lento`: o servidor GRAVA e corta; a releitura demora.
    await abrir('escrita-corta-lento')
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    await ate(() => so('write op=add').length === 1, 'a escrita cortada')
    await assentar(20)
    expect(so('write op=add')[0]).toMatch(/ status=net code=net /)
    // Relendo: a frase já está, o botão NÃO (regra 3).
    expect(achar('picker-adicionar-1')).toBeNull()
    expect(so('resync')).toEqual([])

    await ate(() => so('resync').length === 1, 'a releitura')
    await assentar(20)
    const estado = texto('picker-estado-1')
    expect(estado).toContain('pode já ter sido gravada — confira antes de repetir')
    expect(estado).toContain('sem conexão — nada foi salvo')
    expect(estado).not.toContain('não entrou na setlist')
    expect(texto('picker-adicionar-1')).toBe('Tentar de novo')
    // E a releitura mostra o estado real: a música ENTROU.
    expect(linhaDoResultado(1)).toContain('já na setlist')
  })
})

// ------------------------------------------------------------- (g) o 404

describe('(g) T2-R10 — 404 numa adição: o picker fecha e S1 aparece já relida', () => {
  it('a setlist apagada em outro aparelho: `resync reason=404`, sai com `sumiu`', async () => {
    await abrir('escrita')
    await digitar('picker-campo', 'romance')
    // "Outro aparelho" apaga a setlist direto no mock.
    await fetch(`http://127.0.0.1:${mock.porta}/api/setlists/${SL}`, { method: 'DELETE' })
    linhas = []

    await tocar('picker-adicionar-1')
    await ate(() => so('resync').length === 1, 'a releitura do 404')
    await assentar(20)

    expect(so('write op=add')[0]).toMatch(/ status=404 code=NOT_FOUND /)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=404 op=add status=200/)
    expect(saiuParaS1).toEqual(['sumiu'])
    // Div. 270: a lista relida chega à raiz ANTES da saída.
    expect(relidos.at(-1)?.some((s) => s.id === SL)).toBe(false)
    expect(achar('s1')).not.toBeNull()
    expect(achar('picker-campo')).toBeNull()
  })

  it('401 numa adição não desloga (T2-R13): a frase na linha, a sessão fica', async () => {
    await abrir('escrita-401')
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    await ate(() => so('write op=add').length === 1, 'o 401')
    await assentar(40)
    expect(so('write op=add')[0]).toMatch(/ status=401 code=AUTH_REQUIRED /)
    expect(texto('picker-estado-1')).toContain('não foi possível salvar — confira sua conta no site')
    expect(logouts).toBe(0)
    expect(so('auth-failure')).toEqual([])
  })
})

// ------------------------------------------------------- (h) as saídas

describe('(h) N2-P-vazio — `Concluir` e o `fechar` não escrevem; a volta cai em S2 relida', () => {
  for (const saida of ['picker-concluir', 'fechar-busca', 'voltar do sistema'] as const) {
    it(`${saida}: zero request, e S2 mostra o conjunto da última releitura`, async () => {
      await abrir('escrita')
      await digitar('picker-campo', 'romance')
      await tocar('picker-adicionar-1')
      await ate(() => so('resync').length === 1, 'a releitura')
      await assentar(20)

      linhas = []
      if (saida === 'voltar do sistema') {
        await assentar(0)
        expect(__voltarDoSistema()).toBe(true)
        await assentar(0)
      } else {
        await tocar(saida)
      }
      await assentar(40)

      expect(so('api')).toEqual([])
      expect(so('write')).toEqual([])
      expect(so('resync')).toEqual([])
      expect(achar('picker-campo')).toBeNull()
      expect(achar('picker-abrir')).not.toBeNull()
      // O "n músicas" de S2 subiu — pela releitura da adição (N2-D30).
      expect(textoDaTela()).toContain('8 músicas')
      expect(achar('song-8')).not.toBeNull()
    })
  }

  it('sair com o aviso de releitura aberto: S2 mostra o "salvo, não relido" e relê', async () => {
    await abrir('escrita-resync-500')
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    await ate(() => so('resync').length === 1, 'a releitura em 500')
    await assentar(20)

    linhas = []
    await tocar('picker-concluir')
    await assentar(60)
    expect(achar('picker-campo')).toBeNull()
    expect(so('write')).toEqual([])
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=500/)
    expect(texto('aviso-motivo')).toBe(
      'Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.',
    )
  })
})

// ---------------------------------------------------------- (i) sem rede

describe('(i) T2-R12 — sem rede, `Adicionar música` inativo com o motivo, e o toque não abre', () => {
  it('inativo, o `+` amputado, e nenhum picker', async () => {
    online = false
    await mock.servir('escrita', [setlistDe(7)], BIBLIOTECA)
    await montar(<Raiz inicial={semEmbutido(await mock.doServidor())} />)

    expect(inativo('picker-abrir')).toBe(true)
    // Anexo D: "meia corda, 4" — e o círculo fica.
    expect(paths('picker-abrir')).toEqual(['M8 12h4'])
    expect(texto('aviso-motivo')).toContain('Sem conexão')
    await tocar('picker-abrir')
    expect(achar('picker-campo')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write')).toEqual([])
  })
})

// -------------------------------------------------------- (j) acima de 100

describe('(j) N2-D17 / A-N2-9 — acima de 100, adicionar continua e `Reordenar` inativa na volta', () => {
  it('100 → 101: o 201 sai, o aviso do teto aparece, e S2 volta com `Reordenar` inativo', async () => {
    await abrir('escrita', setlistDe(100))
    expect(texto('picker-rodape')).toBe(`${NOME} · 100 músicas · nada adicionado nesta visita`)
    await digitar('picker-campo', 'romance')
    await tocar('picker-adicionar-1')
    await ate(() => so('resync').length === 1, 'a releitura')
    await assentar(20)

    expect(so('write op=add')[0]).toMatch(/ status=201 /)
    expect(texto('picker-rodape')).toBe(`${NOME} · 101 músicas · 1 adicionada nesta visita`)
    // T2-R6: "o picker avisa que, acima de 100, a setlist não pode ser reordenada".
    expect(texto('aviso-motivo')).toBe(
      'Acima de 100 músicas, reordenar por arrasto fica inativo. Adicionar e remover continuam.',
    )
    // E adicionar continua possível — numa OUTRA música: a linha 1 está
    // "adicionada", sem botão, como tem de estar.
    expect(achar('picker-adicionar-1')).toBeNull()
    await digitar('picker-campo', 'sétima')
    expect(inativo('picker-adicionar-1')).toBe(false)

    await tocar('picker-concluir')
    await assentar(20)
    expect(inativo('reordenar')).toBe(true)
    expect(inativo('picker-abrir')).toBe(false)
  })
})
