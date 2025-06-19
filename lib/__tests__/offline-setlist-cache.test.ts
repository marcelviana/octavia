import { describe, it, expect, beforeEach } from 'vitest'
import * as cache from '../offline-setlist-cache'

beforeEach(() => {
  localStorage.clear()
})

describe('offline setlist cache', () => {
  it('returns empty array when no cache', async () => {
    const data = await cache.getCachedSetlists()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(0)
  })

  it('saves and merges setlists', async () => {
    await cache.saveSetlists([{ id: 1, name: 'A' }])
    await cache.saveSetlists([{ id: 2, name: 'B' }])
    const data = await cache.getCachedSetlists()
    expect(data).toHaveLength(2)
  })
})
