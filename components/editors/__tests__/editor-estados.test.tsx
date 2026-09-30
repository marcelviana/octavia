/**
 * Os estados do editor (I1-PR-11; folha `6-content-editor`) — os que o aval pede com teste que REPROVA na `main`.
 * Os seletores que decidem são os que existem nos dois lados (o botão de salvar por nome — *Salvar* ou o *Save
 * Changes* de antes —, o campo pelo valor, o `fetch` contado), para a reprovação na `main` ser do comportamento e não
 * do seletor (`docs/ux/I1-PR11-anexos/cn/editor-estados-main.txt`).
 * O `LIB-salvo` está em `lib-salvo.test.tsx` (o módulo do sinal não existe na `main`: o import derrubaria a suíte lá).
 * Texto dos fixtures: do projeto.
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const params = { id: '00000000-0000-4000-8000-000000000003' }
const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => params,
  usePathname: () => `/content/${params.id}/edit`,
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))
vi.mock('@/components/pdf-viewer', () => ({ default: () => <div data-testid="pdf-viewer" /> }))

import EditContentPage from '@/app/content/[id]/edit/page'

const letra = {
  id: params.id, user_id: 'cn-user', title: 'Batch três', artist: null, album: null, bpm: null, capo: null, difficulty: null,
  genre: null, is_favorite: false, is_public: false, key: null, notes: null, tags: null, thumbnail_url: null,
  time_signature: '4/4', tuning: null, created_at: null, updated_at: null, file_url: null, content_type: 'Lyrics',
  content_data: { lyrics: 'Primeira estrofe da música três' },
}

type Resposta = Response | Promise<Response> | 'rede' | 'segura'
let get: Resposta
let put: Resposta
let puts: number
const responder = (r: Resposta) => (r === 'rede' ? Promise.reject(new TypeError('Failed to fetch')) : r === 'segura' ? new Promise<Response>(() => {}) : r)
const json = (corpo: unknown, status = 200) => new Response(JSON.stringify(corpo), { status })

beforeEach(() => {
  get = json(letra); put = json(letra); puts = 0; push.mockReset()
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PUT') { puts++; return responder(put) }
    return responder(get)
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const botaoSalvar = () => screen.findByRole('button', { name: /^(Salvar|Salvando…|Save Changes)$/ })
const editarLetra = async () => {
  const t = (await screen.findAllByRole('textbox')).find((e) => (e as HTMLTextAreaElement).value.startsWith('Primeira estrofe')) as HTMLTextAreaElement
  fireEvent.change(t, { target: { value: `${t.value}\n\n[Refrão]` } })
}

describe('I1-PR11 — alterações não salvas só com alteração (resposta 21, decisão 2)', () => {
  it('ao abrir: Salvar inativo, sem o chip, com o motivo; depois de editar: ativo, com o chip', async () => {
    render(<EditContentPage />)
    expect(await botaoSalvar()).toBeDisabled()
    expect(screen.queryByText(/alterações não salvas|Unsaved changes/)).toBeNull()
    expect(screen.getByText('nada mudou desde que você abriu')).toBeInTheDocument()
    await editarLetra()
    expect(await botaoSalvar()).toBeEnabled()
    expect(screen.getByText('alterações não salvas')).toBeInTheDocument()
  })
})

describe('I1-PR11 — Salvando… e o Salvar inativo durante o envio (resposta 22, decisão 5)', () => {
  it('com o PUT em curso: Salvando…, inativo, e o clique duplo manda UM PUT', async () => {
    put = 'segura'
    render(<EditContentPage />)
    await editarLetra()
    const b = await botaoSalvar()
    fireEvent.click(b)
    // o clique duplo de uma pessoa: dois cliques com 100 ms entre eles (na `main`, dois `PUT` — cn/editor-estados-main.txt)
    await new Promise((r) => setTimeout(r, 100))
    fireEvent.click(b)
    await waitFor(() => expect(puts).toBeGreaterThan(0))
    await new Promise((r) => setTimeout(r, 300))
    expect(puts).toBe(1)
    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled()
  })
})

describe('I1-PR11 — a falha da carga por espécie (decisão 3)', () => {
  const casos: [string, Resposta, string, boolean][] = [
    ['rede', 'rede', 'não foi possível carregar o conteúdo — sem conexão', true],
    ['401', json({ error: 'x' }, 401), 'não foi possível carregar o conteúdo — o servidor não aceitou a sessão, entre de novo', false],
    ['429', json({ error: 'x' }, 429), 'não foi possível carregar o conteúdo — muitas tentativas, tente de novo em instantes', false],
    ['500', json({ error: 'x' }, 500), 'não foi possível carregar o conteúdo — falha no servidor', true],
  ]
  for (const [nome, resposta, frase, tentar] of casos) {
    it(`${nome}: "${frase}"${tentar ? ' + Tentar de novo' : ', sem ação'}`, async () => {
      get = resposta
      render(<EditContentPage />)
      expect(await screen.findByText(frase)).toBeInTheDocument()
      expect(!!screen.queryByRole('button', { name: /Tentar de novo/ })).toBe(tentar)
      expect(screen.getByRole('link', { name: 'Ir para a biblioteca' })).toHaveAttribute('href', '/library')
    })
  }
  it('404 e 400: "este conteúdo não existe", sem linha', async () => {
    for (const status of [404, 400]) {
      get = json({ error: 'x' }, status)
      render(<EditContentPage />)
      expect(await screen.findByText('este conteúdo não existe')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).toBeNull()
      cleanup()
    }
  })
})

describe('I1-PR11 — a falha de salvar por espécie (decisão 3; N2)', () => {
  const casos: [string, Resposta, string, boolean][] = [
    ['rede', 'rede', 'não foi possível salvar — sem conexão', true],
    ['400', json({ error: 'x' }, 400), 'não foi possível salvar — o servidor recusou os dados', false],
    ['404', json({ error: 'x' }, 404), 'não foi possível salvar — este conteúdo não existe mais', false],
    ['500', json({ error: 'x' }, 500), 'não foi possível salvar — falha no servidor', true],
  ]
  for (const [nome, resposta, frase, tentar] of casos) {
    it(`${nome}: "${frase}" + "o que você escreveu continua aqui"${tentar ? ' + Tentar de novo (o mesmo PUT)' : ''}`, async () => {
      put = resposta
      render(<EditContentPage />)
      await editarLetra()
      fireEvent.click(await botaoSalvar())
      expect(await screen.findByText(frase)).toBeInTheDocument()
      expect(screen.getByText('o que você escreveu continua aqui')).toBeInTheDocument()
      const t = screen.queryByRole('button', { name: /Tentar de novo/ })
      expect(!!t).toBe(tentar)
      if (t) {
        const corpos = (fetch as unknown as { mock: { calls: [string, RequestInit?][] } }).mock.calls.filter(([, i]) => i?.method === 'PUT').map(([, i]) => i?.body)
        fireEvent.click(t)
        await waitFor(() => expect(puts).toBe(2))
        const depois = (fetch as unknown as { mock: { calls: [string, RequestInit?][] } }).mock.calls.filter(([, i]) => i?.method === 'PUT').map(([, i]) => i?.body)
        expect(depois[1]).toBe(corpos[0])
      }
    })
  }
})
