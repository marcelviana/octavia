import { describe, it, expect, vi } from 'vitest'

it('uploads file when Supabase configured', async () => {
  const upload = vi.fn().mockResolvedValue({ error: null })
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://bucket/test' } }))
  const from = vi.fn(() => ({ upload, getPublicUrl }))
  const client = { storage: { from } }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => client
  }))
  const { uploadFileToStorage } = await import('../storage-service')
  const res = await uploadFileToStorage(new Blob(['a']), 'test.pdf')
  expect(upload).toHaveBeenCalled()
  expect(res.url).toBe('https://bucket/test')
  vi.resetModules()
})
