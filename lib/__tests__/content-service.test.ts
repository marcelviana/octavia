import { describe, it, expect, vi } from 'vitest'

it('returns mock content when Supabase is not configured', async () => {
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: false,
    getSupabaseBrowserClient: vi.fn(),
  }))
  const { getUserContent } = await import('../content-service')
  const result = await getUserContent()
  expect(Array.isArray(result)).toBe(true)
  expect(result.length).toBeGreaterThan(0)
  expect(result[0].id).toBe('mock-1')
  vi.resetModules()
})

it('returns empty array when user not authenticated', async () => {
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
  const { getUserContent } = await import('../content-service')
  const data = await getUserContent()
  expect(data).toEqual([])
  vi.resetModules()
})
