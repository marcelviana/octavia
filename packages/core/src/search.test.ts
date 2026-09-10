import { describe, it, expect } from 'vitest'
import { buildIndex, searchIndex, groupResults } from './search'
import type { ContentDTO } from './types'

function content(
  id: string,
  title: string,
  artist: string | null,
  body: string,
  type: ContentDTO['content_type'] = 'Lyrics',
  album: string | null = null,
): ContentDTO {
  const key = type === 'Lyrics' ? 'lyrics' : type === 'Chords' ? 'chords' : 'tablature'
  return {
    id,
    title,
    artist,
    album,
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

/**
 * Biblioteca com `album` (N1-PR6). `c6` tem `album: null` — o caso real da
 * conta de audit, onde a coluna existe e vem vazia: o índice não pode
 * quebrar nem passar a casar tudo por causa da string vazia.
 */
const COM_ALBUM = [
  content('c5', 'Wave', 'Tom Jobim', 'Vou te contar', 'Lyrics', 'Álbum Chorinho'),
  content('c6', 'Outra', 'Outro', 'corpo qualquer', 'Lyrics', null),
  // "chorinho" está no ÁLBUM de c5 e no CORPO de c7: é o par que prova a
  // ordem de força — sem `album` no índice, c7 sairia sozinho e primeiro.
  content('c7', 'Terceira', 'Mais um', 'tocamos chorinho a noite toda', 'Lyrics', null),
  // "chorinho" no ARTISTA: com c5 (álbum) e c7 (corpo), o trio prova a ordem
  // inteira artista → álbum → corpo numa consulta só.
  content('c8', 'Quarta', 'Chorinho Band', 'corpo sem o termo', 'Lyrics', null),
]

/** Dentro do teste, nunca no topo do módulo: um stub que lança na coleta
 * derruba a suíte inteira e o `it.fails` não a cobre (achado da N1-PR2b). */
function indexar(): ReturnType<typeof buildIndex> {
  return buildIndex(BIBLIOTECA)
}

describe('álbum no índice (T1-R20 — divergência da N1-PR2b fechada na PR6)', () => {
  it('acha pelo álbum, sem acento e sem caixa', () => {
    // "Álbum" só existe no campo `album` de c5 — nem em título, artista ou
    // corpo de ninguém. `aguas`/`Águas` do T1-R21 vale aqui também.
    expect(searchIndex(buildIndex(COM_ALBUM), 'album')).toEqual([{ id: 'c5', where: 'album' }])
    expect(searchIndex(buildIndex(COM_ALBUM), 'ÁLBUM')).toEqual([{ id: 'c5', where: 'album' }])
  })

  it('`album: null` não quebra e não vira coringa', () => {
    // Com `album: null` virando '' no índice, `''.includes(needle)` é falso
    // para qualquer consulta não-vazia: o item sem álbum só aparece pelo que
    // ele realmente tem, nunca por casar "vazio com vazio".
    expect(searchIndex(buildIndex(COM_ALBUM), 'outra')).toEqual([{ id: 'c6', where: 'title' }])
    expect(searchIndex(buildIndex(COM_ALBUM), 'chorinho').map((h) => h.id)).not.toContain('c6')
    // E a consulta vazia continua não buscando, com álbuns nulos no índice.
    expect(searchIndex(buildIndex(COM_ALBUM), '   ')).toEqual([])
  })

  it('a força do campo é título > artista > álbum > corpo', () => {
    // "chorinho" está no ARTISTA de c8, no ÁLBUM de c5 e no CORPO de c7.
    // Sem `album` no índice sairia [c8, c7]; com álbum antes de artista
    // sairia [c5, c8, c7]. Só a ordem do T1-R20 produz o resultado abaixo.
    expect(searchIndex(buildIndex(COM_ALBUM), 'chorinho')).toEqual([
      { id: 'c8', where: 'artist' },
      { id: 'c5', where: 'album' },
      { id: 'c7', where: 'body' },
    ])
    expect(searchIndex(buildIndex(COM_ALBUM), 'wave')).toEqual([{ id: 'c5', where: 'title' }])
    expect(searchIndex(buildIndex(COM_ALBUM), 'jobim')).toEqual([{ id: 'c5', where: 'artist' }])
  })
})

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
