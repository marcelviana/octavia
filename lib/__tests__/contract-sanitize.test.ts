import { describe, it, expect } from 'vitest'
import { authSchemas, setlistSchemas } from '@/lib/api-schemas'

/**
 * B2 PR-4a (SAN-01) — semântica do sanitize: o texto OU passa (e persiste
 * literal), OU a requisição leva 400 nomeando o campo. Nunca alteração ou
 * zeramento silencioso.
 *
 * Controles negativos (regra nº 7) — MEDIDOS contra o código sem o fix
 * (validação da PR-1 + medições de 2026-08-25):
 *
 *  strict zera:    full_name "Marcel (band)"            → "" com 200
 *                  setlist name "Show (acústico)"       → "" com 200
 *  moderate remove: description "primeira (noite) no bar" → "primeira noite no bar" com 200
 *  XSS silencioso: bio "<script>alert(1)</script>"      → "" com 200 (!!)
 *  lastIndex /g:   "(a)" passou e "a (b) c" foi zerado — veredito dependente
 *                  da ordem das chamadas (regexes /g reutilizadas com .test())
 *
 * Causa: lib/input-sanitizer.ts:42 — COMMAND_INJECTION /[;&|`$(){}[\]]/g
 * marcava qualquer texto com ()[]{};&| como ameaça; strict bloqueava para ""
 * e moderate removia os caracteres, ambos retornando 200.
 */

describe('SAN-01 — texto com caracteres comuns persiste LITERAL', () => {
  it('full_name "Marcel (band)" atravessa literal (era "" com 200)', () => {
    const r = authSchemas.profileUpdate.safeParse({ full_name: 'Marcel (band)' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.full_name).toBe('Marcel (band)')
  })

  it('setlist name "Show (acústico)" atravessa literal (era "" com 200)', () => {
    const r = setlistSchemas.create.safeParse({ name: 'Show (acústico)' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe('Show (acústico)')
  })

  it('description "primeira (noite) no bar" atravessa literal (moderate removia os parênteses)', () => {
    const r = setlistSchemas.create.safeParse({ name: 'Show', description: 'primeira (noite) no bar' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.description).toBe('primeira (noite) no bar')
  })

  it('notes de música com colchetes/e-comercial atravessam literal', () => {
    const r = setlistSchemas.addSong.safeParse({
      content_id: '11111111-2222-3333-4444-555555555555',
      position: 1,
      notes: 'entrar depois do [solo] & segurar',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.notes).toBe('entrar depois do [solo] & segurar')
  })

  it('determinismo: "(a)" e "a (b) c" têm o MESMO veredito, em qualquer ordem (lastIndex das /g)', () => {
    const a1 = authSchemas.profileUpdate.safeParse({ full_name: '(a)' })
    const b1 = authSchemas.profileUpdate.safeParse({ full_name: 'a (b) c' })
    const a2 = authSchemas.profileUpdate.safeParse({ full_name: '(a)' })
    expect(a1.success && b1.success && a2.success).toBe(true)
    if (a1.success && b1.success && a2.success) {
      expect(a1.data.full_name).toBe('(a)')
      expect(b1.data.full_name).toBe('a (b) c')
      expect(a2.data.full_name).toBe(a1.data.full_name)
    }
  })

  it('trim das pontas é a ÚNICA normalização (comportamento pré-existente, declarado)', () => {
    const r = authSchemas.profileUpdate.safeParse({ full_name: '  Marcel Viana  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.full_name).toBe('Marcel Viana')
  })
})

describe('SAN-01 — vetor real é REJEITADO com o campo nomeado (não sanitizado em silêncio)', () => {
  it('XSS <script> em bio → parse FALHA no campo bio (era "" com 200)', () => {
    const r = authSchemas.profileUpdate.safeParse({ bio: '<script>alert(1)</script>' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'bio')).toBe(true)
    }
  })

  it('javascript: em full_name → parse FALHA no campo', () => {
    const r = authSchemas.profileUpdate.safeParse({ full_name: 'javascript:alert(1)' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'full_name')).toBe(true)
    }
  })

  it('XSS <script> em description de setlist → parse FALHA no campo (moderate deixava passar limpo)', () => {
    const r = setlistSchemas.create.safeParse({ name: 'Show', description: 'x <script>alert(1)</script> y' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'description')).toBe(true)
    }
  })

  it('handler on*= em description → parse FALHA no campo', () => {
    const r = setlistSchemas.create.safeParse({ name: 'Show', description: '<img src=x onerror=alert(1)>' })
    expect(r.success).toBe(false)
  })

  // Gate de case-sensitivity (exigência do aval da PR-4a): os refines são a
  // ÚNICA barreira e carregam /i — variantes de caixa não podem escapar.
  it('caixa mista: "<ScRiPt>" em bio → parse FALHA no campo bio', () => {
    const r = authSchemas.profileUpdate.safeParse({ bio: '<ScRiPt>alert(1)</ScRiPt>' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'bio')).toBe(true)
    }
  })

  it('caixa alta: "JAVASCRIPT:alert(1)" em full_name → parse FALHA no campo', () => {
    const r = authSchemas.profileUpdate.safeParse({ full_name: 'JAVASCRIPT:alert(1)' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'full_name')).toBe(true)
    }
  })

  it('caixa mista: "OnErRoR =" em description (safeHtml) → parse FALHA', () => {
    const r = setlistSchemas.create.safeParse({ name: 'Show', description: '<img src=x OnErRoR = alert(1)>' })
    expect(r.success).toBe(false)
  })
})
