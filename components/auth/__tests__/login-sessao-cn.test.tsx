/**
 * I1-PR1 — CN de tela do loop mudo do POST /api/auth/session (H-I1-2, H-I1-7;
 * docs/ux/I1-PRECHECK.md §0.2 e §10).
 *
 * Monta o FirebaseAuthProvider REAL com o LoginPanel REAL e o
 * lib/firebase-session-cookies REAL; mockados só o SDK do Firebase, o `fetch`
 * e o `window.location` (a navegação cheia do painel é `location.href = …`).
 *
 * No navegador o loop é: POST falha → o painel navega a /dashboard →
 * requirePageUser devolve a /login → o Firebase restaura o usuário → de novo.
 * No jsdom não há navegação de verdade: o que se mede é a VOLTA — cada
 * atribuição a `location.href` é uma volta, e cada `GET /api/profile` antes
 * do cookie é consumo da cota de perfil (60/15 min).
 *
 * Requisitos (a)–(c) da §0.2: com o POST falhando, 1 POST, 0 GET /api/profile,
 * 0 navegações e a razão visível; com o POST 2xx, navega uma vez, e só depois
 * do 2xx.
 *
 * Commit 2 (depois do aval): as frases ficam LITERAIS (components/auth/
 * frases-sessao.ts, lista declarada no README dos anexos); entram (iv) o
 * "Tentar de novo", (v) a renovação que falha (forma A: linha de aviso no topo
 * + suspensão) e (vi) a limpeza dos listeners de renovação (div. 526).
 */
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// O test-setup global substitui o context por um mock; aqui vale o real
vi.unmock('@/contexts/firebase-auth-context')

const fb = vi.hoisted(() => ({
  listener: null as null | ((u: unknown) => Promise<void> | void),
  pathname: '/login',
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => Promise<void>) => {
    fb.listener = cb
    return () => {}
  },
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('id-token-teste'),
  updateProfile: vi.fn(),
  sendEmailVerification: vi.fn(),
}))

vi.mock('@/lib/firebase', () => ({ auth: { currentUser: null }, isFirebaseConfigured: true }))
vi.mock('@/lib/logger', () => ({ default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => fb.pathname,
}))

import { FirebaseAuthProvider } from '@/contexts/firebase-auth-context'
import { LoginPanel } from '@/components/auth/login-panel'
import { auth } from '@/lib/firebase'
import { fireEvent } from '@testing-library/react'

const USUARIO = { uid: 'uid-teste', email: 'audit@example.com', displayName: 'Audit', photoURL: null }

type Sessao = 500 | 429 | '429-sem-prazo' | 401 | 'rede' | 200 | 'adiada'

/** Log de requests e de navegações — a medida do CN. */
let log: string[] = []
let navegacoes: string[] = []
let liberarSessao: (() => void) | null = null

function resposta(status: number, corpo: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => corpo,
  } as unknown as Response
}

/** `sessao` vale para todo POST; uma lista vale um item por POST (o último se repete). */
function instalarFetch(sessoes: Sessao | Sessao[]) {
  const fila = Array.isArray(sessoes) ? [...sessoes] : [sessoes]
  const f = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === 'string' ? entrada : entrada.toString()
    const metodo = (init?.method ?? 'GET').toUpperCase()
    log.push(`${metodo} ${url}`)
    if (url === '/api/auth/session' && metodo === 'DELETE') return resposta(200, { success: true })
    if (url === '/api/auth/session' && metodo === 'POST') {
      const sessao = fila.length > 1 ? fila.shift()! : fila[0]!
      if (sessao === '429-sem-prazo') return resposta(429, { error: 'Too many requests' })
      if (sessao === 'rede') throw new TypeError('Failed to fetch')
      if (sessao === 429) return resposta(429, { error: 'Too many requests' }, { 'Retry-After': '60' })
      if (sessao === 401) return resposta(401, { error: 'Invalid or expired token' })
      if (sessao === 500) return resposta(500, { error: 'Internal server error' })
      if (sessao === 'adiada') {
        await new Promise<void>((r) => { liberarSessao = r })
        return resposta(200, { success: true })
      }
      return resposta(200, { success: true })
    }
    if (url === '/api/profile' && metodo === 'GET') return resposta(200, { id: USUARIO.uid, email: USUARIO.email })
    return resposta(404, { error: 'não previsto no CN' })
  })
  vi.stubGlobal('fetch', f)
}

const locOriginal = window.location
function instalarLocation() {
  const falsa = {
    pathname: '/login',
    search: '',
    origin: 'http://localhost',
    get href() { return 'http://localhost/login' },
    set href(v: string) { navegacoes.push(v) },
    assign: (v: string) => { navegacoes.push(v) },
    replace: (v: string) => { navegacoes.push(v) },
    reload: () => { navegacoes.push('(reload)') },
  }
  Object.defineProperty(window, 'location', { configurable: true, value: falsa })
}

