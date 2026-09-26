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
 */
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'

// O test-setup global substitui o context por um mock; aqui vale o real
vi.unmock('@/contexts/firebase-auth-context')

const fb = vi.hoisted(() => ({
  listener: null as null | ((u: unknown) => Promise<void> | void),
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
vi.mock('@/lib/offline-cache', () => ({ clearOfflineContent: vi.fn() }))
vi.mock('@/lib/offline-setlist-cache', () => ({ clearOfflineSetlists: vi.fn() }))
vi.mock('@/lib/logger', () => ({ default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() } }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}))

import { FirebaseAuthProvider } from '@/contexts/firebase-auth-context'
import { LoginPanel } from '@/components/auth/login-panel'

const USUARIO = { uid: 'uid-teste', email: 'audit@example.com', displayName: 'Audit', photoURL: null }

type Sessao = 500 | 429 | 401 | 'rede' | 200 | 'adiada'

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

function instalarFetch(sessao: Sessao) {
  const f = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === 'string' ? entrada : entrada.toString()
    const metodo = (init?.method ?? 'GET').toUpperCase()
    log.push(`${metodo} ${url}`)
    if (url === '/api/auth/session' && metodo === 'DELETE') return resposta(200, { success: true })
    if (url === '/api/auth/session' && metodo === 'POST') {
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
  await act(async () => { await fb.listener!(USUARIO) })
  await assentar()
}

/** O login novo: /login deslogado (listener com null), depois o submit (listener com o usuário). */
async function loginNovo() {
  montar()
  await act(async () => { await fb.listener!(null) })
  await assentar()
  await act(async () => { void fb.listener!(USUARIO) })
  await assentar()
}

function textoDoAlerta(): string {
  const alertas = screen.queryAllByRole('alert')
  return alertas.map((a) => a.textContent ?? '').join(' | ').trim()
}

beforeEach(() => {
  log = []
  navegacoes = []
  liberarSessao = null
  fb.listener = null
  instalarLocation()
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: locOriginal })
  vi.unstubAllGlobals()
})

describe('I1-PR1 CN — POST /api/auth/session falhando: uma falha é uma tela, não uma volta', () => {
  const falhas: Array<[string, Sessao]> = [
    ['500', 500],
    ['429 (Retry-After: 60)', 429],
    ['401', 401],
    ['rede', 'rede'],
  ]

  for (const [nome, sessao] of falhas) {
    it(`(i/ii) POST ${nome}, usuário persistido: 1 POST, 0 GET /api/profile, 0 navegações, razão visível`, async () => {
      instalarFetch(sessao)
      await voltaComUsuarioPersistido()

      expect({
        post: conta('POST /api/auth/session'),
        getProfile: conta('GET /api/profile'),
        navegacoes,
      }).toEqual({ post: 1, getProfile: 0, navegacoes: [] })
      expect(textoDoAlerta()).not.toBe('')
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
    })
  }

  it('(b) cada razão tem a sua frase, e a do 429 leva o Retry-After', async () => {
    const textos: Record<string, string> = {}
    for (const [nome, sessao] of falhas) {
      instalarFetch(sessao)
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
