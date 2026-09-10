import { describe, it, expect } from 'vitest'
import { nextPosition, prevPosition, endOfSetlist, songKey } from './position'
import type { SetlistSongDTO } from './types'

function song(id: string, position: number, contentId: string): SetlistSongDTO {
  return { id, setlist_id: 'sl1', content_id: contentId, position, notes: null, content: null }
}

describe('songKey (T1-R24 / A12 — bis)', () => {
  it('mesmo content em duas posições tem chaves distintas', () => {
    const bis1 = song('ss2', 2, 'c-wave')
    const bis2 = song('ss7', 7, 'c-wave')
    expect(songKey(bis1)).not.toBe(songKey(bis2))
    expect([songKey(bis1), songKey(bis2)]).toEqual(['ss2', 'ss7'])
  })
})

describe('nextPosition / prevPosition (T1-R27 — não circula)', () => {
  it('avança 1 → 2 e para na última', () => {
    expect(nextPosition(1, 12)).toBe(2)
    expect(nextPosition(12, 12)).toBe(12)
  })

  it('volta 5 → 4 e para na primeira', () => {
    expect(prevPosition(5, 12)).toBe(4)
    expect(prevPosition(1, 12)).toBe(1)
  })
})

describe('endOfSetlist (T1-R29 / A14)', () => {
  it('só a última posição é o fim', () => {
    expect(endOfSetlist(12, 12)).toBe(true)
    expect(endOfSetlist(11, 12)).toBe(false)
    expect(endOfSetlist(1, 1)).toBe(true)
  })
})
