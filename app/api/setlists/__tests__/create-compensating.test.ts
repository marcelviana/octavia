import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

/**
 * B2 PR-5 (regra nº 7) — prova do CAMINHO COMPENSATÓRIO da opção (B):
 * posse OK → insert da setlist resolve → insert multi-row das músicas FALHA.
 * A garantia "nenhum 201 mentiroso" É este caminho; sem teste seria
 * esperança comentada (exigência do aval do push).
 *
 * Controle negativo por construção: se alguém remover o delete
 * compensatório do handler, o assert (a) falha.
 */

vi.mock('@/lib/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn(), log: vi.fn() }
}))
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn()
}))

import { POST } from '../route'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

const mockGetClient = vi.mocked(getSupabaseServiceClient)
const mockLogger = vi.mocked(logger)

const USER = { uid: 'uid-compensa', email: 'x@y.com', emailVerified: true }
const CONTENT_A = '11111111-2222-3333-4444-555555555555'
const CONTENT_B = '22222222-3333-4444-5555-666666666666'
const SETLIST_ID = '99999999-8888-7777-6666-555555555555'

// Builder encadeável e awaitable com resultado configurável por (tabela, operação)
type Result = { data: unknown; error: unknown }
function makeClient(config: {
  contentSelect: Result
  setlistInsert: Result
  songsInsert: Result
  setlistDelete: Result
}) {
  const calls = { setlistDeleteIds: [] as string[], songsInsertRows: [] as unknown[] }
  const builder = (result: Result, onCall?: (method: string, args: unknown[]) => void) => {
    const b: any = {}
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit', 'single', 'maybeSingle']) {
      b[m] = vi.fn((...args: unknown[]) => { onCall?.(m, args); return b })
    }
    b.then = (resolve: (r: Result) => void) => Promise.resolve(result).then(resolve)
    return b
  }
  const client: any = {
    from: vi.fn((table: string) => {
      if (table === 'content') return builder(config.contentSelect)
      if (table === 'setlist_songs') return builder(config.songsInsert, (m, args) => {
        if (m === 'insert') calls.songsInsertRows.push(args[0])
      })
      if (table === 'setlists') {
        // distingue insert de delete pela primeira chamada na cadeia
        const b: any = {}
        let mode: 'insert' | 'delete' | null = null
        for (const m of ['select', 'insert', 'delete', 'eq', 'single']) {
          b[m] = vi.fn((...args: unknown[]) => {
            if (m === 'insert') mode = 'insert'
            if (m === 'delete') mode = 'delete'
            if (m === 'eq' && mode === 'delete' && typeof args[1] === 'string' && args[0] === 'id') {
              calls.setlistDeleteIds.push(args[1])
            }
            return b
          })
        }
        b.then = (resolve: (r: Result) => void) =>
          Promise.resolve(mode === 'delete' ? config.setlistDelete : config.setlistInsert).then(resolve)
        return b
      }
      throw new Error(`tabela inesperada no teste: ${table}`)
    }),
  }
  return { client, calls }
}

const REQUEST_BODY = {
  name: 'Show compensa',
  songs: [{ content_id: CONTENT_A }, { content_id: CONTENT_B, notes: 'bis' }],
}
const makeRequest = () =>
  new NextRequest('http://localhost:3000/api/setlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer mock' },
    body: JSON.stringify(REQUEST_BODY),
  })

const OWNED = [
  { id: CONTENT_A, title: 'A', artist: null, content_type: 'Lyrics', key: null, bpm: null, file_url: null, content_data: null },
  { id: CONTENT_B, title: 'B', artist: null, content_type: 'Chords', key: null, bpm: null, file_url: null, content_data: null },
]
const CREATED = { id: SETLIST_ID, name: 'Show compensa', user_id: USER.uid }

describe('POST /api/setlists — caminho compensatório (opção B)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('(a)+(b) insert das músicas FALHA → delete compensatório com o id da setlist criada + 500, nunca 201', async () => {
    mockRequireAuthServerSecure.mockResolvedValueOnce(USER)
    const { client, calls } = makeClient({
      contentSelect: { data: OWNED, error: null },
      setlistInsert: { data: CREATED, error: null },
      songsInsert: { data: null, error: { message: 'boom no multi-row' } },
      setlistDelete: { data: null, error: null },
    })
    mockGetClient.mockReturnValue(client)

    const response = await POST(makeRequest())

    expect(response.status).toBe(500)               // (b) erro honesto
    expect(response.status).not.toBe(201)
    expect(calls.setlistDeleteIds).toEqual([SETLIST_ID]) // (a) compensação com o id certo
    const body = await response.json()
    expect(body.error).toBe('Failed to create setlist songs')
  })

  it('(c) o PRÓPRIO delete compensatório falha → ainda 500 + log do pior caso (setlist órfã), nunca 201', async () => {
    mockRequireAuthServerSecure.mockResolvedValueOnce(USER)
    const { client, calls } = makeClient({
      contentSelect: { data: OWNED, error: null },
      setlistInsert: { data: CREATED, error: null },
      songsInsert: { data: null, error: { message: 'boom no multi-row' } },
      setlistDelete: { data: null, error: { message: 'boom no rollback' } },
    })
    mockGetClient.mockReturnValue(client)

    const response = await POST(makeRequest())

    expect(response.status).toBe(500)
    expect(calls.setlistDeleteIds).toEqual([SETLIST_ID]) // a compensação foi TENTADA
    expect(
      mockLogger.error.mock.calls.some(([msg]) => String(msg).includes('Compensating delete FAILED'))
    ).toBe(true) // pior caso logado
  })

  it('sanity do harness: caminho feliz → 201 com as 2 músicas renumeradas 1..N (o mock é fiel)', async () => {
    mockRequireAuthServerSecure.mockResolvedValueOnce(USER)
    const inserted = [
      { id: 's1', setlist_id: SETLIST_ID, content_id: CONTENT_A, position: 1, notes: null },
      { id: 's2', setlist_id: SETLIST_ID, content_id: CONTENT_B, position: 2, notes: 'bis' },
    ]
    const { client, calls } = makeClient({
      contentSelect: { data: OWNED, error: null },
      setlistInsert: { data: CREATED, error: null },
      songsInsert: { data: inserted, error: null },
      setlistDelete: { data: null, error: null },
    })
    mockGetClient.mockReturnValue(client)

    const response = await POST(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.setlist_songs).toHaveLength(2)
    expect(body.setlist_songs[0].position).toBe(1)
    expect(body.setlist_songs[1].position).toBe(2)
    expect(calls.setlistDeleteIds).toEqual([])           // nada compensado no feliz
    const rows = calls.songsInsertRows[0] as Array<{ position: number }>
    expect(rows.map((r) => r.position)).toEqual([1, 2])  // renumeração 1..N no insert
  })
})
