/**
 * B3 PR-4 — proxy envelopado (D5 + decisão A + nota do aval do PR-0).
 * Primeiro arquivo de teste da rota. Gates nascem como it.fails contra o
 * código ATUAL (respostas em text/plain — literais do B3-PRECHECK
 * §2.1/2.3); o commit da migração remove os .fails.
 *
 * Decisão A (normalização do upstream): 404 do upstream → nosso 404
 * NOT_FOUND; QUALQUER outra falha upstream → 500 INTERNAL_ERROR. Nenhum
 * status de dependência atravessa cru (hoje: pass-through).
 * Nota do aval do PR-0: o 400 carrega details (field:"url").
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { mockRequireAuthServerSecure } from '@/src/test-setup'

vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }))
vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { GET } from '../route'

const USER = { uid: 'uid-proxy-b3', email: 'b3@test.local' }
const SUPA = 'https://mlx-teste.supabase.co'

function req(url?: string) {
  const q = url === undefined ? '' : `?url=${encodeURIComponent(url)}`
  return new NextRequest(`http://localhost/api/proxy${q}`)
}

describe('B3 contrato — /api/proxy (PR-4)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPA)
    // o test-setup global fixa ALLOWED_PROXY_HOSTS='localhost,127.0.0.1';
    // os probes deste arquivo miram o host do SUPA
    vi.stubEnv('ALLOWED_PROXY_HOSTS', 'mlx-teste.supabase.co')
    vi.unstubAllGlobals()
    mockRequireAuthServerSecure.mockResolvedValue(USER)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('401 sem credencial: envelope authRequired (hoje: texto "Authentication required")', async () => {
    mockRequireAuthServerSecure.mockResolvedValueOnce(null)
    const res = await GET(req(`${SUPA}/storage/x.pdf`))
    expect(res.status).toBe(401)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await res.clone().text()).toBe('{"error":"Authentication required","code":"AUTH_REQUIRED"}')
  })

  it('400 url ausente: VALIDATION_ERROR com details field:"url" (hoje: texto "Missing url")', async () => {
    const res = await GET(req())
    expect(res.status).toBe(400)
    const body = await res.clone().json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.details).toEqual([
      { field: 'url', message: 'Missing url', code: 'invalid_type' },
    ])
  })

  it('400 host fora da allowlist: details field:"url" (hoje: texto "URL not allowed…")', async () => {
    const res = await GET(req('https://evil.example.com/x.pdf'))
    expect(res.status).toBe(400)
    const body = await res.clone().json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.details).toEqual([
      { field: 'url', message: 'URL not allowed. Configure ALLOWED_PROXY_HOSTS.', code: 'invalid_string' },
    ])
  })

  it('decisão A: upstream 404 → NOSSO 404 NOT_FOUND (hoje: texto "Fetch failed" com status cru)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not here', { status: 404 })))
    const res = await GET(req(`${SUPA}/storage/sumiu.pdf`))
    expect(res.status).toBe(404)
    expect(await res.clone().text()).toBe('{"error":"Resource not found","code":"NOT_FOUND"}')
  })

  it('decisão A: upstream 503 → NOSSO 500 (hoje: 503 cru atravessa)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('down', { status: 503 })))
    const res = await GET(req(`${SUPA}/storage/x.pdf`))
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  it('500 misconfiguração: envelope (hoje: texto "Server misconfiguration")', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const res = await GET(req(`${SUPA}/x.pdf`))
    expect(res.status).toBe(500)
    expect(await res.clone().text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })
})
