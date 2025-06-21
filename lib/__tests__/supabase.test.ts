import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.resetModules()
})

describe('supabase utils', () => {
  it('isSupabaseConfigured false when env vars missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
    const mod = await import('../supabase')
    expect(mod.isSupabaseConfigured).toBe(false)
  })

  it('isSupabaseConfigured true with valid env', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(21)
    const mod = await import('../supabase')
    expect(mod.isSupabaseConfigured).toBe(true)
  })


  it('testSupabaseConnection returns false when not configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''
    const mod = await import('../supabase')
    expect(await mod.testSupabaseConnection()).toBe(false)
  })

  it('testSupabaseConnection true when configured and query succeeds', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a'.repeat(21)
    vi.doMock('@supabase/ssr', () => ({
      createBrowserClient: () => ({
        from: () => ({
          select: () => ({ limit: () => Promise.resolve({ error: null }) })
        })
      })
    }))
    const mod = await import('../supabase')
    expect(await mod.testSupabaseConnection()).toBe(true)
    vi.resetModules()
  })
})
