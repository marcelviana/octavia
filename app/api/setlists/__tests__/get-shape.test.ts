/**
 * B6 PR-4 (D6) — shape do GET /api/setlists: os fallbacks do mapeamento
 * (Unknown Title/Artist/Type, nulls) fazem parte do contrato de resposta
 * e NÃO mudam com o fim do N+1 — o flip troca a FONTE (content embutido
 * no lugar do contentMap), nunca o shape.
 *
 * Nasce `it` (declarado): o mapeamento não muda; o mock serve os DOIS
 * formatos de código (o 1+2N antigo e a query única com embedding) —
 * o teste é o gate de que o shape sobrevive ao flip.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

const USER = { uid: 'uid-b6-pr4', email: 'b6@test.local' }

// linha de setlist como o PostgREST devolve COM embedding (código novo);
// o código antigo ignora o campo embutido e refaz via queries próprias
const setlistRow = {
  id: '44444444-4444-4444-8444-444444444444',
  user_id: USER.uid,
  name: 'Shape gate',
  description: null,
  performance_date: null,
  venue: null,
  notes: null,
  is_public: false,
  created_at: '2026-09-01T00:00:00+00:00',
  updated_at: '2026-09-01T00:00:00+00:00',
  setlist_songs: [
    // content: null força os fallbacks no código novo…
    { id: 'ss1', setlist_id: '44444444-4444-4444-8444-444444444444', content_id: 'c1-fantasma', position: 1, notes: null, content: null },
  ],
}

function thenable(result: unknown) {
  const q: any = {
    eq: () => q,
    order: () => q,
    in: () => q,
    then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
  }
  return q
}

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    from: (table: string) => ({
      select: () => {
        if (table === 'setlists') return thenable({ data: [setlistRow], error: null })
        if (table === 'setlist_songs')
          return thenable({
            data: [{ id: 'ss1', setlist_id: setlistRow.id, content_id: 'c1-fantasma', position: 1, notes: null }],
            error: null,
          })
        // …e content vazio força os fallbacks no código antigo (contentMap sem hit)
        return thenable({ data: [], error: null })
      },
    }),
  })),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { GET } from '../route'

describe('B6 PR-4 — shape do GET /api/setlists (gate de invariância do mapeamento)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
  })

  it('fallbacks do mapeamento preservados (Unknown Title/Artist/Type + nulls) e song com id/position/notes', async () => {
    const res = await GET(new NextRequest('http://localhost/api/setlists'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as any[]
    expect(body).toHaveLength(1)
    const song = body[0].setlist_songs[0]
    expect(song.id).toBe('ss1')
    expect(song.position).toBe(1)
    expect(song.notes).toBeNull()
    expect(song.content).toEqual({
      id: 'c1-fantasma',
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      content_type: 'Unknown Type',
      key: null,
      bpm: null,
      file_url: null,
      content_data: null,
    })
  })
})
