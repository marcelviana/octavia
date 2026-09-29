// CN da MEDIÇÃO POR ESTADO (I1-PR11, commit 2b, div. 803). Anexo, não gate.
// Uso: node docs/ux/I1-PR11-anexos/cn/medicao-por-estado-cn.mjs <fixture.json> <resultado.json> <estado,estado>
// A fixture é uma cópia do JSON commitado; o resultado é o mesmo arquivo depois de uma rodada com G_FAIXA_ESTADOS.
// Os estados FORA da lista têm de sair byte a byte iguais; os da lista, com a rodada nova em `rodadasPorEstado`.
import fs from 'node:fs'
const [fx, res, lista] = process.argv.slice(2)
const a = JSON.parse(fs.readFileSync(fx, 'utf8')), b = JSON.parse(fs.readFileSync(res, 'utf8'))
const medidos = lista.split(',')
let fora = 0, foraIguais = 0, falhas = 0
for (const id of Object.keys(a.estados)) {
  if (medidos.includes(id)) continue
  fora++
  if (JSON.stringify(a.estados[id]) === JSON.stringify(b.estados[id])) foraIguais++; else { falhas++; console.log(`  ✗ ${id}: mudou sem estar na lista`) }
}
console.log(`fora da lista: ${fora} estados · byte a byte iguais: ${foraIguais}`)
for (const id of medidos) {
  const r = b.rodadasPorEstado?.[id]
  console.log(`${id}: larguras ${Object.keys(b.estados[id]?.larguras ?? {}).join(',')} · rodadasPorEstado ${JSON.stringify(r)}`)
  if (!r || Object.keys(r).length !== 3) falhas++
}
const cab = ['superficie', 'rota', 'rodada', 'commit', 'rodadas', 'folha', 'chromium']
for (const k of cab) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) { falhas++; console.log(`  ✗ cabeçalho ${k} mudou`) }
console.log(`cabeçalho (${cab.join(', ')}): ${cab.every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k])) ? 'igual' : 'MUDOU'}`)
for (const L of Object.keys(b.requests)) {
  const n = b.requests[L].linhas.filter((l) => l.rodada).length, v = a.requests[L].linhas.length
  console.log(`requests ${L}: ${v} linhas da rodada inteira + ${n} da rodada por estado`)
  if (b.requests[L].linhas.length !== v + n) falhas++
}
console.log(falhas ? `CN: REPROVA — ${falhas}` : 'CN: PASSA')
process.exit(falhas ? 1 : 0)
