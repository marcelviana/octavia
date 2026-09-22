/**
 * CN (i) — T2-R17 / div. 228: o gancho do prefetch, LIGADO.
 *
 * Em arquivo próprio, e de propósito. Este CN reprova **por ausência do
 * módulo** (`src/apos-escrita.ts` não existe na árvore de hoje), que é a mesma
 * forma dos treze CNs da N2-PR2 — e um arquivo que não CARREGA derruba a suíte
 * inteira dele, não só o seu `it`. Os oito CNs de tela do `s1-criar.test.tsx`
 * reprovam por asserção, um a um, e não podiam ser levados junto por este.
 *
 * **O que a div. 228 mediu, e que este CN fecha**: o `sincronizar()` nunca
 * chamou o prefetch — quem o chama é o `App.tsx`, nas duas saídas do
 * `rodarSync`. A releitura da N2-D13 não passa por lá. Logo o T2-R17 **não
 * acontece por construção**: é uma ligação a fazer, e ela é este módulo.
 */
// ANTES de qualquer import de `src/`: o `api.ts` lê `__DEV__` no topo.
import './dev-flag'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { __reset } from './fake-expo-file-system'
import { __proximaData } from './fake-datetimepicker'
import { Mock, portaLivre } from './mock'
import { assentar, desmontar, digitar, montar, tocar } from './tela'
import { ligarPrefetchAposEscrita } from '../src/apos-escrita'

vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-prefetch-${++tokens}` } },
}))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const UID = 'cn-prefetch'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'

function content(id: string, title: string): ContentDTO {
  return {
    id, title, artist: null, album: null,
    content_type: 'Lyrics', content_data: { lyrics: `letra de ${title}` },
    file_url: null, updated_at: T0,
  }
}

function setlist(id: string, nome: string): SetlistDTO {
  return {
    id, name: nome, performance_date: null, venue: null, updated_at: T0,
    setlist_songs: [{ id: `${id}-ss-1`, setlist_id: id, content_id: 'c-1', position: 1, notes: null, content: null }],
  }
}

const BIBLIOTECA = [content('c-1', 'Primeira')]

let mock: Mock
let dir = ''
let linhas: string[] = []
type Escrita = typeof import('../src/escrita')
let escrita: Escrita
type Tela = typeof import('../src/screens/SetlistsScreen')
let S1: Tela

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(JSON.stringify(setlists.map((s) => ({
    ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })),
  })))) as SetlistDTO[]
}

function daquiA(dias: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-prefetch-'))
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
  __proximaData(null)
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

describe('(i) T2-R17 / div. 228 — criar com data nos próximos 7 dias dispara o prefetch', () => {
  it('com o gancho ligado, criar datado produz `prefetch plan … reason=7d` sem abrir a setlist', async () => {
    await mock.servir('escrita', [setlist(SL, 'Show')], BIBLIOTECA)
    const contentById = new Map(BIBLIOTECA.map((c) => [c.id, c]))
    const desligar = ligarPrefetchAposEscrita(() => contentById, () => undefined, () => undefined)
    try {
      const doServidor = await mock.doServidor()
      await montar(
        <S1.SetlistsScreen
          setlists={semEmbutido(doServidor)}
          contentById={contentById}
          filesPresent={new Set()}
          baixando={new Set()}
          temCache
          sync={{ fase: 'ok', syncedAtMs: Date.now() }}
          online
          onTentarNovamente={() => undefined}
          onAbrirSetlist={() => undefined}
          onBaixarSetlist={() => undefined}
          onBuscar={() => undefined}
          estadoLocal={{ uid: UID, setlists: semEmbutido(doServidor), content: BIBLIOTECA, syncedAtMs: 1 }}
          aoRelerNaEscrita={() => undefined}
        />,
      )
      await tocar('criar-setlist')
      await digitar('form-nome', 'Show de sábado')
      __proximaData(daquiA(3))
      await tocar('form-data')
      await tocar('seletor-de-data')
      await tocar('form-salvar')
      await assentar(50)

      expect(so('write op=create')).toHaveLength(1)
      expect(so('resync kind=setlists')).toHaveLength(1)
      // A prova da div. 228: a releitura da ESCRITA disparou o prefetch.
      expect(so('prefetch plan')).toHaveLength(1)
      expect(so('prefetch plan')[0]).toMatch(/^prefetch plan n=\d+ reason=7d$/)
    } finally {
      desligar()
    }
  })

  it('desligado, a MESMA criação não produz nenhuma linha de prefetch', async () => {
    // O controle positivo do gancho: sem ele, o T2-R17 não acontece — que é
    // exatamente o que a div. 228 mediu contra a árvore da N2-PR2.
    await mock.servir('escrita', [setlist(SL, 'Show')], BIBLIOTECA)
    const contentById = new Map(BIBLIOTECA.map((c) => [c.id, c]))
    const doServidor = await mock.doServidor()
    await montar(
      <S1.SetlistsScreen
        setlists={semEmbutido(doServidor)}
        contentById={contentById}
        filesPresent={new Set()}
        baixando={new Set()}
        temCache
        sync={{ fase: 'ok', syncedAtMs: Date.now() }}
        online
        onTentarNovamente={() => undefined}
        onAbrirSetlist={() => undefined}
        onBaixarSetlist={() => undefined}
        onBuscar={() => undefined}
        estadoLocal={{ uid: UID, setlists: semEmbutido(doServidor), content: BIBLIOTECA, syncedAtMs: 1 }}
        aoRelerNaEscrita={() => undefined}
      />,
    )
    await tocar('criar-setlist')
    await digitar('form-nome', 'Sem gancho')
    __proximaData(daquiA(3))
    await tocar('form-data')
    await tocar('seletor-de-data')
    await tocar('form-salvar')
    await assentar(50)

    expect(so('write op=create')).toHaveLength(1)
    expect(so('prefetch plan')).toEqual([])
  })
})
