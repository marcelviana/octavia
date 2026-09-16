import { describe, it, expect } from 'vitest'
import { mergePages, planSync, diffByUpdatedAt } from './sync'
import { reconcileByUpdatedAt } from './sync'
import type { ContentDTO, SetlistDTO } from './types'

function content(id: string, updatedAt = '2026-08-09T17:18:32.193+00:00'): ContentDTO {
  return {
    id,
    title: `t-${id}`,
    artist: null,
    album: null,
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
  it('id repetido entre páginas entra uma vez e conta como duplicata', () => {
    const { items, duplicates } = mergePages([
      [content('a'), content('b')],
      [content('b'), content('c')],
    ])
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(duplicates).toBe(1)
  })

  it('preserva a ordem de chegada e aceita página vazia', () => {
    const { items, duplicates } = mergePages([[], [content('z'), content('a')], []])
    expect(items.map((i) => i.id)).toEqual(['z', 'a'])
    expect(duplicates).toBe(0)
  })

  it('duas páginas sem repetição (100 + 28) → 128 itens', () => {
    const p1 = Array.from({ length: 100 }, (_, i) => content(`p1-${i}`))
    const p2 = Array.from({ length: 28 }, (_, i) => content(`p2-${i}`))
    const { items, duplicates } = mergePages([p1, p2])
    expect(items).toHaveLength(128)
    expect(duplicates).toBe(0)
  })
})

describe('planSync (T1-R9 / A7, A21)', () => {
  it('página falhada → keep-previous com a MESMA referência do cache anterior', () => {
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

  it('setlists ausentes → keep-previous, mesmo com todas as páginas ok', () => {
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

  it('sem cache anterior e com falha → keep-previous com conjuntos vazios', () => {
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

  it('tudo ok → apply com o conjunto novo inteiro, já deduplicado', () => {
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
  it('dois syncs idênticos → nenhuma invalidação', () => {
    const antes = [content('a'), content('b')]
    const depois = [content('a'), content('b')]
    expect(diffByUpdatedAt(antes, depois)).toEqual({ changed: [], added: [], removed: [] })
  })

  it('separa alterado, novo e removido', () => {
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

describe('reconcileByUpdatedAt (T1-R10 no caminho do sync, N2-D8)', () => {
  it('nada mudou → invalidated=0 e o MESMO conjunto anterior', () => {
    const antes = [content('a'), content('b')]
    const r = reconcileByUpdatedAt(antes, [content('a'), content('b')])
    expect(r.invalidated).toBe(0)
    expect(r.items).toBe(antes)
  })

  it('updated_at diferente → conta 1 e devolve o conjunto novo inteiro', () => {
    const antes = [content('a'), content('b')]
    const depois = [content('a'), content('b', '2026-09-16T12:00:00.000+00:00')]
    const r = reconcileByUpdatedAt(antes, depois)
    expect(r.invalidated).toBe(1)
    expect(r.items).toBe(depois)
  })

  it('novo e removido contam; sem anterior, tudo é novo', () => {
    expect(reconcileByUpdatedAt([content('a'), content('b')], [content('a'), content('c')]).invalidated).toBe(2)
    expect(reconcileByUpdatedAt([], [content('a'), content('b')]).invalidated).toBe(2)
  })

  it('mesma versão em outra ordem → invalidated=0, mas a ordem do servidor vale', () => {
    const antes = [content('a'), content('b')]
    const depois = [content('b'), content('a')]
    const r = reconcileByUpdatedAt(antes, depois)
    expect(r.invalidated).toBe(0)
    expect(r.items).toBe(depois)
  })

  it('vale para setlist (renomear bumpa o updated_at da setlist)', () => {
    const antes = [setlist('x')]
    const depois = [{ ...setlist('x'), name: 'novo', updated_at: '2026-09-16T12:00:00.000+00:00' }]
    expect(reconcileByUpdatedAt(antes, depois).invalidated).toBe(1)
  })
})
