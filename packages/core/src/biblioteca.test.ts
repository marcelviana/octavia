/**
 * N4-PR5 — o core da biblioteca (N4-R4, N4-R5, N4-R11; A-N4-4, A-N4-5, A-N4-11), escrito ANTES do código: contra a
 * `main`, o arquivo inteiro reprova — `consultarBiblioteca`, `ordenarBiblioteca` e `nResultados` não existem.
 *
 * - **A ordem** (N4-R4, P-X1): alfabética pt-BR **sem acento**, as favoritas não sobem. A chave é o
 *   `normalizeForSearch` (o mesmo da busca) e a comparação é por unidade de código — nenhum `localeCompare`, nenhum
 *   `Intl`: o Hermes do aparelho e o Node dos testes não têm de concordar sobre colação nenhuma (N4-PR5 §1.1).
 * - **Os filtros** (N4-R5, P-X2): os quatro tipos por "ou", *Favoritas* por "e", composta com a busca — a tabela
 *   verdade inteira (16 conjuntos de tipos × favoritas × termo) contra um oráculo escrito à mão neste arquivo.
 * - **As contagens**: da biblioteca INTEIRA, as mesmas em toda consulta (busca e filtros não as mexem).
 * - **A busca** (N4-R11, N4-D90): o mesmo predicado da S4 (`searchIndex`), **sem o corte de 50** da S4.
 * - **A régua** (P-F8, N4-E5): *1 resultado*, *{n} resultados* — a frase da S4, agora no core.
 */
import { describe, expect, it } from 'vitest'
import {
  consultarBiblioteca,
  ordenarBiblioteca,
  type ConsultaDaBiblioteca,
} from './biblioteca'
import { nResultados } from './frases-content'
import { buildIndex, searchIndex } from './search'
import type { ContentDTO, ContentType } from './types'

const T0 = '2026-09-23T12:00:00.000+00:00'

function item(
  id: string,
  title: string,
  tipo: string,
  extra: { artist?: string | null; favorita?: boolean; corpo?: string; arquivo?: string } = {},
): ContentDTO {
  const chave: Record<string, string> = { Lyrics: 'lyrics', Chords: 'chords', Tab: 'tablature' }
  const k = chave[tipo]
  return {
    id,
    title,
    artist: extra.artist ?? null,
    album: null,
    content_type: tipo as ContentType,
    content_data: k === undefined ? null : { [k]: extra.corpo ?? `corpo de ${title}` },
    file_url: extra.arquivo ?? null,
    updated_at: T0,
    ...(extra.favorita === undefined ? {} : { is_favorite: extra.favorita }),
  }
}

/** A biblioteca da fixture do pre-check do N3 (`fixture.py:131-144`), na ordem do arquivo — os títulos são do projeto. */
const FIXTURE_N3: ContentDTO[] = [
  item('c01', 'Manhã de ensaio', 'Lyrics', { artist: 'Banda da fixture' }),
  item('c02', 'Segunda do ensaio', 'Chords', { artist: 'Duo Manacá' }),
  item('c03', 'Terceira do ensaio', 'Tab', { artist: 'Trio de fixture' }),
  item('c04', 'Partitura de doze páginas', 'Sheet', { arquivo: 'http://localhost:8790/partitura-12p.pdf' }),
  item('c05', 'Partitura que nunca baixou', 'Sheet', { arquivo: 'http://localhost:8790/nao-existe.pdf' }),
  item('c06', 'Uma música de título bem comprido, para medir o corte do título em retrato e no celular', 'Lyrics'),
  item('c07', 'Sétima do ensaio', 'Chords'),
  item('c08', 'Oitava do ensaio', 'Lyrics'),
  item('c09', 'Nona do ensaio', 'Lyrics', { artist: 'Duo Manacá' }),
  item('c10', 'Décima do ensaio', 'Chords'),
  item('c11', 'Partitura de uma página', 'Sheet', { arquivo: 'http://localhost:8790/partitura-1p.pdf' }),
  item('c12', 'Águas de fixture', 'Lyrics', { artist: 'Banda da fixture' }),
]

