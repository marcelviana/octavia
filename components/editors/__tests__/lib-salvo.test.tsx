/**
 * `LIB-salvo` (I1-PR-11, decisão 1 do aval): o sucesso de salvar do editor marca o sinal em módulo
 * (`lib/sinal-salvo.ts`) e vai à `/library` de antes; a biblioteca o lê UMA vez e diz *alterações salvas* (a linha de
 * sucesso da folha 4, abaixo do título); com uma falha de carga na tela, vence a falha. Na `main` o módulo não existe
 * (a suíte reprova no import — `docs/ux/I1-PR11-anexos/cn/editor-estados-main.txt`).
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { consumirSalvo, marcarSalvo } from '@/lib/sinal-salvo'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: '00000000-0000-4000-8000-000000000003' }),
  usePathname: () => '/library',
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))
const dados = { erro: null as unknown }
vi.mock('@/hooks/use-library-data', () => ({
  useLibraryData: () => ({
    content: [], totalCount: 0, page: 1, setPage: vi.fn(), pageSize: 20, searchQuery: '', setSearchQuery: vi.fn(),
    sortBy: 'recent', setSortBy: vi.fn(), selectedFilters: { contentType: [], difficulty: [], key: [], favorite: false },
    setSelectedFilters: vi.fn(), loading: false, erro: dados.erro, reload: vi.fn(),
  }),
}))

import EditContentPage from '@/app/content/[id]/edit/page'
import RefactoredLibrary from '@/components/library/RefactoredLibrary'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); consumirSalvo(); dados.erro = null })

describe('I1-PR11 — LIB-salvo', () => {
  it('o editor: PUT 200 → a /library de antes e o sinal marcado (lido e apagado uma vez)', async () => {
    const letra = { id: '00000000-0000-4000-8000-000000000003', title: 'Batch três', content_type: 'Lyrics', content_data: { lyrics: 'Primeira estrofe da música três' } }
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(letra), { status: 200 })))
    render(<EditContentPage />)
    const t = (await screen.findAllByRole('textbox')).find((e) => (e as HTMLTextAreaElement).value.startsWith('Primeira')) as HTMLTextAreaElement
    fireEvent.change(t, { target: { value: `${t.value}!` } })
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/library'))
    expect(consumirSalvo()).toBe(true)
    expect(consumirSalvo()).toBe(false)
  })
  it('a biblioteca: com o sinal, *alterações salvas* (sucesso); sem ele, nada', async () => {
    marcarSalvo()
    render(<RefactoredLibrary onSelectContent={vi.fn()} />)
    expect(await screen.findByRole('status')).toHaveTextContent('alterações salvas')
    cleanup()
    render(<RefactoredLibrary onSelectContent={vi.fn()} />)
    expect(screen.queryByText('alterações salvas')).toBeNull()
  })
  it('a biblioteca: com uma falha de carga na tela, vence a falha (uma linha por tela)', async () => {
    marcarSalvo()
    dados.erro = { status: 500 }
    render(<RefactoredLibrary onSelectContent={vi.fn()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('não foi possível carregar a biblioteca')
    expect(screen.queryByText('alterações salvas')).toBeNull()
  })
})
