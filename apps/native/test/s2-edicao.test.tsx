/**
 * CONTROLES NEGATIVOS DA TELA — N2-PR4 (S2 com edição: a faixa de 64 dp, o
 * `remover` por linha, o modo editar da folha, o diálogo de apagar e a linha
 * de aviso de 48 dp em S2). Vêm ANTES do código que medem: contra a árvore de
 * hoje os treze reprovam por ausência — não há `setlist-editar`, não há
 * `remover-1`, não há `DialogoDeApagar`, e a `IndexScreen` não aceita `edicao`.
 *
 * **O que roda de verdade**: a `IndexScreen` e a folha renderizadas com
 * `react-dom` sobre `jsdom` (`tela.tsx`), o `escrever()` da N2-PR2, a camada
 * `api.ts` com o `fetch` do Node, a classificação do core e o `store.ts` sobre
 * o duplo do `expo-file-system`, contra o mock `src/fixtures/aceite.py`.
 * **O que é duplo**: `react-native`, `react-native-svg`, o `datetimepicker`
 * (módulo NATIVO), o Firebase, a sessão e o `expo-network`.
 *
 * **O que estes CNs NÃO medem**: geometria. A faixa de 64 dp, a lista de
 * 551,1 → 487,1, a caixa do título de 336 → 280 e o alvo de 48 do `remover`
 * se medem no **dump do aparelho** (§4 da PR), como em toda esta série. Aqui
 * se mede o que a árvore sabe dizer: qual nó existe, com que `testID`, com que
 * texto, ativo ou inativo, que desenho saiu, e o que acontece ao toque.
 *
 * **A releitura re-renderiza a tela pelo PAI**, como no app: quem grava o
 * cache é o `escrita.ts` e quem passa o conjunto novo para a tela é a raiz
 * (`App.tsx` → `navigation.tsx`). Aqui o `aoReler` guarda o conjunto e o teste
 * re-renderiza com ele — se a tela se atualizasse sozinha, ela estaria
 * mexendo no cache, que é o que o T2-R9 proíbe.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { IndexScreenProps } from '../src/screens/IndexScreen'
import { exatas } from './ajuda'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { __proximaData } from './fake-datetimepicker'
import { Mock, portaLivre } from './mock'
import { achar, assentar, desmontar, digitar, exige, inativo, montar, paths, rerender, texto, textoDaTela, tocar } from './tela'

/** O espião da N2-D9: quem chama isto é o app deslogando (CN (j)). */
const deslogou = vi.fn()
vi.mock('../src/session', () => ({ signOutSession: async () => { deslogou() } }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-s2-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-s2'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'

function content(id: string, title: string): ContentDTO {
  return {
    id, title, artist: 'Artista', album: null,
    content_type: 'Lyrics', content_data: { lyrics: `letra de ${title}` },
    file_url: null, updated_at: T0,
  }
}

const BIBLIOTECA = [content('c-1', 'Primeira'), content('c-2', 'Segunda'), content('c-3', 'Terceira')]

/**
 * A setlist do CN, com **bis**: a mesma música (`c-1`) nas posições 1 e 4.
 * É o caso do T2-R7 — remover a 4 não pode levar a 1 junto, e é por isso que
 * o request leva o `setlist_songs.id`, nunca o `content_id`.
 */
function setlistComBis(nome = 'Show', venue: string | null = 'Bar do Zé'): SetlistDTO {
  const ids = ['c-1', 'c-2', 'c-3', 'c-1']
  return {
    id: SL, name: nome, performance_date: '2025-07-16', venue, updated_at: T0,
    setlist_songs: ids.map((c, i) => ({
      id: `${SL}-ss-${i + 1}`, setlist_id: SL, content_id: c,
      position: i + 1, notes: null, content: null,
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
type TelaS1 = typeof import('../src/screens/SetlistsScreen')
let S1: TelaS1
type AposEscrita = typeof import('../src/apos-escrita')
let aposEscrita: AposEscrita

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

function doCache(): { setlists: SetlistDTO[] } | null {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'setlists.json')
  return f.exists ? (JSON.parse(f.textSync()) as { setlists: SetlistDTO[] }) : null
}

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

/** `Date` a `dias` de hoje, pelos componentes LOCAIS (T2-R2). */
function daquiA(dias: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d
}

/** O que a releitura devolveu — o pai re-renderiza com isto, como o app faz. */
let relido: SetlistDTO[] | null = null
let saiuParaS1: Array<'sumiu' | 'sumiu-nao-relido' | null> = []

const contentById = new Map(BIBLIOTECA.map((c) => [c.id, c]))

/** As props de S2 — vinda de S1 (com edição) por padrão. */
async function props(extra: Partial<IndexScreenProps> = {}): Promise<IndexScreenProps> {
  const doServidor = semEmbutido(await mock.doServidor())
  const setlist = doServidor.find((s) => s.id === SL) ?? doServidor[0]
  return {
    setlist,
    contentById,
    syncDone: true,
    posicaoAtual: null,
    onVoltar: () => undefined,
    onAbrirPosicao: () => undefined,
    onBuscar: () => undefined,
    edicao: {
      estado: { uid: UID, setlists: doServidor, content: BIBLIOTECA, syncedAtMs: 1 },
      online,
      aoReler: (novas: SetlistDTO[]) => { relido = novas },
      aoSairParaS1: (aviso: 'sumiu' | 'sumiu-nao-relido' | null) => { saiuParaS1.push(aviso) },
    },
    ...extra,
  }
}

/** Re-renderiza S2 com o conjunto que a releitura trouxe (o papel do pai). */
async function comOReleitura(extra: Partial<IndexScreenProps> = {}): Promise<void> {
  const novas = relido ?? []
  const setlist = novas.find((s) => s.id === SL)
  if (setlist === undefined) throw new Error('a releitura não trouxe a setlist')
  await rerender(<S2.IndexScreen {...(await props({ setlist, ...extra }))} />)
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-s2-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  escrita = await import('../src/escrita')
  S2 = await import('../src/screens/IndexScreen')
  S1 = await import('../src/screens/SetlistsScreen')
  aposEscrita = await import('../src/apos-escrita')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  online = true
  relido = null
  saiuParaS1 = []
  __proximaData(null)
  deslogou.mockClear()
  escrita.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(async () => {
  // Deixa as pendentes assentarem ANTES de limpar (div. 241): a releitura do
  // teste anterior continua em voo depois do `desmontar()`, e a linha dela
  // cairia no `linhas` do teste seguinte.
  await assentar(20)
  desmontar()
  vi.restoreAllMocks()
})

// ------------------------------------------------- (a) as duas S2 (T2-R19)

describe('(a) T2-R19 / N2-D26 — a faixa de 64 dp distingue as duas S2', () => {
  it('vinda de S1: a faixa tem os DOIS controles desta PR, e cada linha tem o seu `remover`', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(achar('setlist-editar')).not.toBeNull()
    expect(texto('setlist-editar')).toBe('Renomear e datar')
    expect(achar('setlist-apagar')).not.toBeNull()
    expect(texto('setlist-apagar')).toBe('Apagar setlist')
    // Cada bis tem o SEU (`remover-<n>`, por posição — a tabela do §7).
    for (const n of [1, 2, 3, 4]) expect(achar(`remover-${n}`)).not.toBeNull()
    // Ler continua neutro e onde estava.
    expect(achar('buscar')).not.toBeNull()
    expect(achar('voltar')).not.toBeNull()
  })

  /**
   * **Este `it` PASSA contra a árvore de hoje, e isso é o certo**: ele é o
   * frame de CONTROLE do `N2-S2p`, não um controle negativo. O que ele afirma
   * é uma AUSÊNCIA que já vale hoje e tem de continuar valendo depois — a
   * prova dele está em passar com o irmão acima reprovando, e em continuar
   * passando quando o irmão passar. Os treze que reprovam são os outros.
   */
  it('vinda do palco: ZERO controle de escrita — nem faixa, nem `remover`', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props({ posicaoAtual: 3, edicao: null }))} />)

    // "Se a implementação puser um único controle de escrita nesta moldura,
    // ela está errada" (legenda de `N2-S2p`).
    expect(achar('setlist-editar')).toBeNull()
    expect(achar('setlist-apagar')).toBeNull()
    for (const n of [1, 2, 3, 4]) expect(achar(`remover-${n}`)).toBeNull()
    expect(achar('aviso-motivo')).toBeNull()
    // E o que era de leitura continua: a posição atual e a busca.
    expect(achar('song-3')).not.toBeNull()
    expect(achar('buscar')).not.toBeNull()
  })
})

// ------------------------------------------ (b) a terceira validação

describe('(b) T2-R3 (iii) / N2-D21 — "nada mudou" não envia, e a linha de log é `blocked`', () => {
  it('a folha de editar abre com os valores do servidor e `Salvar` inativo com o motivo', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')

    // "abre com os valores do servidor" (`N2-F-editar-igual`).
    expect((exige('form-nome') as HTMLInputElement).value).toBe('Show')
    expect(texto('form-data')).toBe('16 / 07 / 2025')
    expect(textoDaTela()).toContain('Renomear e datar')
    expect(inativo('form-salvar')).toBe(true)
    expect(texto('form-salvar-motivo')).toBe('nada mudou desde que você abriu')

    await tocar('form-salvar')
    await assentar(50)
    // Zero request; a linha é `blocked`, e é a quinta razão (N2-PR2).
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=update reason=nada-mudou'])
  })
})

// ------------------------------------------------- (c) e (d) o `PUT`

describe('(c) T2-R4 — renomear envia SÓ o campo que mudou, e o `venue` sobrevive', () => {
  it('um PUT com `name`, a releitura, e a tela com o nome novo', async () => {
    await mock.servir('escrita', [setlistComBis('Show', 'Bar do Zé')], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')
    await digitar('form-nome', 'Season 4')
    expect(inativo('form-salvar')).toBe(false)
    await tocar('form-salvar')
    await assentar(50)

    expect(so('write op=update')).toHaveLength(1)
    expect(so('write op=update')[0]).toMatch(
      /^write op=update setlist=aaaaaaaa items=- status=200 code=- ms=\d+$/,
    )
    expect(so('resync kind=setlists')[0]).toMatch(/reason=write op=update status=200/)
    // A folha fechou e o servidor tem o nome novo COM o `venue` intacto — o
    // nativo não regrava os cinco campos como o web faz (T2-R4).
    expect(achar('form-nome')).toBeNull()
    const noServidor = (await mock.doServidor()).find((s) => s.id === SL)
    expect(noServidor?.name).toBe('Season 4')
    expect(noServidor?.venue).toBe('Bar do Zé')
    expect(noServidor?.performance_date).toBe('2025-07-16')
    // O cache é o da releitura (T2-R9), e a tela mostra o que ela trouxe.
    expect(doCache()?.setlists).toEqual(semEmbutido(await mock.doServidor()))
    await comOReleitura()
    expect(textoDaTela()).toContain('Season 4')
  })
})

describe('(d) T2-R4 / C4 — limpar a data conta como mudança e envia `null`', () => {
  it('o `Limpar` ativa o `Salvar`, e o servidor fica sem data', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')
    expect(inativo('form-salvar')).toBe(true)

    await tocar('form-data-limpar')
    expect(inativo('form-salvar')).toBe(false)
    expect(texto('form-data')).toBe('dd / mm / aaaa')
    // N2-PR7 (c) — sem data, não há o que limpar: o alvo SOME no mesmo toque.
    expect(achar('form-data-limpar')).toBeNull()
    // O corpo do `PUT` lido na saída do app (o mock não guarda corpos).
    const espia = vi.spyOn(globalThis, 'fetch')
    await tocar('form-salvar')
    await assentar(50)
    const corposDoPut = (): unknown[] =>
      espia.mock.calls
        .filter(([, init]) => (init as RequestInit | undefined)?.method === 'PUT')
        .map(([, init]) => JSON.parse(String((init as RequestInit).body)))

    expect(so('write op=update')).toHaveLength(1)
    // O `PUT` levou `performance_date: null` e só isso (contrato §PUT) …
    expect(corposDoPut()).toEqual([{ performance_date: null }])
    // … e a tela foi relida depois dele (regra 3).
    expect(so('resync')).toEqual([
      expect.stringMatching(/^resync kind=setlists reason=write op=update status=200 setlists=\d+ ms=\d+$/),
    ])
    const noServidor = (await mock.doServidor()).find((s) => s.id === SL)
    expect(noServidor?.performance_date).toBeNull()
    // O nome NÃO foi enviado: ele não mudou (ausente = não mexe).
    expect(noServidor?.name).toBe('Show')
  })

  it('N2-PR7 (c) — setlist sem data: o `Limpar` não existe, e sem frase nova', async () => {
    const semData = { ...setlistComBis(), performance_date: null }
    await mock.servir('escrita', [semData], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')
    expect(texto('form-data')).toBe('dd / mm / aaaa')
    expect(achar('form-data-limpar')).toBeNull()
  })
})

// --------------------------------------------------- (e) o prefetch

describe('(e) T2-R17 — datar para os próximos 7 dias na EDIÇÃO dispara o prefetch', () => {
  it('a releitura da edição corre o mesmo plano de 7 dias do sync', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    const desligar = aposEscrita.ligarPrefetchAposEscrita(() => contentById, () => undefined, () => undefined)
    try {
      await montar(<S2.IndexScreen {...(await props())} />)
      await tocar('setlist-editar')
      __proximaData(daquiA(5))
      await tocar('form-data')
      await tocar('seletor-de-data')
      await tocar('form-salvar')
      await assentar(80)

      expect(so('write op=update')).toHaveLength(1)
      expect(so('prefetch plan')).toHaveLength(1)
      expect(so('prefetch plan')[0]).toMatch(/^prefetch plan n=\d+ reason=7d$/)
    } finally {
      desligar()
    }
  })
})

// ---------------------------------------------------- (f) o `remover`

describe('(f) T2-R7 / N2-D28 — remover é escrita imediata, por `setlist_songs.id`', () => {
  it('o bis da posição 4 sai e a posição 1 fica; sem diálogo, com releitura', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    await tocar('remover-4')
    await assentar(50)

    expect(so('write op=remove')).toHaveLength(1)
    expect(so('write op=remove')[0]).toMatch(
      /^write op=remove setlist=aaaaaaaa items=- status=200 code=- ms=\d+$/,
    )
    // O `path` da linha `api` leva o id da LINHA, recortado a 8 (T2-R16).
    expect(so('api').some((l) => l.includes('path=/api/setlists/songs/aaaaaaaa'))).toBe(true)
    expect(so('resync kind=setlists')[0]).toMatch(/reason=write op=remove status=200/)

    // O que sobrou no servidor: três linhas, e a posição 1 (o outro bis, o
    // MESMO `content_id`) continua lá. É o que a div. 156 diz para não copiar
    // do web, que filtra todas as ocorrências do `content_id`.
    const noServidor = (await mock.doServidor()).find((s) => s.id === SL)
    expect(noServidor?.setlist_songs).toHaveLength(3)
    expect(noServidor?.setlist_songs.map((s) => s.content_id)).toEqual(['c-1', 'c-2', 'c-3'])

    await comOReleitura()
    expect(achar('remover-4')).toBeNull()
    expect(achar('remover-3')).not.toBeNull()
  })
})

