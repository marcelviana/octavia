import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { contentSchemas, storageSchemas, setlistSchemas, authSchemas } from '@/lib/api-schemas'

/**
 * B2 §3.3 — gate estrutural da política D1, por COMPORTAMENTO (exigência do
 * aval: zero dependência de internals como _def.unknownKeys):
 * para cada schema de BODY do módulo, o payload mínimo válido passa, e o
 * mesmo payload + uma chave desconhecida FALHA.
 *
 * Schemas de QUERY ficam de fora por decisão declarada: a D1 é política de
 * body — query strings carregam chaves benignas de terceiros (cachebuster,
 * utm_*) e um 400 ali quebraria GETs legítimos.
 */

const UUID = '11111111-2222-3333-4444-555555555555'

const BODY_SCHEMAS: Array<[string, z.ZodTypeAny, Record<string, unknown>]> = [
  ['contentSchemas.create', contentSchemas.create, { title: 'x', content_type: 'Lyrics' }],
  ['contentSchemas.update', contentSchemas.update, { id: UUID }],
  ['storageSchemas.upload', storageSchemas.upload, { filename: 'a.pdf', contentType: 'application/pdf', size: 1 }],
  ['storageSchemas.delete', storageSchemas.delete, { filename: 'a.pdf' }],
  ['setlistSchemas.create', setlistSchemas.create, { name: 'x' }],
  ['setlistSchemas.update', setlistSchemas.update, {}],
  ['setlistSchemas.addSong', setlistSchemas.addSong, { content_id: UUID }],
  ['setlistSchemas.reorder', setlistSchemas.reorder, { order: [UUID] }],
  ['authSchemas.profileCreate', authSchemas.profileCreate, {}],
  ['authSchemas.profileUpdate', authSchemas.profileUpdate, {}],
  ['authSchemas.sessionCreate', authSchemas.sessionCreate, { idToken: 'a.b.c' }],
]

describe('gate D1 — todo schema de body do módulo rejeita chave desconhecida', () => {
  it.each(BODY_SCHEMAS.map(([n]) => [n]))('%s', (name) => {
    const [, schema, minimal] = BODY_SCHEMAS.find(([n]) => n === name)!
    expect(schema.safeParse(minimal).success).toBe(true)
    expect(schema.safeParse({ ...minimal, __chave_desconhecida_b2__: 1 }).success).toBe(false)
  })
})

describe('gate D1 — controle negativo permanente', () => {
  it('um z.object SEM .strict() engole a chave (é exatamente isto que o gate impede de regredir)', () => {
    const semStrict = z.object({ name: z.string() })
    const r = semStrict.safeParse({ name: 'x', __chave_desconhecida_b2__: 1 })
    expect(r.success).toBe(true) // o default do Zod: strip silencioso
    if (r.success) expect('__chave_desconhecida_b2__' in r.data).toBe(false)
  })
})
