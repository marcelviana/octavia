// por estado: alvos tocáveis (bounds px + dp), content-desc e os textos do dump
import { readFileSync, readdirSync } from 'node:fs'
const DP = 2.25
function nos(f) {
  const xml = readFileSync(f, 'utf8'); const out = []
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a = {}; for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    out.push(a)
  }
  return out
}
const dec = (s) => s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#10;/g,' ')
for (const d of process.argv.slice(2)) {
  for (const f of readdirSync(d).filter((x) => x.endsWith('.xml')).sort()) {
    console.log(`\n--- ${f.replace('.xml','')}`)
    const ns = nos(`${d}/${f}`)
    console.log('  ALVOS:')
    for (const a of ns) {
      if (a.clickable !== 'true') continue
      const id = a['resource-id'] || '(sem id)'
      if (id.startsWith('android:') || id.startsWith('com.google') || id.startsWith('rocks.octavia')) continue
      const b = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(a.bounds).slice(1).map(Number)
      const w = (b[2]-b[0])/DP, h = (b[3]-b[1])/DP
      console.log(`    ${id.padEnd(10)} ${a.bounds.padEnd(24)} ${w.toFixed(1).padStart(7)} × ${h.toFixed(1).padStart(6)} dp  desc=${JSON.stringify(dec(a['content-desc']))}`)
    }
    const textos = [...new Set(ns.filter(a => a.text && a.text.length).map(a => dec(a.text)))]
    console.log(`  TEXTOS (${textos.length}):`)
    for (const t of textos) console.log(`    ${JSON.stringify(t)}`)
  }
}
