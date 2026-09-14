#!/usr/bin/env node
/**
 * Mede a fileira de marcas do S5 num `uiautomator dump`: quantas, que largura,
 * que folga e que comprimento total — para comparar com o que a `marcas.mjs`
 * prevê. A fileira é o maior grupo de nós SEM texto, não clicáveis, de 2 a 4,5
 * dp de altura e mesmo `y1`.
 *
 * Uso: node fileira.mjs <dump.xml> [...]
 */
import { readFileSync } from 'node:fs'
const DP = 2.25
for (const f of process.argv.slice(2)) {
  const xml = readFileSync(f, 'utf8')
  const cand = []
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a = {}
    for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(a.bounds ?? '')
    if (b === null) continue
    const [x1, y1, x2, y2] = b.slice(1).map(Number)
    const h = (y2 - y1) / DP
    if (h >= 2 && h <= 4.5 && (a.text ?? '') === '' && a.clickable !== 'true') cand.push([x1, y1, x2, y2])
  }
  const porY = new Map()
  for (const c of cand) porY.set(c[1], [...(porY.get(c[1]) ?? []), c])
  const fila = [...porY.values()].sort((a, b) => b.length - a.length)[0] ?? []
  fila.sort((a, b) => a[0] - b[0])
  if (fila.length === 0) { console.log(`${f}: nenhuma marca`); continue }
  const larguras = [...new Set(fila.map(([x1, , x2]) => +((x2 - x1) / DP).toFixed(1)))].sort((a, b) => a - b)
  const folgas = [...new Set(fila.slice(1).map((c, i) => +((c[0] - fila[i][2]) / DP).toFixed(1)))].sort((a, b) => a - b)
  console.log(`${f.split('/').pop()}: ${fila.length} marcas · largura ${larguras.join(' / ')} dp · altura ${((fila[0][3] - fila[0][1]) / DP).toFixed(1)} dp · folga ${folgas.join(' / ')} dp · fileira ${((fila.at(-1)[2] - fila[0][0]) / DP).toFixed(1)} dp (teto 900)`)
}
