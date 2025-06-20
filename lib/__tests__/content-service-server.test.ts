import { it, expect, vi, describe } from 'vitest'


describe('getUserContentServer', () => {
  it('delegates to getUserContent when not configured', async () => {
    const getUserContent = vi.fn().mockResolvedValue(['demo'])
    vi.doMock('../supabase', () => ({ isSupabaseConfigured: false }))
    vi.doMock('../content-service', () => ({
      getUserContent,
      getContentById: vi.fn(),
      getUserStats: vi.fn(),
      getUserContentPage: vi.fn(),
    }))
    const { getUserContentServer } = await import('../content-service-server')
    const res = await getUserContentServer()
    expect(getUserContent).toHaveBeenCalled()
    expect(res).toEqual(['demo'])
    vi.resetModules()
    vi.doUnmock('../content-service')
    vi.doUnmock('../supabase')
  })

  it('returns empty array when user not authenticated', async () => {
    vi.doUnmock('../content-service')
    const mockClient = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    }
    vi.doMock('../supabase', () => ({ isSupabaseConfigured: true }))
    vi.doMock('../supabase-server', () => ({ getSupabaseServerClient: () => mockClient }))
    const { getUserContentServer } = await import('../content-service-server')
    const res = await getUserContentServer()
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
    await expect(getContentByIdServer('1')).rejects.toThrow('User not authenticated')
    vi.resetModules()
  })
})

describe('getSetlistByIdServer', () => {
  it('delegates to getSetlistById in demo mode', async () => {
    const getSetlistById = vi.fn().mockResolvedValue({ id: 'mock' })
    vi.doMock('../supabase', () => ({ isSupabaseConfigured: false }))
    vi.doMock('../setlist-service', () => ({ getSetlistById }))
    const { getSetlistByIdServer } = await import('../content-service-server')
    const res = await getSetlistByIdServer('mock')
    expect(getSetlistById).toHaveBeenCalledWith('mock')
    expect(res).toEqual({ id: 'mock' })
    vi.resetModules()
    vi.doUnmock('../supabase')
    vi.doUnmock('../setlist-service')
  })
})
