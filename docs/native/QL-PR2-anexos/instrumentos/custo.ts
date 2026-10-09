/**
 * O CUSTO de `quebrar` (QL-PR2) — instrumento de anexo (fora de CI, lint e typecheck, N4-D117). A função roda a cada
 * mudança de colunas no palco (o giro e o zoom); aqui ela roda 100 vezes por (texto, colunas) e se registram a mediana
 * e o máximo, em ms (`performance.now`, Node).
 *
 * As fixtures são INVENTADAS, com a FORMA do dado real do pre-check (`QL-PRECHECK.md` §10.1/§10.2), sem texto de música
 * de ninguém (regra 10):
 *   - a Letra: 50 linhas (6 vazias, as divisas de estrofe), a maior com 77 colunas, o p95 (posto mais próximo) em 46;
 *   - a Cifra: 40 linhas = 20 pares (a linha de acordes e a de letra), o maior par com 50 colunas.
 *
 * Uso (da RAIZ): pnpm exec tsx docs/native/QL-PR2-anexos/instrumentos/custo.ts
 */
import { quebrar } from '../../../../packages/core/src/quebra'

const PALAVRAS = 'a lanterna da fixture acende o cais devagar e o vento leva o barco pela areia fria enquanto a cidade dorme sem pressa'.split(' ')

/** Uma linha de letra inventada com exatamente `n` colunas (palavras do projeto, cortada na última). */
function linha(n: number, semente: number): string {
  let s = ''
  for (let k = semente; s.length < n; k++) s += (s ? ' ' : '') + PALAVRAS[k % PALAVRAS.length]
  s = s.slice(0, n)
  return s.endsWith(' ') ? s.slice(0, -1) + 'o' : s
}

// a Letra — os comprimentos: 1 de 77, 1 de 72, e o resto até 46 (44 linhas com texto + 6 vazias = 50)
const COMPRIMENTOS = [77, 72, 46, 46, 46, 45, 44, 44, 43, 42, 41, 40, 40, 39, 38, 38, 37, 36, 36, 35, 34, 34, 33, 32, 32,
  31, 30, 30, 29, 28, 28, 27, 26, 25, 24, 24, 23, 22, 21, 20, 18, 16, 14, 12]
const letra: string[] = []
COMPRIMENTOS.forEach((n, i) => {
  letra.push(linha(n, i * 3))
  if (i % 8 === 7 && letra.length < 50) letra.push('')
})
while (letra.length < 50) letra.push('')
const LETRA = letra.join('\n')

// a Cifra — 20 pares; os acordes espalhados sobre a letra; o maior par com 50 colunas
const ACORDES = ['Am', 'F', 'C', 'G', 'Dm', 'E7', 'F#m7(11)', 'Bb']
const cifra: string[] = []
for (let p = 0; p < 20; p++) {
  const n = p === 0 ? 50 : 24 + ((p * 7) % 16) // 24…39, e um de 50
  const l = linha(n, p * 5)
  let a = ''
  for (let col = 0, k = p; col < n - 2; col += 9 + (k % 5), k++) a = a.padEnd(col, ' ') + ACORDES[k % ACORDES.length]
  cifra.push(a, l)
}
const CIFRA = cifra.join('\n')

const forma = (t: string) => {
  const ls = t.split('\n').map((s) => s.length)
  const ord = [...ls].sort((x, y) => x - y)
  return `linhas ${ls.length} · maior ${ord[ord.length - 1]} · p95 ${ord[Math.ceil(0.95 * ord.length) - 1]}`
}
console.log(`Letra: ${forma(LETRA)}`)
console.log(`Cifra: ${forma(CIFRA)} · pares ${cifra.length / 2}`)
console.log('')
console.log('texto  colunas  linhas visuais  mediana (ms)  máximo (ms)  — 100 rodadas')
for (const [nome, tipo, t] of [['Letra', 'Lyrics', LETRA], ['Cifra', 'Chords', CIFRA]] as const) {
  for (const c of [80, 48, 26, 14]) {
    const ms: number[] = []
    let n = 0
    for (let r = 0; r < 100; r++) {
      const t0 = performance.now()
      n = quebrar(t, tipo, c).length
      ms.push(performance.now() - t0)
    }
    ms.sort((x, y) => x - y)
    const med = (ms[49]! + ms[50]!) / 2
    console.log(`${nome.padEnd(6)} ${String(c).padStart(7)}  ${String(n).padStart(14)}  ${med.toFixed(3).padStart(12)}  ${ms[99]!.toFixed(3).padStart(11)}`)
  }
}
