import { it, expect, vi, describe } from 'vitest'


describe('getUserContentServer', () => {

  it('returns empty array when user not authenticated', async () => {
    vi.doUnmock('../content-service')
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    }
    vi.doMock('../supabase', () => ({ isSupabaseConfigured: true }))
    vi.doMock('../supabase-server', () => ({ getSupabaseServerClient: () => mockClient }))
    const { getUserContentServer } = await import('../content-service-server')
    const mockCookies = { get: vi.fn() } as any
    const res = await getUserContentServer(mockCookies)
    expect(res).toEqual([])
    vi.resetModules()
    vi.doUnmock('../supabase')
    vi.doUnmock('../supabase-server')
  })
})

describe('getContentByIdServer', () => {
  it('throws when user not authenticated', async () => {
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    }
    vi.doMock('../supabase', () => ({ isSupabaseConfigured: true }))
    vi.doMock('../supabase-server', () => ({ getSupabaseServerClient: () => mockClient }))
    const { getContentByIdServer } = await import('../content-service-server')
    const mockCookies = { get: vi.fn() } as any
    await expect(getContentByIdServer('1', mockCookies)).rejects.toThrow('User not authenticated')
    vi.resetModules()
  })
})

