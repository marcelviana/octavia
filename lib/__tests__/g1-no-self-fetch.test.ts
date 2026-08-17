/**
 * G1 (B1.1) — o self-fetch de verificação de token está MORTO nas lambdas.
 *
 * As duas cadeias de auth (firebase-server-utils e secure-auth-utils)
 * devem verificar tokens por CHAMADA DIRETA de função (verifyFirebaseToken
 * do lib/firebase-admin), sem nenhum hop HTTP. Este spec espiona o fetch
 * global: qualquer chamada a ele durante a verificação é regressão.
 *
 * CONTROLE NEGATIVO (regra nº 7): contra o código pré-B1.1 (main na época),
 * este spec FALHA — o espião registra o POST a /api/auth/verify. Executado
 * na validação da PR via git worktree; saída registrada no relatório.
 *
 * O jsdom do setup global define window; o stub abaixo o remove para o
 * guard tomar o ramo server (padrão do repo — igual ao
 * secure-auth-utils.test.ts). O ramo fetch (Edge) segue testado nos specs
 * das cadeias com NEXT_RUNTIME='edge' forçado, até morrer na B1.2.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.unmock('@/lib/firebase-server-utils')
vi.unmock('@/lib/secure-auth-utils')

vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn()
}))

import { verifyFirebaseToken } from '@/lib/firebase-admin'
import {
  validateFirebaseTokenServer,
  getServerSideUser,
  clearTokenCache
} from '@/lib/firebase-server-utils'
import { validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'

const mockVerify = vi.mocked(verifyFirebaseToken)

// Espião: se alguém tentar o hop HTTP, a chamada fica registrada — e o
// mock ainda devolve uma resposta válida do /api/auth/verify, para que a
// falha apareça no assert de contagem (evidência do hop), não num erro
// de rede mascarado.
const fetchSpy = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    success: true,
    user: { uid: 'via-http', email: 'http@example.com', emailVerified: true }
  })
})

describe('G1 — zero self-fetch na verificação de token (lambdas Node)', () => {
  beforeEach(() => {
    clearTokenCache()
    fetchSpy.mockClear()
    mockVerify.mockReset()
    mockVerify.mockResolvedValue({
      uid: 'g1-uid',
      email: 'g1@example.com',
      email_verified: true
    } as any)
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('cadeia A: validateFirebaseTokenServer verifica por chamada direta, zero fetch', async () => {
    const result = await validateFirebaseTokenServer('g1-token-cadeia-a')

    expect(result.isValid).toBe(true)
    expect(result.user?.uid).toBe('g1-uid')
    expect(mockVerify).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('cadeia B: validateFirebaseTokenSecure verifica por chamada direta, zero fetch', async () => {
    const result = await validateFirebaseTokenSecure('g1-token-cadeia-b')

    expect(result.isValid).toBe(true)
    expect(result.user?.uid).toBe('g1-uid')
    expect(mockVerify).toHaveBeenCalledTimes(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('ponta a ponta: getServerSideUser (todo server component autenticado) não faz hop HTTP', async () => {
    const cookieStore = {
      get: (name: string) =>
        name === 'firebase-session' ? { name, value: 'g1-token-wrapper' } : undefined
    } as any

    const user = await getServerSideUser(cookieStore, 'https://octavia.rocks/dashboard')

    expect(user?.uid).toBe('g1-uid')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
