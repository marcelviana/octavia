/**
 * A QUEBRA DE LINHA DO CORPO (bloco QL). O contrato é da PR-1 (QL-D41); a lógica, da PR-2
 * (`docs/native/QL-REQUISITOS.md` §3). Nenhuma tela a chama ainda — quem a liga ao leitor
 * (`apps/native/src/screens/Leitor.tsx`) é a PR-3.
 *
 * O que ela faz (QL-D13; QL-R2): recebe o texto do corpo como o `bodyOf` o devolve, o tipo e o número de COLUNAS que
 * cabem na coluna do leitor — o app mede a largura da coluna e a de um caractere da mono no zoom corrente e divide
 * (QL-R21) — e devolve as LINHAS VISUAIS, na ordem em que se desenham. **Só exibição** (QL-D2; QL-R1): o texto não muda,
 * e esta função **não entra no `bodyOf`** — a busca segue indexando o texto lógico (`search.ts`, QL-D13; o gate
 * estrutural está em `tests/gates/ql-quebra.test.ts`).
 *
 * As regras do corte são as da folha congelada (`docs/native/DESIGN-QL/README.md` §3.1, QL-D28/D29; QL-D22/D23):
 *
 *   R1 · Letra — corta no último espaço que cabe; o espaço do corte não aparece em nenhum dos dois pedaços; só parte uma
 *        palavra se ela sozinha for maior que a coluna, e aí na última coluna.
 *   R2 · o par da Cifra — a linha de acordes e a de letra logo abaixo cortam na MESMA coluna; o corte recua até o
 *        primeiro ponto que não parte nem um acorde nem uma palavra, nas duas linhas; sem esse ponto, a palavra pode
 *        partir, o acorde nunca (o corte vai para a última coluna fora de acorde).
 *   R3 · continuação — cada pedaço depois do primeiro começa com `RECUO_DA_CONTINUACAO` (2) colunas de recuo, nas duas
 *        linhas do par; a coluna útil da continuação é colunas − 2; os espaços que sobram no começo do resto saem na mesma
 *        quantidade das duas linhas (o acorde continua sobre a mesma sílaba); um pedaço de acordes vazio não ocupa linha.
 *   R4 · fora do par — a linha quase acorde (*Intro: Am  E*) quebra como letra (a reserva é por linha); a progressão de
 *        uma seção (*Am  F  C  G*) faz par com a linha de baixo; o par só existe na Cifra — a Letra quebra sempre como
 *        letra; a **Tab não quebra**.
 *
 * A MEDIDA (QL-D24; QL-R9) — a função mede sem normalizar o texto: o `\t` avança até a próxima coluna múltipla de 8; o
 * `\r` do fim da linha conta 0; o acento combinante conta 0; todo outro caractere conta 1.
 *
 * O RECONHECEDOR DA LINHA DE ACORDES (`ehLinhaDeAcordes`) é a heurística que o pre-check declarou e a Fase B mediu no
 * dado real (`docs/native/QL-PRECHECK-anexos/fase-b/q2-cifra-pares.sql`, o cabeçalho; `QL-PRECHECK.md` §3.1 e §10.2):
 * cada pedaço da linha separado por espaço ou tab é um TOKEN; a linha é de acordes quando TODO token é acorde ou
 * separador e há ao menos um acorde. A linha que tem acorde e também outra palavra (a QUASE ACORDE, com ou sem maioria
 * de acordes) não é de acordes: não forma par e quebra como letra (R4; QL-D23). Exemplos, e a decisão de cada um no
 * `docs/native/QL-PR2-anexos/README.md` §2:
 *
 *   entram (linha de acordes):     `Am  F  C  G` · `Am            F              C` · `C  |  G  x2` · `Am  F  C  G  (2x)`
 *                                  · `D/F#  Gsus4  Bb` · `F#m7(11)`
 *   não entram (quebram como letra): `Intro: Am  E` · `Intro: Am  E  F#m7(11)  G` (maioria de acordes, e ainda assim
 *                                  fora) · `A noite chega` · `E o dia` · `Refrão` · `x2` (só separador) · a linha vazia
 *
 * O PAR (R2, R4): na Cifra, a linha de acordes seguida de uma linha não vazia que não é de acordes. A linha de acordes
 * sem letra embaixo (a última da seção, ou seguida de outra de acordes ou de linha vazia) não tem par e quebra como letra
 * — **mas o acorde nunca parte** (QL-D45, o aval da PR-2: a R2 se estende a ela): um acorde maior que a coluna fica
 * inteiro e a linha passa da coluna, como no par. Na Letra a linha de acordes quebra como letra, acorde e tudo (QL-D22).
 *
 * O que `quebrar` GARANTE (a invariância, QL-R1 / A-QL-2; o gate (ii) de `tests/gates/ql-quebra.test.ts` a confere caso a
 * caso, e `quebra.test.ts` nos casos de borda). Com `L = texto.split('\n')`:
 *
 *   1. toda linha visual é `(continuacao ? '  ' : '') + L[logica].slice(inicio, fim)` — nenhum caractere trocado, nenhum
 *      acrescentado além do recuo;
 *   2. `continuacao` ⇔ `inicio > 0`;
 *   3. toda linha lógica tem ao menos uma linha visual (a linha vazia tem uma, `''`), e a primeira linha visual de cada
 *      linha lógica sai depois da primeira da anterior — no par, os pedaços das duas linhas se intercalam, acordes antes
 *      da letra;
 *   4. os pedaços de uma linha lógica não se sobrepõem, em ordem de `inicio`, e **tudo o que fica fora deles é espaço**
 *      (U+0020): o espaço do corte (R1), os espaços do fim de um pedaço e do começo do resto (R3), e o pedaço de acordes
 *      só de espaço que não ocupa linha (R3).
 *
 * Logo, **juntar as linhas visuais tirando o recuo das continuações, cada pedaço no seu `inicio` e o que falta entre
 * eles preenchido com espaço, devolve o texto lógico byte a byte.** A junção precisa do `inicio`: a concatenação
 * simples perde o espaço do corte da R1 e os espaços que a R3 tira, e o par intercala duas linhas lógicas (div. 1199).
 *
 * `inicio` e `fim` são posições do `String.prototype.slice` (unidades UTF-16), não colunas: com `\t`, `\r` e acento
 * combinante as duas contas divergem, e é a posição que devolve o texto. Por isso a função trabalha sobre CÉLULAS — um
 * ponto de código e os acentos combinantes que o seguem —, e nenhum corte cai dentro de uma célula: o acento não se
 * separa da letra, e um par substituto (o emoji) não se parte.
 *
 * A COLUNA DO `\t` é a da linha DESENHADA: a continuação começa na coluna 2 (o recuo), e a tabulação de uma continuação
 * avança até a próxima múltipla de 8 contada daí — é o que cada linha visual ocupa quando se desenha sozinha.
 *
 * Os casos de borda que R1–R4 não decidem sozinhas têm o comportamento escrito em `quebra.test.ts`, cada um com o porquê;
 * os que viraram pergunta ao Marcel foram decididos no aval da PR-2 (QL-D43…QL-D47, `docs/native/QL-PR2-anexos/README.md`).
 */

