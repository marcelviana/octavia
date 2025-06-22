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

  it('removes cached content and files', async () => {
    await cache.saveContent([{ id: 1, title: 'A' }, { id: 2, title: 'B' }])
    const buffer = new TextEncoder().encode('bye')
    global.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => buffer,
      headers: { get: () => 'text/plain' }
    })) as any
    await cache.cacheFilesForContent([{ id: '1', file_url: 'https://x.test/b.txt' }])
    await cache.removeCachedContent('1')
    const data = await cache.getCachedContent()
    expect(data.some((d: any) => d.id === 1)).toBe(false)
    expect(data.some((d: any) => d.id === 2)).toBe(true)
    const url = await cache.getCachedFileUrl('1')
    expect(url).toBeNull()
  })

  it('skips caching when file exceeds quota', async () => {
    const big = new Uint8Array(50 * 1024 * 1024 + 1)
    global.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer: async () => big,
      headers: { get: () => 'application/pdf' }
    })) as any
    await cache.cacheFilesForContent([
      { id: 'big', file_url: 'https://x.test/big.pdf' }
    ])
    const url = await cache.getCachedFileUrl('big')
    expect(url).toBeNull()
  })

  it('checks Content-Length before downloading large file', async () => {
    const arrayBuffer = vi.fn(async () => new Uint8Array())
    const cancel = vi.fn()
    global.fetch = vi.fn(async () => ({
      ok: true,
      arrayBuffer,
      headers: { get: (name: string) => name === 'Content-Length' ? String(50 * 1024 * 1024 + 1) : 'application/pdf' },
      body: { cancel }
    })) as any
    await cache.cacheFilesForContent([
      { id: 'huge', file_url: 'https://x.test/huge.pdf' }
    ])
    expect(arrayBuffer).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalled()
    const url = await cache.getCachedFileUrl('huge')
    expect(url).toBeNull()
  })
})
