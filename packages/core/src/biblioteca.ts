/**
 * A biblioteca no tablet, sem tela (N4-PR5; `N4-REQUISITOS.md` N4-R4, N4-R5, N4-R11): a ordem, os filtros, as
 * contagens e a busca. Puro, como todo o core — quem desenha é a tela da PR-7.
 *
 * ## A ordem (N4-R4, P-X1) — e por que ela não usa `localeCompare`
 *
 * Alfabética pt-BR **sem acento** (*Águas* antes de *Décima*), sem controle de ordem, e as favoritas **não sobem**.
 * A chave de cada música é o título pelo `normalizeForSearch` — o mesmo da busca (NFD, sem as marcas U+0300–U+036F,
 * minúsculas, espaços juntos) — e duas chaves se comparam **por unidade de código**, com `<`. Nenhum
 * `localeCompare`, nenhum `Intl.Collator`: a colação de um runtime é a tabela de ICU que ele carrega, e o Hermes do
 * aparelho e o Node dos testes não têm de concordar sobre ela. O NFD e a remoção das marcas são Unicode puro, e a
 * comparação por unidade de código é a mesma em qualquer motor — a ordem do teste É a do aparelho.
 * O empate de chave (*Ensaio* × *Ensáio*) se desfaz pelo título cru, e depois pelo `id`: a ordem é TOTAL, e a mesma
 * para qualquer ordem de entrada.
 *
 * ## Os filtros (N4-R5, P-X2)
 *
 * Os quatro tipos combinam por **"ou"** (nenhum marcado = todos); *Favoritas* combina por **"e"**. O tipo fora do
 * enum aparece sem filtro de tipo e some com qualquer tipo marcado. **As cinco contagens são da biblioteca inteira**
 * e não mudam com a busca nem com os outros filtros: `consultarBiblioteca` as calcula sobre a biblioteca recebida, e
 * nunca sobre o que sobrou.
 *
 * ## A busca (N4-R11; N4-D90, `[Marcel, 2026-10-04]`)
 *
 * O predicado é o da S4 (`searchIndex`: título, artista, álbum e corpo, normalizados), **sem o corte de 50** que a S4
 * aplica: na L a busca compõe com os filtros e a lista é alfabética, e cortar antes de filtrar esconderia músicas. O
 * conjunto é o da S4 sempre que a S4 não corta (≤ 50 acertos); a ordem é a da biblioteca, não a de força da S4.
 */
import { normalizeForSearch } from './normalize'
import { searchIndex, type SearchIndex } from './search'
import type { ContentDTO, ContentType } from './types'

/** A chave de ordem de um título — a mesma normalização da busca. */
export function chaveDeOrdem(titulo: string): string {
  return normalizeForSearch(titulo)
}

/** Por unidade de código: o que `<` diz em qualquer motor JavaScript. */
function porCodigo(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * A biblioteca em ordem alfabética (N4-R4) — a ordem total: a chave sem acento, depois o título cru, depois o `id`.
 * Não muda a lista recebida.
 */
export function ordenarBiblioteca(contents: readonly ContentDTO[]): ContentDTO[] {
  const chaves = new Map(contents.map((c) => [c, chaveDeOrdem(c.title)]))
  return [...contents].sort(
    (a, b) => porCodigo(chaves.get(a)!, chaves.get(b)!) || porCodigo(a.title, b.title) || porCodigo(a.id, b.id),
  )
}

/** Favorita é `is_favorite === true`; ausente (o mock do N3 não manda a chave) ou `null` não é. */
export function ehFavorita(content: ContentDTO): boolean {
  return content.is_favorite === true
}

/** As cinco contagens dos chips — da biblioteca inteira (P-X2). */
export interface ContagensDaBiblioteca {
  Lyrics: number
  Chords: number
  Tab: number
  Sheet: number
  favoritas: number
}

export function contarBiblioteca(contents: readonly ContentDTO[]): ContagensDaBiblioteca {
  const out: ContagensDaBiblioteca = { Lyrics: 0, Chords: 0, Tab: 0, Sheet: 0, favoritas: 0 }
  for (const c of contents) {
    const t = c.content_type as string
    if (t === 'Lyrics' || t === 'Chords' || t === 'Tab' || t === 'Sheet') out[t]++
    if (ehFavorita(c)) out.favoritas++
  }
  return out
}

/** O que a tela de L pergunta: o termo do campo, os tipos marcados e o chip *Favoritas*. */
export interface ConsultaDaBiblioteca {
  termo: string
  tipos: readonly ContentType[]
  favoritas: boolean
}

export interface RespostaDaBiblioteca {
  /** O que sobra, na ordem da biblioteca. */
  itens: ContentDTO[]
  /** Quantos sobraram — o número da régua (`nResultados`). */
  n: number
  /** As cinco contagens da biblioteca INTEIRA — as mesmas em toda consulta. */
  contagens: ContagensDaBiblioteca
}

/**
 * A lista de L para uma consulta. `indice` é o `buildIndex` da mesma biblioteca (a tela o memoiza por referência,
 * como a S4 faz): a busca de L é a da S4, sem o corte de 50 (N4-D90).
 */
export function consultarBiblioteca(
  biblioteca: readonly ContentDTO[],
  indice: SearchIndex,
  consulta: ConsultaDaBiblioteca,
): RespostaDaBiblioteca {
  const casados =
    normalizeForSearch(consulta.termo) === ''
      ? null
      : new Set(searchIndex(indice, consulta.termo, Number.POSITIVE_INFINITY).map((h) => h.id))
  const tipos = new Set<string>(consulta.tipos)
  const itens = ordenarBiblioteca(biblioteca).filter(
    (c) =>
      (tipos.size === 0 || tipos.has(c.content_type)) &&
      (!consulta.favoritas || ehFavorita(c)) &&
      (casados === null || casados.has(c.id)),
  )
  return { itens, n: itens.length, contagens: contarBiblioteca(biblioteca) }
}
