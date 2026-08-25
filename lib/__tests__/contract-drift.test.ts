import { describe, it, expect } from 'vitest'
import { contentSchemas } from '@/lib/api-schemas'
import { authSchemas } from '@/lib/api-validation-middleware'

/**
 * B2 §3.4 — gate de drift Zod × banco (classe c1): nenhum schema aceita
 * string maior que a coluna varchar correspondente. Limites HARDCODED do
 * supabase/schema.dump.sql (artefato gerado; ao regenerar o dump, revisar
 * esta tabela).
 *
 * Método comportamental: parse de 'x'.repeat(colMax + 1) DEVE falhar —
 * independe de internals do Zod.
 *
 * Controle negativo (regra nº 7), medido em 2026-08-25: o schema órfão
 * contentSchemas.update do api-validation-middleware (title máx 1000 vs
 * varchar(255) — o c1 original, rota morta na PR-3) ACEITA 'x'.repeat(256);
 * este gate o teria pego. Setlist entra na PR-4c.
 */

const CONTENT_LIMITS: Array<[string, number]> = [
  ['title', 255], ['artist', 255], ['album', 255], ['genre', 100],
  ['key', 10], ['time_signature', 10], ['tuning', 50],
]

describe('gate c1 — content: Zod ≤ varchar da coluna', () => {
  it.each(CONTENT_LIMITS)('%s: acima de varchar(%d) → parse falha', (campo, max) => {
    const r = contentSchemas.create.safeParse({
      title: 'x', content_type: 'Lyrics', [campo]: 'x'.repeat(max + 1),
    })
    expect(r.success).toBe(false)
  })
})

const PROFILE_LIMITS: Array<[string, number]> = [
  ['full_name', 255], ['first_name', 255], ['last_name', 255], ['primary_instrument', 100],
]

describe('gate c1 — profiles: Zod ≤ varchar da coluna', () => {
  it.each(PROFILE_LIMITS)('%s: acima de varchar(%d) → parse falha', (campo, max) => {
    const r = authSchemas.profileUpdate.safeParse({ [campo]: 'x'.repeat(max + 1) })
    expect(r.success).toBe(false)
  })
})
