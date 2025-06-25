import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSetlistData } from '../use-setlist-data'

vi.mock('@/lib/setlist-service', () => ({
  getUserSetlists: vi.fn(() => Promise.resolve([{ id: '1' }]))
}))

vi.mock('@/lib/content-service', () => ({
  getUserContent: vi.fn(() => Promise.resolve([{ id: 'c1' }]))
}))

vi.mock('@/lib/offline-setlist-cache', () => ({
  saveSetlists: vi.fn(),
  getCachedSetlists: vi.fn(() => Promise.resolve([]))
}))

vi.mock('@/lib/offline-cache', () => ({
  getCachedContent: vi.fn(() => Promise.resolve([]))
}))

describe('useSetlistData', () => {
  it('loads data on reload', async () => {
    const { result } = renderHook(() => useSetlistData({ uid: '1', email: 'a' }, true))
    await act(async () => {
      await result.current.reload()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.setlists.length).toBe(1)
    expect(result.current.content.length).toBe(1)
  })
})
