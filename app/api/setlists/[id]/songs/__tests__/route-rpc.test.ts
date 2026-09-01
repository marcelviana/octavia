/**
 * B6 PR-3b — addSong → rpc('add_setlist_song') (B6-D3/D10;
 * docs/ux/B6-DESENHO.md §2.5, tradução §2.2).
 *
 * Regra nº 7 (it.fails→it, commit 1): os gates (a)/(b)/(c) nascem
 * `it.fails` — o código ATUAL lê max, calcula Math.max e insere direto
 * (route.ts:55-95), nunca chama rpc; cada teste falhou no commit 1 por
 * construção. Este é o estado pós-flip (commit das rotas) — o histórico
 * da branch prova a transição.
 *
 * SENTINELA (D6 do B3): nasce `it`, DECLARADO — o código atual não tem
 * rpc, logo não há interpolação de error.message de rpc a acusar hoje;
 * o teste já afirma o contrato que o código novo deve manter (mensagem
 * de dependência não navega ao envelope).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

const mockRpc = vi.fn()
const mockInsert = vi.fn()
const mockMaybeSingle = vi.fn()
const mockGateSingle = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    rpc: mockRpc,
    from: (table: string) => {
      if (table === 'setlists') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: mockGateSingle }) }) }),
          update: () => ({ eq: async () => ({ error: null }) }),
        }
      }
      if (table === 'content') {
        return { select: () => ({ eq: () => ({ eq: () => ({ single: mockGateSingle }) }) }) }
      }
      // setlist_songs — caminho VELHO (max + insert); o novo não deve tocá-lo
      return {
        select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: mockMaybeSingle }) }) }) }),
        insert: mockInsert,
      }
    },
  })),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { POST } from '../route'

const SETLIST_ID = '44444444-4444-4444-8444-444444444444'
const CONTENT_ID = '55555555-5555-4555-8555-555555555555'
const USER = { uid: 'uid-b6-3b', email: 'b6@test.local' }

// linha que a RPC devolve — as 6 colunas NA ORDEM da tabela (dump :89-96),
// shape do 201 medido no pre-check L1.1
const RPC_ROW = {
  id: '66666666-6666-4666-8666-666666666666',
  setlist_id: SETLIST_ID,
  content_id: CONTENT_ID,
  position: 7,
  notes: null,
  created_at: '2026-09-01T00:00:00.000000+00:00',
}

function req(body: unknown = { content_id: CONTENT_ID, position: 99 }) {
  return new NextRequest(`http://localhost/api/setlists/${SETLIST_ID}/songs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe("B6 PR-3b — addSong via rpc('add_setlist_song') (D3/D10, §2.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
    // gates de posse (setlist e content) passam nos dois códigos
    mockGateSingle.mockResolvedValue({ data: { id: SETLIST_ID }, error: null })
    // caminho VELHO alimentado para o controle negativo ser observável:
    mockMaybeSingle.mockResolvedValue({ data: { position: 6 }, error: null })
    mockInsert.mockReturnValue({
      select: () => ({ single: async () => ({ data: { id: 'FROM-INSERT-DIRETO' }, error: null }) }),
    })
    mockRpc.mockResolvedValue({ data: [RPC_ROW], error: null })
  })

  it('(a) position 99: chama rpc add_setlist_song {p_setlist_id,p_content_id,p_notes} e NÃO insere direto (hoje: Math.max + insert)', async () => {
    await POST(req())
    expect(mockRpc).toHaveBeenCalledExactlyOnceWith('add_setlist_song', {
      p_setlist_id: SETLIST_ID,
      p_content_id: CONTENT_ID,
      p_notes: null,
    })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('(b) 201 ecoa data[0] da rpc — 6 chaves na ordem id,setlist_id,content_id,position,notes,created_at (hoje: ecoa o insert direto)', async () => {
    const res = await POST(req())
    expect(res.status).toBe(201)
    expect(await res.clone().text()).toBe(JSON.stringify(RPC_ROW))
  })

  it('(c1) rpc error OB602 → 404 byte-idêntico ao 404 do gate (hoje: 201 pelo caminho velho)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB602', message: 'SETLIST_NOT_FOUND' } })
    const res = await POST(req())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Setlist not found","code":"NOT_FOUND"}')
  })

  it('(c2) rpc error OB601 → 500 internalError (invariante interno; hoje: 201)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'ORDER_MISMATCH' } })
    const res = await POST(req())
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('(c3) rpc error com code desconhecido → 500 (hoje: 201)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'whatever' } })
    const res = await POST(req())
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('SENTINELA (D6): error.message da rpc NUNCA navega ao envelope (nasce it — hoje não há rpc para interpolar; declara o contrato do código novo)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'SENTINELA-b6-nao-navega-9f3c' } })
    const res = await POST(req())
    expect(await res.clone().text()).not.toContain('SENTINELA-b6-nao-navega-9f3c')
  })
})
