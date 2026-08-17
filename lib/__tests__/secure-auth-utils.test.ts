import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// O test-setup global substitui requireAuthServerSecure por um mock;
// aqui queremos testar a implementação real.
vi.unmock('@/lib/secure-auth-utils')

// B1.1: o transporte padrão é chamada direta — o verificador local é
// mockado. O ramo fetch (Edge) é exercitado só no describe da âncora,
// com NEXT_RUNTIME='edge' forçado.
vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn()
}))

import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { requireAuthServerSecure, validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'

const mockVerify = vi.mocked(verifyFirebaseToken)

const verifyResponse = (user: Record<string, unknown>) => ({
  ok: true,
  json: async () => ({ success: true, user })
})

describe('requireAuthServerSecure (real implementation)', () => {
  const makeRequest = (token: string) =>
    new Request('https://octavia.example/api/profile', {
      headers: { authorization: `Bearer ${token}` }
    })

  beforeEach(() => {
    // validateFirebaseTokenSecure só roda o caminho server-side quando
    // typeof window === 'undefined'
    vi.stubGlobal('window', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the user when the email is verified', async () => {
    mockVerify.mockResolvedValueOnce({
      uid: 'user-verified',
      email: 'verified@example.com',
      email_verified: true
    } as any)

    const user = await requireAuthServerSecure(makeRequest('token-verified-1'))

    expect(user).toMatchObject({ uid: 'user-verified', email: 'verified@example.com' })
  })

  it('rejects users with unverified email by default', async () => {
    mockVerify.mockResolvedValueOnce({
      uid: 'user-unverified-default',
      email: 'unverified@example.com',
      email_verified: false
    } as any)

    const user = await requireAuthServerSecure(makeRequest('token-unverified-default-1'))

    expect(user).toBeNull()
  })

  it('BUG(profile-create): allows a freshly signed-up (unverified) user when allowUnverifiedEmail is set', async () => {
    // Durante o signup por email/senha o usuário acabou de ser criado, então
    // emailVerified === false. O POST /api/profile precisa poder aceitar esse
    // usuário — sem isso o perfil Supabase nunca é criado em produção.
    mockVerify.mockResolvedValueOnce({
      uid: 'user-unverified-signup',
      email: 'new-user@example.com',
      email_verified: false
    } as any)

    const user = await requireAuthServerSecure(makeRequest('token-unverified-signup-1'), {
      allowUnverifiedEmail: true
    })

    expect(user).toMatchObject({ uid: 'user-unverified-signup', emailVerified: false })
  })
})

describe('validateFirebaseTokenSecure — âncora de origem do self-fetch (ramo Edge; morre na B1.2)', () => {
  // Pós-B1.1 este ramo não tem consumidor em produção (a cadeia B não
  // roda em Edge — o middleware usa a cadeia A), mas a propriedade de
  // segurança da âncora de env fica protegida enquanto o código existir.
  // NEXT_RUNTIME='edge' força o guard a percorrê-lo.
  beforeEach(() => {
    vi.stubGlobal('window', undefined)
    vi.stubEnv('NEXT_RUNTIME', 'edge')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('server-side SEM requestUrl usa a cadeia de env (antes: rejeição no branch client-side)', async () => {
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    const fetchMock = vi.fn().mockResolvedValue(verifyResponse({
      uid: 'user-sem-requesturl',
      email: 'env@example.com',
      emailVerified: true
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateFirebaseTokenSecure('token-sem-requesturl-1')

    expect(result.isValid).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/verify',
      expect.anything()
    )
  })

  it('a env vence o requestUrl: origin do request de entrada NÃO decide o destino do fetch', async () => {
    // Propriedade de segurança: o self-fetch carrega o idToken — um Host
    // forjado no request não pode redirecioná-lo para fora.
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000')
    const fetchMock = vi.fn().mockResolvedValue(verifyResponse({
      uid: 'user-anti-forjamento',
      email: 'anchor@example.com',
      emailVerified: true
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateFirebaseTokenSecure(
      'token-anti-forjamento-1',
      'https://host-forjado.example/api/auth/session'
    )

    expect(result.isValid).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/verify',
      expect.anything()
    )
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('host-forjado.example'),
      expect.anything()
    )
  })
})
