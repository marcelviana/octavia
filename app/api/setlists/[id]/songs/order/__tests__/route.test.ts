/**
 * B6 PR-3b — testes da rota NOVA PUT /api/setlists/[id]/songs/order
 * (B6-D1/D2/D4; docs/ux/B6-DESENHO.md §1). Nascem `it` no commit das
 * rotas — DECLARADO: não há código velho desta rota para it.fails; os
 * controles negativos do contrato viem do pre-check (rota move-one,
 * removida nesta PR) e dos replays branch × prod do §8.
 *
 * Absorve os destinos da migração dos testes do move-one (§1.5):
 * setlist alheia → 404; 401; byte-identidade dos 404 e dos 400 de
 * mismatch (anti-oráculo).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

const mockRpc = vi.fn()
const mockGateSingle = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    rpc: mockRpc,
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ single: mockGateSingle }) }) }),
    }),
  })),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { PUT } from '../route'

const SETLIST_ID = '44444444-4444-4444-8444-444444444444'
const S1 = '11111111-1111-4111-8111-111111111111'
const S2 = '22222222-2222-4222-8222-222222222222'
const S3 = '33333333-3333-4333-8333-333333333333'
const USER = { uid: 'uid-b6-reorder', email: 'b6@test.local' }
const pgrst116 = { data: null, error: { code: 'PGRST116', message: 'No rows found' } }

function req(body: unknown = { order: [S3, S1, S2] }) {
  return new NextRequest(`http://localhost/api/setlists/${SETLIST_ID}/songs/order`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('B6 PR-3b — PUT /api/setlists/[id]/songs/order (D1/D2/D4, §1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
    mockGateSingle.mockResolvedValue({ data: { id: SETLIST_ID }, error: null })
    mockRpc.mockResolvedValue({
      data: [{ id: S3, position: 1 }, { id: S1, position: 2 }, { id: S2, position: 3 }],
      error: null,
    })
  })

  it('401 sem credencial: envelope authRequired', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(null)
    const res = await PUT(req())
    expect(res.status).toBe(401)
    expect(await res.clone().text()).toBe('{"error":"Authentication required","code":"AUTH_REQUIRED"}')
  })

  it('setlist inexistente-ou-alheia → 404 byte-idêntico ao do addSong (D2, sem oráculo)', async () => {
    mockGateSingle.mockResolvedValue(pgrst116)
    const inexistente = await (await PUT(req())).text()
    mockGateSingle.mockResolvedValue(pgrst116) // "alheia": mesma PGRST116 por construção
    const alheia = await (await PUT(req())).text()
    expect(alheia).toBe(inexistente)
    expect(inexistente).toBe('{"error":"Setlist not found","code":"NOT_FOUND"}')
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('duplicata no array → 400 field:"order" (Zod, ANTES da rpc — corpo próprio, declarado ≠ mismatch)', async () => {
    const res = await PUT(req({ order: [S1, S1, S2] }))
    expect(res.status).toBe(400)
    const data = (await res.json()) as { code?: string; details?: unknown }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'order', message: 'Duplicate song id in order', code: 'custom' },
    ])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('chave desconhecida → 400 com um detail por chave (D7 do B3)', async () => {
    const res = await PUT(req({ order: [S1], extra: 1 }))
    expect(res.status).toBe(400)
    const data = (await res.json()) as { details?: Array<{ field: string; code: string }> }
    expect(data.details).toEqual([
      { field: 'extra', message: "Unrecognized key: 'extra'", code: 'unrecognized_keys' },
    ])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('rpc OB601 (falta/sobra/alheio/corrida) → 400 field:"order" com a mensagem canônica', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'ORDER_MISMATCH' } })
    const res = await PUT(req({ order: [S1, S2] }))
    expect(res.status).toBe(400)
    expect(await res.clone().text()).toBe(
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"order","message":"order must contain exactly the songs of the setlist","code":"custom"}]}'
    )
  })

  it('rpc OB602 → 404 byte-idêntico ao do gate (setlist sumiu no intervalo)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB602', message: 'SETLIST_NOT_FOUND' } })
    const res = await PUT(req())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Setlist not found","code":"NOT_FOUND"}')
  })

  it('sucesso: rpc chamada com {p_setlist_id, p_song_ids} e 200 {"songs":[{id,position}…]} na ordem canônica', async () => {
    const res = await PUT(req())
    expect(mockRpc).toHaveBeenCalledExactlyOnceWith('reorder_setlist_songs', {
      p_setlist_id: SETLIST_ID,
      p_song_ids: [S3, S1, S2],
    })
    expect(res.status).toBe(200)
    expect(await res.clone().text()).toBe(
      `{"songs":[{"id":"${S3}","position":1},{"id":"${S1}","position":2},{"id":"${S2}","position":3}]}`
    )
  })

  it('SENTINELA (D6): error.message da rpc não navega — o 400 canônico não contém a string', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'SENTINELA-b6-nao-navega-9f3c' } })
    const res = await PUT(req())
    expect(res.status).toBe(400)
    expect(await res.clone().text()).not.toContain('SENTINELA-b6-nao-navega-9f3c')
  })
})
