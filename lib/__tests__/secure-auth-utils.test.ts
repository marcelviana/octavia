import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// O test-setup global substitui requireAuthServerSecure por um mock;
// aqui queremos testar a implementação real.
vi.unmock('@/lib/secure-auth-utils')

import { requireAuthServerSecure } from '@/lib/secure-auth-utils'

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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(verifyResponse({
      uid: 'user-verified',
      email: 'verified@example.com',
      emailVerified: true
    })))

    const user = await requireAuthServerSecure(makeRequest('token-verified-1'))

    expect(user).toMatchObject({ uid: 'user-verified', email: 'verified@example.com' })
  })

  it('rejects users with unverified email by default', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(verifyResponse({
      uid: 'user-unverified-default',
      email: 'unverified@example.com',
      emailVerified: false
    })))

    const user = await requireAuthServerSecure(makeRequest('token-unverified-default-1'))

    expect(user).toBeNull()
  })

  it('BUG(profile-create): allows a freshly signed-up (unverified) user when allowUnverifiedEmail is set', async () => {
    // Durante o signup por email/senha o usuário acabou de ser criado, então
    // emailVerified === false. O POST /api/profile precisa poder aceitar esse
    // usuário — sem isso o perfil Supabase nunca é criado em produção.
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(verifyResponse({
      uid: 'user-unverified-signup',
      email: 'new-user@example.com',
      emailVerified: false
    })))

    const user = await requireAuthServerSecure(makeRequest('token-unverified-signup-1'), {
      allowUnverifiedEmail: true
    })

    expect(user).toMatchObject({ uid: 'user-unverified-signup', emailVerified: false })
  })
})
