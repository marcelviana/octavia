/**
 * I1-PR-10 — decisão 11 do aval (div. 743): a tab com `content_data.chords` em TEXTO. Antes,
 * `components/content-viewer/TabDisplay.tsx:71-77` fazia `chords.map(...)` sem `Array.isArray` — a página inteira
 * caía no limite de render. Agora os acordes vão ao segundo painel *Cifra*. MUDANÇA DE COMPORTAMENTO DECLARADA
 * (crash → render). Este arquivo só usa o que a `main` também tem (o `ContentPageClient`), para reprovar lá:
 * `docs/ux/I1-PR10-anexos/cn/tab-acordes-main.txt`. Textos: do projeto.
 */
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/content/cn',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: null, profile: null, isLoading: true, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() }),
}))

import ContentPageClient from '@/components/content-page-client'

afterEach(cleanup)

describe('I1-PR-10 — tab com acordes em texto (div. 743)', () => {
  it('abre: a tablatura e os acordes na tela, sem cair no limite de render', () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const content = {
      id: 'cn-tab', user_id: 'cn', title: 'Trenzinho do caipira', artist: 'Villa-Lobos', content_type: 'Tab',
      capo: null, tuning: null, notes: null, file_url: null, created_at: null, updated_at: null,
      content_data: { tablature: 'e|---0---|\nB|-1---1-|', chords: 'Am E7 Am' },
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<ContentPageClient content={content as any} />)
    expect(screen.getByText(/e\|---0---\|/)).toBeInTheDocument()
    expect(screen.getByText('Am E7 Am')).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong|algo deu errado/)).toBeNull()
    erro.mockRestore()
  })
})
