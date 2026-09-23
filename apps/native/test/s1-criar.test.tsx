/**
 * CONTROLES NEGATIVOS DA TELA — N2-PR3 (S1 com "Nova setlist", a folha de
 * criar, a linha de aviso de 48 dp). Vêm ANTES do código que medem: contra a
 * árvore de hoje os nove reprovam por ausência (não há `criar-setlist`, não há
 * `FolhaDeCriar`, não há `LinhaDeAviso`).
 *
 * **O que roda de verdade**: a `SetlistsScreen` e a `FolhaDeCriar` renderizadas
 * com `react-dom` sobre `jsdom` (`tela.tsx`), o `escrever()` da N2-PR2, a
 * camada `api.ts` com o `fetch` do Node, a classificação do core e o `store.ts`
 * sobre o duplo do `expo-file-system`, contra o mock `src/fixtures/aceite.py`.
 * **O que é duplo**: `react-native`, `react-native-svg`, o `datetimepicker`
 * (que é módulo NATIVO), o Firebase, a sessão e o `expo-network`.
 *
 * **O que estes CNs NÃO medem**: geometria. Os 190 × 57,8 dp do botão, os
 * 709,8 → 495,8 da caixa do título e os 48 dp da linha de aviso se medem no
 * **dump do aparelho** (§4 da PR), como em toda esta série. Aqui se mede o que
 * a árvore sabe dizer: qual nó existe, com que `testID`, com que texto, ativo
 * ou inativo, que desenho saiu, e o que acontece ao toque — que é exatamente o
 * que o G6 pergunta ao `uiautomator`.
 */
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import type { SetlistsScreenProps } from '../src/screens/SetlistsScreen'
import { exatas } from './ajuda'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'
import { __proximaData } from './fake-datetimepicker'
import { Mock, portaLivre } from './mock'
import { achar, assentar, desmontar, digitar, exige, inativo, montar, paths, texto, textoDaTela, tocar } from './tela'

/** O espião da N2-D9: quem chama isto é o app deslogando (CN (g)). */
const deslogou = vi.fn()
vi.mock('../src/session', () => ({ signOutSession: async () => { deslogou() } }))

let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-tela-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-tela'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'

function content(id: string, title: string): ContentDTO {
  return {
    id, title, artist: null, album: null,
    content_type: 'Lyrics', content_data: { lyrics: `letra de ${title}` },
    file_url: null, updated_at: T0,
  }
}

function setlist(id: string, nome: string, songs: number): SetlistDTO {
  return {
    id, name: nome, performance_date: null, venue: null, updated_at: T0,
    setlist_songs: Array.from({ length: songs }, (_, i) => ({
      id: `${id}-ss-${i + 1}`, setlist_id: id, content_id: `c-${i + 1}`,
      position: i + 1, notes: null, content: null,
    })),
  }
}

const BIBLIOTECA = [content('c-1', 'Primeira'), content('c-2', 'Segunda')]

let mock: Mock
let dir = ''
let linhas: string[] = []
type Escrita = typeof import('../src/escrita')
let escrita: Escrita
type Tela = typeof import('../src/screens/SetlistsScreen')
let S1: Tela

/** As linhas de log que começam com este prefixo, sem o carimbo `OCTAVIA: `. */
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

/** `YYYY-MM-DD` a `dias` de hoje, pelos componentes LOCAIS (T2-R2). */
function daquiA(dias: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d
}

/** As props de S1 — os valores fixos, e o que cada CN sobrescreve. */
async function props(extra: Partial<SetlistsScreenProps> = {}): Promise<SetlistsScreenProps> {
  const doServidor = await mock.doServidor()
  return {
    setlists: semEmbutido(doServidor),
    contentById: new Map(BIBLIOTECA.map((c) => [c.id, c])),
    filesPresent: new Set<string>(),
    baixando: new Set<string>(),
    temCache: true,
    sync: { fase: 'ok' as const, syncedAtMs: Date.now() },
    online,
    onTentarNovamente: () => undefined,
    onAbrirSetlist: () => undefined,
    onBaixarSetlist: () => undefined,
    onBuscar: () => undefined,
    estadoLocal: { uid: UID, setlists: semEmbutido(doServidor), content: BIBLIOTECA, syncedAtMs: 1 },
    aoRelerNaEscrita: () => undefined,
    ...extra,
  }
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-tela-'))
  const porta = await portaLivre()
  mock = new Mock(porta, dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  escrita = await import('../src/escrita')
  S1 = await import('../src/screens/SetlistsScreen')
})

afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  online = true
  __proximaData(null)
  deslogou.mockClear()
  escrita.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(async () => {
  // **Deixa as pendentes assentarem ANTES de limpar** — medido: a releitura
  // que a folha do teste anterior disparou continua em voo depois do
  // `desmontar()`, e a linha `resync … reason=reopen` dela caía no `linhas`
  // do teste SEGUINTE, que então lia a releitura errada como se fosse a sua.
  // O teste (f) passava sozinho e reprovava na suíte: poluição, não defeito.
  await assentar(20)
  desmontar()
  vi.restoreAllMocks()
})

// --------------------------------------------------------------- (a) S1/S1f

describe('(a) T2-R1 — o ato de criar existe em S1 e em S1f, com o MESMO id', () => {
  it('S1 com lista: o botão da barra tem testID `criar-setlist` e o rótulo do congelado', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    expect(achar('criar-setlist')).not.toBeNull()
    expect(texto('criar-setlist')).toBe('Nova setlist')
    // `Buscar música` continua onde estava (a moldura N2-S1-criar: o grupo é
    // status · escrever · ler, e a leitura não muda de lugar).
    expect(achar('buscar')).not.toBeNull()
  })

  it('S1f (vazia após sync): o MESMO `criar-setlist`, com o rótulo do estado vazio', async () => {
    await mock.servir('escrita', [], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    expect(achar('s1f')).not.toBeNull()
    // Dois nós com o mesmo id (o da barra e o central) — a tabela de testIDs
    // do DESIGN-N2 diz "mesmo id nos dois".
    const todos = [...document.querySelectorAll('[data-testid="criar-setlist"]')]
    expect(todos.length).toBe(2)
    expect(todos.map((e) => e.textContent)).toContain('Criar a primeira setlist')
    // Sai a frase que manda ao web (moldura N2-S1f-criar).
    expect(textoDaTela()).not.toContain('Crie na versão web')
    expect(textoDaTela()).toContain('Nenhuma setlist por aqui ainda.')
    expect(textoDaTela()).toContain('A primeira pode nascer neste aparelho.')
  })
})

// ------------------------------------------------- (b) e (c) as validações

describe('(b) T2-R3 (i) — nome vazio: zero request, motivo visível, ZERO linha de log', () => {
  it('a folha abre com `Criar` inativo, o motivo do campo mais alto, e nada sai', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')

    expect(achar('form-nome')).not.toBeNull()
    expect(inativo('form-salvar')).toBe(true)
    // R1·7c: o motivo do inativo é a MESMA frase do campo que bloqueia.
    expect(texto('form-salvar-motivo')).toBe('a setlist precisa de um nome')
    expect(texto('form-erro-nome')).toBe('a setlist precisa de um nome')

    // Só espaço continua sendo vazio (o `trim` do validador).
    await digitar('form-nome', '   ')
    expect(inativo('form-salvar')).toBe(true)
    await tocar('form-salvar')
    await assentar()

    // ZERO request e ZERO linha de log.
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
    /**
     * **Qual linha o T2-R16 prevê para validação falha: NENHUMA.**
     * A tabela do T2-R16 tem três linhas — `write op=`, `resync kind=` e
     * `write blocked op=<op> reason=offline|ratelimit|ceiling|busy` (mais
     * `nada-mudou`, a quinta razão que a N2-PR2 declarou). Nenhuma delas
     * cobre "o campo está inválido": `write blocked` é "toque num controle de
     * escrita que não gera request", e o `prepararCriacao` do
     * `src/escrita.ts` já diz por escrito que nome vazio e data impossível
     * **não** geram linha — "o botão nasce inativo com o motivo escrito ao
     * lado (N2-D23), e um toque nele não é um toque num controle de escrita".
     * `nada-mudou` é do T2-R3 (iii), que é estado do formulário de EDITAR e
     * não existe em criar. Logo: zero linhas, e é isto que se afirma.
     */
    expect(so('write blocked')).toEqual([])
  })
})

describe('(c) T2-R3 (ii) — data impossível: zero request, motivo junto do campo', () => {
  it('uma data que não existe no calendário barra o envio, e o nome válido não salva sozinho', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    expect(inativo('form-salvar')).toBe(false)

    // O seletor do sistema é um módulo NATIVO e não produz 31/02; o que ele
    // pode devolver é lixo, e é isso que o duplo entrega. O guarda do
    // `dataExiste` existe para esse caso, e é ele que este CN mede.
    __proximaData(new Date(NaN))
    await tocar('form-data')
    await tocar('seletor-de-data')

    expect(texto('form-erro-data')).toBe('essa data não existe')
    expect(inativo('form-salvar')).toBe(true)
    expect(texto('form-salvar-motivo')).toBe('essa data não existe')
    await tocar('form-salvar')
    await assentar()
    expect(so('api')).toEqual([])
    expect(so('write op=')).toEqual([])
  })
})

// ------------------------------------------------------------ (d) o sucesso

