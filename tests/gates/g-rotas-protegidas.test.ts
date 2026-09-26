/**
 * G-rotas (B1.2a) — o invariante que torna o middleware otimista (B1.2b)
 * seguro: TODA página protegida verifica o usuário por conta própria e
 * EXPULSA (redirect), nunca degrada para spinner/null/shell.
 *
 * Paridade por construção: a lista percorrida aqui é a MESMA que o
 * middleware consome (lib/protected-routes.ts). Página protegida nova
 * fora do inventário → o assert de paridade falha.
 *
 * I1-PR3 (I1-D25, div. 505): /settings, /profile e /performance saíram com
 * as páginas — inventário 8 → 5, 17 → 11 testes.
 *
 * CONTROLE NEGATIVO (regra nº 7): contra o main pré-B1.2a este spec FALHA
 * em 6 das 8 páginas (dashboard/library: spinner; setlists/settings/
 * add-content: shell client sem verificação server; profile: redirect só
 * client-side). Executado via git worktree na validação da PR; saída
 * registrada no relatório.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/firebase-server-utils', () => ({
  getServerSideUser: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
  headers: async () => ({ get: () => null })
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`GATE_REDIRECT:${url}`)
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}))

import { getServerSideUser } from '@/lib/firebase-server-utils'
import {
  PROTECTED_PAGES,
  PROTECTED_ROUTE_PREFIXES
} from '@/lib/protected-routes'

const mockGetUser = vi.mocked(getServerSideUser)

// Inventário rota → invocação da página (props mínimas reais de cada uma)
const PAGE_INVOCATIONS: Record<string, () => Promise<unknown>> = {
  '/dashboard': async () =>
    (await import('@/app/dashboard/page')).default(),
  '/library': async () =>
    (await import('@/app/library/page')).default({}),
  '/setlists': async () =>
    (await import('@/app/setlists/page')).default(),
  '/add-content': async () =>
    (await import('@/app/add-content/page')).default(),
  '/content/[id]': async () =>
    (await import('@/app/content/[id]/page')).default({
      params: Promise.resolve({ id: 'gate-test-id' })
    })
}

describe('G-rotas — toda página protegida expulsa por conta própria', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('paridade por construção: inventário do gate == PROTECTED_PAGES, e todo prefixo do middleware tem página coberta', () => {
    expect(Object.keys(PAGE_INVOCATIONS).sort()).toEqual(
      [...PROTECTED_PAGES].sort()
    )
    for (const prefix of PROTECTED_ROUTE_PREFIXES) {
      expect(
        PROTECTED_PAGES.some((p) => p.startsWith(prefix)),
        `prefixo ${prefix} sem página no inventário do gate`
      ).toBe(true)
    }
  })

  for (const [route, invoke] of Object.entries(PAGE_INVOCATIONS)) {
    it(`${route}: user nulo → redirect('/login')`, async () => {
      mockGetUser.mockResolvedValue(null)

      await expect(invoke()).rejects.toThrow('GATE_REDIRECT:/login')
    })

    it(`${route}: email não verificado → redirect('/verify-email')`, async () => {
      mockGetUser.mockResolvedValue({
        uid: 'gate-uid',
        email: 'gate@example.com',
        emailVerified: false
      })

      await expect(invoke()).rejects.toThrow('GATE_REDIRECT:/verify-email')
    })
  }
})
