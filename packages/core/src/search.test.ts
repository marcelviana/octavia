import { describe, it, expect } from 'vitest'
import { buildIndex, searchIndex, groupResults } from './search'
import type { ContentDTO } from './types'

function content(
  id: string,
  title: string,
  artist: string | null,
  body: string,
  type: ContentDTO['content_type'] = 'Lyrics',
): ContentDTO {
  const key = type === 'Lyrics' ? 'lyrics' : type === 'Chords' ? 'chords' : 'tablature'
  return {
    id,
    title,
    artist,
    content_type: type,
    content_data: { [key]: body },
    file_url: null,
    updated_at: '2026-08-09T17:18:32.193+00:00',
  }
}

const BIBLIOTECA = [
  content('c1', 'Águas de Março', 'Tom Jobim', 'É pau, é pedra'),
  content('c2', 'Garota de Ipanema', 'Tom Jobim', 'Olha que coisa mais linda'),
  content('c3', 'Wave', 'Antônio Carlos', 'Vou te contar', 'Tab'),
  content('c4', 'O barquinho', 'Roberto Menescal', 'Dia de luz, festa de sol'),
]

/** Dentro do teste, nunca no topo do módulo: um stub que lança na coleta
 * derruba a suíte inteira e o `it.fails` não a cobre (achado da N1-PR2b). */
function indexar(): ReturnType<typeof buildIndex> {
  return buildIndex(BIBLIOTECA)
}

describe('searchIndex (T1-R20, T1-R21 / A11)', () => {
  it('acento e caixa não importam: aguas acha "Águas de Março"', () => {
    expect(searchIndex(indexar(), 'aguas')).toEqual([{ id: 'c1', where: 'title' }])
    expect(searchIndex(indexar(), 'ÁGUAS')).toEqual([{ id: 'c1', where: 'title' }])
  })

  it('acha pelo corpo — o verso que se lembra', () => {
    expect(searchIndex(indexar(), 'coisa mais linda')).toEqual([{ id: 'c2', where: 'body' }])
  })

  it('acha pelo artista e devolve título antes de artista antes de corpo', () => {
    expect(searchIndex(indexar(), 'tom jobim')).toEqual([
      { id: 'c1', where: 'artist' },
      { id: 'c2', where: 'artist' },
    ])
    // "de" está no título de c1 e c2 e só no corpo de c4 ("Dia de luz") →
    // os dois títulos saem antes do corpo, na ordem do índice
    expect(searchIndex(indexar(), 'de')).toEqual([
      { id: 'c1', where: 'title' },
      { id: 'c2', where: 'title' },
      { id: 'c4', where: 'body' },
    ])
  })

  it('limit corta o resultado', () => {
    expect(searchIndex(indexar(), 'de', 2)).toHaveLength(2)
  })

  it('consulta vazia (ou só espaços) não busca', () => {
    expect(searchIndex(indexar(), '')).toEqual([])
    expect(searchIndex(indexar(), '   ')).toEqual([])
  })
})

describe('groupResults (T1-R22 / A11)', () => {
  it('o que está na setlist atual vem primeiro, o resto é biblioteca', () => {
    const hits = searchIndex(indexar(), 'tom jobim')
    expect(groupResults(hits, new Set(['c2']))).toEqual({
      inSetlist: [{ id: 'c2', where: 'artist' }],
      library: [{ id: 'c1', where: 'artist' }],
    })
  })
})
