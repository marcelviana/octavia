import { describe, it, expect, vi } from 'vitest'

describe('setlist-service demo mode', () => {
  const demoMock = {
    isSupabaseConfigured: false,
    getSupabaseBrowserClient: vi.fn()
  }

  it('getUserSetlists returns mock data', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { getUserSetlists } = await import('../setlist-service')
    const lists = await getUserSetlists()
    expect(Array.isArray(lists)).toBe(true)
    expect(lists[0].id).toMatch(/^mock-setlist/)
    vi.resetModules()
  })

  it('getSetlistById falls back to first item when id missing', async () => {
    vi.doMock('../supabase', () => demoMock)
    const { getSetlistById } = await import('../setlist-service')
    const list = await getSetlistById('unknown')
    expect(list.id).toBe('mock-setlist-1')
    vi.resetModules()
  })
})
