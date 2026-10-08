/**
 * O TEXTO LÓGICO do corpo desenhado — bloco QL, PR-1 (QL-D16; `docs/native/QL-REQUISITOS.md` QL-R19, A-QL-5).
 *
 * Os três instrumentos que leem o nó `corpo` desenhado — o G-par de V (`apps/native/test/g-par-visualizacao.test.tsx`),
 * o (e) do G-N3 (`g-n3.mjs`) e o comprimento com `sha12` (`corpo-logico.mjs`) — comparavam o TEXTO do nó com o texto
 * da música. Com a quebra (QL) o nó deixa de ter o texto: tem as linhas visuais. Daqui em diante os três comparam o
 * TEXTO LÓGICO: o desenho vale como o texto `logico` quando ele é uma QUEBRA desse texto.
 *
 * POR QUE NÃO SE RECONSTRÓI O TEXTO SÓ DO DESENHO (div. 1199). A concatenação das linhas visuais tirando o recuo das
 * continuações não devolve o texto: o espaço do corte some (R1), os espaços do fim de um pedaço e do começo do resto
 * saem (R3), o pedaço de acordes só de espaço não ocupa linha (R3), o par intercala duas linhas lógicas (R2), e uma
 * continuação (`"  lá"`) não se distingue de uma linha lógica que começa com dois espaços (uma linha de acordes). O
 * instrumento precisa do texto de referência — que os três têm: o retrato do site (G-par), o dump da paisagem da base
 * congelada (G-N3) e o texto do cache (o `sha12`).
 *
 * O QUE `ehQuebraDe` ACEITA — a forma, não a escolha do corte (essa é do gate (i), `tests/gates/ql-quebra.test.ts`):
 * as linhas desenhadas saem das linhas lógicas, em ordem, cada linha lógica partida em pedaços que são FATIAS dela,
 * com SÓ ESPAÇO (U+0020) entre os pedaços e depois do último; cada pedaço depois do primeiro desenhado com o recuo de 2
 * espaços; e, no PAR (duas linhas lógicas seguidas), os pedaços das duas intercalados — o de cima antes do de baixo —,
 * cada par de pedaços começando na MESMA posição das duas linhas (o acorde sobre a sílaba), e o pedaço de cima omitido
 * quando é só espaço. **Não aceita**: caractere trocado, acrescentado (fora o recuo) ou tirado (fora espaço), linha
 * fora de ordem, recuo diferente de 2. Sem quebra nenhuma, o desenho é o próprio texto, linha a linha.
 *
 * O QUE NÃO MEDE (declarado): se o corte está no lugar que as regras mandam (o gate (i)); se o par é de acordes (a
 * heurística é da PR-2) — dois pedaços intercalados com o mesmo começo bastam; geometria.
 */

const RECUO = '  '

const soEspaco = (s) => /^ *$/.test(s)
/** A primeira posição ≥ `p` que não é espaço (o fim da linha, se não há). */
function naoEspaco(s, p) {
  let i = p
  while (i < s.length && s[i] === ' ') i++
  return i
}

/**
 * As linhas desenhadas `desenho` são uma quebra do texto `logico`?
 *
 * @param {string[]} desenho as linhas visuais, na ordem do desenho
 * @param {string} logico o texto de referência (o `bodyOf`)
 * @returns {{ ok: boolean, continuacoes: number, linhasLogicas: number, motivo: string | null }}
 */
export function ehQuebraDe(desenho, logico) {
  const L = logico.split('\n')
  const D = desenho
  if (D.length === L.length && D.every((d, i) => d === L[i])) return { ok: true, continuacoes: 0, linhasLogicas: L.length, motivo: null }

  // casa(i, d): a menor contagem de continuações com que L[i..] se desenha em D[d..]; -1 se não se desenha
  const memo = new Map()
  function casa(i, d) {
    if (i === L.length) return d === D.length ? 0 : -1
    const k = i * (D.length + 1) + d
    if (memo.has(k)) return memo.get(k)
    memo.set(k, -1)
    let melhor = -1
    const tentar = (fins, salto) => {
      for (const [d2, c] of fins) {
        const r = casa(i + salto, d2)
        if (r >= 0 && (melhor < 0 || r + c < melhor)) melhor = r + c
      }
    }
    tentar(sozinha(L[i], d), 1)
    if (i + 1 < L.length) tentar(emPar(L[i], L[i + 1], d), 2)
    memo.set(k, melhor)
    return melhor
  }

  /** Os fins possíveis `[d', continuações]` de uma linha lógica sozinha desenhada a partir de D[d]. */
  function sozinha(linha, d) {
    const fins = []
    const X = D[d]
    if (X === undefined) return fins
    if (X === '' ? !soEspaco(linha) : !linha.startsWith(X)) return fins
    const passo = (pos, dd, cont) => {
      if (soEspaco(linha.slice(pos))) fins.push([dd, cont])
      const Y = D[dd]
      if (Y === undefined || !Y.startsWith(RECUO)) return
      const y = Y.slice(RECUO.length)
      if (y === '' || pos >= linha.length) return
      for (let p = pos; p <= naoEspaco(linha, pos); p++) {
        if (linha.startsWith(y, p)) passo(p + y.length, dd + 1, cont + 1)
      }
    }
    passo(X.length, d + 1, 0)
    return fins
  }

  /**
   * Os fins possíveis de um PAR (C em cima, T embaixo) desenhado a partir de D[d]: os pedaços de número j das duas
   * linhas começam na mesma posição `s`; o de cima vem antes do de baixo; o de cima só de espaço não se desenha.
   */
  function emPar(C, T, d) {
    const fins = []
    const seguir = (fimC, fimT, dd, cont, j) => {
      if (soEspaco(C.slice(fimC)) && soEspaco(T.slice(fimT))) fins.push([dd, cont])
      for (let s2 = Math.max(fimC, fimT); s2 <= Math.max(C.length, T.length); s2++) {
        if (!soEspaco(C.slice(fimC, s2)) || !soEspaco(T.slice(fimT, s2))) break
        if (soEspaco(C.slice(s2)) && soEspaco(T.slice(s2))) break
        passo(s2, dd, j + 1, cont)
      }
    }
    const passo = (s, dd, j, cont) => {
      const r = j > 0 ? RECUO : ''
      const n = j > 0 ? 1 : 0
      const sem = (X) => (X !== undefined && X.startsWith(r) ? X.slice(r.length) : null)
      // o pedaço de cima desenhado — e o de baixo logo depois, ou nenhum se a linha de baixo acabou
      const xc = sem(D[dd])
      if (xc !== null && !soEspaco(xc) && C.slice(s).startsWith(xc)) {
        const xt = sem(D[dd + 1])
        if (xt !== null && xt !== '' && T.slice(s).startsWith(xt)) seguir(s + xc.length, s + xt.length, dd + 2, cont + 2 * n, j)
        if (soEspaco(T.slice(s))) seguir(s + xc.length, Math.max(s, T.length), dd + 1, cont + n, j)
      }
      // o pedaço de cima só de espaço não ocupa linha (R3): só o de baixo
      const xt = sem(D[dd])
      if (xt !== null && xt !== '' && T.slice(s).startsWith(xt)) seguir(s, s + xt.length, dd + 1, cont + n, j)
    }
    passo(0, d, 0, 0)
    return fins
  }

  const c = casa(0, 0)
  if (c < 0) return { ok: false, continuacoes: 0, linhasLogicas: L.length, motivo: `as ${D.length} linhas desenhadas não são uma quebra das ${L.length} linhas lógicas` }
  return { ok: true, continuacoes: c, linhasLogicas: L.length, motivo: null }
}
