import { describe, it, expect } from 'vitest'
import { authSchemas } from '@/lib/api-validation-middleware'

/**
 * B2 PR-1 (D8) — contrato de /api/profile: os dois S1 do pre-check
 * (docs/ux/B2-PRECHECK.md §2.6/§2.7) + estreia da política D1.
 *
 * Controles negativos (regra nº 7) — saídas MEDIDAS contra o código sem o fix
 * (pre-check, probes 3/4; reconfirmadas contra main antes desta PR):
 *
 *  b2 — login social sem displayName (login-panel.tsx:53):
 *    payload { id, email, full_name: null, first_name: null, last_name: null,
 *              avatar_url: null }
 *    → RESULTADO: 400 com QUATRO campos:
 *      full_name  "Expected string, received null"
 *      first_name "Expected string, received null"
 *      last_name  "Expected string, received null"
 *      avatar_url "Expected string, received null"
 *    Consequência: usuário Firebase órfão sem perfil (mesma classe do aa501cc).
 *
 *  b1 — salvar perfil sem site (ProfileForm.tsx:46):
 *    payload { full_name, bio: "", website: "" }
 *    → RESULTADO: 400 — { campo: "website", msg: "Invalid url" }
 *    Consequência: toast genérico "Failed to update profile" em prod.
 */

describe('authSchemas.profileCreate — b2 (login social) e política D1', () => {
  const socialSemDisplayName = {
    id: 'firebase-uid-123',
    email: 'x@y.com',
    full_name: null,
    first_name: null,
    last_name: null,
    avatar_url: null,
  }

  it('b2: login social SEM displayName (4 nulls) é aceito; nulls atravessam como null', () => {
    const r = authSchemas.profileCreate.safeParse(socialSemDisplayName)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).toHaveProperty('full_name', null)
      expect(r.data).toHaveProperty('first_name', null)
      expect(r.data).toHaveProperty('last_name', null)
      expect(r.data).toHaveProperty('avatar_url', null)
    }
  })

  it('D1: id e email do body são ignorados por lista explícita (não chegam ao handler)', () => {
    const r = authSchemas.profileCreate.safeParse(socialSemDisplayName)
    expect(r.success).toBe(true)
    if (r.success) {
      expect('id' in r.data).toBe(false)
      expect('email' in r.data).toBe(false)
    }
  })

  it('signup email/senha (payload real de signup-panel.tsx:40) continua aceito', () => {
    const r = authSchemas.profileCreate.safeParse({
      first_name: 'Marcel',
      last_name: 'Viana',
      full_name: 'Marcel Viana',
      primary_instrument: 'Guitar',
      id: 'firebase-uid-123',
      email: 'marcelviana@gmail.com',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.full_name).toBe('Marcel Viana')
      expect(r.data.primary_instrument).toBe('Guitar')
    }
  })

  it('avatar_url "" (photoURL vazio) vira null, não 400', () => {
    const r = authSchemas.profileCreate.safeParse({
      id: 'u', email: 'x@y.com', avatar_url: '',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.avatar_url).toBeNull()
  })

  it('D1: chave desconhecida fora da lista de ignorados → falha (strict)', () => {
    const r = authSchemas.profileCreate.safeParse({
      full_name: 'x', __chave_desconhecida_b2__: 1,
    })
    expect(r.success).toBe(false)
  })
})

describe('authSchemas.profileUpdate — b1 (website vazio) e política D1', () => {
  it('b1: payload real do ProfileForm com website "" é aceito; "" vira null', () => {
    const r = authSchemas.profileUpdate.safeParse({
      full_name: 'Marcel Viana', bio: '', website: '',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.website).toBeNull()
      expect(r.data.full_name).toBe('Marcel Viana')
    }
  })

  it('website preenchido continua validado como URL', () => {
    const ok = authSchemas.profileUpdate.safeParse({ website: 'https://octavia.rocks' })
    expect(ok.success).toBe(true)
    const bad = authSchemas.profileUpdate.safeParse({ website: 'nao-e-url' })
    expect(bad.success).toBe(false)
  })

  it('semântica SET-23: null = limpar (atravessa como null); ausente = não mexer (undefined)', () => {
    const comNull = authSchemas.profileUpdate.safeParse({ website: null })
    expect(comNull.success).toBe(true)
    if (comNull.success) expect(comNull.data).toHaveProperty('website', null)

    const ausente = authSchemas.profileUpdate.safeParse({ full_name: 'x' })
    expect(ausente.success).toBe(true)
    if (ausente.success) expect(ausente.data.website).toBeUndefined()
  })

  it('D1: id e email são ignorados por lista; chave desconhecida → falha', () => {
    const ignorados = authSchemas.profileUpdate.safeParse({
      full_name: 'Novo Nome', id: 'outro-uid', email: 'outro@email.com',
    })
    expect(ignorados.success).toBe(true)
    if (ignorados.success) {
      expect('id' in ignorados.data).toBe(false)
      expect('email' in ignorados.data).toBe(false)
    }

    const desconhecida = authSchemas.profileUpdate.safeParse({
      full_name: 'x', created_at: '2020-01-01',
    })
    expect(desconhecida.success).toBe(false)
  })

  it('payload vazio é aceito (update sem campos = só updated_at no handler)', () => {
    expect(authSchemas.profileUpdate.safeParse({}).success).toBe(true)
  })
})
