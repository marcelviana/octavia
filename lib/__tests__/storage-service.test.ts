import { describe, it, expect, vi } from 'vitest'

it('uploads file when Supabase configured', async () => {
  const upload = vi.fn().mockResolvedValue({ error: null })
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://bucket/test' } }))
  const from = vi.fn(() => ({ upload, getPublicUrl }))
  const client = {
    storage: { from }
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => client
  }))
  vi.doMock('../supabase-service', () => ({
    isSupabaseServiceConfigured: true
  }))
  vi.doMock('../firebase', () => ({
    auth: {
      currentUser: {
        uid: 'user1',
        email: 'test@example.com',
        getIdToken: vi.fn().mockResolvedValue('token')
      }
    },
    isFirebaseConfigured: true
  }))
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: 'https://bucket/test', path: 'test' })
  })
  const { uploadFileToStorage } = await import('../storage-service')
  const res = await uploadFileToStorage(new Blob(['a']), 'test.pdf')
  expect(fetch).toHaveBeenCalledWith('/api/storage/upload', expect.any(Object))
  expect(res.url).toBe('https://bucket/test')
  vi.restoreAllMocks()
  vi.resetModules()
})