/** As colunas de recuo de cada continuação (R3; QL-D29: o recuo de 2, sem glifo). */
export const RECUO_DA_CONTINUACAO = 2

/** Uma linha como se desenha no leitor — um pedaço de uma linha lógica do corpo. */
export interface LinhaVisual {
  /** O que se desenha: o recuo (nas continuações) e o pedaço. Nunca termina em espaço, salvo o fim da linha lógica. */
  texto: string
  /** O índice da linha lógica de onde o pedaço veio (`texto.split('\n')`). */
  logica: number
  /** O pedaço não é o primeiro da linha lógica: começa com o recuo de 2 colunas (R3). */
  continuacao: boolean
  /** Onde o pedaço começa na linha lógica (posição de `slice`, sem o recuo). */
  inicio: number
  /** Onde o pedaço termina na linha lógica (posição de `slice`, exclusiva). */
  fim: number
}

// ── o reconhecedor (a heurística da Fase B, `q2-cifra-pares.sql`, verbatim) ───────────────────────────────────────

const ACORDE = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(\/[A-G](#|b)?)?$/
const SEPARADOR = /^([|:.-]+|x?[0-9]+x?|\([0-9]+x\))$/

/**
 * A linha é de acordes: todo token (pedaço separado por espaço ou tab) é acorde ou separador, e há ao menos um acorde.
 * O `\r` do fim da linha não é token (QL-D24: ele é o fim da linha colada com CRLF, não conteúdo).
 */
export function ehLinhaDeAcordes(linha: string): boolean {
  const t = linha.replace(/\r$/, '').replace(/^[ \t]+|[ \t]+$/g, '')
  if (t === '') return false
  let acordes = 0
  for (const token of t.split(/[ \t]+/)) {
    if (ACORDE.test(token)) acordes++
    else if (!SEPARADOR.test(token)) return false
  }
  return acordes > 0
}

// ── as células e a medida (QL-D24) ─────────────────────────────────────────────────────────────────────────────────

/** `esp` = U+0020 (o único ponto de corte e o único que pode ficar fora dos pedaços); `zero` = conta 0 colunas. */
type Tipo = 'esp' | 'tab' | 'zero' | 'um'
interface Celula {
  u0: number
  u1: number
  tipo: Tipo
}

const COMBINANTE = /^[\p{Mn}\p{Me}]$/u

/** A linha em células: um ponto de código e os acentos combinantes que vêm depois dele. */
function celulas(linha: string): Celula[] {
  const out: Celula[] = []
  let u = 0
  for (const cp of linha) {
    const u1 = u + cp.length
    const ultima = out[out.length - 1]
    if (ultima !== undefined && COMBINANTE.test(cp)) ultima.u1 = u1
    else out.push({ u0: u, u1, tipo: cp === ' ' ? 'esp' : cp === '\t' ? 'tab' : COMBINANTE.test(cp) ? 'zero' : 'um' })
    u = u1
  }
  // o `\r` do fim da linha conta 0
  const fim = out[out.length - 1]
  if (fim !== undefined && fim.u1 - fim.u0 === 1 && linha[fim.u0] === '\r') fim.tipo = 'zero'
  return out
}

/** A largura da célula desenhada a partir da coluna `col` (o `\t` vai até a próxima múltipla de 8). */
function largura(c: Celula, col: number): number {
  return c.tipo === 'tab' ? 8 - (col % 8) : c.tipo === 'zero' ? 0 : 1
}

/** As colunas das células `k..n-1` desenhadas a partir da coluna `d0`: onde cada uma começa e termina (índice `j - k`). */
function colunasDe(cl: Celula[], k: number, d0: number): { c0: number[]; c1: number[] } {
  const c0: number[] = []
  const c1: number[] = []
  let col = d0
  for (let j = k; j < cl.length; j++) {
    c0.push(col)
    col += largura(cl[j]!, col)
    c1.push(col)
  }
  return { c0, c1 }
}

/** Uma fatia de células `[k0, k1)`. */
interface Fatia {
  k0: number
  k1: number
}

const ehEsp = (cl: Celula[], j: number): boolean => cl[j]?.tipo === 'esp'

/** O fim da fatia `[k, fim)` sem os espaços do fim. */
function semEspacosNoFim(cl: Celula[], k: number, fim: number): number {
  while (fim > k && ehEsp(cl, fim - 1)) fim--
  return fim
}

/** A primeira célula a partir de `j` que não é espaço. */
function depoisDosEspacos(cl: Celula[], j: number): number {
  while (j < cl.length && ehEsp(cl, j)) j++
  return j
}

/** A coluna do fim do conteúdo desenhado de `[k, fim)` (`d0` se vazio). */
function fimEmColunas(cols: { c1: number[] }, k: number, fim: number, d0: number): number {
  return fim > k ? cols.c1[fim - 1 - k]! : d0
}

// ── R1 · a Letra ───────────────────────────────────────────────────────────────────────────────────────────────────

/** `acordeInteiro` (QL-D45): a linha de acordes sozinha, na Cifra — a palavra maior que a coluna não parte. */
function cortarLetra(cl: Celula[], w: number, acordeInteiro = false): Fatia[] {
  const out: Fatia[] = []
  const n = cl.length
  let k = 0
  for (let primeiro = true; ; primeiro = false) {
    const d0 = primeiro ? 0 : RECUO_DA_CONTINUACAO
    const cols = colunasDe(cl, k, d0)
    // o resto cabe — inteiro, ou sem os espaços do fim (que ficam fora, como o espaço do corte)
    if (fimEmColunas(cols, k, n, d0) <= w) {
      out.push({ k0: k, k1: n })
      break
    }
    const semEsp = semEspacosNoFim(cl, k, n)
    if (fimEmColunas(cols, k, semEsp, d0) <= w) {
      out.push({ k0: k, k1: semEsp })
      break
    }
    // o último espaço que cabe: o que vem antes dele termina até a coluna `w`
    let corte = -1
    for (let j = n - 1; j > k; j--) if (ehEsp(cl, j) && cols.c0[j - k]! <= w) { corte = j; break }
    let fim: number
    let prox: number
    if (corte > 0) {
      fim = semEspacosNoFim(cl, k, corte)
      prox = depoisDosEspacos(cl, corte + 1)
    } else if (acordeInteiro) {
      // QL-D45: o acorde maior que a coluna fica inteiro — o pedaço vai até o fim dele e passa da coluna
      fim = k + 1
      while (fim < n && !ehEsp(cl, fim)) fim++
      prox = depoisDosEspacos(cl, fim)
    } else {
      // a palavra sozinha é maior que a coluna: parte na última coluna (ao menos uma célula, para andar)
      fim = k + 1
      while (fim < n && cols.c1[fim - k]! <= w) fim++
      prox = depoisDosEspacos(cl, fim)
    }
    out.push({ k0: k, k1: fim })
    if (prox >= n) break
    k = prox
  }
  return out
}

// ── R2 · o par da Cifra ────────────────────────────────────────────────────────────────────────────────────────────

/** Em que célula está a coluna `x` (−1 se depois do fim; −2 se a coluna é o meio de uma célula larga, o `\t`). */
function celulaNaColuna(cols: { c0: number[]; c1: number[] }, k: number, x: number): number {
  for (let j = 0; j < cols.c0.length; j++) {
    if (cols.c1[j]! <= x) continue
    if (cols.c0[j]! === x) return k + j
    return cols.c0[j]! < x ? -2 : k + j
  }
  return -1
}

/** A célula onde a fatia termina se o corte cair na coluna `x` (a primeira que começa em `x` ou depois). */
function celulaDaFronteira(cols: { c0: number[] }, k: number, n: number, x: number): number {
  for (let j = 0; j < cols.c0.length; j++) if (cols.c0[j]! >= x) return k + j
  return n
}

/** A coluna `x` é fronteira de células nesta linha (não cai no meio de um `\t`). */
const ehFronteira = (cols: { c0: number[]; c1: number[] }, k: number, x: number): boolean => celulaNaColuna(cols, k, x) !== -2

interface Lado {
  cl: Celula[]
  k: number
  cols: { c0: number[]; c1: number[] }
}

/** Espaço — ou o fim da linha — na coluna `x`. */
function espacoOuFim(l: Lado, x: number): boolean {
  const j = celulaNaColuna(l.cols, l.k, x)
  return j === -1 || (j >= 0 && ehEsp(l.cl, j))
}

/** A coluna `x` cai entre duas células que não são espaço da linha de acordes — dentro de um acorde. */
function dentroDeAcorde(l: Lado, x: number): boolean {
  const j = celulaNaColuna(l.cols, l.k, x)
  if (j < 0) return j === -2
  return j > l.k && !ehEsp(l.cl, j - 1) && !ehEsp(l.cl, j)
}

interface FatiaDoPar {
  acordes: Fatia
  letra: Fatia
}

function cortarPar(clA: Celula[], clL: Celula[], w: number): FatiaDoPar[] {
  const out: FatiaDoPar[] = []
  const nA = clA.length
  const nL = clL.length
  let kA = 0
  let kL = 0
  for (let primeiro = true; ; primeiro = false) {
    const d0 = primeiro ? 0 : RECUO_DA_CONTINUACAO
    const A: Lado = { cl: clA, k: kA, cols: colunasDe(clA, kA, d0) }
    const L: Lado = { cl: clL, k: kL, cols: colunasDe(clL, kL, d0) }
    const fimA = (fim: number): number => fimEmColunas(A.cols, kA, fim, d0)
    const fimL = (fim: number): number => fimEmColunas(L.cols, kL, fim, d0)
    // o resto das duas cabe
    const semEspA = semEspacosNoFim(clA, kA, nA)
    const semEspL = semEspacosNoFim(clL, kL, nL)
    if (Math.max(fimA(semEspA), fimL(semEspL)) <= w) {
      out.push({
        acordes: { k0: kA, k1: fimA(nA) <= w ? nA : semEspA },
        letra: { k0: kL, k1: fimL(nL) <= w ? nL : semEspL },
      })
      break
    }
    // o primeiro ponto, recuando da coluna `w`, que não parte nem acorde nem palavra: espaço (ou fim) nas duas linhas
    let x = -1
    let comEspaco = true
    for (let c = w; c > d0; c--) if (espacoOuFim(A, c) && espacoOuFim(L, c)) { x = c; break }
    if (x < 0) {
      // sem esse ponto: a palavra pode partir, o acorde nunca — a última coluna fora de acorde
      comEspaco = false
      for (let c = w; c > d0; c--) if (!dentroDeAcorde(A, c) && ehFronteira(L.cols, kL, c)) { x = c; break }
      // nem essa: o acorde é maior que a coluna — ele não parte, e o pedaço passa da coluna até o fim dele
      if (x < 0) {
        const limite = Math.max(fimA(nA), fimL(nL))
        for (let c = w + 1; c < limite; c++) if (!dentroDeAcorde(A, c) && ehFronteira(L.cols, kL, c)) { x = c; break }
        if (x < 0) {
          out.push({ acordes: { k0: kA, k1: nA }, letra: { k0: kL, k1: nL } })
          break
        }
      }
    }
    const bA = celulaDaFronteira(A.cols, kA, nA, x)
    const bL = celulaDaFronteira(L.cols, kL, nL, x)
    out.push({ acordes: { k0: kA, k1: semEspacosNoFim(clA, kA, bA) }, letra: { k0: kL, k1: semEspacosNoFim(clL, kL, bL) } })
    // o espaço do corte sai das duas; depois, os espaços do começo do resto, na mesma quantidade nas duas (R3)
    let pA = comEspaco && bA < nA ? bA + 1 : bA
    let pL = comEspaco && bL < nL ? bL + 1 : bL
    const espA = pA < nA ? depoisDosEspacos(clA, pA) - pA : Infinity
    const espL = pL < nL ? depoisDosEspacos(clL, pL) - pL : Infinity
    const comum = Math.min(espA, espL)
    if (comum !== Infinity) {
      pA = Math.min(nA, pA + comum)
      pL = Math.min(nL, pL + comum)
    }
    if (pA >= nA && pL >= nL) break
    kA = pA
    kL = pL
  }
  return out
}

// ── a montagem ─────────────────────────────────────────────────────────────────────────────────────────────────────

function vazia(cl: Celula[], f: Fatia): boolean {
  for (let j = f.k0; j < f.k1; j++) if (!ehEsp(cl, j)) return false
  return true
}

function linhaVisual(linha: string, cl: Celula[], logica: number, f: Fatia, continuacao: boolean): LinhaVisual {
  const inicio = f.k0 < cl.length ? cl[f.k0]!.u0 : linha.length
  const fim = f.k1 > f.k0 ? cl[f.k1 - 1]!.u1 : inicio
  return {
    texto: (continuacao ? ' '.repeat(RECUO_DA_CONTINUACAO) : '') + linha.slice(inicio, fim),
    logica,
    continuacao,
    inicio,
    fim,
  }
}

/**
 * As linhas visuais do corpo em `colunas` colunas (R1–R4, a medida do QL-D24, a invariância acima).
 *
 * @param texto   o corpo de texto, como o `bodyOf` o devolve (não normalizado).
 * @param tipo    o `content_type`: `'Chords'` forma o par; `'Tab'` não quebra; qualquer outro quebra como Letra.
 * @param colunas inteiro, maior que `RECUO_DA_CONTINUACAO` — a continuação precisa de ao menos uma coluna útil. Fora
 *                disso, `RangeError`.
 */
export function quebrar(texto: string, tipo: string, colunas: number): LinhaVisual[] {
  if (!Number.isInteger(colunas) || colunas <= RECUO_DA_CONTINUACAO) {
    throw new RangeError(`quebrar: colunas tem de ser inteiro maior que ${RECUO_DA_CONTINUACAO} (veio ${colunas})`)
  }
  const L = texto.split('\n')
  const out: LinhaVisual[] = []
  for (let i = 0; i < L.length; i++) {
    const linha = L[i]!
    // R4: a Tab não quebra
    if (tipo === 'Tab') {
      out.push({ texto: linha, logica: i, continuacao: false, inicio: 0, fim: linha.length })
      continue
    }
    const cl = celulas(linha)
    const baixo = L[i + 1]
    // R2/R4: o par — só na Cifra, a linha de acordes com uma linha de letra embaixo
    if (tipo === 'Chords' && baixo !== undefined && ehLinhaDeAcordes(linha) && baixo.trim() !== '' && !ehLinhaDeAcordes(baixo)) {
      const clB = celulas(baixo)
      cortarPar(cl, clB, colunas).forEach((p, j) => {
        const cont = j > 0
        // R3: o pedaço de acordes vazio não ocupa linha — salvo o primeiro, que abre a linha lógica (invariância, item 3)
        if (!cont || !vazia(cl, p.acordes)) out.push(linhaVisual(linha, cl, i, p.acordes, cont))
        // e o pedaço de letra vazio de uma continuação também não
        if (!cont || !vazia(clB, p.letra)) out.push(linhaVisual(baixo, clB, i + 1, p.letra, cont))
      })
      i++
      continue
    }
    // R1: a Letra (e, fora do par, a linha de acordes — com o acorde inteiro na Cifra, QL-D45 — e a quase acorde)
    cortarLetra(cl, colunas, tipo === 'Chords' && ehLinhaDeAcordes(linha)).forEach((f, j) => out.push(linhaVisual(linha, cl, i, f, j > 0)))
  }
  return out
}