/** Deixa as promessas e os efeitos assentarem (sem temporizador falso: o fluxo é só microtarefa + render). */
async function assentar(ms = 50) {
  for (let i = 0; i < 5; i++) {
    await act(async () => { await new Promise((r) => setTimeout(r, ms / 5)) })
  }
}

const conta = (linha: string) => log.filter((l) => l === linha).length

function montar() {
  render(
    <FirebaseAuthProvider>
      <LoginPanel />
    </FirebaseAuthProvider>,
  )
}

/** A volta do loop: o /login recarrega com o usuário persistido no Firebase. */
async function voltaComUsuarioPersistido() {
  montar()
  ;(auth as { currentUser: unknown }).currentUser = USUARIO
  await act(async () => { await fb.listener!(USUARIO) })
  await assentar()
}

/** O login novo: /login deslogado (listener com null), depois o submit (listener com o usuário). */
async function loginNovo() {
  montar()
  await act(async () => { await fb.listener!(null) })
  await assentar()
  ;(auth as { currentUser: unknown }).currentUser = USUARIO
  await act(async () => { void fb.listener!(USUARIO) })
  await assentar()
}

function textoDoAlerta(): string {
  const alertas = screen.queryAllByRole('alert')
  return alertas.map((a) => a.textContent ?? '').join(' | ').trim()
}

/** O motivo das linhas de aviso na tela (sem o rótulo do botão). */
function motivos(): string[] {
  return screen.queryAllByRole('alert').map((a) => a.querySelector('span')?.textContent ?? '')
}

function visibilidade() {
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  log = []
  navegacoes = []
  liberarSessao = null
  fb.listener = null
  fb.pathname = '/login'
  ;(auth as { currentUser: unknown }).currentUser = null
  instalarLocation()
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: locOriginal })
  vi.unstubAllGlobals()
})

describe('I1-PR1 CN — POST /api/auth/session falhando: uma falha é uma tela, não uma volta', () => {
  const falhas: Array<[string, Sessao, string]> = [
    ['500', 500, 'falha no servidor — a sessão não foi aberta'],
    ['429 (Retry-After: 60)', 429, 'muitas tentativas de entrar — tente de novo em 1 min'],
    ['401', 401, 'o servidor não aceitou o login — entre de novo'],
    ['rede', 'rede', 'sem conexão — a sessão não foi aberta'],
  ]

  for (const [nome, sessao, frase] of falhas) {
    it(`(i/ii) POST ${nome}, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível`, async () => {
      instalarFetch(sessao)
      await voltaComUsuarioPersistido()

      expect({
        post: conta('POST /api/auth/session'),
        getProfile: conta('GET /api/profile'),
        navegacoes,
      }).toEqual({ post: 1, getProfile: 0, navegacoes: [] })
      expect(textoDoAlerta()).not.toBe('')
      expect(motivos()).toEqual([frase])
    })

    it(`(i/ii) POST ${nome}, login novo: 1 POST, 0 GET /api/profile, 0 navegações, razão visível`, async () => {
      instalarFetch(sessao)
      await loginNovo()

      expect({
        post: conta('POST /api/auth/session'),
        getProfile: conta('GET /api/profile'),
        navegacoes,
      }).toEqual({ post: 1, getProfile: 0, navegacoes: [] })
      expect(textoDoAlerta()).not.toBe('')
      expect(motivos()).toEqual([frase])
    })
  }

  it('(b) cada razão tem a sua frase, e a do 429 leva o Retry-After', async () => {
    const textos: Record<string, string> = {}
    for (const [nome, sessao] of falhas) {
      instalarFetch(sessao)
      ;(auth as { currentUser: unknown }).currentUser = USUARIO
      const { unmount } = render(
        <FirebaseAuthProvider>
          <LoginPanel />
        </FirebaseAuthProvider>,
      )
      await act(async () => { await fb.listener!(USUARIO) })
      await assentar()
      textos[nome] = textoDoAlerta()
      unmount()
      vi.unstubAllGlobals()
    }
    expect(new Set(Object.values(textos)).size).toBe(falhas.length)
    expect(textos['429 (Retry-After: 60)']).toMatch(/\b60\b|\b1 min/)
  })
})

