/**
 * GATE (i), FAMÍLIA `tela-` — O QUE O GATILHO FAZ COM A TELA ABERTA (SY-PR4, commit 1; SY-D52, SY-D57). Entra
 * REPROVADO pela lista `sy-reprovados.txt` (as linhas `i:tela-*`); a PR-4 o esvazia ligando os gatilhos de verdade.
 *
 * Cada caso monta a sessão como o `App.tsx` a monta — os gatilhos ligados (`ligarGatilhos`, com a foto da sessão como o
 * palco) e o sync da abertura (`rodarSync`, o executor de verdade, contra o `aceite.py`) —, monta a TELA com o que a
 * raiz tem (S2 com a edição, S1, a L), dispara um gatilho (a rede, ou a volta do segundo plano) e **re-renderiza a tela
 * com o que a raiz passou a ter**: é o que o `App.tsx` faz ao `Navigation` quando o executor aplica (o mesmo desenho do
 * `reordenar.test.tsx`: o pai re-renderiza). Mede o que a tela mostra depois.
 *
 *   - **S2 em edição** (SY-D52): um gatilho que chega muda S2 na hora (ela lê a viva); a reordenação e a folha em
 *     andamento **não se perdem nem pulam**.
 *   - **A falha automática com cache** (SY-D57, decisão do Marcel nesta PR): mostra o S1e de hoje — o banner em S1, a
 *     linha de aviso na L —, (1) **some sozinho no próximo sync que der certo**, inclusive automático, e (2) **não
 *     desfaz o que o músico está fazendo** (a rolagem da lista de S1, a busca digitada na L, S2 em edição).
 *
 * **O que NÃO consegue ver**: geometria e rolagem de verdade (o duplo não rola: o que se mede é que a LISTA de S1 é o
 * MESMO nó depois do banner — remontar a lista é o que zeraria a rolagem no aparelho —, e o aparelho mede o resto), o
 * gesto do reordenar (o arrasto é o registro que o teste alimenta, `tela.tsx` `pegar`), e a `Navigation` real.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { act, type ReactElement } from 'react'
import type { SetlistDTO } from '@octavia/core'
import type { FotoDaSessao } from '../src/foto-do-palco'
import type { GatilhosLigados } from '../src/gatilhos'
import type { SyncState } from '../src/screens/SetlistsScreen'
import { __appState, __limparAppState } from './fake-react-native'
import { __limparRede, __rede } from './fake-expo-network'
import { __reset } from './fake-expo-file-system'
import { Mock, portaLivre } from './mock'
import { Arnes, SEM_DADOS, musica, setlistCom } from './sy-arnes'
import { Checagens, type Veredito } from './sy-lista'
import { achar, desmontar, digitar, exige, inativo, montar, pegar, rerender, textoDaTela, tocar } from './tela'

vi.mock('expo-network', () => import('./fake-expo-network'))
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-gatilhos-telas' } } }))
// A L lê os insets da raiz (o `SafeAreaProvider` do `App.tsx`) e o foco da navegação: os duplos do `biblioteca-tela`.
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }))
vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (efeito: () => (() => void) | void) => {
    const { useEffect } = require('react') as typeof import('react')
    useEffect(() => {
      const limpar = efeito()
      return limpar ?? undefined
    }, [efeito])
  },
}))

const UID = 'sy-gatilhos-telas'
const SL = 'eeeeeeee-1111-4222-8333-444455556666'
const BIBLIOTECA = [1, 2, 3, 4, 5].map((i) => musica(i))
const SETLIST = setlistCom(SL, 'SY telas', BIBLIOTECA.map((c) => c.id))
/** O que o site muda enquanto a tela está aberta: o nome da setlist (o `updated_at` novo faz o sync trazer a nova). */
const RENOMEADA = { ...setlistCom(SL, 'SY telas, renomeada no site', BIBLIOTECA.map((c) => c.id)), updated_at: '2026-10-01T00:00:00.000+00:00' }
const AGORA = Date.parse('2026-10-10T20:00:00.000Z')
/** O passo da coluna do reordenar: a linha de 72 e o vão de 8 (o `reordenar.test.tsx`). */
const PASSO = 80

