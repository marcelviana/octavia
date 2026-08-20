import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// O test-setup global substitui requireAuthServerSecure por um mock;
// aqui queremos testar a implementação real.
vi.unmock('@/lib/secure-auth-utils')

// B1.1: o transporte é chamada direta — o verificador local é mockado.
// B1.2b: o ramo fetch e o describe da âncora (#221) morreram com a rota.
vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: vi.fn()
}))

import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { requireAuthServerSecure, validateFirebaseTokenSecure } from '@/lib/secure-auth-utils'

const mockVerify = vi.mocked(verifyFirebaseToken)

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

// B1.2b: o describe da âncora de origem (2 testes, propriedade da PR #221)
// morreu junto com o ramo fetch — o self-fetch não existe mais em nenhuma
// cadeia, então a âncora perdeu o objeto (docs/ux/PLANO-TRANSICAO.md, B1.2b).
