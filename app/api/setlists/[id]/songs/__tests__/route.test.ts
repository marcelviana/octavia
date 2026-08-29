/**
 * B3 PR-4 — add-song: mudança SEMÂNTICA pelo rito do PR-3a (aval do
 * PR-3b). Primeiro arquivo de teste da rota desde a morte do de 9
 * it.skip no B2/PR-5. Fecha a lacuna do pre-check §2.5 (cross-user do
 * add-song não mapeado).
 *
 * Controles negativos (código atual): setlist inexistente-ou-alheia →
 * `throw setlistError` → 500; content inexistente-ou-alheio →
 * `throw new Error('Content with ID …')` → 500.
 *
 * Nota de construção: a posse é verificada por query filtrada
 * (.eq('user_id', uid) + .single()) — "alheio" e "inexistente" produzem
 * o MESMO PGRST116 pela própria query, então a byte-identidade do D2 é
 * estrutural; o gate a prova executando os dois mocks (idênticos por
 * construção) e comparando os corpos.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({ from: mockFrom })),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '../route'

const SETLIST_ID = '44444444-4444-4444-8444-444444444444'
const CONTENT_ID = '55555555-5555-4555-8555-555555555555'
const USER = { uid: 'uid-addsong-b3', email: 'b3@test.local' }
const pgrst116 = { data: null, error: { code: 'PGRST116', message: 'No rows found' } }

function wire() {
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
}

function addReq() {
  return new NextRequest(`http://localhost/api/setlists/${SETLIST_ID}/songs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content_id: CONTENT_ID, notes: '' }),
  })
}

describe('B3 contrato — add-song (PR-4, semântica pelo rito do PR-3a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wire()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
  })

  it('setlist inexistente-ou-alheia → 404 "Setlist not found" (hoje: throw → 500)', async () => {
    mockSingle.mockResolvedValueOnce(pgrst116) // query da setlist
    const res = await POST(addReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Setlist not found","code":"NOT_FOUND"}')
  })

  it('content inexistente-ou-alheio → 404 "Content not found" (hoje: throw → 500)', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: SETLIST_ID }, error: null }) // setlist ok
      .mockResolvedValueOnce(pgrst116) // content
    const res = await POST(addReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Content not found","code":"NOT_FOUND"}')
  })

  it('SEM ORÁCULO: alheio ≡ inexistente byte-idêntico (estrutural — mesma query filtrada)', async () => {
    mockSingle.mockResolvedValueOnce(pgrst116)
    const inexistente = await (await POST(addReq())).text()
    mockSingle.mockResolvedValueOnce(pgrst116) // "alheio": mesma PGRST116 por construção
    const alheio = await (await POST(addReq())).text()
    expect(alheio).toBe(inexistente)
    expect(inexistente).toBe('{"error":"Setlist not found","code":"NOT_FOUND"}')
  })
})
