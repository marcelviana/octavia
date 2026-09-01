/**
 * B6 PR-3c — DELETE /api/content/[id] → rpc('delete_content_resequence')
 * (B6-D11; docs/ux/B6-DESENHO.md §2.6, tradução §2.2).
 *
 * Regra nº 7 (it.fails→it, commit 1): (a)-(d) nasceram `it.fails` — o
 * código pré-3c deletava direto na tabela e deixava o FK cascade apagar
 * a música do MEIO das setlists SEM renumerar (a brecha (e) do
 * inventário §0.1, fechada pela D11); falharam no commit 1 por
 * construção. Este é o estado pós-flip — o histórico da branch prova a
 * transição.
 *
 * SENTINELA (D6 do B3): nasce `it`, DECLARADO — sem rpc no código atual
 * não há interpolação a acusar; afirma o contrato do código novo.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockRpc = vi.fn()
const mockGateSingle = vi.fn()
const mockDelete = vi.fn()
const mockRequireAuthServer = vi.fn()

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(() => ({
    rpc: mockRpc,
    from: () => ({
      // gate NOVO (select) e caminho VELHO (delete) — ambos alimentados
      // para o controle negativo ser observável
      select: () => ({ eq: () => ({ eq: () => ({ single: mockGateSingle }) }) }),
      delete: mockDelete,
    }),
  })),
}))
vi.mock('@/lib/firebase-server-utils', () => ({
  requireAuthServer: (req: Request) => mockRequireAuthServer(req),
}))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { DELETE } from '../route'

const CONTENT_ID = '55555555-5555-4555-8555-555555555555'
const USER = { uid: 'uid-b6-3c', email: 'b6@test.local' }
const pgrst116 = { data: null, error: { code: 'PGRST116', message: 'No rows found' } }

// as 22 colunas NA ORDEM da tabela (dump :42-64) — shape do 200 medido
// ao vivo no §0 do desenho (probe de 2026-09-01)
const RPC_ROW = {
  id: CONTENT_ID,
  user_id: USER.uid,
  title: 'X',
  artist: null,
  album: null,
  genre: null,
  content_type: 'Lyrics',
  key: null,
  bpm: null,
  time_signature: null,
  difficulty: null,
  capo: null,
  tuning: null,
  tags: null,
  notes: null,
  content_data: { lyrics: 'x' },
  file_url: null,
  thumbnail_url: null,
  is_favorite: false,
  is_public: false,
  created_at: '2026-09-01T00:00:00.000+00:00',
  updated_at: '2026-09-01T00:00:00.000+00:00',
}

function delReq() {
  return new NextRequest(`http://localhost/api/content/${CONTENT_ID}`, {
    method: 'DELETE',
    headers: { authorization: 'Bearer token-de-teste' },
  })
}

describe("B6 PR-3c — DELETE content via rpc('delete_content_resequence') (D11, §2.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuthServer.mockResolvedValue(USER)
    mockGateSingle.mockResolvedValue({ data: { id: CONTENT_ID }, error: null })
    // caminho VELHO alimentado: delete direto devolvendo linha-marcador
    mockDelete.mockReturnValue({
      eq: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: { id: 'FROM-DELETE-DIRETO' }, error: null }) }) }) }),
    })
    mockRpc.mockResolvedValue({ data: [RPC_ROW], error: null })
  })

  it('(a) gate de posse EXPLÍCITO antes da rpc: PGRST116 → 404 byte-idêntico ao do GET, sem tocar rpc nem delete (hoje: posse embutida no delete direto)', async () => {
    mockGateSingle.mockResolvedValue(pgrst116)
    const res = await DELETE(delReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Content not found","code":"NOT_FOUND"}')
    expect(mockRpc).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('(b) miolo chama rpc delete_content_resequence {p_content_id} e NÃO deleta direto (hoje: .delete().eq().eq())', async () => {
    await DELETE(delReq())
    expect(mockRpc).toHaveBeenCalledExactlyOnceWith('delete_content_resequence', {
      p_content_id: CONTENT_ID,
    })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('(c) 200 ecoa {success, message, deletedContent: data[0]} — 22 chaves na ordem do dump, byte-compatível com o §0 (hoje: ecoa o delete direto)', async () => {
    const res = await DELETE(delReq())
    expect(res.status).toBe(200)
    expect(await res.clone().text()).toBe(JSON.stringify({
      success: true,
      message: 'Content deleted successfully',
      deletedContent: RPC_ROW,
    }))
  })

  it('(d1) rpc error OB604 → 404 byte-idêntico ao do gate (content sumiu no intervalo; hoje: 200)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB604', message: 'CONTENT_NOT_FOUND' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Content not found","code":"NOT_FOUND"}')
  })

  it('(d2) rpc error OB601 → 500 internalError (invariante interno; hoje: 200)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB601', message: 'ORDER_MISMATCH' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('(d3) rpc error com code desconhecido → 500 (hoje: 200)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'whatever' } })
    const res = await DELETE(delReq())
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('(e) SENTINELA (D6): error.message da rpc NUNCA navega ao envelope (nasce it — hoje não há rpc; declara o contrato do código novo)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { code: 'OB604', message: 'SENTINELA-b6-nao-navega-9f3c' } })
    const res = await DELETE(delReq())
    expect(await res.clone().text()).not.toContain('SENTINELA-b6-nao-navega-9f3c')
  })
})
