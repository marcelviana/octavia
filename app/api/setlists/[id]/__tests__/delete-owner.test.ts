import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Hotfix das divs. 150/151 (N2-D6) — DELETE /api/setlists/[id] sem gate
// de dono. Controles negativos escritos ANTES do fix (regra 4): contra o
// código antigo reprovam (200 + delete de setlist_songs alheia).

vi.mock('@/lib/logger', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(),
}))

import { DELETE } from '../route'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { createAPIMockData } from '@/lib/test-utils/api-test-helpers'

const mockGetSupabaseServiceClient = vi.mocked(getSupabaseServiceClient)
const { factory, mockUser, mockSetlists, mockSetlistSongs, TEST_IDS, supabaseMock } =
  createAPIMockData()

// A é dono da SETLIST_1 (mockUser); B é outro usuário logado
const USER_B = { uid: 'user-b-456' }
const MISSING_ID = '00000000-0000-4000-8000-000000000000'

const del = (id: string) =>
  DELETE(new NextRequest(`http://localhost:3000/api/setlists/${id}`, { method: 'DELETE' }))

const touchedSetlistSongs = () =>
  supabaseMock.from.mock.calls.filter(([table]) => table === 'setlist_songs').length

describe('DELETE /api/setlists/[id] — gate de dono (divs. 150/151)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSupabaseServiceClient.mockReturnValue(supabaseMock as unknown as SupabaseClient<Database>)
    factory.clear()
    factory
      .setMockData('setlists', mockSetlists)
      .setMockData('setlist_songs', mockSetlistSongs)
  })

  it('CN-150: B apaga setlist de A → 404 NOT_FOUND e zero toques em setlist_songs', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(USER_B)

    const response = await del(TEST_IDS.SETLIST_1)

    // soft: o controle negativo mostra as DUAS falhas de uma vez
    expect.soft(touchedSetlistSongs()).toBe(0)
    expect.soft(response.status).toBe(404)
    expect.soft(await response.json()).toEqual({ error: 'Setlist not found', code: 'NOT_FOUND' })
  })

  it('CN-151: uuid inexistente → 404 byte-idêntico ao do CN-150 (sem oráculo)', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(USER_B)
    const alheia = await del(TEST_IDS.SETLIST_1)

    mockRequireAuthServerSecure.mockResolvedValue(mockUser)
    const inexistente = await del(MISSING_ID)

    expect(inexistente.status).toBe(404)
    expect(inexistente.status).toBe(alheia.status)
    expect(await inexistente.text()).toBe(await alheia.text())
  })

  it('setlist própria → 200 {success:true} (comportamento inalterado)', async () => {
    mockRequireAuthServerSecure.mockResolvedValue(mockUser)

    const response = await del(TEST_IDS.SETLIST_1)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })
})
