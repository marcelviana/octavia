/**
 * LEITURA DE LABORATÓRIO das regras R1–R4 — instrumento dos controles negativos da QL-PR1, **não é a PR-2**.
 *
 * O `cn-gate-quebra.sh` copia este arquivo por cima de `packages/core/src/quebra.ts`, roda o gate da quebra
 * (`tests/gates/ql-quebra.test.ts`) e devolve o contrato com `git checkout`. Serve para provar que o gate DISTINGUE:
 *
 *   - CN-1 (sem `LAB_DEFEITO`): esta leitura aplica R1–R4 como a folha os desenhou (reproduz as 44 molduras de Letra e
 *     Cifra) e **não mede** o `\t`, o `\r` nem o acento combinante (conta 1 por unidade UTF-16) — o gate tem de passar
 *     nas regras e na invariância e reprovar exatamente os casos do (iii) cujo corte depende da medida;
 *   - CN-2…CN-4 (`LAB_DEFEITO=letra|palavra|ordem`): a mesma leitura com um defeito que MUDA O TEXTO — uma letra trocada,
 *     uma palavra a menos, duas linhas lógicas fora de ordem — e o (ii), a invariância, tem de reprovar.
 *
 * O reconhecedor de linha de acordes é a heurística da Fase B (`QL-PRECHECK-anexos/fase-b/q2-cifra-pares.sql`).
 */
export const RECUO_DA_CONTINUACAO = 2

export interface LinhaVisual {
  texto: string
  logica: number
  continuacao: boolean
  inicio: number
  fim: number
}

const ACORDE = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(\/[A-G](#|b)?)?$/
const SEP = /^([|:.-]+|x?[0-9]+x?|\([0-9]+x\))$/
const DEFEITO = typeof process !== 'undefined' ? process.env.LAB_DEFEITO ?? '' : ''

function ehAcordes(l: string): boolean {
  const t = l.trim()
  if (t === '') return false
  let a = 0
  for (const k of t.split(/[ \t]+/)) {
    if (ACORDE.test(k)) a++
    else if (!SEP.test(k)) return false
  }
  return a > 0
}

const espacosNoComeco = (s: string): number => /^ */.exec(s)![0].length

function letra(L: string, w: number): { ini: number; fim: number }[] {
  const out: { ini: number; fim: number }[] = []
  let pos = 0
  let primeiro = true
  for (;;) {
    const W = primeiro ? w : w - RECUO_DA_CONTINUACAO
    const resto = L.slice(pos)
    if (resto.length <= W) {
      out.push({ ini: pos, fim: L.length })
      break
    }
    let p = -1
    for (let i = Math.min(W, resto.length - 1); i >= 1; i--) if (resto[i] === ' ') { p = i; break }
    let fim = pos + W
    let prox = pos + W
    if (p > 0) {
      fim = pos + p
      while (fim > pos && L[fim - 1] === ' ') fim--
      prox = pos + p + 1
      while (prox < L.length && L[prox] === ' ') prox++
      if (fim === pos) { fim = pos + W; prox = pos + W }
    }
    out.push({ ini: pos, fim })
    pos = prox
    primeiro = false
    if (pos >= L.length) break
  }
  return out
}

function par(C: string, T: string, w: number): { ini: number; fimC: number; fimT: number }[] {
  const out: { ini: number; fimC: number; fimT: number }[] = []
  const dentroDeAcorde = (s: string, i: number): boolean => i > 0 && i < s.length && s[i - 1] !== ' ' && s[i] !== ' '
  let pos = 0
  let primeiro = true
  for (;;) {
    const W = primeiro ? w : w - RECUO_DA_CONTINUACAO
    const rc = C.slice(pos)
    const rt = T.slice(pos)
    if (Math.max(rc.replace(/ +$/, '').length, rt.length) <= W) {
      out.push({ ini: pos, fimC: C.length, fimT: T.length })
      break
    }
    let p = -1
    for (let i = W; i >= 1; i--) if ((i >= rc.length || rc[i] === ' ') && (i >= rt.length || rt[i] === ' ')) { p = i; break }
    let semEspaco = false
    if (p < 0) {
      for (let i = W; i >= 1; i--) if (!dentroDeAcorde(rc, i)) { p = i; break }
      semEspaco = true
    }
    let fimC = Math.min(C.length, pos + p)
    while (fimC > pos && C[fimC - 1] === ' ') fimC--
    let fimT = Math.min(T.length, pos + p)
    while (fimT > pos && T[fimT - 1] === ' ') fimT--
    out.push({ ini: pos, fimC, fimT })
    let prox = pos + p + (semEspaco ? 0 : 1)
    const k = Math.min(
      prox < C.length ? espacosNoComeco(C.slice(prox)) : Infinity,
      prox < T.length ? espacosNoComeco(T.slice(prox)) : Infinity,
    )
    if (k !== Infinity) prox += k
    pos = prox
    primeiro = false
    if (pos >= C.length && pos >= T.length) break
  }
  return out
}

export function quebrar(texto: string, tipo: string, colunas: number): LinhaVisual[] {
  const L = texto.split('\n')
  const out: LinhaVisual[] = []
  const recuo = (j: number): string => (j > 0 ? ' '.repeat(RECUO_DA_CONTINUACAO) : '')
  for (let i = 0; i < L.length; i++) {
    const linha = L[i]!
    if (tipo === 'Tab') {
      out.push({ texto: linha, logica: i, continuacao: false, inicio: 0, fim: linha.length })
      continue
    }
    const baixo = L[i + 1]
    if (tipo === 'Chords' && ehAcordes(linha) && baixo !== undefined && baixo.trim() !== '' && !ehAcordes(baixo)) {
      par(linha, baixo, colunas).forEach((p, j) => {
        const c = linha.slice(p.ini, p.fimC)
        if (c.trim() !== '') out.push({ texto: recuo(j) + c, logica: i, continuacao: j > 0, inicio: p.ini, fim: p.fimC })
        out.push({ texto: recuo(j) + baixo.slice(p.ini, p.fimT), logica: i + 1, continuacao: j > 0, inicio: p.ini, fim: p.fimT })
      })
      i++
      continue
    }
    letra(linha, colunas).forEach((p, j) =>
      out.push({ texto: recuo(j) + linha.slice(p.ini, p.fim), logica: i, continuacao: j > 0, inicio: p.ini, fim: p.fim }),
    )
  }
  // Os defeitos que MUDAM O TEXTO (CN-2…CN-4) — a invariância (ii) tem de reprovar cada um.
  if (DEFEITO === 'letra') {
    // o último caractere da primeira linha visual não vazia vira `?`
    const k = out.findIndex((l) => l.texto !== '')
    if (k >= 0) out[k] = { ...out[k]!, texto: out[k]!.texto.slice(0, -1) + '?' }
    return out
  }
  if (DEFEITO === 'palavra') {
    // a primeira continuação começa uma palavra adiante: a palavra some, e o que fica entre os pedaços não é só espaço
    const k = out.findIndex((l) => l.continuacao && l.texto.trim().includes(' '))
    if (k < 0) return out
    const l = out[k]!
    const linha = L[l.logica]!
    const salto = linha.indexOf(' ', l.inicio) + 1
    out[k] = { ...l, inicio: salto, texto: recuo(1) + linha.slice(salto, l.fim) }
    return out
  }
  if (DEFEITO === 'ordem') {
    const a = out.findIndex((l) => l.logica === 1)
    const b = out.findIndex((l) => l.logica === 2)
    if (a >= 0 && b >= 0) [out[a], out[b]] = [out[b]!, out[a]!]
    return out
  }
  return out
}
