import { it, expect, vi } from 'vitest'

it('creates a mock setlist when Supabase is not configured', async () => {
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: false,
    getSupabaseBrowserClient: vi.fn(),
  }))
  const { createSetlist } = await import('../setlist-service')
  const result = await createSetlist({ name: 'Demo' })
  expect(result.user_id).toBe('demo-user')
  expect(result.setlist_songs).toEqual([])
  vi.resetModules()
})

it('throws when Supabase is configured but user is missing', async () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    },
    from: vi.fn()
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient,
  }))
  const { createSetlist } = await import('../setlist-service')
  await expect(createSetlist({ name: 'Demo' })).rejects.toThrow('User not authenticated')
  vi.resetModules()
})

it('uses bulk updates when adding a song', async () => {
  const songsToShift = [
    { id: 'a', position: 1 },
    { id: 'b', position: 2 }
  ]
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
  const insert = vi.fn(() => ({
    select: () => ({ single: () => Promise.resolve({ data: { id: 'new' }, error: null }) })
  }))
  const mockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === 'setlists') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'l1' }, error: null }) }) }) })
        }
      }
      if (table === 'setlist_songs') {
        return {
          select: () => ({ eq: () => ({ gte: () => ({ order: () => Promise.resolve({ data: songsToShift, error: null }) }) }) }),
          upsert,
          insert
        }
      }
      if (table === 'content') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { title: '', artist: '', content_type: '' }, error: null }) }) })
        }
      }
      return {}
    })
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient
  }))
  const { addSongToSetlist } = await import('../setlist-service')
  await addSongToSetlist('l1', 'c1', 1)
  expect(upsert).toHaveBeenCalledTimes(2)
  expect(upsert).toHaveBeenNthCalledWith(1, songsToShift.map(s => ({ id: s.id, position: s.position + 1000 })), { onConflict: 'id' })
  expect(upsert).toHaveBeenNthCalledWith(2, songsToShift.map(s => ({ id: s.id, position: s.position + 1 })), { onConflict: 'id' })
  vi.resetModules()
})

it('uses bulk updates when removing a song', async () => {
  const songsToShift = [
    { id: 'b', position: 2 },
    { id: 'c', position: 3 }
  ]
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
  const del = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }))
  const mockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === 'setlist_songs') {
        return {
          select: (cols?: string) => {
            if (cols && cols.includes('setlists!inner')) {
              return { eq: () => ({ single: () => Promise.resolve({ data: { id: 'a', position: 1, setlist_id: 'l1', setlists: { id: 'l1', user_id: 'u1' } }, error: null }) }) }
            }
            return { eq: () => ({ gt: () => ({ order: () => Promise.resolve({ data: songsToShift, error: null }) }) }) }
          },
          delete: del,
          upsert
        }
      }
      return {}
    })
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient
  }))
  const { removeSongFromSetlist } = await import('../setlist-service')
  await removeSongFromSetlist('a')
  expect(upsert).toHaveBeenCalledWith(songsToShift.map(s => ({ id: s.id, position: s.position - 1 })), { onConflict: 'id' })
  vi.resetModules()
})

it('uses bulk updates when moving a song', async () => {
  const songsToShift = [
    { id: 'b', position: 2 },
    { id: 'c', position: 3 }
  ]
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })
  const update = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
  const mockClient = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === 'setlists') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: 'l1' }, error: null }) }) }) })
        }
      }
      if (table === 'setlist_songs') {
        return {
          select: (cols?: string) => {
            if (cols === 'position') {
              return { eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { position: 1 }, error: null }) }) }) }
            }
            return { eq: () => ({ gt: () => ({ lte: () => ({ order: () => Promise.resolve({ data: songsToShift, error: null }) }) }) }) }
          },
          update,
          upsert
        }
      }
      return {}
    })
  }
  vi.doMock('../supabase', () => ({
    isSupabaseConfigured: true,
    getSupabaseBrowserClient: () => mockClient
  }))
  const { updateSongPosition } = await import('../setlist-service')
  await updateSongPosition('l1', 'a', 3)
  expect(upsert).toHaveBeenCalledWith(songsToShift.map(s => ({ id: s.id, position: s.position - 1 })), { onConflict: 'id' })
  vi.resetModules()
})
