// bounds de todos os alvos tocáveis de cada dump, em px e dp (2,25 px/dp), antes × depois
import { readFileSync, readdirSync } from 'node:fs'
const DP = 2.25
function alvos(f) {
  const xml = readFileSync(f, 'utf8'); const out = []
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a = {}; for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    if (a.clickable !== 'true') continue
    const id = a['resource-id'] || '(sem id)'; if (id.startsWith('android:') || id.startsWith('com.google') || id.startsWith('rocks.octavia')) continue
    const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(a.bounds).slice(1).map(Number)
    out.push({ id, b, w: (b[2]-b[0])/DP, h: (b[3]-b[1])/DP })
  }
  return out
}
for (const d of process.argv.slice(2)) {
  console.log(`===== ${d} =====`)
  for (const f of readdirSync(d).filter((x) => x.endsWith('.xml')).sort()) {
    console.log(`-- ${f.replace('.xml','')}`)
    for (const a of alvos(`${d}/${f}`)) console.log(`  ${a.id.padEnd(22)} [${a.b[0]},${a.b[1]}][${a.b[2]},${a.b[3]}]`.padEnd(52) + `${a.w.toFixed(1).padStart(7)} × ${a.h.toFixed(1).padStart(6)} dp${a.w < 48 || a.h < 48 ? '   ← <48' : ''}`)
  }
}
