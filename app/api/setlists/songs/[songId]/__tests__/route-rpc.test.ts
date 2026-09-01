/**
 * B6 PR-3b — DELETE → rpc('remove_setlist_song') (B6-D9/D10;
 * docs/ux/B6-DESENHO.md §2.4, tradução §2.2).
 *
 * Regra nº 7 (it.fails→it, commit 1): (a)+(b) e (c) nascem `it.fails` —
 * o código pré-3b deletava direto e fechava o buraco com loop de
 * UPDATEs, nunca chamava rpc; falharam no commit 1 por construção. Este
 * é o estado pós-flip — o histórico da branch prova a transição.
 *
 * SENTINELA (D6 do B3): nasce `it`, DECLARADO — sem rpc no código atual
 * não há interpolação a acusar hoje; o teste afirma o contrato que o
 * código novo deve manter.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

const mockRpc = vi.fn()
const mockGateSingle = vi.fn()
const mockDelete = vi.fn()
const mockShiftOrder = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    rpc: mockRpc,
    from: (table: string) => {
      if (table === 'setlists') {
        return { update: () => ({ eq: async () => ({ error: null }) }) }
      }
      // setlist_songs
      return {
        select: () => ({
          eq: (col: string) => ({
            single: mockGateSingle, // gate de posse (join)
            gt: () => ({ order: mockShiftOrder }), // fetch do shift velho
          }),
        }),
        delete: mockDelete,
        update: mockUpdate,
      }
    },
  })),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { DELETE } from '../route'

const SONG_ID = '11111111-1111-4111-8111-111111111111'
const SETLIST_ID = '22222222-2222-4222-8222-222222222222'
const USER = { uid: 'uid-b6-3b-del', email: 'b6@test.local' }

const songDoUsuario = {
  id: SONG_ID,
  position: 2,
  setlist_id: SETLIST_ID,
  setlists: { id: SETLIST_ID, user_id: USER.uid },
}

function delReq() {
  return new NextRequest(`http://localhost/api/setlists/songs/${SONG_ID}`, { method: 'DELETE' })
}

describe("B6 PR-3b — DELETE via rpc('remove_setlist_song') (D9/D10, §2.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
    mockGateSingle.mockResolvedValue({ data: songDoUsuario, error: null })
    // caminho VELHO alimentado (controle negativo observável):
    mockDelete.mockReturnValue({ eq: async () => ({ error: null }) })
    mockShiftOrder.mockResolvedValue({ data: [], error: null })
    mockUpdate.mockReturnValue({ eq: async () => ({ error: null }) })
    mockRpc.mockResolvedValue({
      data: [{ id: '33333333-3333-4333-8333-333333333333', position: 1 }],
      error: null,
    })
  })

  it('(a)+(b) chama rpc remove_setlist_song {p_song_id}, NÃO deleta/shifta direto, e o 200 segue {"success":true} byte-idêntico (hoje: delete + loop)', async () => {
    const res = await DELETE(delReq())
    expect(mockRpc).toHaveBeenCalledExactlyOnceWith('remove_setlist_song', { p_song_id: SONG_ID })
    expect(mockDelete).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(res.status).toBe(200)
    expect(await res.clone().text()).toBe('{"success":true}')
  })

  it('(c1) rpc error OB603 → 404 "Song not found" byte-idêntico (hoje: 200 pelo caminho velho)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB603', message: 'SONG_NOT_FOUND' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it('(c2) rpc error OB602 → 404 "Song not found" byte-idêntico (setlist sumiu no intervalo; hoje: 200)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB602', message: 'SETLIST_NOT_FOUND' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it('(c3) rpc error OB601 → 500 internalError (hoje: 200)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'ORDER_MISMATCH' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('SENTINELA (D6): error.message da rpc NUNCA navega ao envelope (nasce it — hoje não há rpc; declara o contrato do código novo)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB603', message: 'SENTINELA-b6-nao-navega-9f3c' } })
    const res = await DELETE(delReq())
    expect(await res.clone().text()).not.toContain('SENTINELA-b6-nao-navega-9f3c')
  })
})