describe('N4-R4 — a ordem: alfabética pt-BR sem acento, sem controle de ordem', () => {
  it('a fixture do N3 na ordem esperada (A-N4-4: a mesma do dump da PR-7)', () => {
    expect(ordenarBiblioteca(FIXTURE_N3).map((c) => c.title)).toEqual([
      'Águas de fixture',
      'Décima do ensaio',
      'Manhã de ensaio',
      'Nona do ensaio',
      'Oitava do ensaio',
      'Partitura de doze páginas',
      'Partitura de uma página',
      'Partitura que nunca baixou',
      'Segunda do ensaio',
      'Sétima do ensaio',
      'Terceira do ensaio',
      'Uma música de título bem comprido, para medir o corte do título em retrato e no celular',
    ])
  })

  it('o acento não pesa: Águas antes de Décima, Décima antes de Manhã; maiúscula não pesa', () => {
    const nomes = ordenarBiblioteca([
      item('a', 'Décima', 'Lyrics'),
      item('b', 'manhã', 'Lyrics'),
      item('c', 'Águas', 'Lyrics'),
      item('d', 'Ação', 'Lyrics'),
      item('e', 'abacate', 'Lyrics'),
    ]).map((c) => c.title)
    expect(nomes).toEqual(['abacate', 'Ação', 'Águas', 'Décima', 'manhã'])
  })

  it('as favoritas NÃO sobem ao topo', () => {
    const lista = ordenarBiblioteca([
      item('z', 'Zebra', 'Lyrics', { favorita: true }),
      item('a', 'Abelha', 'Lyrics', { favorita: false }),
    ])
    expect(lista.map((c) => c.title)).toEqual(['Abelha', 'Zebra'])
  })

  it('empate de chave: o título cru e depois o id decidem — a ordem é total, a mesma em qualquer entrada', () => {
    const a = item('id-b', 'Ensaio', 'Lyrics')
    const b = item('id-a', 'Ensaio', 'Lyrics')
    const c = item('id-c', 'Ensáio', 'Lyrics')
    const uma = ordenarBiblioteca([a, b, c]).map((x) => x.id)
    const outra = ordenarBiblioteca([c, b, a]).map((x) => x.id)
    expect(uma).toEqual(outra)
    expect(uma).toEqual(['id-a', 'id-b', 'id-c'])
  })

  it('não muda a lista recebida', () => {
    const entrada = [...FIXTURE_N3]
    ordenarBiblioteca(entrada)
    expect(entrada).toEqual(FIXTURE_N3)
  })
})

// --------------------------------------------------------------- os filtros

const TIPOS: ContentType[] = ['Lyrics', 'Chords', 'Tab', 'Sheet']

/** Um item por (tipo × favorita), mais um tipo fora do enum, com corpos que a busca distingue. */
const BIBLIOTECA: ContentDTO[] = [
  item('l1', 'Letra um', 'Lyrics', { favorita: true, corpo: 'quando a noite chega' }),
  item('l2', 'Letra dois', 'Lyrics', { favorita: false, corpo: 'linha do ensaio' }),
  item('c1', 'Cifra um', 'Chords', { favorita: true, corpo: 'C Am F G noite' }),
  item('c2', 'Cifra dois', 'Chords', { corpo: 'D G A' }),
  item('t1', 'Tab um', 'Tab', { favorita: true, corpo: 'e|---0---' }),
  item('t2', 'Tab dois', 'Tab', { favorita: false, corpo: 'B|---1--- noite' }),
  item('s1', 'Partitura um', 'Sheet', { favorita: true, arquivo: 'http://h/p1.pdf' }),
  item('s2', 'Partitura dois', 'Sheet', { arquivo: 'http://h/p2.pdf' }),
  item('x1', 'Piano de fixture', 'Piano', { favorita: true }),
]
const INDICE = buildIndex(BIBLIOTECA)

/** O oráculo, escrito à mão: tipos por "ou" (vazio = todos), favoritas por "e", a busca pelo predicado da S4. */
function oraculo(c: ConsultaDaBiblioteca): string[] {
  const casados = c.termo.trim() === '' ? null : new Set(searchIndex(INDICE, c.termo, Infinity).map((h) => h.id))
  const out: string[] = []
  for (const x of BIBLIOTECA) {
    let passaTipo = c.tipos.length === 0
    for (const t of c.tipos) if (x.content_type === t) passaTipo = true
    const passaFav = !c.favoritas || x.is_favorite === true
    const passaBusca = casados === null || casados.has(x.id)
    if (passaTipo && passaFav && passaBusca) out.push(x.id)
  }
  return out.sort()
}

function subconjuntos(): ContentType[][] {
  const out: ContentType[][] = []
  for (let m = 0; m < 16; m++) out.push(TIPOS.filter((_, i) => (m >> i) & 1))
  return out
}

