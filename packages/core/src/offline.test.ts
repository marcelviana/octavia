import { describe, it, expect } from 'vitest'
import { offlineStatus, selectPrefetch, prefetchOrder, lruEvict } from './offline'
import type { ContentDTO, SetlistDTO, SetlistSongDTO } from './types'

const BUCKET = 'https://host/storage/v1/object/public/content-files'

function texto(id: string): ContentDTO {
  return {
    id,
    title: `t-${id}`,
    artist: null,
    content_type: 'Lyrics',
    content_data: { lyrics: 'x' },
    file_url: null,
    updated_at: '2026-08-09T17:18:32.193+00:00',
  }
}

function arquivo(id: string, url: string): ContentDTO {
  return {
    id,
    title: `t-${id}`,
    artist: null,
    content_type: 'Sheet',
    content_data: null,
    file_url: url,
    updated_at: '2026-08-09T17:18:32.193+00:00',
  }
}

function song(id: string, position: number, contentId: string): SetlistSongDTO {
  return { id, setlist_id: 'sl1', content_id: contentId, position, notes: null, content: null }
}

function setlist(id: string, songs: SetlistSongDTO[], performanceDate: string | null = null): SetlistDTO {
  return {
    id,
    name: `s-${id}`,
    performance_date: performanceDate,
    venue: null,
    updated_at: '2026-08-29T19:43:10.287+00:00',
    setlist_songs: songs,
  }
}

function cache(items: ContentDTO[]): Map<string, ContentDTO> {
  return new Map(items.map((item) => [item.id, item]))
}

describe('offlineStatus (T1-R17 / A10)', () => {
  it.fails('setlist só de texto está garantida com need 0', () => {
    const sl = setlist('sl1', [song('a', 1, 'c1'), song('b', 2, 'c2')])
    expect(offlineStatus(sl, cache([texto('c1'), texto('c2')]), new Set())).toEqual({
      kind: 'guaranteed',
      have: 0,
      need: 0,
    })
  })

  it.fails('2 de 5 arquivos → parcial "2 de 5"', () => {
    const songs = [1, 2, 3, 4, 5].map((n) => song(`s${n}`, n, `c${n}`))
    const contents = [1, 2, 3, 4, 5].map((n) => arquivo(`c${n}`, `${BUCKET}/${n}.pdf`))
    expect(
      offlineStatus(
        setlist('sl1', songs),
        cache(contents),
        new Set([`${BUCKET}/1.pdf`, `${BUCKET}/2.pdf`]),
      ),
    ).toEqual({ kind: 'partial', have: 2, need: 5 })
  })

  it.fails('nenhum content no cache → nunca sincronizada', () => {
    const sl = setlist('sl1', [song('a', 1, 'c1'), song('b', 2, 'c2')])
    expect(offlineStatus(sl, cache([]), new Set())).toEqual({ kind: 'never', have: 0, need: 0 })
  })

  it.fails('contents no cache e nenhum arquivo baixado → parcial "0 de 2" (aceite A10)', () => {
    const songs = [song('a', 1, 'c1'), song('b', 2, 'c2')]
    const contents = [arquivo('c1', `${BUCKET}/1.pdf`), arquivo('c2', `${BUCKET}/2.pdf`)]
    expect(offlineStatus(setlist('sl1', songs), cache(contents), new Set())).toEqual({
      kind: 'partial',
      have: 0,
      need: 2,
    })
  })

  it.fails('bis conta o arquivo uma vez; com ele baixado, garantida', () => {
    const songs = [song('a', 1, 'c1'), song('b', 2, 'c1')]
    const contents = [arquivo('c1', `${BUCKET}/1.pdf`)]
    expect(
      offlineStatus(setlist('sl1', songs), cache(contents), new Set([`${BUCKET}/1.pdf`])),
    ).toEqual({ kind: 'guaranteed', have: 1, need: 1 })
  })
})

