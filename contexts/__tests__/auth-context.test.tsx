/**
 * @vitest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
globalThis.React = React

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
})

it('throws when useAuth is called outside provider', async () => {
  const mod = await import('../auth-context')
  expect(() => renderHook(() => mod.useAuth())).toThrow(
    'useAuth must be used within an AuthProvider'
  )
})

describe('AuthProvider', () => {
  it('initializes demo user when not configured', async () => {
    vi.doMock('@/lib/supabase', () => ({
      isSupabaseConfigured: false,
      getSupabaseBrowserClient: vi.fn(),
    }))
    const mod = await import('../auth-context')
    const wrapper = ({ children }: any) => <mod.AuthProvider>{children}</mod.AuthProvider>
    const { result } = renderHook(() => mod.useAuth(), { wrapper })
    await waitFor(() => result.current.isInitialized)
    expect(result.current.isConfigured).toBe(false)
    expect(result.current.user?.email).toBe('demo@musicsheet.pro')
    let res: any
    await act(async () => {
      res = await result.current.signIn('a', 'b')
    })
    expect(res.error.message).toMatch(/Demo mode/)
  })

  it('initializes with no session when configured', async () => {
    const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null })
    const onAuthStateChange = vi.fn().mockImplementation((callback) => {
      // Call the callback immediately to simulate auth state change
      Promise.resolve().then(() => {
        callback('INITIAL_SESSION', null)
      })
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    const mockClient = { auth: { getSession, onAuthStateChange }, from }
    const getSessionSafe = vi.fn().mockResolvedValue(null)
    
    vi.doMock('@/lib/supabase', () => ({
      isSupabaseConfigured: true,
      getSupabaseBrowserClient: () => mockClient,
      getSessionSafe,
    }))
    
    const mod = await import('../auth-context')
    const wrapper = ({ children }: any) => <mod.AuthProvider>{children}</mod.AuthProvider>
    const { result } = renderHook(() => mod.useAuth(), { wrapper })
    
    await waitFor(() => result.current.isInitialized, { timeout: 5000 })
    
    // Wait for getSession to be called (it's called via getSessionSafe)
    await waitFor(() => expect(getSessionSafe).toHaveBeenCalled(), { timeout: 5000 })
    
    expect(result.current.isConfigured).toBe(true)
    expect(result.current.user).toBe(null)
  })
})