describe('N4-R5 — os filtros: tipos por "ou", Favoritas por "e", compostos com a busca (a tabela verdade)', () => {
  const termos = ['', 'noite', 'um', 'nada-casa-isto']
  for (const termo of termos) {
    for (const favoritas of [false, true]) {
      it(`termo=${JSON.stringify(termo)} favoritas=${favoritas}: os 16 conjuntos de tipos`, () => {
        for (const tipos of subconjuntos()) {
          const consulta = { termo, tipos, favoritas }
          const obtido = consultarBiblioteca(BIBLIOTECA, INDICE, consulta).itens.map((c) => c.id).sort()
          expect({ tipos, obtido }).toEqual({ tipos, obtido: oraculo(consulta) })
        }
      })
    }
  }

  it('dois tipos marcados somam (é "ou"): Letra + Cifra = 4 itens', () => {
    const r = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: '', tipos: ['Lyrics', 'Chords'], favoritas: false })
    expect(r.itens.map((c) => c.id).sort()).toEqual(['c1', 'c2', 'l1', 'l2'])
  })

  it('Favoritas restringe (é "e"): Letra + Cifra com Favoritas = 2 itens', () => {
    const r = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: '', tipos: ['Lyrics', 'Chords'], favoritas: true })
    expect(r.itens.map((c) => c.id).sort()).toEqual(['c1', 'l1'])
  })

  it('o tipo fora do enum aparece sem filtro de tipo e some com qualquer tipo marcado', () => {
    const sem = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: '', tipos: [], favoritas: false })
    expect(sem.itens.map((c) => c.id)).toContain('x1')
    for (const t of TIPOS) {
      const com = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: '', tipos: [t], favoritas: false })
      expect(com.itens.map((c) => c.id)).not.toContain('x1')
    }
  })

  it('o resultado sai na ordem da biblioteca (alfabética), com filtro e com busca', () => {
    const r = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: 'noite', tipos: [], favoritas: false })
    expect(r.itens.map((c) => c.title)).toEqual(['Cifra um', 'Letra um', 'Tab dois'])
    expect(r.n).toBe(3)
  })

  it('is_favorite ausente (o mock do N3 não manda a chave) conta como não favorita', () => {
    const r = consultarBiblioteca(FIXTURE_N3, buildIndex(FIXTURE_N3), { termo: '', tipos: [], favoritas: true })
    expect(r.itens).toEqual([])
    expect(r.contagens.favoritas).toBe(0)
  })
})

describe('N4-R5 — as cinco contagens são da biblioteca inteira e não mudam com a busca nem com os filtros', () => {
  const ESPERADAS = { Lyrics: 2, Chords: 2, Tab: 2, Sheet: 2, favoritas: 5 }

  it('as contagens da BIBLIOTECA, escritas à mão (o Piano não conta em tipo nenhum; conta nas favoritas)', () => {
    const r = consultarBiblioteca(BIBLIOTECA, INDICE, { termo: '', tipos: [], favoritas: false })
    expect(r.contagens).toEqual(ESPERADAS)
  })

  it('as mesmas em toda consulta da tabela verdade', () => {
    for (const termo of ['', 'noite', 'um', 'nada-casa-isto']) {
      for (const favoritas of [false, true]) {
        for (const tipos of subconjuntos()) {
          expect(consultarBiblioteca(BIBLIOTECA, INDICE, { termo, tipos, favoritas }).contagens).toEqual(ESPERADAS)
        }
      }
    }
  })
})

describe('N4-R11 / N4-D90 — a busca de L é a da S4, sem o corte de 50', () => {
  const MUITAS = Array.from({ length: 60 }, (_, i) =>
    item(`m${String(i).padStart(2, '0')}`, `Ensaio ${String(i).padStart(2, '0')}`, 'Lyrics'),
  )
  const IDX = buildIndex(MUITAS)

  it('com ≤ 50 acertos, o conjunto é o da S4 (o mesmo `searchIndex`, título · artista · álbum · corpo)', () => {
    for (const termo of ['noite', 'um', 'ensaio', 'fixture', 'manaca', 'C Am']) {
      const s4 = new Set(searchIndex(buildIndex(FIXTURE_N3.concat(BIBLIOTECA)), termo).map((h) => h.id))
      const l = consultarBiblioteca(FIXTURE_N3.concat(BIBLIOTECA), buildIndex(FIXTURE_N3.concat(BIBLIOTECA)), {
        termo,
        tipos: [],
        favoritas: false,
      })
      expect(s4.size).toBeLessThanOrEqual(50)
      expect(new Set(l.itens.map((c) => c.id))).toEqual(s4)
    }
  })

  it('com 60 acertos, a S4 corta em 50 e a L mostra os 60 — a única diferença (declarada)', () => {
    expect(searchIndex(IDX, 'ensaio')).toHaveLength(50)
    expect(consultarBiblioteca(MUITAS, IDX, { termo: 'ensaio', tipos: [], favoritas: false }).n).toBe(60)
  })

  it('termo só de espaço não busca (como a S4)', () => {
    expect(consultarBiblioteca(MUITAS, IDX, { termo: '   ', tipos: [], favoritas: false }).n).toBe(60)
  })
})

describe('P-F8 — a régua de resultados, com o singular (N4-E5), agora no core', () => {
  it('0 · 1 · 2 · 57', () => {
    expect(nResultados(0)).toBe('0 resultados')
    expect(nResultados(1)).toBe('1 resultado')
    expect(nResultados(2)).toBe('2 resultados')
    expect(nResultados(57)).toBe('57 resultados')
  })
})