describe('(g) T2-R11 / N2-X-falhou — remover que falha: aviso, e `Tentar de novo` só depois da releitura', () => {
  it('a linha de aviso de S2 traz as três orações do congelado e a ação', async () => {
    await mock.servir('escrita-500', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    await tocar('remover-4')
    await assentar(80)

    expect(so('write op=remove')[0]).toMatch(/ status=500 code=INTERNAL_ERROR /)
    const aviso = texto('aviso-motivo')
    expect(aviso).toContain('Não foi possível salvar')
    expect(aviso).toContain('falha no servidor — nada foi alterado aqui')
    expect(aviso).toContain('a lista abaixo é a que o servidor acabou de devolver')
    // Em remover não existe "pode já ter sido gravada": só criar e adicionar
    // duplicam quando repetidos (C10).
    expect(aviso).not.toContain('pode já ter sido gravada')
    expect(texto('aviso-acao')).toBe('Tentar de novo')
    expect(inativo('aviso-acao')).toBe(false)
    // A releitura da regra 3 aconteceu ANTES de o botão ficar ativo.
    expect(so('resync kind=setlists')).toHaveLength(1)
    // E a música continua lá: a escrita não passou.
    expect(achar('remover-4')).not.toBeNull()
  })
})

describe('(h) N2-D22 — remover com 2xx e releitura em 500: "salvo; não foi possível recarregar"', () => {
  it('o aviso é o da regra 4, e o único botão RECARREGA', async () => {
    await mock.servir('escrita-resync-500', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    await tocar('remover-4')
    await assentar(80)

    expect(so('write op=remove')[0]).toMatch(/ status=200 code=- /)
    expect(so('resync kind=setlists')[0]).toMatch(/reason=write op=remove status=500/)
    expect(texto('aviso-motivo')).toBe(
      'Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.',
    )
    expect(texto('aviso-acao')).toBe('Tentar recarregar')

    linhas = []
    await tocar('aviso-acao')
    await assentar(50)
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=/)
    // Recarregar NÃO reescreve (Q8/N2-D32).
    expect(so('write op=')).toEqual([])
  })
})

// -------------------------------------------------- (i) o diálogo

describe('(i) T2-R5 / N2-D14 — apagar tem diálogo, com os quatro itens da regra 5', () => {
  it('`Manter a setlist` não escreve nada; `Apagar` escreve e sai para S1', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)

    await tocar('setlist-apagar')
    const dialogo = textoDaTela()
    expect(dialogo).toContain('Apagar a setlist')
    // Nome e contagem são DADO (div. 227): a frase fixa é do core.
    expect(dialogo).toContain('Apagar Show, com 4 músicas?')
    expect(dialogo).toContain(
      'As músicas continuam na biblioteca, e os arquivos já baixados continuam neste aparelho. Só a setlist deixa de existir.',
    )
    expect(texto('apagar-manter')).toBe('Manter a setlist')
    expect(texto('apagar-confirmar')).toBe('Apagar')

    await tocar('apagar-manter')
    await assentar(20)
    expect(achar('apagar-confirmar')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])

    await tocar('setlist-apagar')
    await tocar('apagar-confirmar')
    await assentar(80)

    expect(so('write op=delete')).toHaveLength(1)
    expect(so('write op=delete')[0]).toMatch(
      /^write op=delete setlist=aaaaaaaa items=- status=200 code=- ms=\d+$/,
    )
    expect(so('resync kind=setlists')[0]).toMatch(/reason=write op=delete status=200/)
    // Volta para S1 SEM aviso: apagar de propósito não é acidente.
    expect(saiuParaS1).toEqual([null])
    expect((await mock.doServidor()).find((s) => s.id === SL)).toBeUndefined()
    /**
     * **E o conjunto da releitura chega à raiz ANTES da saída** — div. 270,
     * achada no §4 e não por este CN, que na primeira forma parava na linha
     * de cima. No aparelho o cache ficava certo (quem o grava é o
     * `escrita.ts`) e **S1 voltava mostrando a setlist apagada**, porque o
     * estado da raiz não tinha sido avisado. A ordem importa: quem sai da
     * tela entrega a lista nova primeiro.
     */
    expect(relido).not.toBeNull()
    expect((relido ?? []).some((s) => s.id === SL)).toBe(false)
  })
})

