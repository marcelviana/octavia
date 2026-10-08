/**
 * D-0-PR1 — o M0 do pre-check DE NOVO, sobre o código da PR (cópia de `docs/ux/D0-PRECHECK-anexos/instrumentos/
 * m0-editor.medir.tsx`; a única troca: *uma corda do compasso* virou *o painel de texto*, porque a corda não existe
 * mais — D0-D6). O resto, o mesmo instrumento:
 *
 * D-0 pre-check, M0 (`D0-PRECHECK.md` §9.1) — o editor de Tab, medido. Rastro de instrumento (N4-D117): fora de CI,
 * lint e typecheck; sem sufixo `.test` (o `pnpm test` não o coleta); config própria ao lado. Zero requisições.
 *
 * Monta a ROTA do editor (`app/content/[id]/edit/page.tsx`), como o gate `tests/gates/i1-editor-put.test.tsx`, com o
 * `fetch` falso: o `GET` devolve a linha fabricada; o `PUT` passa o corpo à ROTA REAL (`app/api/content/route.ts`,
 * `PUT`) com a autenticação e o banco simulados — o banco devolve o `content_type` da linha e ecoa o update. Imprime,
 * por roteiro: as chaves do `content_data` do corpo, se o `measures` é o compasso de exemplo, o `title` do topo × o
 * `content_data.title`, a `tablature` igual à da linha (sim/não, comprimento), o status da rota, o `error`/`details`
 * dela e a linha que a tela mostra. Cada roteiro, com `difficulty` nula e com `'Beginner'`. Dado FABRICADO: título "Tab de régua D0", artista "Autor fabricado", tab `e|--1--|`.
 */
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest'
import { NextRequest } from 'next/server'

const params = { id: '' }
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => params,
  usePathname: () => `/content/${params.id}/edit`,
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'm0-user', email: 'm0@exemplo.com', displayName: 'M0' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'm0-user', email: 'm0@exemplo.com' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'm0-token', error: null }) }))
vi.mock('@/components/pdf-viewer', () => ({ default: () => <div /> }))
// o lado do servidor: autenticação e banco simulados; a rota é a real
vi.mock('@/lib/firebase-server-utils', () => ({ requireAuthServer: async () => ({ uid: 'm0-user', email: 'm0@exemplo.com' }) }))
let linhaDoBanco: Record<string, unknown> = {}
const chain = (fim: () => unknown) => {
  const c: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'update']) c[m] = (arg?: unknown) => { if (m === 'update') ultimoUpdate = arg; return c }
  c.single = async () => fim()
  return c
}
let ultimoUpdate: unknown = null
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: () => ({ from: () => chain(() => ({ data: { ...linhaDoBanco, ...(ultimoUpdate as object ?? {}) }, error: null })) }),
}))

import EditContentPage from '@/app/content/[id]/edit/page'
import { PUT } from '@/app/api/content/route'

const T = '2026-10-08T12:00:00.000Z'
const EXEMPLO = [{ id: 1, strings: ['E|--0--3--0--2--0--|', 'B|--1--1--1--1--1--|', 'G|--0--0--0--0--0--|', 'D|--2--2--2--2--2--|', 'A|--3-------------|', 'E|----------------|'] }]
const TAB = 'e|--1--|'
const base = {
  id: '00000000-0000-4000-8000-0000000000d0', user_id: 'm0-user', title: 'Tab de régua D0', artist: 'Autor fabricado',
  content_type: 'Tab', album: null, bpm: null, capo: null, difficulty: null, genre: null, is_favorite: false, is_public: false,
  key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4', tuning: null, created_at: T, updated_at: T,
  file_url: null as string | null,
}

let corpos: string[] = []
let respostas: { status: number; corpo: string }[] = []
const servir = (linha: Record<string, unknown>) => {
  linhaDoBanco = linha
  ultimoUpdate = null
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PUT') {
      corpos.push(String(init?.body))
      const req = new NextRequest('http://localhost/api/content', { method: 'PUT', body: String(init?.body), headers: { 'content-type': 'application/json', authorization: 'Bearer m0-token' } })
      const res = await PUT(req)
      const texto = await res.text()
      respostas.push({ status: res.status, corpo: texto })
      return new Response(texto, { status: res.status, headers: { 'content-type': 'application/json' } })
    }
    if (String(url).startsWith(`/api/content/${linha.id}`)) return new Response(JSON.stringify(linha), { status: 200 })
    return new Response('{}', { status: 404 })
  }))
}

const mudar = async (testid: string, valor: string) => {
  const e = (await screen.findAllByTestId(testid))[0] as HTMLInputElement
  fireEvent.change(e, { target: { value: valor } })
}
const salvarAtivo = async () => !(await screen.findByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled
const salvar = async () => fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))

