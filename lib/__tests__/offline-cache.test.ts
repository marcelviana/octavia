import { describe, it, expect, beforeEach } from 'vitest'
import * as cache from '../offline-cache'

beforeEach(() => {
  localStorage.clear()
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
})
