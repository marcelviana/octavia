import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as cache from '../offline-cache'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('offline cache', () => {
  it('returns empty array when no cache', async () => {
    const data = await cache.getCachedContent()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(0)
  })

  it('saves and merges content', async () => {
    await cache.saveContent([{ id: 1, title: 'A' }])
    await cache.saveContent([{ id: 2, title: 'B' }])
    const data = await cache.getCachedContent()
    expect(data).toHaveLength(2)
  })

  it('caches file blobs and returns url', async () => {
    const buffer = new TextEncoder().encode('hello')
    global.fetch = vi.fn(async (input: RequestInfo) => ({
      ok: true,
      arrayBuffer: async () => buffer,
      headers: { get: () => 'text/plain' }
    })) as any
    await cache.cacheFilesForContent([{ id: '1', file_url: 'https://x.test/a.txt' }])
    expect((global.fetch as any).mock.calls[0][0]).toBe('/api/proxy?url=' + encodeURIComponent('https://x.test/a.txt'))
    const url = await cache.getCachedFileUrl('1')
    expect(typeof url).toBe('string')
    expect(url!.startsWith('blob:') || url!.startsWith('data:')).toBe(true)
  })
})
