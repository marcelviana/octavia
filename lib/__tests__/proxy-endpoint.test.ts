import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('proxy endpoint', () => {
  it('returns 500 when NEXT_PUBLIC_SUPABASE_URL missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const { GET } = await import('../../app/api/proxy/route')
    const req = new NextRequest('https://site.test/api/proxy?url=' + encodeURIComponent('https://demo.supabase.co/file'))
    const res = await GET(req as any)
    expect(res.status).toBe(500)
  })

  it('rejects url not on whitelist', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.ALLOWED_PROXY_HOSTS = 'demo.supabase.co'

    vi.doMock('../supabase-server', () => ({
      getSupabaseServerClient: async () => ({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
        }
      })
    }))

    const { GET } = await import('../../app/api/proxy/route')
    const req = new NextRequest('https://site.test/api/proxy?url=' + encodeURIComponent('https://evil.com/file.txt'))
    const res = await GET(req as any)
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated user', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.ALLOWED_PROXY_HOSTS = 'demo.supabase.co'

    vi.doMock('../supabase-server', () => ({
      getSupabaseServerClient: async () => ({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
        }
      })
    }))

    const { GET } = await import('../../app/api/proxy/route')
    const allowedUrl = 'https://demo.supabase.co/storage/v1/object'
    const req = new NextRequest('https://site.test/api/proxy?url=' + encodeURIComponent(allowedUrl))
    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('proxies allowed url when authenticated', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.ALLOWED_PROXY_HOSTS = 'demo.supabase.co'

    vi.doMock('../supabase-server', () => ({
      getSupabaseServerClient: async () => ({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
        }
      })
    }))

    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 })) as any

    const { GET } = await import('../../app/api/proxy/route')
    const allowedUrl = 'https://demo.supabase.co/storage/v1/object/file.txt'
    const req = new NextRequest('https://site.test/api/proxy?url=' + encodeURIComponent(allowedUrl))
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect((global.fetch as any).mock.calls[0][0]).toBe(allowedUrl)
  })

  it('strips disallowed response headers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.ALLOWED_PROXY_HOSTS = 'demo.supabase.co'

    vi.doMock('../supabase-server', () => ({
      getSupabaseServerClient: async () => ({
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
        }
      })
    }))

    const upstreamHeaders = new Headers({ 'set-cookie': 'a=b', 'x-test': '1' })
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200, headers: upstreamHeaders })) as any

    const { GET } = await import('../../app/api/proxy/route')
    const allowedUrl = 'https://demo.supabase.co/storage/v1/object/file.txt'
    const req = new NextRequest('https://site.test/api/proxy?url=' + encodeURIComponent(allowedUrl))
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(res.headers.get('x-test')).toBe('1')
  })
})
