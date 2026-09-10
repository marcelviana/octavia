import { describe, it, expect } from 'vitest'
import { mergePages, planSync, diffByUpdatedAt } from './sync'
import type { ContentDTO, SetlistDTO } from './types'

function content(id: string, updatedAt = '2026-08-09T17:18:32.193+00:00'): ContentDTO {
  return {
    id,
    title: `t-${id}`,
    artist: null,
    content_type: 'Lyrics',
    content_data: { lyrics: 'x' },
    file_url: null,
    updated_at: updatedAt,
  }
}

function setlist(id: string): SetlistDTO {
  return {
    id,
    name: `s-${id}`,
    performance_date: null,
    venue: null,
    updated_at: '2026-08-29T19:43:10.287+00:00',
    setlist_songs: [],
  }
}

describe('mergePages (T1-R9b / A22)', () => {
  it.fails('id repetido entre páginas entra uma vez e conta como duplicata', () => {
    const { items, duplicates } = mergePages([
      [content('a'), content('b')],
      [content('b'), content('c')],
    ])
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(duplicates).toBe(1)
  })

  it.fails('preserva a ordem de chegada e aceita página vazia', () => {
    const { items, duplicates } = mergePages([[], [content('z'), content('a')], []])
    expect(items.map((i) => i.id)).toEqual(['z', 'a'])
    expect(duplicates).toBe(0)
  })

  it.fails('duas páginas sem repetição (100 + 28) → 128 itens', () => {
    const p1 = Array.from({ length: 100 }, (_, i) => content(`p1-${i}`))
    const p2 = Array.from({ length: 28 }, (_, i) => content(`p2-${i}`))
    const { items, duplicates } = mergePages([p1, p2])
    expect(items).toHaveLength(128)
    expect(duplicates).toBe(0)
  })
})

describe('planSync (T1-R9 / A7, A21)', () => {
  it.fails('página falhada → keep-previous com a MESMA referência do cache anterior', () => {
    const previous = { content: [content('a')], setlists: [setlist('s1')] }
    const plan = planSync({
      pages: [
        { items: [content('a')], failed: false },
        { items: [], failed: true },
      ],
      setlists: [setlist('s1')],
      previous,
    })
    expect(plan.action).toBe('keep-previous')
    expect(plan.reason).toBe('content-page-failed')
    expect(plan.content).toBe(previous.content)
    expect(plan.setlists).toBe(previous.setlists)
  })

  it.fails('setlists ausentes → keep-previous, mesmo com todas as páginas ok', () => {
    const previous = { content: [content('a')], setlists: [setlist('s1')] }
    const plan = planSync({
      pages: [{ items: [content('a'), content('b')], failed: false }],
      setlists: null,
      previous,
    })
    expect(plan.action).toBe('keep-previous')
    expect(plan.reason).toBe('setlists-missing')
    expect(plan.content).toBe(previous.content)
  })

  it.fails('sem cache anterior e com falha → keep-previous com conjuntos vazios', () => {
    const plan = planSync({
      pages: [{ items: [], failed: true }],
      setlists: null,
      previous: null,
    })
    expect(plan).toEqual({
      action: 'keep-previous',
      content: [],
      setlists: [],
      reason: 'content-page-failed',
    })
  })

  it.fails('tudo ok → apply com o conjunto novo inteiro, já deduplicado', () => {
    const novas = [setlist('s1'), setlist('s2')]
    const plan = planSync({
      pages: [
        { items: [content('a'), content('b')], failed: false },
        { items: [content('b'), content('c')], failed: false },
      ],
      setlists: novas,
      previous: { content: [content('velho')], setlists: [setlist('velha')] },
    })
    expect(plan.action).toBe('apply')
    expect(plan.reason).toBe('ok')
    expect(plan.content.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(plan.setlists).toBe(novas)
  })
})

describe('diffByUpdatedAt (T1-R10 / A7)', () => {
  it.fails('dois syncs idênticos → nenhuma invalidação', () => {
    const antes = [content('a'), content('b')]
    const depois = [content('a'), content('b')]
    expect(diffByUpdatedAt(antes, depois)).toEqual({ changed: [], added: [], removed: [] })
  })

  it.fails('separa alterado, novo e removido', () => {
    const antes = [content('a'), content('b'), content('c')]
    const depois = [
      content('a'),
      content('b', '2026-09-10T10:00:00.000+00:00'),
      content('d'),
    ]
    expect(diffByUpdatedAt(antes, depois)).toEqual({
      changed: ['b'],
      added: ['d'],
      removed: ['c'],
    })
  })
})