describe('(d) T2-R1/T2-R9 — criar: 201, releitura, a folha fecha', () => {
  it('um POST, um GET, a folha some e a setlist nova está no topo de S1', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    const vistos: SetlistDTO[][] = []
    await montar(
      <S1.SetlistsScreen {...(await props({ aoRelerNaEscrita: (s: SetlistDTO[]) => vistos.push(s) }))} />,
    )
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    expect(so('write op=create')).toHaveLength(1)
    expect(so('write op=create')[0]).toMatch(/^write op=create setlist=- items=- status=201 code=- ms=\d+$/)
    expect(so('resync kind=setlists')).toHaveLength(1)
    expect(so('resync kind=setlists')[0]).toMatch(
      /^resync kind=setlists reason=write op=create status=200 setlists=2 ms=\d+$/,
    )
    // A folha fechou.
    expect(achar('form-nome')).toBeNull()
    expect(achar('form-salvar')).toBeNull()
    // O conjunto novo subiu para quem grava, e a setlist está no topo.
    expect(vistos).toHaveLength(1)
    expect(vistos[0]?.[0]?.name).toBe('Season 4')
    expect(doCache()?.setlists).toEqual(semEmbutido(await mock.doServidor()))
    // Nenhuma linha de aviso: o sucesso relido não avisa nada (regra 4).
    expect(achar('aviso-motivo')).toBeNull()
  })
})

// --------------------------------------------- (e) a folha que não fecha

