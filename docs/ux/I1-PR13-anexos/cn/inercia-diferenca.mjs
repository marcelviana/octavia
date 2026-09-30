// I1-PR-13 — a inércia das públicas nó a nó (anexo, não gate): o `inercia-comparar.mjs` da PR-9 compara o JSON inteiro e
// reprova por UM nó por página — a `<section aria-label="Notifications alt+T">` do Toaster do sonner, que saiu do
// `app/layout.tsx` nesta PR (decisão 18 do aval). Aqui: o que só existe antes, o que só existe depois, e os nós que mudaram.
// Uso: node docs/ux/I1-PR13-anexos/cn/inercia-diferenca.mjs <pasta medida> landing login privacy-policy
import fs from 'node:fs'
const [dirNovo, ...sups] = process.argv.slice(2)
let mudaram = 0, soDepois = 0, outros = 0, toaster = 0, n = 0
for (const s of sups) {
  const v = JSON.parse(fs.readFileSync(`tests/gates-web/medicoes/${s}.json`, 'utf8')), d = JSON.parse(fs.readFileSync(`${dirNovo}/${s}.json`, 'utf8'))
  for (const [id, ev] of Object.entries(v.estados)) for (const l of ['1138', '711', '411']) {
    const a = ev.larguras?.[l], b = d.estados[id]?.larguras?.[l]
    if (!a?.nos || !b?.nos) continue
    n++
    const ka = new Map(a.nos.map((x) => [x.k, x])), kb = new Map(b.nos.map((x) => [x.k, x]))
    const soAntes = [...ka.keys()].filter((k) => !kb.has(k))
    const dif = [...ka.keys()].filter((k) => kb.has(k) && JSON.stringify(ka.get(k)) !== JSON.stringify(kb.get(k)))
    const depois = [...kb.keys()].filter((k) => !ka.has(k))
    mudaram += dif.length; soDepois += depois.length
    for (const k of soAntes) { if (ka.get(k).rotulo === 'Notifications alt+T') toaster++; else outros++ }
    console.log(`${s} · ${id} · ${l}: só antes ${soAntes.map((k) => `${JSON.stringify(ka.get(k).rotulo)} <${ka.get(k).tag}> ${ka.get(k).w}×${ka.get(k).h}`).join('; ') || '—'} · só depois ${depois.length} · nós que mudaram ${dif.length} · doc ${JSON.stringify(a.doc) === JSON.stringify(b.doc) ? 'igual' : 'DIFERE'}`)
  }
}
console.log(`\n${n} (estado × largura): nós que mudaram ${mudaram} · só depois ${soDepois} · só antes: ${toaster} × a seção do Toaster do sonner · ${outros} outros`)
console.log(mudaram || soDepois || outros ? 'INÉRCIA (nó a nó): REPROVA' : 'INÉRCIA (nó a nó): PASSA — só a seção do Toaster saiu')
