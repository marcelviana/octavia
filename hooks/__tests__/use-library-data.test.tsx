import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useLibraryData } from '../use-library-data'

vi.mock('@/lib/content-service', () => ({
  getUserContentPage: vi.fn(() => Promise.resolve({ data: [{ id: 'c1' }], total: 1 }))
}))

vi.mock('@/lib/offline-cache', () => ({
  saveContent: vi.fn(),
  getCachedContent: vi.fn(() => Promise.resolve([]))
}))

describe('useLibraryData', () => {
  it.skip('loads data on reload', async () => {
    const { result } = renderHook(() => useLibraryData({
      user: { uid: '1', email: 'a' },
      ready: true,
      initialContent: [],
      initialTotal: 0,
      initialPage: 1,
      initialPageSize: 20,
    }))
    await act(async () => {
      await result.current.reload()
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.content.length).toBe(1)
    expect(result.current.totalCount).toBe(1)
  })
})
