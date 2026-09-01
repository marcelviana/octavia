/**
 * B3 PR-3a — gates de SEMÂNTICA da rota de songs (D2 + PGRST116→404).
 *
 * B6 PR-3b (§1.5 do desenho): o move-one (PUT) foi REMOVIDO — os 4
 * testes de PUT deste arquivo migraram para o contrato novo em
 * app/api/setlists/[id]/songs/order/__tests__/route.test.ts (404
 * alheia/inexistente, 401, byte-identidade; "songId inexistente" virou
 * ID inexistente DENTRO de order → 400 mismatch). Ficam os 3 de DELETE
 * (contrato externo intacto; o miolo virou rpc — cobertura da rpc em
 * route-rpc.test.ts) e a byte-identidade, readaptada ao DELETE.
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

import { DELETE } from '../route'

const SONG_ID = '11111111-1111-4111-8111-111111111111'
const SETLIST_ID = '22222222-2222-4222-8222-222222222222'
const USER = { uid: 'uid-do-usuario-autenticado', email: 'b3@test.local' }

function wireChain() {
  mockFrom.mockReturnValue({ select: mockSelect, delete: vi.fn(), update: vi.fn() })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, order: vi.fn(), gt: vi.fn() })
}


function deleteRequest() {
  return new NextRequest(`http://localhost/api/setlists/songs/${SONG_ID}`, {
    method: 'DELETE',
  })
}

const songDeOutroUsuario = {
  id: SONG_ID,
  position: 1,
  setlist_id: SETLIST_ID,
  setlists: { id: SETLIST_ID, user_id: 'OUTRO-usuario' },
}

const pgrst116 = { data: null, error: { code: 'PGRST116', message: 'No rows found' } }

describe('B3 contrato — /api/setlists/songs/[songId] (PR-3a, semântica)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    wireChain()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
  })

  it('G-D2 DELETE: song de OUTRO usuário → 404 NOT_FOUND (hoje: throw → 500)', async () => {
    mockSingle.mockResolvedValue({ data: songDeOutroUsuario, error: null })
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it('G-PGRST116 DELETE: songId inexistente → 404 (hoje: throw → 500)', async () => {
    mockSingle.mockResolvedValue(pgrst116)
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it('SEM ORÁCULO: corpo do 404 cross-user é BYTE-IDÊNTICO ao do 404 inexistente (a prova do D2; readaptado ao DELETE na B6 PR-3b)', async () => {
    mockSingle.mockResolvedValueOnce({ data: songDeOutroUsuario, error: null })
    const crossUser = await (await DELETE(deleteRequest())).text()
    mockSingle.mockResolvedValueOnce(pgrst116)
    const inexistente = await (await DELETE(deleteRequest())).text()
    expect(crossUser).toBe(inexistente)
  })

  it('401 DELETE: envelope authRequired (hoje: {"error":"Unauthorized"} sem code)', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(null)
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })
})
