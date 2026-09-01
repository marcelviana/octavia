import { describe, it, expect } from 'vitest'
import { setlistSchemas, authSchemas } from '@/lib/api-schemas'

/**
 * B2 PR-5 — contrato de /api/setlists: SET-01 fechado, songs[] real (D2).
 *
 * MUDANÇA DECLARADA DE POLÍTICA (mesma classe das PRs 4a/4b): os testes da
 * PR-4c provavam que venue/performance_date/notes eram STRIPADOS por lista
 * (estado intermediário). A PR-5 os coloca no contrato — os testes passam a
 * provar PERSISTÊNCIA. Controles negativos herdados, todos medidos:
 *  - SET-01 create: 201 com strip (pre-check §2.1; re-provado no preview da
 *    4c — read-back com os três campos null)
 *  - SET-01 update: 200 "Setlist updated successfully" mentindo (§2.2)
 *  - a3: songs[] aceito e descartado com setlist_songs: [] fixo (§2.1)
 *  - NaN: addSong sem position → 500 do Postgres na 1ª inserção (medido na
 *    verificação pós-MIG-1, 2026-08-27)
 */

const UUID_A = '11111111-2222-3333-4444-555555555555'
const UUID_B = '22222222-3333-4444-5555-666666666666'

describe('setlistSchemas — SET-01 fechado: os cinco campos de metadados no contrato', () => {
  it('create: replay verbatim do payload real da UI (§2.1) — os TRÊS fantasma agora ATRAVESSAM', () => {
    const r = setlistSchemas.create.safeParse({
      name: 'Show Bar do Zé',
      description: 'primeira noite',
      performance_date: '2026-09-12',
      venue: 'Bar do Zé',
      notes: 'levar capo',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.venue).toBe('Bar do Zé')
      expect(r.data.performance_date).toBe('2026-09-12')
      expect(r.data.notes).toBe('levar capo')
    }
  })

  it('update: mesmo replay (§2.2) — os cinco campos chegam ao handler', () => {
    const r = setlistSchemas.update.safeParse({
      name: 'Show Bar do Zé', description: 'primeira noite',
      performance_date: '2026-09-12', venue: 'Bar do Zé', notes: 'levar capo',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.venue).toBe('Bar do Zé')
      expect(r.data.performance_date).toBe('2026-09-12')
      expect(r.data.notes).toBe('levar capo')
    }
  })

  it('performance_date é DATE-ONLY (decisão B5): timestamp → 400; null limpa; formato inválido → 400', () => {
    expect(setlistSchemas.create.safeParse({ name: 'x', performance_date: '2026-09-12' }).success).toBe(true)
    expect(setlistSchemas.create.safeParse({ name: 'x', performance_date: '2026-09-12T20:00:00Z' }).success).toBe(false)
    expect(setlistSchemas.create.safeParse({ name: 'x', performance_date: '12/09/2026' }).success).toBe(false)
    const limpa = setlistSchemas.update.safeParse({ performance_date: null })
    expect(limpa.success).toBe(true)
    if (limpa.success) expect(limpa.data).toHaveProperty('performance_date', null)
  })

  it('chave desconhecida → 400 (era ENGOLIDA — controle medido na 4c)', () => {
    expect(setlistSchemas.create.safeParse({ name: 'Show', chave_b2: 1 }).success).toBe(false)
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

describe('setlistSchemas.create.songs — D2: implementado, sem position', () => {
  it('item é {content_id, notes?}; a ORDEM DO ARRAY é a ordem', () => {
    const r = setlistSchemas.create.safeParse({
      name: 'Show', songs: [{ content_id: UUID_A }, { content_id: UUID_B, notes: 'bis' }],
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.songs).toHaveLength(2)
  })

  it('position no item → 400 (o servidor renumera 1..N; aceitar seria a mentira que o B2 mata)', () => {
    expect(setlistSchemas.create.safeParse({
      name: 'Show', songs: [{ content_id: UUID_A, position: 1 }],
    }).success).toBe(false)
  })

  it('content_id repetido no array → 400 (bis intencional se faz ADICIONANDO depois)', () => {
    expect(setlistSchemas.create.safeParse({
      name: 'Show', songs: [{ content_id: UUID_A }, { content_id: UUID_A }],
    }).success).toBe(false)
  })

  it('update NÃO aceita songs → 400 por chave desconhecida, não strip (fim do a3 no update)', () => {
    expect(setlistSchemas.update.safeParse({
      name: 'x', songs: [{ content_id: UUID_A }],
    }).success).toBe(false)
  })
})

describe('setlistSchemas.addSong — exceção declarada da position + fix do NaN', () => {
  it('payload real da UI (setlist-service.ts:271) passa', () => {
    const r = setlistSchemas.addSong.safeParse({ content_id: UUID_A, position: 3, notes: '' })
    expect(r.success).toBe(true)
  })

  it('position ausente é VÁLIDO pelo schema — e o handler vai para max+1 (era Math.max(undefined,…)=NaN → 500, medido pós-MIG-1)', () => {
    const r = setlistSchemas.addSong.safeParse({ content_id: UUID_A })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.position).toBeUndefined()
  })

  it('chave desconhecida → 400; content_id inválido → 400', () => {
    expect(setlistSchemas.addSong.safeParse({ content_id: UUID_A, chave_b2: 1 }).success).toBe(false)
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

describe('setlistSchemas.reorder — B6 PR-3b (D1; o updateSongPosition morreu com o move-one)', () => {
  const UUID = '11111111-2222-3333-4444-555555555555'
  const UUID2 = '22222222-3333-4444-5555-666666666666'

  it('array de uuids válido passa; a ordem do array é o contrato', () => {
    expect(setlistSchemas.reorder.safeParse({ order: [UUID, UUID2] }).success).toBe(true)
  })

  it('duplicata no array → 400 nomeando order (refine)', () => {
    const r = setlistSchemas.reorder.safeParse({ order: [UUID, UUID] })
    expect(r.success).toBe(false)
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.join('.') === 'order')
      expect(issue?.message).toBe('Duplicate song id in order')
    }
  })

  it('array vazio → 400 (min 1); >100 itens → 400 (max alinhado ao songs[] do create)', () => {
    expect(setlistSchemas.reorder.safeParse({ order: [] }).success).toBe(false)
    const many = Array.from({ length: 101 }, (_, i) =>
      `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`)
    expect(setlistSchemas.reorder.safeParse({ order: many }).success).toBe(false)
  })

  it('item não-uuid → 400; order ausente → 400; setlistId no body → 400 (strict — o recurso vem do path)', () => {
    expect(setlistSchemas.reorder.safeParse({ order: ['nao-uuid'] }).success).toBe(false)
    expect(setlistSchemas.reorder.safeParse({}).success).toBe(false)
    expect(setlistSchemas.reorder.safeParse({ order: [UUID], setlistId: UUID }).success).toBe(false)
  })
})

