import { describe, it, expect, beforeEach, vi } from 'vitest'

// In-memory stand-in for localforage (IndexedDB)
const store = new Map<string, any>()
vi.mock('localforage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: any) => {
      store.set(key, value)
      return value
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key)
    }),
  },
}))

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
}))

import {
  saveSetlists,
  replaceSetlists,
  getCachedSetlists,
  removeCachedSetlist,
} from '../offline-setlist-cache'

const KEY = 'octavia-offline-setlists-user-1'

describe('offline-setlist-cache', () => {
  beforeEach(() => {
    store.clear()
  })

  it('saveSetlists merges with existing items (per-mutation writes)', async () => {
    store.set(KEY, [
      { id: 'a', name: 'Old A' },
      { id: 'b', name: 'B' },
    ])

    await saveSetlists([{ id: 'a', name: 'New A' }])

    const cached = await getCachedSetlists()
    expect(cached).toHaveLength(2)
    expect(cached.find((s: any) => s.id === 'a')?.name).toBe('New A')
    expect(cached.find((s: any) => s.id === 'b')?.name).toBe('B')
  })

  it('replaceSetlists overwrites the whole store (server list is the truth)', async () => {
    // 'b' foi deletada em outro dispositivo: um merge a ressuscitaria
    store.set(KEY, [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'Deleted elsewhere' },
    ])

    await replaceSetlists([{ id: 'a', name: 'A' }])

    const cached = await getCachedSetlists()
    expect(cached).toEqual([{ id: 'a', name: 'A' }])
  })

  it('replaceSetlists with an empty server list empties the cache', async () => {
    store.set(KEY, [{ id: 'a', name: 'A' }])

    await replaceSetlists([])

    expect(await getCachedSetlists()).toEqual([])
  })

  it('keys the store by the live user id', async () => {
    await replaceSetlists([{ id: 'a', name: 'A' }])

    expect(store.has(KEY)).toBe(true)
    expect([...store.keys()]).toEqual([KEY])
  })

  it('removeCachedSetlist filters a single id out', async () => {
    store.set(KEY, [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ])

    await removeCachedSetlist('a')

    expect(await getCachedSetlists()).toEqual([{ id: 'b', name: 'B' }])
  })
})
