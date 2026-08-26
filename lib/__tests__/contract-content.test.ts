import { describe, it, expect } from 'vitest'
import { contentSchemas } from '@/lib/api-schemas'

/**
 * B2 PR-4b — contrato de /api/content (módulo único, D3+D4).
 *
 * Controles negativos (regra nº 7), medidos contra os schemas ANTIGOS
 * (2026-08-25, antes desta PR):
 *  - chave desconhecida: ENGOLIDA em silêncio (strip default do Zod)
 *  - content_type 'pdf': ACEITO (enum de 10 valores fantasma — achado c2)
 *  - batch (content_data string): 400 "Expected object" — comportamento
 *    PRESERVADO (D5); o assert abaixo é gate contra "consertarem" por
 *    acidente com correção de tipo (exigência registrada na revisão da PR-2)
 */

const MIN_CREATE = { title: 'Asa Branca', content_type: 'Lyrics' }

describe('contentSchemas.create — D5: content_data é objeto-ou-null no topo', () => {
  it('OBRIGATÓRIO (D5/aval PR-2): batch envia STRING → 400 "Expected object"', () => {
    const r = contentSchemas.create.safeParse({
      ...MIN_CREATE,
      content_data: 'Quando olhei a terra ardendo\n',
      user_id: 'firebase-uid-123',
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path.join('.') === 'content_data')
      expect(issue?.message).toContain('Expected object')
    }
  })

  it('objeto, null e objeto aninhado passam', () => {
    expect(contentSchemas.create.safeParse({ ...MIN_CREATE, content_data: { lyrics: 'x' } }).success).toBe(true)
    expect(contentSchemas.create.safeParse({ ...MIN_CREATE, content_data: null }).success).toBe(true)
    expect(contentSchemas.create.safeParse({
      ...MIN_CREATE,
      content_data: { annotations: [], sections: [{ name: 'A' }], meta: { n: 1 } },
    }).success).toBe(true)
  })
})

describe('contentSchemas.create — D4: enum canônico único', () => {
  it.each(['Lyrics', 'Chords', 'Tab', 'Sheet'])('aceita %s (enum da UI, types/content.ts)', (t) => {
    expect(contentSchemas.create.safeParse({ title: 'x', content_type: t }).success).toBe(true)
  })

  it.each(['song', 'pdf', 'audio', 'Tabs', 'Piano', 'Drums'])(
    'rejeita %s (valores fantasma dos enums antigos — eram ACEITOS)',
    (t) => {
      expect(contentSchemas.create.safeParse({ title: 'x', content_type: t }).success).toBe(false)
    }
  )
})

describe('contentSchemas.create — política D1', () => {
  it('user_id/created_at/updated_at do body são ignorados por lista (payload real de useAddContentLogic)', () => {
    const r = contentSchemas.create.safeParse({ ...MIN_CREATE, user_id: 'uid-x', updated_at: '2020-01-01' })
    expect(r.success).toBe(true)
    if (r.success) {
      expect('user_id' in r.data).toBe(false)
      expect('updated_at' in r.data).toBe(false)
    }
  })

  it('chave desconhecida → 400 (era ENGOLIDA em silêncio — controle medido)', () => {
    expect(contentSchemas.create.safeParse({ ...MIN_CREATE, __chave_b2__: 1 }).success).toBe(false)
  })
})

describe('contentSchemas.create — limites do banco real (classe c1)', () => {
  it('title com 255 (= varchar) passa; 256 → 400 nomeando title', () => {
    expect(contentSchemas.create.safeParse({ title: 'x'.repeat(255), content_type: 'Lyrics' }).success).toBe(true)
    const r = contentSchemas.create.safeParse({ title: 'x'.repeat(256), content_type: 'Lyrics' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.path.join('.')).toBe('title')
  })

  it('bpm: faixa única 1–999 (aval, ponto 3)', () => {
    const mk = (bpm: number) => contentSchemas.create.safeParse({ ...MIN_CREATE, bpm })
    expect(mk(1).success).toBe(true)
    expect(mk(999).success).toBe(true)
    expect(mk(0).success).toBe(false)
    expect(mk(1000).success).toBe(false)
  })

  it('bpm NaN → 400 (caso do editor com campo não-numérico)', () => {
    expect(contentSchemas.create.safeParse({ ...MIN_CREATE, bpm: Number.parseInt('') }).success).toBe(false)
  })
})

describe('contentSchemas.create — campos que voltam ao contrato (órfãs d2)', () => {
  it('capo, tuning, genre, time_signature, is_public aceitos e literais', () => {
    const r = contentSchemas.create.safeParse({
      ...MIN_CREATE, capo: 3, tuning: 'DADGAD', genre: 'Baião',
      time_signature: '6/8', is_public: false,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.capo).toBe(3)
      expect(r.data.tuning).toBe('DADGAD')
      expect(r.data.genre).toBe('Baião')
      expect(r.data.time_signature).toBe('6/8')
    }
  })

  it('file_url: URL absoluta ok; nome de arquivo → 400 (armadilha b6 desativada no contrato)', () => {
    expect(contentSchemas.create.safeParse({ ...MIN_CREATE, file_url: 'https://x.supabase.co/f.pdf' }).success).toBe(true)
    const r = contentSchemas.create.safeParse({ ...MIN_CREATE, file_url: 'cifra.pdf' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.path.join('.')).toBe('file_url')
  })
})

describe('contentSchemas.update — id no corpo (rota canônica) + semântica SET-23', () => {
  const ID = '11111111-2222-3333-4444-555555555555'

  it('payload real do content-editor (com updated_at e nulls) passa; updated_at ignorado; null atravessa', () => {
    const r = contentSchemas.update.safeParse({
      id: ID, title: 'Asa Branca', artist: 'Luiz Gonzaga', album: null, genre: null,
      key: 'F', bpm: 120, difficulty: null, tags: [], notes: null,
      is_favorite: false, is_public: false, content_data: { annotations: [] },
      updated_at: '2026-08-25T00:00:00.000Z',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect('updated_at' in r.data).toBe(false)
      expect(r.data).toHaveProperty('album', null)
      expect(r.data).toHaveProperty('difficulty', null)
    }
  })

  it('sem id → 400; campo ausente permanece undefined (não mexer)', () => {
    expect(contentSchemas.update.safeParse({ title: 'x' }).success).toBe(false)
    const r = contentSchemas.update.safeParse({ id: ID, title: 'x' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.artist).toBeUndefined()
  })

  it('content_type Tab/Sheet aceitos no update (classe b5 morta — o schema antigo do PUT removido os rejeitava)', () => {
    expect(contentSchemas.update.safeParse({ id: ID, content_type: 'Tab' }).success).toBe(true)
    expect(contentSchemas.update.safeParse({ id: ID, content_type: 'Sheet' }).success).toBe(true)
  })
})