describe('(e) R1·1 / N2-D18 — "grava e corta": a folha fica, com o banner', () => {
  it('o digitado fica, `Tentar de novo` nasce inativo com `relendo a lista…` e depois ativa', async () => {
    await mock.servir('escrita-corta', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    // A folha NÃO fechou e o digitado ficou (fechar apagaria o trabalho).
    expect((exige('form-nome') as HTMLInputElement).value).toBe('Season 4')
    // O banner: a frase do CONJUNTO FECHADO, e a segunda oração fixa.
    const banner = texto('form-falha')
    expect(banner).toContain('Não foi possível criar')
    // N2-E19: a request SAIU e não voltou — "sem resposta do servidor"; o
    // "nada foi salvo" mentiria ao lado da oração que diz que pode ter sido.
    expect(banner).toContain('sem resposta do servidor')
    expect(banner).not.toContain('nada foi salvo')
    expect(banner).toContain(
      'Pode já ter sido gravada — confira a lista antes de tentar de novo. A lista atrás desta folha acabou de ser relida.',
    )
    // `Cancelar` virou `Fechar` (regra 2: não há desfazer).
    expect(texto('form-cancelar')).toBe('Fechar')
    // A releitura já voltou (o GET do modo `escrita-corta` é normal), então o
    // botão está ATIVO — e a linha da releitura saiu.
    expect(inativo('form-tentar')).toBe(false)
    expect(texto('form-tentar')).toContain('Tentar de novo')
    expect(so('resync kind=setlists')).toHaveLength(1)
    expect(so('resync kind=setlists')[0]).toMatch(/reason=reopen op=- status=200/)
  })

  it('enquanto a releitura está em voo, `Tentar de novo` é inativo com o motivo escrito', async () => {
    // O modo `escrita-corta-lento` existe por causa DESTE estado: a escrita
    // falha na hora e a releitura demora 600 ms, que é a única janela em que
    // o congelado desenha `Tentar de novo` inativo com `relendo a lista…`.
    // Com o `escrita-corta` normal a releitura voltava dentro do mesmo `act`
    // e o estado nunca era observável — teste que depende de corrida não é
    // teste.
    await mock.servir('escrita-corta-lento', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(100)

    expect(inativo('form-tentar')).toBe(true)
    expect(texto('form-tentar')).toBe('Tentar de novo')
    // O motivo do inativo mora no mesmo nó que a tabela do §7 dá ao motivo do
    // `Criar` inativo ("motivo do inativo, incl. validação 3") — um só lugar
    // na folha onde se lê por que o botão principal não aceita toque.
    expect(texto('form-salvar-motivo')).toBe('relendo a lista…')

    await assentar(700)
    expect(inativo('form-tentar')).toBe(false)
  })
})

// ------------------------------------------- (f) salvo, mas não relido

describe('(f) N2-D22 / R1·2b — 201 com a releitura em 500: a linha de aviso de S1', () => {
  it('a folha fecha, S1 avisa nomeando a setlist, e `Tentar recarregar` emite reason=reopen', async () => {
    await mock.servir('escrita-resync-500', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    // A folha fechou: o servidor CONFIRMOU (regra 4 — nunca "falhou").
    expect(achar('form-nome')).toBeNull()
    // A linha de aviso de S1 nomeia a setlist (div. 227: o core guarda a
    // segunda oração; S1 monta `<nome> foi criada. ` na frente).
    expect(texto('aviso-motivo')).toBe(
      'Season 4 foi criada. Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda.',
    )
    expect(texto('aviso-acao')).toBe('Tentar recarregar')
    expect(so('resync kind=setlists')[0]).toMatch(/reason=write op=create status=500/)

    linhas = []
    await tocar('aviso-acao')
    await assentar(50)
    expect(so('resync kind=setlists')).toHaveLength(1)
    expect(so('resync kind=setlists')[0]).toMatch(/^resync kind=setlists reason=reopen op=- status=/)
  })
})

// ------------------------------------------------------------ (g) o 401

describe('(g) T2-R13 / N2-D9 — 401 numa escrita não desloga', () => {
  it('o banner traz a frase do conjunto, a sessão fica e a lista continua', async () => {
    await mock.servir('escrita-401', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    expect(texto('form-falha')).toContain('não foi possível salvar — confira sua conta no site')
    expect(deslogou).not.toHaveBeenCalled()
    // A-N2-15 por linha exata (`grep -x`), não por prefixo.
    expect(exatas(linhas, 'auth-failure')).toEqual([])
    expect(exatas(linhas, 'login-screen')).toEqual([])
    // T1-R3: a original e uma depois de renovar, nunca uma terceira.
    expect(so('api status=401')[0]).toMatch(/ n=2 ms=\d+$/)
    // Em 401 nada foi gravado: não há "pode já ter sido gravada" (o servidor
    // recusou antes de tocar o banco, pre-check §7.1).
    expect(texto('form-falha')).not.toContain('Pode já ter sido gravada')
  })
})

// ----------------------------------------------------------- (h) o 429

describe('(h) T2-R14 — 429: a frase carrega o N do Retry-After', () => {
  it('o prazo do servidor entra na frase, e a escrita seguinte nem sai', async () => {
    await mock.servir('escrita-429', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Season 4')
    await tocar('form-salvar')
    await assentar(50)

    // Div. 225: o servidor MANDA o prazo, então a linha do T2-R15 vale com o N.
    expect(texto('form-falha')).toMatch(/muitas alterações seguidas — tente de novo em \d+ s/)

    linhas = []
    await tocar('form-tentar')
    await assentar(50)
    // T2-R14: a família inteira fechou — **zero ESCRITAS**. O que sai é a
    // releitura da regra 3 (um `GET`, de outra família, que não consome a
    // janela `setlist-mutate`): ela é exatamente o que o congelado manda
    // fazer depois de uma falha, antes de oferecer repetir.
    expect(so('write op=')).toEqual([])
    expect(so('write blocked')).toEqual(['write blocked op=create reason=ratelimit'])
    expect(so('api').filter((l) => !l.includes('path=/api/setlists '))).toEqual([])
  })
})

// ------------------------------------------------- (i-bis) a data local

describe('(i-bis) T2-R2 — a data que o seletor devolve vira data-calendário local', () => {
  it('T2-R2 — a data do seletor vira YYYY-MM-DD pelos componentes LOCAIS', async () => {
    await mock.servir('escrita', [], BIBLIOTECA)
    await montar(<S1.SetlistsScreen {...(await props())} />)
    await tocar('criar-setlist')
    await digitar('form-nome', 'Com data')
    // 23:30 local: `toISOString()` daria o DIA SEGUINTE num fuso a oeste.
    const escolhida = new Date(2026, 9, 3, 23, 30, 0)
    __proximaData(escolhida)
    await tocar('form-data')
    await tocar('seletor-de-data')
    await tocar('form-salvar')
    await assentar(50)

    const criada = (await mock.doServidor()).find((s) => s.name === 'Com data')
    expect(criada?.performance_date).toBe('2026-10-03')
  })
})

// ---------------------------------------------------- a linha de aviso: rede

describe('R1·2a / T2-R12 — sem rede, a linha de aviso de S1 e o botão amputado', () => {
  it('`Nova setlist` fica inativo com a cruz amputada, e o motivo está escrito', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show', 2)], BIBLIOTECA)
    online = false
    await montar(<S1.SetlistsScreen {...(await props({ online: false }))} />)

    expect(texto('aviso-motivo')).toBe(
      'Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.',
    )
    // Uma frase por vez, e a de rede vence: sem ação nesta linha.
    expect(achar('aviso-acao')).toBeNull()
    expect(inativo('criar-setlist')).toBe(true)
    // A cruz amputada do anexo D: some a haste vertical, fica o traço.
    expect(paths('criar-setlist')).toEqual(['M4 6.5h12M4 12h8M4 17.5h6', 'M14 17.5h7'])
    // Tocar num inativo não abre a folha e não gera request.
    await tocar('criar-setlist')
    await assentar()
    expect(achar('form-nome')).toBeNull()
    expect(so('api')).toEqual([])
  })
})
