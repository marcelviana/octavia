// N4-PR8 — a borda do ▶ pelo pixel: o pixel da borda esquerda do alvo (do bounds do dump), no meio da altura.
import fs from 'node:fs'
import { createRequire } from 'node:module'
const req = createRequire('/Users/marcelviana/projects/octavia-n4-pr8/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/package.json')
const { PNG } = req('pngjs')
const W = process.argv[2]
const casos = [
  ['ativo — V Letra (a rodada de V, antes do conserto)', 'view-tocar', 'run-v/dumps/N4P8V-V-letra-tab-pai'],
  ['inerte — V tipo desconhecido, ANTES do conserto', 'view-tocar', 'run-v/dumps/N4P8V-V-tipo-desconhecido-tab-pai'],
  ['inerte — V tipo desconhecido, DEPOIS', 'view-tocar', 'run-v/borda/N4P8B-V-tipo-desconhecido-tab-pai'],
  ['inerte — V item sem conteúdo, DEPOIS', 'view-tocar', 'run-v/borda/N4P8B-V-corpo-vazio-tab-pai'],
  ['inerte — L linha inválida, DEPOIS', 'lib-tocar-b1b10014', 'run-v/borda/N4P8B-L-linhas-invalidas-tab-pai'],
  ['inerte — L linha inválida, DEPOIS (B)', 'lib-tocar-b1b10014', 'run-v/borda/N4P8B-L-linhas-invalidas-tab-ret'],
]
for (const [nome, rid, arq] of casos) {
  const x = fs.readFileSync(`${W}/${arq}.xml`, 'utf8')
  const m = new RegExp(`resource-id="[^"]*${rid}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`).exec(x)
  const [x0, y0, , y1] = m.slice(1).map(Number)
  const png = PNG.sync.read(fs.readFileSync(`${W}/${arq}.png`))
  const px = (xx, yy) => { const i = (png.width * yy + xx) << 2; return '#' + [0, 1, 2].map((k) => png.data[i + k].toString(16).padStart(2, '0').toUpperCase()).join('') }
  const y = (y0 + y1) >> 1
  console.log(`${nome.padEnd(50)} borda ${[0, 1, 2].map((d) => px(x0 + d, y)).join(' ')} · fundo ${px(x0 + 8, y)}`)
}
