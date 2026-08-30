import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Very simple mocks to verify basic functionality
vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn()
}))

vi.mock('@/lib/firebase-server-utils', () => ({
  validateFirebaseTokenServer: vi.fn()
}))

vi.mock('@/lib/user-rate-limit', async () => {
  const actual = await vi.importActual('@/lib/user-rate-limit')
  return {
    ...(actual as object),
    // B1.3: limites neutralizados nos testes de rota (o contrato do
    // limiter tem suite propria em lib/__tests__/user-rate-limit.test.ts)
    enforceUserLimit: vi.fn(() => null),
    checkRateLimit: vi.fn(() => ({ ok: true, scope: 'user', limit: 999, remaining: 999, resetTime: Date.now() + 60000 })),
    authFailureLimited: vi.fn(() => false),
    recordAuthFailure: vi.fn(),
    getAuthFailureLimit: vi.fn(() => null)
  }
})

vi.mock('@/lib/logger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

describe('/api/storage/upload', () => {
  it('should export a POST handler', async () => {
    const { POST } = await import('../upload/route')
    expect(POST).toBeDefined()
    expect(typeof POST).toBe('function')
  })

})
// B3 PR-2 — shapes do contrato em /api/storage/upload. it.fails contra o
// código atual (controle negativo codificado); a migração remove o .fails.
// Inclui o ACHADO do PR-2: upload/route.ts:102 interpola error.message do
// Supabase na resposta — segunda instância da classe D6 (o pre-check §2.9
// declarava o delete como ponto único; corrigido no relatório do PR-2).
vi.mock('@/lib/secure-auth-utils', () => ({
  requireAuthServerSecure: vi.fn(async () => ({ uid: 'test-user-b3', email: 'b3@test.local' })),
}))

describe('B3 contrato — /api/storage/upload (PR-2)', () => {
  const makeUpload = async (withFile = true, storageMock?: unknown) => {
    const { getSupabaseServiceClient } = await import('@/lib/supabase-service')
    if (storageMock) {
      vi.mocked(getSupabaseServiceClient).mockReturnValue(storageMock as never)
    }
    const { POST } = await import('../upload/route')
    const form = new FormData()
    if (withFile) {
      form.append('file', new File(['%PDF-1.4 b3'], 'b3.pdf', { type: 'application/pdf' }))
      form.append('filename', 'b3.pdf')
    }
    const request = new NextRequest('http://localhost/api/storage/upload', {
      method: 'POST',
      body: form,
    })
    return POST(request)
  }

  it('401 sem credencial: envelope authRequired (hoje: sem code, sem WWW-Authenticate)', async () => {
    const { requireAuthServerSecure } = await import('@/lib/secure-auth-utils')
    vi.mocked(requireAuthServerSecure).mockResolvedValueOnce(null)
    const response = await makeUpload()
    expect(response.status).toBe(401)
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await response.clone().text()).toBe(
      '{"error":"Authentication required","code":"AUTH_REQUIRED"}'
    )
  })

  it('400 sem arquivo: VALIDATION_ERROR com field:"file" (hoje: {"error":"No file provided"})', async () => {
    const response = await makeUpload(false)
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: unknown }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'file', message: 'No file provided', code: 'invalid_type' },
    ])
  })

  /**
   * B5 PR-2 — magic bytes (B5-DESENHO.md §4). Regra nº 7, it.fails→it:
   * nasce como `it.fails` contra a rota atual, que ACEITA texto declarado
   * image/png — é o probe P1 do pre-check (§3.3, 201 medido em prod)
   * codificado como controle negativo. Vira `it` no commit do flip.
   */
  it.fails('B5 PR-2: bytes de texto declarados image/png → 400 field:"file" (P1 do pre-check codificado)', async () => {
    const { getSupabaseServiceClient } = await import('@/lib/supabase-service')
    const mockUpload = vi.fn(async () => ({ data: { path: 'x' }, error: null }))
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      storage: {
        from: () => ({
          upload: mockUpload,
          getPublicUrl: () => ({ data: { publicUrl: 'https://x/y.png' } }),
        }),
      },
    } as never)
    const { POST } = await import('../upload/route')
    const form = new FormData()
    form.append('file', new File(['this is not a png'], 'b5-magic.png', { type: 'image/png' }))
    form.append('filename', 'b5-magic.png')
    const request = new NextRequest('http://localhost/api/storage/upload', { method: 'POST', body: form })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: unknown }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'file', message: 'File content does not match declared type (image/png)', code: 'custom' },
    ])
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('G1-upload: error.message do Supabase NÃO vaza (hoje: "Upload failed: <msg>")', async () => {
    const mockUpload = vi.fn(async () => ({
      data: null,
      error: { message: 'SENTINELA-upload-supabase' },
    }))
    const response = await makeUpload(true, {
      storage: { from: () => ({ upload: mockUpload, getPublicUrl: vi.fn() }) },
    })
    expect(response.status).toBe(500)
    const raw = await response.clone().text()
    expect(raw).not.toContain('SENTINELA-upload-supabase')
    expect(raw).toBe('{"error":"File upload failed","code":"INTERNAL_ERROR"}')
  })
})
