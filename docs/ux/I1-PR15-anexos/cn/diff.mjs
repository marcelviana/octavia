// I1-PR15 — antes × depois: pixelmatch threshold 0 e geometria (tag, hash, x, y, w, h — sem a família, que é o que muda)
import fs from "node:fs"
// Uso: ARVORE=<raiz do repositório> node diff.mjs <pasta antes> <pasta depois>
const { PNG } = (await import(`${process.env.ARVORE}/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js`)).default ?? await import(`${process.env.ARVORE}/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js`)
const pixelmatch = (await import(`${process.env.ARVORE}/node_modules/.pnpm/pixelmatch@7.1.0/node_modules/pixelmatch/index.js`)).default
const [a, b] = process.argv.slice(2)
let total = 0
for (const f of fs.readdirSync(a).filter((x) => x.endsWith(".png")).sort()) {
  const n = f.replace(".png", "")
  const A = PNG.sync.read(fs.readFileSync(`${a}/${f}`)), B = PNG.sync.read(fs.readFileSync(`${b}/${f}`))
  let px = "tamanhos diferentes"
  if (A.width === B.width && A.height === B.height) px = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0 })
  const ga = JSON.parse(fs.readFileSync(`${a}/${n}.json`)).nos, gb = JSON.parse(fs.readFileSync(`${b}/${n}.json`)).nos
  const k = (x) => JSON.stringify(x.slice(0, 6))
  const nosDelta = ga.length !== gb.length ? `contagem ${ga.length}→${gb.length}` : ga.filter((x, i) => k(x) !== k(gb[i])).length
  if (px !== 0 || nosDelta !== 0) total++
  console.log(`${n}\t${A.width}×${A.height} → ${B.width}×${B.height}\tpixels diferentes: ${px}\tnós com Δ de geometria: ${nosDelta}`)
}
console.log(`capturas com diferença: ${total}`)
