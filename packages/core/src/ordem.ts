/**
 * A ORDEM de uma setlist no modo de reordenar (N2-PR5; PRD T2-R8; N2-D27;
 * N2-D36; div. 155).
 *
 * Puro, como todo o core: aqui não há gesto, não há tela e não há request. O
 * modo de reordenar pergunta a este módulo **para onde** a linha erguida cai,
 * **qual** é a ordem depois de soltar, **se** alguma coisa mudou e **se** a
 * setlist pode ser reordenada — e manda o resultado pelo `pedidoReordenar` do
 * `escrita.ts`, que já existe desde a N2-PR2.
 *
 * As ordens aqui são listas de `setlist_songs.id` (T2-R8: "a permutação
 * completa dos `setlist_songs.id`"), nunca de `content_id` — um bis são duas
 * linhas e duas posições.
 */

/**
 * O teto do contrato: `order` é "strict, 1..100 itens" (`SETLISTS.md` §order).
 * Acima dele a rota recusa com 400, e por isso a tela nem oferece o gesto: o
 * `Reordenar` fica inativo com o motivo escrito (N2-X-100, N2-D17). A correção
 * do teto é do Bloco D (N2-D29).
 */
export const TETO_DO_REORDENAR = 100

/** A setlist de `n` músicas pode ser reordenada por arrasto? */
export function reordenavel(n: number): boolean {
  return n <= TETO_DO_REORDENAR
}

/**
 * A lista com o item de `de` movido para `para` (índices a partir de 0). Não
 * muta a entrada: a ordem do servidor e a arrastada convivem na tela depois
 * de uma falha (R2·1), e uma não pode virar a outra por acidente.
 */
export function mover<T>(lista: readonly T[], de: number, para: number): T[] {
  const n = lista.length
  if (!Number.isInteger(de) || !Number.isInteger(para) || de < 0 || de >= n || para < 0 || para >= n) {
    throw new Error(`mover: índice fora da lista (de=${de}, para=${para}, n=${n})`)
  }
  const saida = [...lista]
  const [item] = saida.splice(de, 1)
  saida.splice(para, 0, item as T)
  return saida
}

/**
 * **N2-D36** — o "nada mudou" do reordenar: a mesma sequência, elemento a
 * elemento. `Salvar a ordem` com a ordem inalterada fecha o modo sem request,
 * como o `Cancelar`; a comparação é esta.
 */
export function mesmaOrdem(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

/**
 * Onde a linha erguida cai: a posição de origem mais o deslocamento em
 * PASSOS de linha, arredondado pelo meio da linha e saturado nas duas pontas
 * da lista. `passo` é a altura da linha mais o vão entre linhas.
 */
export function alvoDoArrasto(de: number, deslocamento: number, passo: number, n: number): number {
  if (n <= 0) return 0
  const alvo = de + Math.round(deslocamento / passo)
  return Math.min(n - 1, Math.max(0, alvo))
}
