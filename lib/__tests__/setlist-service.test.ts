import { it, expect, vi } from 'vitest'

it('creates a mock setlist when Supabase is not configured', async () => {
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: false,
    getSupabaseBrowserClient: vi.fn(),
  }))
  const { createSetlist } = await import('../setlist-service')
  const result = await createSetlist({ name: 'Demo' })
  expect(result.user_id).toBe('demo-user')
  expect(result.setlist_songs).toEqual([])
  vi.resetModules()
})

it('throws when Supabase is configured but user is missing', async () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    },
    from: vi.fn()
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient,
  }))
  const { createSetlist } = await import('../setlist-service')
  await expect(createSetlist({ name: 'Demo' })).rejects.toThrow('User not authenticated')
  vi.resetModules()
})
