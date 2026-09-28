/**
 * O texto do corpo mono de cada tipo (I1-PR-10, decisão 10 do aval, div. 742): TODO dado que a visualização
 * velha mostrava continua na tela, no corpo mono do painel do tipo; só os rótulos dos blocos (*"Chords:"*, *"Song
 * Structure"*, *"Chord Progression"*) saem. `null` = não há dado → o vazio do painel.
 *
 * As formas de `content_data` que o código de hoje lê (`components/content-viewer/*Display.tsx`, antes da PR-10):
 * cifra — `sections[]` (nome · acordes · letra), `chords[]` (nome, diagrama, dedilhado), `chords` texto, e a
 * `progression` ({seção: acordes}); letra — `lyrics` (+ `chords`, lista ou texto); tab — `tablature` (lista ou
 * texto) (+ `chords`); partitura — `notation` (texto).
 */
export type DadosDoConteudo = Record<string, unknown> | null | undefined

const texto = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
const lista = (v: unknown): unknown[] | null => (Array.isArray(v) && v.length > 0 ? v : null)
const juntar = (partes: (string | null | undefined)[], sep: string) => {
  const p = partes.filter((x): x is string => !!x)
  return p.length ? p.join(sep) : null
}

/** Os acordes soltos (a lista ou o texto) — o segundo painel *Cifra* da letra e da tab, e a cifra em lista. */
export function textoDosAcordes(chords: unknown): string | null {
  const t = texto(chords)
  if (t) return t
  const l = lista(chords)
  if (!l) return null
  return juntar(
    l.map((c) => {
      if (typeof c === "string") return c
      const o = (c ?? {}) as { name?: unknown; diagram?: unknown; fingering?: unknown }
      const diagrama = Array.isArray(o.diagram) ? o.diagram.filter((x): x is string => typeof x === "string").join("\n") : null
      return juntar([texto(o.name), diagrama || null, texto(o.fingering)], "\n")
    }),
    "\n\n",
  )
}

function textoDaProgressao(p: unknown): string | null {
  if (!p || typeof p !== "object" || Array.isArray(p)) return null
  return juntar(
    Object.entries(p as Record<string, unknown>).map(([secao, acordes]) =>
      `${secao}: ${Array.isArray(acordes) ? acordes.join(" - ") : String(acordes)}`),
    "\n",
  )
}

/** O corpo da cifra: as seções, ou os acordes (lista/texto); a progressão ao fim. */
export function textoDaCifra(d: DadosDoConteudo): string | null {
  const secoes = lista(d?.sections)
  const corpo = secoes
    ? juntar(secoes.map((s) => {
        const o = (s ?? {}) as { name?: unknown; chords?: unknown; lyrics?: unknown }
        return juntar([texto(o.name), texto(o.chords), texto(o.lyrics)], "\n")
      }), "\n\n")
    : textoDosAcordes(d?.chords)
  return juntar([corpo, textoDaProgressao(d?.progression)], "\n\n")
}

/** O corpo da tab: as linhas (lista) ou o texto. */
export function textoDaTab(d: DadosDoConteudo): string | null {
  const l = lista(d?.tablature)
  if (l) return juntar(l.map((x) => (typeof x === "string" ? x : null)), "\n")
  return texto(d?.tablature)
}

export const textoDaLetra = (d: DadosDoConteudo): string | null => texto(d?.lyrics)
export const textoDaNotacao = (d: DadosDoConteudo): string | null => texto(d?.notation)