describe('I1-PR1 CN — POST /api/auth/session 2xx: navega uma vez, e só depois do 2xx', () => {
  it('(iii) usuário persistido: 1 POST, navega a /dashboard uma vez, sem alerta', async () => {
    instalarFetch(200)
    await voltaComUsuarioPersistido()

    expect(conta('POST /api/auth/session')).toBe(1)
    expect(navegacoes).toEqual(['/dashboard'])
    expect(textoDoAlerta()).toBe('')
  })

  it('(iii/a) login novo com o POST pendente: não navega nem lê o perfil antes do 2xx; navega uma vez depois', async () => {
    instalarFetch('adiada')
    await loginNovo()

    // o POST saiu e ainda não respondeu
    expect(conta('POST /api/auth/session')).toBe(1)
    expect({ getProfile: conta('GET /api/profile'), navegacoes }).toEqual({ getProfile: 0, navegacoes: [] })

    await act(async () => { liberarSessao!() })
    await assentar()

    expect(navegacoes).toEqual(['/dashboard'])
    const iPost = log.indexOf('POST /api/auth/session')
    const iPerfil = log.indexOf('GET /api/profile')
    expect(iPerfil === -1 || iPerfil > iPost).toBe(true)
  })
})

describe('I1-PR1 CN — commit 2: frase sem prazo, "Tentar de novo", renovação e limpeza', () => {
  it('(b) 429 sem Retry-After: a frase não inventa prazo', async () => {
    instalarFetch('429-sem-prazo')
    await voltaComUsuarioPersistido()

    expect(motivos()).toEqual(['muitas tentativas de entrar — tente de novo em instantes'])
    expect(navegacoes).toEqual([])
  })

  it('(iv) "Tentar de novo" depois de um 500: exatamente 1 POST a mais; no 2xx navega uma vez', async () => {
    instalarFetch([500, 200])
    await voltaComUsuarioPersistido()
    expect({ post: conta('POST /api/auth/session'), navegacoes }).toEqual({ post: 1, navegacoes: [] })

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' })) })
    await assentar()

    expect(conta('POST /api/auth/session')).toBe(2)
    expect(navegacoes).toEqual(['/dashboard'])
    const iPerfil = log.indexOf('GET /api/profile')
    expect(iPerfil).toBeGreaterThan(log.lastIndexOf('POST /api/auth/session'))
  })

  it('(v) renovação que falha fora do /login: linha de aviso no topo, 0 navegações, e nada repete sozinho', async () => {
    // I1-PR-9 (decisão 9): no /dashboard e na /library a linha é da própria tela, abaixo do título; o topo
    // (este CN) segue valendo nas telas de corpo velho — a mesma rota "fora do /login", uma delas
    fb.pathname = '/setlists'
    instalarFetch([200, 500, 500, 200])
    render(
      <FirebaseAuthProvider>
        <div>app</div>
      </FirebaseAuthProvider>,
    )
    ;(auth as { currentUser: unknown }).currentUser = USUARIO
    await act(async () => { await fb.listener!(USUARIO) })
    await assentar()
    expect(conta('POST /api/auth/session')).toBe(1)
    expect(motivos()).toEqual([])

    // volta à aba: a renovação falha
    await act(async () => { visibilidade() })
    await assentar()
    expect(conta('POST /api/auth/session')).toBe(2)
    expect(motivos()).toEqual(['a sessão não foi renovada: falha no servidor'])
    expect(navegacoes).toEqual([])

    // (c) outra volta à aba: suspensa — nenhum POST
    await act(async () => { visibilidade() })
    await assentar()
    expect(conta('POST /api/auth/session')).toBe(2)

    // o usuário age: 1 POST (500 de novo) → a mesma linha, sem navegar
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' })) })
    await assentar()
    expect(conta('POST /api/auth/session')).toBe(3)
    expect(motivos()).toEqual(['a sessão não foi renovada: falha no servidor'])

    // age de novo: 2xx → a linha some, a renovação volta
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' })) })
    await assentar()
    expect(conta('POST /api/auth/session')).toBe(4)
    expect(motivos()).toEqual([])
    expect(navegacoes).toEqual([])
  })

  it('(vi) div. 526: desmontar o provider remove o listener de visibilitychange e o intervalo de 50 min', async () => {
    instalarFetch(200)
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const setInt = vi.spyOn(globalThis, 'setInterval')
    const clearInt = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = render(
      <FirebaseAuthProvider>
        <div>app</div>
      </FirebaseAuthProvider>,
    )
    await assentar()
    const vis = (spy: typeof add) => spy.mock.calls.filter((c) => c[0] === 'visibilitychange').map((c) => c[1])
    const intervalos = setInt.mock.results
      .filter((_r, i) => setInt.mock.calls[i]![1] === 50 * 60 * 1000)
      .map((r) => r.value)
    expect(vis(add)).toHaveLength(1)
    expect(intervalos).toHaveLength(1)

    unmount()
    expect(vis(remove)).toEqual(vis(add))
    expect(clearInt.mock.calls.map((c) => c[0])).toContain(intervalos[0])
    add.mockRestore(); remove.mockRestore(); setInt.mockRestore(); clearInt.mockRestore()
  })
})