// ------------------------------------------------------ (j) o 404

describe('(j) T2-R10 — 404 em qualquer escrita: S2 é abandonada e S1 já vem relida', () => {
  it('a folha fecha, a tela sai com `sumiu`, e S1 mostra a frase sem botão', async () => {
    await mock.servir('escrita-404', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(80)

    expect(so('write op=update')[0]).toMatch(/ status=404 code=NOT_FOUND /)
    // T2-R10: o 404 dispara a MESMA leitura, com a razão própria.
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=404 op=update status=200/)
    expect(saiuParaS1).toEqual(['sumiu'])
    // Div. 270, o outro caminho: *"cai em S1 já relida"* — a lista da
    // releitura do 404 chega à raiz antes de a tela sair.
    expect(relido).not.toBeNull()

    // A outra metade: S1 com a linha de aviso do congelado, SEM botão.
    desmontar()
    await montar(
      <S1.SetlistsScreen
        setlists={[]}
        contentById={contentById}
        filesPresent={new Set()}
        baixando={new Set()}
        temCache
        sync={{ fase: 'ok', syncedAtMs: Date.now() }}
        online
        sumiu
        onTentarNovamente={() => undefined}
        onAbrirSetlist={() => undefined}
        onBaixarSetlist={() => undefined}
        onBuscar={() => undefined}
        estadoLocal={null}
        aoRelerNaEscrita={() => undefined}
      />,
    )
    expect(texto('aviso-motivo')).toBe(
      'Essa setlist não existe mais. A lista abaixo é a que o servidor tem agora.',
    )
    expect(achar('aviso-acao')).toBeNull()
  })
})

