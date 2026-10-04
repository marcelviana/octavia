// antes × depois: pixelmatch limiar 0; todo pixel diferente tem de cair dentro de uma caixa de ícone de tipo (±1 px).
import fs from 'node:fs'
const ARV = process.env.ARV
const { PNG } = (await import(`${ARV}/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js`)).default
const pixelmatch = (await import(`${ARV}/node_modules/.pnpm/pixelmatch@7.1.0/node_modules/pixelmatch/index.js`)).default
const [a, b] = process.argv.slice(2)
let fora = 0
for (const f of fs.readdirSync(a).filter((x) => x.endsWith('.png')).sort()) {
  const A = PNG.sync.read(fs.readFileSync(`${a}/${f}`)), B = PNG.sync.read(fs.readFileSync(`${b}/${f}`))
  if (A.width !== B.width || A.height !== B.height) { console.log(`${f}\ttamanhos diferentes ${A.width}×${A.height} → ${B.width}×${B.height}`); fora++; continue }
  const D = new PNG({ width: A.width, height: A.height })
  const n = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0, includeAA: true, diffMask: true })
  const cx = [...JSON.parse(fs.readFileSync(`${a}/${f.replace('.png', '.json')}`)).caixas, ...JSON.parse(fs.readFileSync(`${b}/${f.replace('.png', '.json')}`)).caixas]
  let foraDaCaixa = 0
  for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
    const i = (y * A.width + x) * 4
    if (D.data[i + 3] === 0) continue
    if (!cx.some(([X, Y, W, H]) => x >= X - 1 && x <= X + W + 1 && y >= Y - 1 && y <= Y + H + 1)) foraDaCaixa++
  }
  if (foraDaCaixa) fora++
  console.log(`${f}\t${A.width}×${A.height}\tpixels diferentes: ${n}\tfora das caixas dos ícones de tipo: ${foraDaCaixa}\t(caixas: ${cx.length / 2})`)
}
console.log(`capturas com diferença fora das caixas: ${fora}`)
