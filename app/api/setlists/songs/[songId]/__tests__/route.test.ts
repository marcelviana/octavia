/**
 * B3 PR-3a — gates de SEMÂNTICA das rotas de songs (D2 + PGRST116→404).
 * Primeiro arquivo de teste destas rotas (o antigo, 9 it.skip, morreu no
 * B2/PR-5). Nascem como it.fails contra o código ATUAL (controle negativo
 * codificado, técnica do PR-1); o commit de migração remove os .fails.
 *
 * Controles negativos (literais MEDIDOS no B3-PRECHECK §2.5/§2.1):
 *  - PUT cross-user:    403 {"error":"Unauthorized"}
 *  - DELETE cross-user: 500 (throw new Error('Unauthorized…'))
 *  - songId inexistente (PGRST116): 500 nas duas rotas (ramos 404 mortos)
 *  - 401: {"error":"Unauthorized"} sem code, sem WWW-Authenticate
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

import { PUT, DELETE } from '../route'

const SONG_ID = '11111111-1111-4111-8111-111111111111'
const SETLIST_ID = '22222222-2222-4222-8222-222222222222'
const USER = { uid: 'uid-do-usuario-autenticado', email: 'b3@test.local' }

function wireChain() {
  mockFrom.mockReturnValue({ select: mockSelect, delete: vi.fn(), update: vi.fn() })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle, eq: mockEq, order: vi.fn(), gt: vi.fn() })
}

function putRequest(body: unknown = { setlistId: SETLIST_ID, newPosition: 2 }) {
  return new NextRequest(`http://localhost/api/setlists/songs/${SONG_ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
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

  it.fails('G-D2 PUT: song de OUTRO usuário → 404 NOT_FOUND (hoje: 403 vazando existência)', async () => {
    mockSingle.mockResolvedValue({ data: songDeOutroUsuario, error: null })
    const response = await PUT(putRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it.fails('G-D2 DELETE: song de OUTRO usuário → 404 NOT_FOUND (hoje: throw → 500)', async () => {
    mockSingle.mockResolvedValue({ data: songDeOutroUsuario, error: null })
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it.fails('G-PGRST116 PUT: songId inexistente → 404 (hoje: throw → 500; ramo 404 morto)', async () => {
    mockSingle.mockResolvedValue(pgrst116)
    const response = await PUT(putRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it.fails('G-PGRST116 DELETE: songId inexistente → 404 (hoje: throw → 500)', async () => {
    mockSingle.mockResolvedValue(pgrst116)
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(404)
    expect(await response.clone().text()).toBe('{"error":"Song not found","code":"NOT_FOUND"}')
  })

  it.fails('SEM ORÁCULO: corpo do 404 cross-user é BYTE-IDÊNTICO ao do 404 inexistente (a prova do D2)', async () => {
    mockSingle.mockResolvedValueOnce({ data: songDeOutroUsuario, error: null })
    const crossUser = await (await PUT(putRequest())).text()
    mockSingle.mockResolvedValueOnce(pgrst116)
    const inexistente = await (await PUT(putRequest())).text()
    expect(crossUser).toBe(inexistente)
  })

  it.fails('401 PUT: envelope authRequired (hoje: {"error":"Unauthorized"} sem code)', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(null)
    const response = await PUT(putRequest())
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it.fails('401 DELETE: envelope authRequired (hoje: {"error":"Unauthorized"} sem code)', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(null)
    const response = await DELETE(deleteRequest())
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })
})
