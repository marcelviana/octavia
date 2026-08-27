import { describe, it, expect } from 'vitest'
import { setlistSchemas, authSchemas } from '@/lib/api-schemas'

/**
 * B2 PR-4c — contrato de /api/setlists (parte schema; comportamento do
 * handler — songs[] de verdade, campos fantasma religados — é PR-5).
 *
 * Controle negativo (regra nº 7), medido 2026-08-25 contra o schema antigo:
 *   { name: 'Show', chave_b2: 1, venue: 'Bar' }
 *   → ENGOLIDA (chegava ao handler só { name, songs } — strip silencioso
 *     do default do Zod; nem a chave inventada nem venue davam erro)
 */

describe('setlistSchemas — política D1 com a ressalva de estado intermediário', () => {
  it('venue/performance_date/notes são IGNORADOS por lista até a PR-5 (SET-01: replay verbatim do payload real da UI, §2.1)', () => {
    const r = setlistSchemas.create.safeParse({
      name: 'Show Bar do Zé',
      description: 'primeira noite',
      performance_date: '2026-09-12',
      venue: 'Bar do Zé',
      notes: 'levar capo',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      // mesmo comportamento de hoje (strip) — mas por decisão escrita;
      // a PR-5 move os três da lista de ignorados para o schema
      expect('venue' in r.data).toBe(false)
      expect('performance_date' in r.data).toBe(false)
      expect('notes' in r.data).toBe(false)
      expect(r.data.name).toBe('Show Bar do Zé')
    }
  })

  it('update: mesmo replay verbatim (§2.2) passa; name/description chegam', () => {
    const r = setlistSchemas.update.safeParse({
      name: 'Show Bar do Zé', description: 'primeira noite',
      performance_date: '2026-09-12', venue: 'Bar do Zé', notes: 'levar capo',
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe('Show Bar do Zé')
  })

  it('chave desconhecida fora da lista → 400 (era ENGOLIDA — controle medido)', () => {
    expect(setlistSchemas.create.safeParse({ name: 'Show', chave_b2: 1 }).success).toBe(false)
    expect(setlistSchemas.update.safeParse({ name: 'x', chave_b2: 1 }).success).toBe(false)
  })

  it('SET-23 preservado: description null atravessa como null; ausente = undefined', () => {
    const comNull = setlistSchemas.update.safeParse({ description: null })
    expect(comNull.success).toBe(true)
    if (comNull.success) expect(comNull.data).toHaveProperty('description', null)
    const ausente = setlistSchemas.update.safeParse({ name: 'x' })
    expect(ausente.success).toBe(true)
    if (ausente.success) expect(ausente.data.description).toBeUndefined()
  })

  it('name alinhado à coluna varchar(255): 255 passa, 256 falha (era máx 100)', () => {
    expect(setlistSchemas.create.safeParse({ name: 'x'.repeat(255) }).success).toBe(true)
    expect(setlistSchemas.create.safeParse({ name: 'x'.repeat(256) }).success).toBe(false)
  })
})

describe('setlistSchemas.addSong — exceção declarada da position', () => {
  const ID = '11111111-2222-3333-4444-555555555555'

  it('payload real da UI (setlist-service.ts:271) passa', () => {
    const r = setlistSchemas.addSong.safeParse({ content_id: ID, position: 3, notes: '' })
    expect(r.success).toBe(true)
  })

  it('position é opcional (sugestão — exceção D1 documentada no schema, pendente B6)', () => {
    expect(setlistSchemas.addSong.safeParse({ content_id: ID }).success).toBe(true)
  })

  it('chave desconhecida → 400; content_id inválido → 400', () => {
    expect(setlistSchemas.addSong.safeParse({ content_id: ID, chave_b2: 1 }).success).toBe(false)
    expect(setlistSchemas.addSong.safeParse({ content_id: 'nao-uuid' }).success).toBe(false)
  })
})

describe('authSchemas.sessionCreate — migração no-op (pre-check §2.11)', () => {
  it('payload real { idToken } passa; chave extra → 400; token vazio → 400', () => {
    expect(authSchemas.sessionCreate.safeParse({ idToken: 'a.b.c' }).success).toBe(true)
    expect(authSchemas.sessionCreate.safeParse({ idToken: 'a.b.c', extra: 1 }).success).toBe(false)
    expect(authSchemas.sessionCreate.safeParse({ idToken: '' }).success).toBe(false)
  })
})
