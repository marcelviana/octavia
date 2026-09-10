import { describe, it, expect } from 'vitest'
import { resolveSong, labelFor } from './song'
import type { ContentDTO, SetlistSongDTO } from './types'

const CACHE: ContentDTO = {
  id: 'c1',
  title: 'B',
  artist: 'Tom Jobim',
  album: null,
  content_type: 'Lyrics',
  content_data: { lyrics: 'É pedra, é ponte' },
  file_url: null,
  updated_at: '2026-08-09T17:18:32.193+00:00',
}

/** Linha da setlist com o `content` EMBUTIDO divergente do cache (T1-R8 / A7). */
const SONG: SetlistSongDTO = {
  id: 'ss1',
  setlist_id: 'sl1',
  content_id: 'c1',
  position: 4,
  notes: 'cantar 1 tom abaixo',
  content: {
    id: 'c1',
    title: 'A',
    artist: 'Tom Jobim',
    // sem `album`: o embutido da listagem de setlists não traz o campo (A3)
    content_type: 'Lyrics',
    content_data: { lyrics: 'texto velho' },
    file_url: null,
  },
}

describe('resolveSong (T1-R8 / A7)', () => {
  it('o cache vence o content embutido na resposta de setlists', () => {
    const resolved = resolveSong(SONG, new Map([['c1', CACHE]]))
    expect(resolved.content?.title).toBe('B')
    expect(resolved.validity).toEqual({ ok: true, body: 'text' })
    expect(resolved.notes).toBe('cantar 1 tom abaixo')
  })

  it('content_id fora do cache → content e validity nulos (o embutido não substitui)', () => {
    const resolved = resolveSong(SONG, new Map())
    expect(resolved.content).toBeNull()
    expect(resolved.validity).toBeNull()
    expect(resolved.notes).toBe('cantar 1 tom abaixo')
  })
})

describe('labelFor (T1-R11 + T1-R7 / A8)', () => {
  it('sem cache e sync em andamento → loading', () => {
    expect(labelFor(SONG, new Map(), false)).toBe('loading')
  })

  it('sem cache e sync terminado → unavailable', () => {
    expect(labelFor(SONG, new Map(), true)).toBe('unavailable')
  })

  it('no cache e sem corpo renderizável → invalid', () => {
    const invalido: ContentDTO = { ...CACHE, content_data: null, file_url: null }
    expect(labelFor(SONG, new Map([['c1', invalido]]), true)).toBe('invalid')
  })

  it('no cache e renderizável → ready', () => {
    expect(labelFor(SONG, new Map([['c1', CACHE]]), true)).toBe('ready')
  })
})
