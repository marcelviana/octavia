// W4-b3 — a árvore do dump em dp (2,25 px/dp), SEM texto: classe, resource-id,
// bounds em dp, enabled, clickable. Uma linha por nó, na ordem do dump. É o que
// o `cmp` antes × depois compara ("idêntico em dp").
import { readFileSync } from 'node:fs'
const DP = 2.25
const f = (n) => (Math.round((n / DP) * 10) / 10).toFixed(1)
const xml = readFileSync(process.argv[2], 'utf8')
for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
  const a = {}
  for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
  if ((a.package ?? '') !== 'rocks.octavia.app') continue
  const b = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(a.bounds ?? '')
  const id = (a['resource-id'] ?? '').replace(/^.*:id\//, '') || '-'
  console.log(`${a.class} ${id} [${f(+b[1])},${f(+b[2])}][${f(+b[3])},${f(+b[4])}] en=${a.enabled} ck=${a.clickable}`)
}
