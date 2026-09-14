#!/usr/bin/env node
/**
 * A regra de N grande da §7.1 do DESIGN-V1, isolada — a MESMA função que o
 * `EndScreen.tsx` usa, para que os três números que a §7.1 publica (8 → 34,
 * 60 → 10, e 128 como último N) possam ser reproduzidos sem abrir o app.
 *
 * Uso: node marcas.mjs [n...]   (sem argumento: a varredura de 1 a 200)
 */
const FILEIRA = 900
const MARCA = { maxima: 34, piso: 6 }
const FOLGA = 5

export function marcas(n) {
  if (n <= 0) return null
  if (n === 1) return { largura: MARCA.maxima, folga: FOLGA }
  const cabe = (FILEIRA - FOLGA * (n - 1)) / n
  if (cabe >= MARCA.piso) return { largura: Math.min(MARCA.maxima, Math.floor(cabe)), folga: FOLGA }
  const folga = (FILEIRA - MARCA.piso * n) / (n - 1)
  return folga >= 1 ? { largura: MARCA.piso, folga: Math.floor(folga * 10) / 10 } : null
}

const ns = process.argv.slice(2).map(Number)
if (ns.length > 0) {
  for (const n of ns) {
    const m = marcas(n)
    console.log(n, m === null ? 'barra sólida 900 × 3' : `${m.largura} dp · folga ${m.folga} · fileira ${(n * m.largura + (n - 1) * m.folga).toFixed(1)} dp`)
  }
} else {
  let anterior = null
  for (let n = 1; n <= 200; n++) {
    const m = marcas(n)
    const chave = m === null ? 'solida' : `${m.largura}|${m.folga}`
    if (chave !== anterior) {
      console.log(`n=${String(n).padStart(3)}  ${m === null ? 'BARRA SÓLIDA 900 × 3' : `marca ${m.largura} dp · folga ${m.folga} dp`}`)
      anterior = chave
    }
  }
}