// ------------------------------------- (n) N2-PR7 — N2-D32 e N2-E21 em S2

/**
 * **O defeito que o §3 da N2-PR7 achou no AVD** (`remove … status=net` e
 * `resync … reason=reopen … status=net`): com a releitura da regra 3 FALHA,
 * S2 dizia *"a lista abaixo é a que o servidor acabou de devolver"* e
 * oferecia `Tentar de novo` — as duas coisas contra a N2-D32. E um 404 com a
 * releitura falha saía para S1 dizendo que *"a lista abaixo é a que o
 * servidor tem agora"*, sem ter lido lista nenhuma. O modo do mock com o
 * sufixo `-releitura-500` (N2-PR7) é o que alcança os dois casos.
 */
describe('(n) N2-D32 / N2-E21 — a escrita falhou E a releitura também', () => {
  it('500 no remover e 500 na releitura: sem "lista relida", e o botão RECARREGA', async () => {
    await mock.servir('escrita-500-releitura-500', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-4')
    await assentar(120)

    expect(so('write op=remove')[0]).toMatch(/ status=500 code=INTERNAL_ERROR /)
    expect(so('resync')).toEqual([
      expect.stringMatching(/^resync kind=setlists reason=reopen op=- status=500 setlists=- ms=\d+$/),
    ])
    const aviso = texto('aviso-motivo')
    expect(aviso).toContain('Não foi possível salvar')
    expect(aviso).toContain('falha no servidor — nada foi alterado aqui')
    // A terceira oração é uma afirmação sobre uma releitura que NÃO houve.
    expect(aviso).not.toContain('a lista abaixo é a que o servidor acabou de devolver')
    // N2-D32: sem estado real, nenhuma repetição de escrita — só recarregar.
    expect(texto('aviso-acao')).toBe('Tentar recarregar')
    expect(inativo('aviso-acao')).toBe(false)

    // Recarregar com a leitura de pé: agora sim, a regra 3 foi cumprida, e o
    // `Tentar de novo` aparece com a terceira oração.
    await mock.servir('escrita-500', semEmbutido(await mock.doServidor()), BIBLIOTECA)
    linhas = []
    await tocar('aviso-acao')
    await assentar(80)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=200/)
    expect(texto('aviso-motivo')).toContain('a lista abaixo é a que o servidor acabou de devolver')
    expect(texto('aviso-acao')).toBe('Tentar de novo')
  })

  it('404 no remover e 500 na releitura: sai para S1 com `sumiu-nao-relido`, sem a lista', async () => {
    await mock.servir('escrita-404-releitura-500', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-4')
    await assentar(120)

    expect(so('write op=remove')[0]).toMatch(/ status=404 code=NOT_FOUND /)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=404 op=remove status=500/)
    // T2-R10: o 404 é conhecimento — a tela SAI. Mas não "já relida".
    expect(saiuParaS1).toEqual(['sumiu-nao-relido'])
    expect(relido).toBeNull()
  })

  it('extra X5 — o mesmo vale para o 404 do editar (e dos outros caminhos de saída)', async () => {
    await mock.servir('escrita-404-releitura-500', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('setlist-editar')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(120)

    expect(so('write op=update')[0]).toMatch(/ status=404 code=NOT_FOUND /)
    expect(saiuParaS1).toEqual(['sumiu-nao-relido'])
    expect(relido).toBeNull()
  })

  it('S1 com `sumiu-nao-relido`: as duas orações, `Tentar recarregar`, e depois do 200 a frase do 404', async () => {
    await mock.servir('escrita', [], BIBLIOTECA)
    const estadoLocal = { uid: UID, setlists: [setlistComBis()], content: BIBLIOTECA, syncedAtMs: 1 }
    let relidoEmS1: SetlistDTO[] | null = null
    await montar(
      <S1.SetlistsScreen
        setlists={[setlistComBis()]}
        contentById={contentById}
        filesPresent={new Set()}
        baixando={new Set()}
        temCache
        sync={{ fase: 'ok', syncedAtMs: Date.now() }}
        online
        sumiu
        sumiuNaoRelido
        onTentarNovamente={() => undefined}
        onAbrirSetlist={() => undefined}
        onBaixarSetlist={() => undefined}
        onBuscar={() => undefined}
        estadoLocal={estadoLocal}
        aoRelerNaEscrita={(novas: SetlistDTO[]) => { relidoEmS1 = novas }}
      />,
    )
    // N2-E21: as duas primeiras orações das frases de origem, e nada mais —
    // "a lista abaixo é a que o servidor tem agora" seria falso aqui.
    expect(texto('aviso-motivo')).toBe('Essa setlist não existe mais. Não foi possível recarregar a lista.')
    expect(texto('aviso-acao')).toBe('Tentar recarregar')

    await tocar('aviso-acao')
    await assentar(80)
    expect(so('resync')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=200/)
    expect(relidoEmS1).toEqual([])
    // Relida, a frase inteira do 404 volta a ser verdade — e não há botão.
    expect(texto('aviso-motivo')).toBe(
      'Essa setlist não existe mais. A lista abaixo é a que o servidor tem agora.',
    )
    expect(achar('aviso-acao')).toBeNull()
  })
})

// ------------------------------------------------------ (k) o 401

describe('(k) T2-R13 / N2-D9 — 401 numa escrita de S2 não desloga', () => {
  it('o aviso traz a frase do conjunto, e a sessão fica', async () => {
    await mock.servir('escrita-401', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-4')
    await assentar(80)

    expect(texto('aviso-motivo')).toContain('não foi possível salvar — confira sua conta no site')
    expect(deslogou).not.toHaveBeenCalled()
    // A-N2-15 por linha exata (`grep -x`), não por prefixo.
    expect(exatas(linhas, 'auth-failure')).toEqual([])
    expect(exatas(linhas, 'login-screen')).toEqual([])
    expect(so('api status=401')[0]).toMatch(/ n=2 ms=\d+$/)
  })
})

// ------------------------------------------------- (l) sem rede

describe('(l) T2-R12 / N2-X-sem-rede — sem rede, os controles de escrita inativam', () => {
  it('faixa e `remover` inativos com o desenho amputado, o motivo escrito uma vez, zero request', async () => {
    await mock.servir('escrita', [setlistComBis()], BIBLIOTECA)
    online = false
    await montar(<S2.IndexScreen {...(await props())} />)

    expect(texto('aviso-motivo')).toBe(
      'Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.',
    )
    // Uma frase só, para os cinco controles (regra 11): sem ação na linha.
    expect(achar('aviso-acao')).toBeNull()
    expect(inativo('setlist-editar')).toBe(true)
    expect(inativo('setlist-apagar')).toBe(true)
    expect(inativo('remover-1')).toBe(true)

    // As amputações do anexo D: o lápis perde a ponta, a lixeira perde a
    // parede direita e as costelas, o menos fica com meia corda.
    expect(paths('setlist-editar')).toEqual(['M4.5 19.5h4L20 8', 'M15 5l4 4'])
    expect(paths('setlist-apagar')).toEqual(['M4.5 7h15M9.5 7V4.8h5V7M6.8 7l1 12.2h8.4'])
    expect(paths('remover-1')).toEqual(['M8 12h4'])

    // Tocar num inativo não abre nada e não gera request.
    await tocar('setlist-editar')
    await tocar('setlist-apagar')
    await tocar('remover-1')
    await assentar(30)
    expect(achar('form-nome')).toBeNull()
    expect(achar('apagar-confirmar')).toBeNull()
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
    // Ler e tocar continuam intactos.
    expect(inativo('buscar')).toBe(false)
    expect(achar('song-1')).not.toBeNull()
  })
})

// -------------------------------------------------- (m) o limite

describe('(m) T2-R14 / N2-X-limite — 429 fecha a família e o aviso diz o prazo', () => {
  it('a frase carrega o N do `Retry-After`, e a escrita seguinte nem sai', async () => {
    await mock.servir('escrita-429', [setlistComBis()], BIBLIOTECA)
    await montar(<S2.IndexScreen {...(await props())} />)
    await tocar('remover-4')
    await assentar(80)

    expect(texto('aviso-motivo')).toMatch(/muitas alterações seguidas — tente de novo em \d+ s/)

    linhas = []
    await tocar('remover-3')
    await assentar(50)
    expect(so('write op=')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=remove reason=ratelimit'])
  })
})
