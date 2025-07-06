import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  process.env = { ...originalEnv }
  vi.resetModules()
})

describe('supabase service utils', () => {
  it('isSupabaseServiceConfigured false when service role env vars missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    const mod = await import('../supabase-service')
    expect(mod.isSupabaseServiceConfigured).toBe(false)
  })

  it('isSupabaseServiceConfigured true with valid service role env', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(50)
    const mod = await import('../supabase-service')
    expect(mod.isSupabaseServiceConfigured).toBe(true)
  })

  it('getSupabaseServiceClient throws error when not configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    const mod = await import('../supabase-service')
    expect(() => mod.getSupabaseServiceClient()).toThrow('Supabase service role key not configured')
  })

  it('getSupabaseServiceClient returns client when configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(50)
    
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({
        from: () => ({
          select: () => ({ limit: () => Promise.resolve({ error: null }) })
        })
      }))
    }))
    
    const mod = await import('../supabase-service')
    const client = mod.getSupabaseServiceClient()
    expect(client).toBeDefined()
    vi.resetModules()
  })

  it('testSupabaseServiceConnection returns false when not configured', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.SUPABASE_SERVICE_ROLE_KEY = ''
    const mod = await import('../supabase-service')
    expect(await mod.testSupabaseServiceConnection()).toBe(false)
  })

  it('testSupabaseServiceConnection true when configured and query succeeds', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a'.repeat(50)
    
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: vi.fn(() => ({
        from: () => ({
          select: () => ({ limit: () => Promise.resolve({ error: null }) })
        })
      }))
    }))
    
    const mod = await import('../supabase-service')
    expect(await mod.testSupabaseServiceConnection()).toBe(true)
    vi.resetModules()
  })
})
