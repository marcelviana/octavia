import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * B5 PR-3 — contrato de GET /api/storage/list (B5-DESENHO.md §5.1).
 * Mesmo padrão de mocks do upload.test.ts. Controle negativo da rota
 * (contra prod SEM ela → 404 HTML do Next) roda na validação em preview,
 * registrado no ciclo da PR.
 */

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(),
}))

vi.mock('@/lib/secure-auth-utils', () => ({
  requireAuthServerSecure: vi.fn(async () => ({ uid: 'test-user-b5', email: 'b5@test.local' })),
}))

vi.mock('@/lib/user-rate-limit', async () => {
  const actual = await vi.importActual('@/lib/user-rate-limit')
  return {
    ...(actual as object),
    enforceUserLimit: vi.fn(() => null),
  }
})

vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const makeList = async (query = '', storageMock?: unknown) => {
  const { getSupabaseServiceClient } = await import('@/lib/supabase-service')
  if (storageMock) {
    vi.mocked(getSupabaseServiceClient).mockReturnValue(storageMock as never)
  }
  const { GET } = await import('../list/route')
  const request = new NextRequest(`http://localhost/api/storage/list${query}`)
  return GET(request)
}

const storageComLista = (data: unknown, error: unknown = null) => ({
  storage: { from: () => ({ list: vi.fn(async () => ({ data, error })) }) },
})

describe('B5 PR-3 — contrato de GET /api/storage/list', () => {
  it('401 sem credencial: envelope AUTH_REQUIRED + WWW-Authenticate', async () => {
    const { requireAuthServerSecure } = await import('@/lib/secure-auth-utils')
    vi.mocked(requireAuthServerSecure).mockResolvedValueOnce(null as never)
    const response = await makeList()
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it('400 limit inválido: field:"limit"', async () => {
    const response = await makeList('?limit=abc')
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: Array<{ field: string }> }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details?.map((d) => d.field)).toEqual(['limit'])
  })

  it('400 offset negativo: field:"offset"', async () => {
    const response = await makeList('?offset=-1')
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: Array<{ field: string }> }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details?.map((d) => d.field)).toEqual(['offset'])
  })

  it('200: shape {objects,count}; pastas (id null) fora; query desconhecida ignorada (decisão B2)', async () => {
    const response = await makeList('?limit=10&utm_source=teste', storageComLista([
      {
        id: 'uuid-1',
        name: '1750165612008-Easy - Guitar.pdf',
        created_at: '2025-06-17T13:06:52.690Z',
        updated_at: '2025-11-11T22:11:46.637Z',
        metadata: { size: 138916, mimetype: 'application/pdf' },
      },
      { id: null, name: 'pasta-virtual', created_at: null, updated_at: null, metadata: null },
    ]))
    expect(response.status).toBe(200)
    const data = (await response.json()) as { objects: unknown[]; count: number }
    expect(data).toEqual({
      objects: [
        {
          path: '1750165612008-Easy - Guitar.pdf',
          size: 138916,
          contentType: 'application/pdf',
          createdAt: '2025-06-17T13:06:52.690Z',
          updatedAt: '2025-11-11T22:11:46.637Z',
        },
      ],
      count: 1,
    })
  })

  it('G1-list: error.message do Supabase NÃO vaza (regra de sentinela)', async () => {
    const response = await makeList('', storageComLista(null, { message: 'SENTINELA-list-supabase' }))
    expect(response.status).toBe(500)
    const raw = await response.clone().text()
    expect(raw).not.toContain('SENTINELA-list-supabase')
    expect(raw).toBe('{"error":"Failed to list storage objects","code":"INTERNAL_ERROR"}')
  })
})