let mock: Mock
let dir = ''
let S: typeof import('../src/sincronizador')
let G: typeof import('../src/gatilhos')
let F: typeof import('../src/foto-do-palco')
let Telas: {
  IndexScreen: typeof import('../src/screens/IndexScreen').IndexScreen
  SetlistsScreen: typeof import('../src/screens/SetlistsScreen').SetlistsScreen
  LibraryScreen: typeof import('../src/screens/LibraryScreen').LibraryScreen
}
let a: Arnes
let foto: FotoDaSessao
let desligar: () => void = () => undefined
const C = new Checagens('i', 'os gatilhos, com a tela aberta', 'tela-')

const passar = (ms: number): void => {
  vi.setSystemTime(Date.now() + ms)
}
async function evento(f: () => void): Promise<void> {
  await act(async () => {
    f()
  })
  await a.quieto()
}
/** A rede cai e volta com o app na frente: o gatilho da rede. */
async function redeVolta(): Promise<void> {
  await evento(() => __rede(false))
  await evento(() => __rede(true))
}
/** A volta do segundo plano depois de 31 s: o outro gatilho. */
async function voltaLonga(): Promise<void> {
  await evento(() => __appState('background'))
  passar(31_000)
  await evento(() => __appState('active'))
}

/** O que a raiz mostra AGORA: os dados da última aplicação e o último `setSync`. */
function syncAgora(): SyncState {
  return a.syncs.length > 0 ? a.syncs[a.syncs.length - 1]! : { fase: 'sincronizando' }
}

/** A sessão como o `App.tsx` a monta: os gatilhos ligados (o palco fechado), o sync da abertura, e 10 min adiante. */
async function sessao(): Promise<void> {
  __limparAppState()
  __limparRede()
  __reset()
  await mock.servir('normal', [SETLIST], BIBLIOTECA)
  a = new Arnes(UID)
  a.registrar()
  vi.setSystemTime(AGORA)
  foto = F.criarFotoDaSessao()
  const g: GatilhosLigados = G.ligarGatilhos({
    sessao: () => a.sessao,
    pedirSync: () => {
      void S.rodarSync(a.raiz, UID, a.dadosRef.current)
    },
    ultimoSyncNaRede: () => a.ultimoSyncNaRede(),
    palco: foto,
  })
  a.raiz.segurarDeNovo = () => g.segurarDeNovo()
  desligar = g
  await S.rodarSync(a.raiz, UID, SEM_DADOS)
  await a.quieto()
  passar(10 * 60_000)
}

/** S2 com a edição, com o que a raiz tem agora (o `navigation.tsx`: `acharSetlist` + `edicaoDeS2`). */
function s2(): ReactElement {
  const d = a.dados
  const setlist = d.setlists.find((s) => s.id === SL) as SetlistDTO
  return (
    <Telas.IndexScreen
      setlist={setlist}
      contentById={d.contentById}
      syncDone={syncAgora().fase !== 'sincronizando'}
      posicaoAtual={null}
      onVoltar={() => undefined}
      onAbrirPosicao={() => undefined}
      onBuscar={() => undefined}
      edicao={{
        estado: { uid: UID, setlists: d.setlists, content: d.content, syncedAtMs: d.syncedAtMs },
        online: true,
        aoReler: () => undefined,
        aoSairParaS1: () => undefined,
      }}
    />
  )
}

/** S1 com o que a raiz tem agora (as props que o `App.tsx` dá). */
function s1(): ReactElement {
  const d = a.dados
  return (
    <Telas.SetlistsScreen
      setlists={d.setlists}
      contentById={d.contentById}
      filesPresent={new Set()}
      baixando={new Set()}
      temCache={d.temCache}
      sync={syncAgora()}
      online
      onTentarNovamente={() => undefined}
      onAbrirSetlist={() => undefined}
      onBaixarSetlist={() => undefined}
      onBuscar={() => undefined}
      estadoLocal={{ uid: UID, setlists: d.setlists, content: d.content, syncedAtMs: d.syncedAtMs }}
      aoRelerNaEscrita={() => undefined}
    />
  )
}

/** A L com o que a raiz tem agora. */
function biblioteca(): ReactElement {
  const d = a.dados
  return (
    <Telas.LibraryScreen
      contents={d.content}
      filesPresent={new Set()}
      online
      sync={syncAgora()}
      temCache={d.temCache}
      onTentarNovamente={() => undefined}
      onVoltar={() => undefined}
      onTocar={() => undefined}
      onVisualizar={() => undefined}
    />
  )
}

/** As linhas do modo de reordenar, na ordem da tela (o texto de cada linha que tem alça). */
function ordemDoModo(): string[] {
  return [...document.body.querySelectorAll('[data-testid^="alca-"]')].map((e) =>
    (e.parentElement?.textContent ?? '').replace(/\s+/g, ' ').trim(),
  )
}

