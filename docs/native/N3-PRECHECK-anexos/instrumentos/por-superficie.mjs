// N3 pre-check — o resumo do B3/B4 por superfície × faixa, a partir de B3-inventario.jsonl.
//   node instrumentos/por-superficie.mjs B3-inventario.jsonl > B3-por-superficie.md
import { readFileSync } from 'node:fs'
const rs = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l))
const faixa = { tab: 'tablet retrato (Tab S6)', avd: 'tablet retrato (AVD)', 'phone-ret': 'celular retrato', 'phone-pai': 'celular paisagem' }
const g = {}
for (const r of rs) {
  const m = /^B[24]-(S0|S1|S2|S3|S4|S5|reordenar|picker|folha|dialogo)-(.*)-(avd|tab|phone-ret|phone-pai)\.xml$/.exec(r.arquivo.split('/').pop())
  if (!m) continue
  const k = `${m[1]}|${m[3]}`
  const x = (g[k] ??= { n: 0, a: [], b: [], c: [], d: 0, dl: 0, e: [] })
  x.n++
  x.a.push(...r.novo.a.map((y) => y.par))
  x.b.push(...r.novo.b.map((y) => `${y.no} (${y.onde === 'ausente' ? 'ausente' : y.onde === 'borda lateral' ? 'borda' : 'sob barra'})`))
  x.c.push(...r.novo.c.map((y) => `${y.no} ${y.w}×${y.h}`))
  x.d += r.d.length
  x.dl += r.novo.dl.length
  x.e.push(...r.novo.e.map((y) => y.no))
}
const u = (a) => { const s = [...new Set(a)]; return s.slice(0, 5).join('; ') + (s.length > 5 ? `; … (+${s.length - 5})` : '') }
console.log('| superfície | faixa | dumps | a | b | c | d | d′ | e | o que é (novo contra a paisagem; distintos) |')
console.log('|---|---|---|---|---|---|---|---|---|---|')
for (const s of ['S0', 'S1', 'S2', 'reordenar', 'picker', 'folha', 'dialogo', 'S3', 'S4', 'S5']) {
  for (const d of ['tab', 'avd', 'phone-ret', 'phone-pai']) {
    const x = g[`${s}|${d}`]
    if (!x) { console.log(`| ${s} | ${faixa[d]} | 0 | — | — | — | — | — | — | não capturado (§3.3) |`); continue }
    const o = [x.a.length && `a: ${u(x.a)}`, x.b.length && `b: ${u(x.b)}`, x.c.length && `c: ${u(x.c)}`, x.e.length && `e: ${u(x.e)}`].filter(Boolean).join(' · ')
    console.log(`| ${s} | ${faixa[d]} | ${x.n} | ${x.a.length} | ${x.b.length} | ${x.c.length} | ${x.d} | ${x.dl} | ${x.e.length} | ${o.replace(/\|/g, '\\|')} |`)
  }
}
