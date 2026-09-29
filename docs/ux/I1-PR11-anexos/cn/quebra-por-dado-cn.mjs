// CN da QUEBRA POR DADO (I1-PR11, commit 1; herança da div. 767 da I1-PR10). Anexo, não gate.
//
// Uso (da raiz):  node docs/ux/I1-PR11-anexos/cn/quebra-por-dado-cn.mjs <classificador-da-main.mjs>
//   (o da main: `git show origin/main:scripts/gates-web/g-faixa-classificar.mjs > /tmp/…/classificar-main.mjs`)
//
// (1) Todos os JSON commitados (medicoes/*.json, casca-efeito/**, cn-main/*): o classificador novo dá o MESMO (e), (b),
//     (d′), sem par e saídas que o da main, e errata candidata nova + cascata da quebra por dado = errata candidata velha
//     (nada some, nada nasce: a candidata só muda de gaveta).
// (2) O aceite da I1-PR10 (medicoes/content.json): as 42 candidatas de B saem como quebra por dado.
// (3) A fixture `tests/gates-web/fixtures/g-faixa-dy-sem-quebra.json` (o mesmo estado, o título em UMA linha): o Δy
//     abaixo dele segue errata candidata (19), quebra por dado 0.
import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import * as novo from "../../../../scripts/gates-web/g-faixa-classificar.mjs"

const velho = await import(pathToFileURL(path.resolve(process.argv[2])).href)
const RAIZ = "tests/gates-web/medicoes"
const jsons = []
const andar = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) andar(p); else if (f.endsWith(".json")) jsons.push(p) } }
andar(RAIZ)

const ks = (l) => l.map((o) => o.k).sort().join(",")
let estados = 0, divergem = 0, mudaramDeGaveta = 0
for (const arq of jsons.sort()) {
  const s = JSON.parse(fs.readFileSync(arq, "utf8"))
  let n = 0
  for (const [id, e] of Object.entries(s.estados ?? {})) {
    if (!e.larguras || !Object.keys(e.larguras).length) continue
    const a = velho.classificarEstado(e), b = novo.classificarEstado(e)
    for (const L of Object.keys(a)) {
      estados++
      const x = a[L], y = b[L]
      const igual = ks(x.e) === ks(y.e) && ks(x.b) === ks(y.b) && ks(x.dl) === ks(y.dl) && ks(x.semPar.folha) === ks(y.semPar.folha) &&
        ks(x.semPar.app) === ks(y.semPar.app) && JSON.stringify(x.saidas) === JSON.stringify(y.saidas) &&
        ks(x.errata) === ks([...y.errata, ...y.quebraPorDado.cascata])
      if (!igual) { divergem++; console.log(`  ✗ ${arq} · ${id} · ${L}: o classificador novo mudou mais que a gaveta das candidatas`) }
      if (y.quebraPorDado.cascata.length) { n += y.quebraPorDado.cascata.length; console.log(`  ${arq} · ${id} · ${L}: errata candidata ${x.errata.length} → ${y.errata.length} · quebra por dado ${y.quebraPorDado.cascata.length} (nó${y.quebraPorDado.nos.length > 1 ? "s" : ""}: ${y.quebraPorDado.nos.map((q) => `${q.k} em ${q.linhas} linhas, +${q.extra}`).join("; ")})`) }
    }
  }
  mudaramDeGaveta += n
}
console.log(`(1) ${jsons.length} JSON · ${estados} (estado × largura) · divergem além da gaveta: ${divergem} · candidatas que viraram quebra por dado: ${mudaramDeGaveta}`)

const fx = JSON.parse(fs.readFileSync("tests/gates-web/fixtures/g-faixa-dy-sem-quebra.json", "utf8")).estado
const cV = velho.classificarEstado(fx)["711"], cN = novo.classificarEstado(fx)["711"]
console.log(`(3) fixture sem quebra (VIEW-partitura · 711, o título em 1 linha): velho errata candidata ${cV.errata.length} · novo errata candidata ${cN.errata.length} · quebra por dado ${cN.quebraPorDado.cascata.length} (nós ${cN.quebraPorDado.nos.length})`)
const ok = divergem === 0 && mudaramDeGaveta === 42 && cN.errata.length === 19 && cN.quebraPorDado.cascata.length === 0
console.log(ok ? "CN: PASSA" : "CN: REPROVA")
process.exit(ok ? 0 : 1)
