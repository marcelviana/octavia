import { describe, it, expect, vi } from 'vitest'

const demoMock = {
  isSupabaseConfigured: false,
  getSupabaseBrowserClient: vi.fn()
}

describe('content-service demo mode', () => {
  it('createContent returns mock item', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { createContent } = await import('../content-service')
    const item = await createContent({ title: 'Test', artist: 'Me', content_type: 'Lyrics' } as any)
    expect(item.id).toMatch(/^mock-/)
    expect(item.user_id).toBe('demo-user')
    vi.resetModules()
  })

  it('updateContent updates mock item', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { updateContent } = await import('../content-service')
    const updated = await updateContent('mock-1', { title: 'New' } as any)
    expect(updated.title).toBe('New')
    vi.resetModules()
  })

  it('deleteContent resolves to true in demo mode', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { deleteContent } = await import('../content-service')
    const res = await deleteContent('mock-1')
    expect(res).toBe(true)
    vi.resetModules()
  })

  it('getUserStats returns mocked counts', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { getUserStats } = await import('../content-service')
    const stats = await getUserStats()
    expect(stats.totalContent).toBeGreaterThan(0)
    expect(stats.favoriteContent).toBeGreaterThan(0)
    vi.resetModules()
  })
})

describe('content-service when configured but user missing', () => {
  const mockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn()
  }

  const configuredMock = {
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient
  }

  it('updateContent throws when user not authenticated', async () => {
    vi.doMock('../supabase', () => configuredMock)
    const { updateContent } = await import('../content-service')
    await expect(updateContent('1', { title: 'A' } as any)).rejects.toThrow('User not authenticated')
    vi.resetModules()
  })

  it('getUserStats returns zeros when user not authenticated', async () => {
    vi.doMock('../supabase', () => configuredMock)
    const { getUserStats } = await import('../content-service')
    const stats = await getUserStats()
    expect(stats.totalContent).toBe(0)
    expect(stats.favoriteContent).toBe(0)
    vi.resetModules()
  })
})