async function arrastar(de: number, para: number): Promise<void> {
  const g = await pegar(`alca-${de}`)
  const total = (para - de) * PASSO
  await g.mover(total / 3)
  await g.mover((2 * total) / 3)
  await g.mover(total)
  await g.soltar()
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-gatilhos-telas-'))
  mock = new Mock(await portaLivre(), dir)
  await mock.servir('normal', [SETLIST], BIBLIOTECA)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  vi.useFakeTimers({ toFake: ['Date'] })
  S = await import('../src/sincronizador')
  G = await import('../src/gatilhos')
  F = await import('../src/foto-do-palco')
  Telas = {
    IndexScreen: (await import('../src/screens/IndexScreen')).IndexScreen,
    SetlistsScreen: (await import('../src/screens/SetlistsScreen')).SetlistsScreen,
    LibraryScreen: (await import('../src/screens/LibraryScreen')).LibraryScreen,
  }
})

afterAll(async () => {
  vi.useRealTimers()
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

afterEach(() => {
  desmontar()
  desligar()
  desligar = () => undefined
  vi.restoreAllMocks()
})

describe('gate (i), família tela- — o gatilho com S2, S1 e a L abertas (SY-D52, SY-D57)', () => {
  it('SY-D52: S2 no modo de reordenar, com um arrasto feito; um gatilho chega → 1 sync, o modo segue aberto e o arrasto fica', async () => {
    await C.caso('tela-s2-reordenar', async () => {
      await sessao()
      await montar(s2())
      await tocar('reordenar')
      const antes = ordemDoModo()
      await arrastar(1, 3)
      const arrastada = ordemDoModo()
      if (JSON.stringify(arrastada) === JSON.stringify(antes)) return 'o arrasto não mudou a ordem — o cenário não se montou'
      await mock.servir('normal', [RENOMEADA], BIBLIOTECA)
      const i0 = a.marca()
      await redeVolta()
      await rerender(s2())
      const n = a.starts(i0)
      const depois = ordemDoModo()
      const nome = (a.dados.setlists.find((s) => s.id === SL)?.name ?? '').includes('renomeada')
      const salvarAtivo = achar('reordenar-salvar') !== null && !inativo('reordenar-salvar')
      C.nota('tela-s2-reordenar', `sync start: ${n} · a raiz com a renomeada: ${nome} · modo aberto: ${achar('alca-1') !== null} · ordem igual ao arrasto: ${JSON.stringify(depois) === JSON.stringify(arrastada)} · salvar ativo: ${salvarAtivo}`)
      if (n !== 1 || !nome) return `${n} sync(s) e a raiz ${nome ? 'com' : 'sem'} a setlist renomeada — o gatilho não chegou à tela`
      if (achar('alca-1') === null) return 'o modo de reordenar fechou com o sync'
      if (JSON.stringify(depois) !== JSON.stringify(arrastada)) return `a ordem pulou: ${JSON.stringify(depois)} (o arrasto: ${JSON.stringify(arrastada)})`
      if (!salvarAtivo) return 'o `Salvar a ordem` ficou inativo — o arrasto deixou de contar como mudança'
      return null
    })
  })

  it('SY-D52: a folha de renomear aberta, com um nome digitado; um gatilho chega → 1 sync, e o que foi digitado fica', async () => {
    await C.caso('tela-s2-folha', async () => {
      await sessao()
      await montar(s2())
      await tocar('setlist-editar')
      await digitar('form-nome', 'nome digitado pelo músico')
      await mock.servir('normal', [RENOMEADA], BIBLIOTECA)
      const i0 = a.marca()
      await voltaLonga()
      await rerender(s2())
      const n = a.starts(i0)
      const campo = achar('form-nome') as HTMLInputElement | null
      C.nota('tela-s2-folha', `sync start: ${n} · a folha aberta: ${campo !== null} · o campo: ${JSON.stringify(campo?.value ?? null)}`)
      if (n !== 1) return `${n} sync(s), esperado 1 — o gatilho não chegou à tela`
      if (campo === null) return 'a folha fechou com o sync'
      if (campo.value !== 'nome digitado pelo músico') return `o nome digitado se perdeu: ${JSON.stringify(campo.value)}`
      return null
    })
  })

  it('SY-D57 (1): a falha automática com cache põe o banner em S1, e o próximo sync automático que dá certo o tira', async () => {
    await C.caso('tela-banner-some', async () => {
      await sessao()
      await montar(s1())
      const semBannerAntes = achar('tentar-banner') === null
      await mock.servir('500-pagina-1', [SETLIST], BIBLIOTECA)
      const i0 = a.marca()
      await voltaLonga()
      await rerender(s1())
      const comBanner = achar('tentar-banner') !== null
      const falhou = a.desde(i0, 'sync fail').length
      await mock.servir('normal', [SETLIST], BIBLIOTECA)
      passar(31_000) // a falha com status: o intervalo vale (SY-D18)
      await voltaLonga()
      await rerender(s1())
      const semBannerDepois = achar('tentar-banner') === null
      const n = a.starts(i0)
      const ok = a.desde(i0, 'sync ok').length
      C.nota('tela-banner-some', `sem banner antes: ${semBannerAntes} · sync start: ${n} (fail ${falhou}, ok ${ok}) · banner depois da falha: ${comBanner} · sem banner depois do ok: ${semBannerDepois}`)
      if (!semBannerAntes) return 'o banner já estava na tela antes — o cenário não se montou'
      if (n !== 2 || falhou !== 1 || ok !== 1) return `${n} sync(s) (fail ${falhou}, ok ${ok}), esperado 2 (1 falha, 1 ok)`
      if (!comBanner) return 'a falha automática não pôs o banner'
      if (!semBannerDepois) return 'o banner ficou depois do sync automático que deu certo'
      return null
    })
  })

  it('SY-D57 (2): o banner da falha automática não desfaz a lista de S1 (o MESMO nó: a rolagem não se perde)', async () => {
    await C.caso('tela-banner-nao-desfaz-s1', async () => {
      await sessao()
      await montar(s1())
      const lista = document.body.querySelector('[data-flatlist]')
      await mock.servir('500-pagina-1', [SETLIST], BIBLIOTECA)
      const i0 = a.marca()
      await redeVolta()
      await rerender(s1())
      const comBanner = achar('tentar-banner') !== null
      const mesma = lista !== null && document.body.querySelector('[data-flatlist]') === lista && lista.isConnected
      C.nota('tela-banner-nao-desfaz-s1', `sync start: ${a.starts(i0)} · banner: ${comBanner} · a lista é o mesmo nó: ${mesma}`)
      if (!comBanner) return 'a falha automática não pôs o banner — o cenário não se montou'
      if (!mesma) return 'a lista de S1 foi remontada com o banner (a rolagem voltaria ao topo)'
      return null
    })
  })

  it('SY-D57 (2): a linha da falha automática na L não desfaz a busca digitada (o termo e o resultado ficam)', async () => {
    await C.caso('tela-banner-nao-desfaz-l', async () => {
      await sessao()
      await montar(biblioteca())
      await digitar('lib-campo', 'música 2')
      const filtrou = textoDaTela().includes('SY música 2') && !textoDaTela().includes('SY música 1')
      await mock.servir('500-pagina-1', [SETLIST], BIBLIOTECA)
      const i0 = a.marca()
      await voltaLonga()
      await rerender(biblioteca())
      const aviso = achar('aviso-acao') !== null
      const termo = (exige('lib-campo') as HTMLInputElement).value
      const segue = textoDaTela().includes('SY música 2') && !textoDaTela().includes('SY música 1')
      C.nota('tela-banner-nao-desfaz-l', `sync start: ${a.starts(i0)} · a busca filtrou antes: ${filtrou} · a linha de aviso: ${aviso} · o termo: ${JSON.stringify(termo)} · o resultado segue: ${segue}`)
      if (!filtrou) return 'a busca não filtrou antes do sync — o cenário não se montou'
      if (!aviso) return 'a falha automática não pôs a linha de aviso na L'
      if (termo !== 'música 2') return `o termo digitado se perdeu: ${JSON.stringify(termo)}`
      if (!segue) return 'o resultado da busca mudou com a linha de aviso'
      return null
    })
  })

  it('reprova exatamente a lista de sy-reprovados.txt (a família tela-)', () => {
    const j = C.julgar()
    console.info(j.texto)
    expect(j.casos, 'gate sem casos: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(j.naoDeclaradas, 'reprovação NÃO DECLARADA').toEqual([])
    expect(j.orfas, 'declaração ÓRFÃ').toEqual([])
    expect(j.listaNaoVazia, 'lista não vazia: desde a SY-PR4 reprovação declarada não é mais aceita').toEqual([])
  })
})
