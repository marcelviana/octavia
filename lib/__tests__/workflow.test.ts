import { describe, it, expect, vi } from 'vitest'

// Integration test covering create, update and setlist add actions

describe('content and setlist workflow in demo mode', () => {
  it('creates content, updates it and adds to setlist', async () => {
    vi.doMock('../supabase', () => ({
      isSupabaseConfigured: false,
      getSupabaseBrowserClient: vi.fn()
    }))
    const { createContent, updateContent } = await import('../content-service')
    const { createSetlist, addSongToSetlist } = await import('../setlist-service')

    const content = await createContent({ title: 'My Song', content_type: 'Lyrics' } as any)
    expect(content.id).toMatch(/^mock-/)

    const updated = await updateContent(content.id, { title: 'Updated' } as any)
    expect(updated.title).toBe('Wonderwall')
    expect(updated.id).toBe('mock-1')

    const setlist = await createSetlist({ name: 'My Set' })
    const added = await addSongToSetlist(setlist.id, content.id, 1)
    expect(added.content_id).toBe(content.id)
    expect(added.position).toBe(1)
    vi.resetModules()
  })
})