describe('selectPrefetch (T1-R15 / A10)', () => {
  it.fails('amanhã entra; hoje+8 e sem data não entram', () => {
    const contents = cache([
      arquivo('c1', `${BUCKET}/1.pdf`),
      arquivo('c2', `${BUCKET}/2.pdf`),
      arquivo('c3', `${BUCKET}/3.pdf`),
    ])
    const setlists = [
      setlist('amanha', [song('a', 1, 'c1')], '2026-09-11'),
      setlist('oito-dias', [song('b', 1, 'c2')], '2026-09-18'),
      setlist('sem-data', [song('c', 1, 'c3')], null),
    ]
    expect(selectPrefetch(setlists, contents, new Set(), '2026-09-10')).toEqual([
      { url: `${BUCKET}/1.pdf`, setlistId: 'amanha', reason: '7d' },
    ])
  })

  it.fails('duas datadas na janela saem pela data mais próxima primeiro', () => {
    const contents = cache([arquivo('c1', `${BUCKET}/1.pdf`), arquivo('c2', `${BUCKET}/2.pdf`)])
    const setlists = [
      setlist('depois', [song('b', 1, 'c2')], '2026-09-15'),
      setlist('antes', [song('a', 1, 'c1')], '2026-09-12'),
    ]
    expect(selectPrefetch(setlists, contents, new Set(), '2026-09-10').map((i) => i.setlistId)).toEqual([
      'antes',
      'depois',
    ])
  })

  it.fails('arquivo já no aparelho não entra na fila', () => {
    const contents = cache([arquivo('c1', `${BUCKET}/1.pdf`), arquivo('c2', `${BUCKET}/2.pdf`)])
    const sl = setlist('amanha', [song('a', 1, 'c1'), song('b', 2, 'c2')], '2026-09-11')
    expect(
      selectPrefetch([sl], contents, new Set([`${BUCKET}/1.pdf`]), '2026-09-10').map((i) => i.url),
    ).toEqual([`${BUCKET}/2.pdf`])
  })
})

describe('prefetchOrder (T1-R16)', () => {
  it.fails('posição 5 de 12 → 5, 6, 7, 8, 4, depois o resto por position', () => {
    const songs = Array.from({ length: 12 }, (_, i) => song(`ss${i + 1}`, i + 1, `c${i + 1}`))
    expect(prefetchOrder(5, songs)).toEqual([
      'ss5',
      'ss6',
      'ss7',
      'ss8',
      'ss4',
      'ss1',
      'ss2',
      'ss3',
      'ss9',
      'ss10',
      'ss11',
      'ss12',
    ])
  })
})

describe('lruEvict (T1-R14 / A9)', () => {
  it.fails('o repertório medido no N0 (265.002 B) cabe no teto de 200 MB — nada a despejar', () => {
    const files = [
      { url: `${BUCKET}/12p.pdf`, bytes: 242_176, lastUsedMs: 1 },
      { url: `${BUCKET}/1p.pdf`, bytes: 20_821, lastUsedMs: 2 },
      { url: `${BUCKET}/cifra.pdf`, bytes: 1_117, lastUsedMs: 3 },
      { url: `${BUCKET}/offline.pdf`, bytes: 888, lastUsedMs: 4 },
    ]
    expect(lruEvict(files, 200 * 1024 * 1024, new Set())).toEqual({
      evict: [],
      bytesAfter: 265_002,
    })
  })

  it.fails('despeja o menos usado primeiro até caber', () => {
    const files = [
      { url: 'a', bytes: 100, lastUsedMs: 30 },
      { url: 'b', bytes: 100, lastUsedMs: 10 },
      { url: 'c', bytes: 100, lastUsedMs: 20 },
    ]
    expect(lruEvict(files, 150, new Set())).toEqual({ evict: ['b', 'c'], bytesAfter: 100 })
  })

  it.fails('protegido dos 7 dias nunca sai, mesmo sendo o mais antigo', () => {
    const files = [
      { url: 'protegido', bytes: 100, lastUsedMs: 1 },
      { url: 'a', bytes: 100, lastUsedMs: 50 },
    ]
    expect(lruEvict(files, 150, new Set(['protegido']))).toEqual({
      evict: ['a'],
      bytesAfter: 100,
    })
  })

  it.fails('se nem sem os protegidos couber, despeja o que pode e devolve o total real', () => {
    const files = [
      { url: 'p1', bytes: 100, lastUsedMs: 1 },
      { url: 'p2', bytes: 100, lastUsedMs: 2 },
      { url: 'a', bytes: 100, lastUsedMs: 3 },
    ]
    expect(lruEvict(files, 150, new Set(['p1', 'p2']))).toEqual({
      evict: ['a'],
      bytesAfter: 200,
    })
  })
})
