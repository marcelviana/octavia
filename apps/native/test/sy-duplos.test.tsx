/**
 * SY-PR1 — OS DUPLOS DO SY (SY-D13; `docs/native/SY-PRECHECK.md` A8): o `AppState` do `fake-react-native.tsx` e o
 * `fake-expo-network.ts`. Antes de um gate depender de um duplo, o duplo se prova (o molde do `duplo-colunas.test.tsx`
 * da QL-PR1): o que ele entrega, quando, e que o desligar desliga. E o que o app faz hoje com ele — o `useOnline`
 * (`net.ts`) sobre o duplo de rede: a primeira leitura loga `net online` (a `null → true` que NÃO é gatilho, A2.1), e
 * a repetição de um evento não loga de novo.
 *
 * O que NÃO prova: a entrega do Android (o aparelho, na PR-4: A-SY-18, A-SY-19).
 */
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppState, __appState, __limparAppState, __ouvintesDoAppState, type EstadoDoApp } from './fake-react-native'
import { __leiturasDeRede, __limparRede, __ouvintesDeRede, __rede, __redeSemEvento, addNetworkStateListener, getNetworkStateAsync } from './fake-expo-network'
import { assentar, desmontar, montar } from './tela'

vi.mock('expo-network', () => import('./fake-expo-network'))

let linhas: string[] = []

beforeEach(() => {
  __limparAppState()
  __limparRede()
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    linhas.push(a.map(String).join(' '))
  })
})

afterEach(() => {
  desmontar()
  vi.restoreAllMocks()
})

describe('o AppState do duplo', () => {
  it('começa active; entrega o change só na MUDANÇA; o remove desliga', () => {
    const vistos: EstadoDoApp[] = []
    expect(AppState.currentState).toBe('active')
    const sub = AppState.addEventListener('change', (e) => vistos.push(e))
    expect(__ouvintesDoAppState()).toBe(1)
    __appState('background')
    __appState('background') // repetido: nada
    __appState('active')
    expect(vistos).toEqual(['background', 'active'])
    expect(AppState.currentState).toBe('active')
    sub.remove()
    expect(__ouvintesDoAppState()).toBe(0)
    __appState('background')
    expect(vistos).toEqual(['background', 'active'])
  })
})

describe('o expo-network do duplo', () => {
  it('a leitura devolve o estado de agora; o evento chega a cada ouvinte, inclusive repetido; nada ao assinar', async () => {
    const vistos: boolean[] = []
    const sub = addNetworkStateListener((e) => vistos.push(e.isInternetReachable))
    expect(vistos, 'nada ao assinar').toEqual([])
    expect((await getNetworkStateAsync()).isInternetReachable).toBe(true)
    __rede(false)
    __rede(true)
    __rede(true)
    expect(vistos).toEqual([false, true, true])
    __redeSemEvento(false)
    expect(vistos).toEqual([false, true, true])
    expect((await getNetworkStateAsync()).isInternetReachable).toBe(false)
    expect(__leiturasDeRede()).toBe(2)
    sub.remove()
    expect(__ouvintesDeRede()).toBe(0)
  })

  it('o useOnline de hoje sobre o duplo: a primeira leitura loga net online; a volta false → true loga; a repetição não', async () => {
    const { useOnline } = await import('../src/net')
    function Sonda(): null {
      useOnline()
      return null
    }
    await montar(<Sonda />)
    await assentar(5)
    expect(__ouvintesDeRede()).toBe(1)
    for (const v of [false, true, true]) {
      await act(async () => {
        __rede(v)
      })
      await assentar(5)
    }
    const net = linhas.filter((l) => l.startsWith('OCTAVIA: net '))
    console.info(`useOnline sobre o duplo: ${net.length} linhas net — ${JSON.stringify(net)}`)
    expect(net).toEqual(['OCTAVIA: net online', 'OCTAVIA: net offline', 'OCTAVIA: net online'])
    desmontar()
    expect(__ouvintesDeRede(), 'o efeito desmontado desliga o ouvinte').toBe(0)
  })
})
