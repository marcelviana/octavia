import fs from 'node:fs'
const [dirNovo, ...sups] = process.argv.slice(2)
let difs = 0
for (const s of sups) {
  const velho = JSON.parse(fs.readFileSync(`tests/gates-web/medicoes/${s}.json`, 'utf8'))
  const novo = JSON.parse(fs.readFileSync(`${dirNovo}/${s}.json`, 'utf8'))
  let iguais = 0, comparados = 0, soNoCommitado = 0
  for (const [id, ev] of Object.entries(velho.estados)) {
    const en = novo.estados[id]
    for (const l of ['1138', '711', '411']) {
      const a = ev.larguras?.[l], b = en?.larguras?.[l]
      if (!a?.nos) continue
      if (!b?.nos) { soNoCommitado++; continue }
      comparados++
      const A = JSON.stringify({ doc: a.doc, nos: a.nos }), B = JSON.stringify({ doc: b.doc, nos: b.nos })
      if (A === B) iguais++; else { difs++; console.log(`  ✗ ${s} · ${id} · ${l}: nós diferem`) }
    }
  }
  console.log(`${s}: ${comparados} (estado × largura) medidos nos dois lados · ${iguais} idênticos (nós + doc) · ${soNoCommitado} só no commitado (pedem o .env — o usuário falso do auth)`)
}
console.log(difs ? `INÉRCIA: REPROVA — ${difs}` : 'INÉRCIA: PASSA — nenhum nó mudou')