interface Roteiro { nome: string; linha: Record<string, unknown>; editar: () => Promise<void>; salva: boolean }
const ROTEIROS: Roteiro[] = [
  { nome: 'R1 título em Detalhes (Tab de lote, sem measures)', linha: { ...base, content_data: { tablature: TAB } },
    editar: async () => { await mudar('campo-titulo', 'Título novo D0') }, salva: true },
  { nome: 'R2 título em Informações do editor de tab', linha: { ...base, content_data: { tablature: TAB } },
    editar: async () => { await mudar('campo-info-titulo', 'Título novo D0') }, salva: true },
  { nome: 'R3 o painel de texto (era: uma corda do compasso)', linha: { ...base, content_data: { tablature: TAB } },
    editar: async () => {
      const e = (await screen.findByTestId('campo-tablatura')) as HTMLTextAreaElement
      fireEvent.change(e, { target: { value: `${e.value}\nG|--2--|` } })
    }, salva: true },
  { nome: 'R4 abrir sem mudar nada', linha: { ...base, content_data: { tablature: TAB } }, editar: async () => {}, salva: false },
  { nome: 'R5 Tab na forma do upload (content_data null, file_url), título em Detalhes', linha: { ...base, content_data: null, file_url: 'https://m0.exemplo/arquivo-fabricado.txt' },
    editar: async () => { await mudar('campo-titulo', 'Título novo D0') }, salva: true },
  { nome: 'R6 Tab na forma do upload, o painel de texto (era: uma corda)', linha: { ...base, content_data: null, file_url: 'https://m0.exemplo/arquivo-fabricado.txt' },
    editar: async () => {
      const e = (await screen.findByTestId('campo-tablatura')) as HTMLTextAreaElement
      fireEvent.change(e, { target: { value: `${e.value}\nG|--2--|` } })
    }, salva: true },
]

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(T)); corpos = []; respostas = [] })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

// cada roteiro roda com `difficulty: null` (a forma de toda música criada sem dificuldade) e com um valor do enum —
// o segundo isola a div. 1149 do 400 de `difficulty: ""` que o primeiro mostrou (div. 1152)
const DIFICULDADES: (string | null)[] = [null, 'Beginner']
describe('D-0 M0 — o editor de Tab, medido', () => {
  for (const dif of DIFICULDADES) for (const r0 of ROTEIROS) {
    const r = { ...r0, nome: `${r0.nome} · difficulty=${JSON.stringify(dif)}`, linha: { ...r0.linha, difficulty: dif } }
    it(r.nome, async () => {
      params.id = String(r.linha.id)
      servir(r.linha)
      render(<EditContentPage />)
      await screen.findByRole('button', { name: 'Salvar' })
      await r.editar()
      const ativo = await salvarAtivo()
      const out: string[] = [`== ${r.nome}`, `   Salvar ativo: ${ativo}`]
      if (ativo) {
        await salvar()
        await waitFor(() => expect(respostas).toHaveLength(1))
        await act(async () => { await new Promise((ok) => setTimeout(ok, 50)) })
        const b = JSON.parse(corpos[0])
        // D-0-PR1: o content_data pode ir `null` (D0-D22) — o instrumento do pre-check supunha objeto
        const cd = (b.content_data ?? {}) as Record<string, unknown>
        out.push(`   corpo: chaves do topo = ${Object.keys(b).sort().join(',')}`)
        out.push(b.content_data === null ? '   corpo: content_data = null' : `   corpo: chaves do content_data (${Object.keys(cd).length}) = ${Object.keys(cd).sort().join(',')}`)
        out.push(`   measures: ${cd.measures === undefined ? 'ausente' : JSON.stringify(cd.measures) === JSON.stringify(EXEMPLO) ? 'IGUAL ao exemplo' : 'diferente do exemplo'}`)
        const tabAntes = (r.linha.content_data as Record<string, unknown> | null)?.tablature
        out.push(`   tablature: ${cd.tablature === undefined ? 'ausente' : `len ${String(cd.tablature).length}, igual à da linha: ${cd.tablature === tabAntes}`}`)
        out.push(`   title do topo = ${JSON.stringify(b.title)} · content_data.title = ${JSON.stringify(cd.title)}`)
        const resp = respostas[0]
        let j: Record<string, unknown> = {}
        try { j = JSON.parse(resp.corpo) } catch { /* corpo não-JSON */ }
        out.push(`   rota: status ${resp.status}${resp.status >= 400 ? ` · error=${JSON.stringify(j.error)} · code=${JSON.stringify(j.code)} · details=${JSON.stringify(j.details)}` : ''}`)
        if (resp.status >= 400) {
          const alerta = document.querySelector('[role="alert"], [role="status"]')
          out.push(`   tela: ${JSON.stringify(alerta?.textContent ?? '(nenhuma linha de alerta achada)')}`)
        }
      }
      console.log(out.join('\n'))
      expect(ativo).toBe(r.salva)
    }, 20_000)
  }
})
