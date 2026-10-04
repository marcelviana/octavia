// N4-PR4 — antes × depois no tablet: pixelmatch limiar 0 por captura (pareadas pelo nome sem o prefixo); todo pixel
// diferente tem de cair numa caixa de ícone de tipo — o SvgView logo à esquerda de um texto Letra/Cifra/Tab/Partitura
// (o mesmo y), dos dois dumps — com folga de 2 px. Imprime também o G-inv da mesma captura (o dump) à parte.
import fs from 'node:fs'
const ARV = process.env.ARV
const { PNG } = (await import(`${ARV}/node_modules/.pnpm/pngjs@7.0.0/node_modules/pngjs/lib/png.js`)).default
const pixelmatch = (await import(`${ARV}/node_modules/.pnpm/pixelmatch@7.1.0/node_modules/pixelmatch/index.js`)).default
const [a, b] = process.argv.slice(2)
const chave = (f) => f.replace(/^[^-]+-/, '')
const caixas = (xml) => {
  const nos = [...xml.matchAll(/<node [^>]*>/g)].map((m) => { const t = /text="([^"]*)"/.exec(m[0])[1]; const c = /class="([^"]*)"/.exec(m[0])[1]; const [x0, y0, x1, y1] = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(m[0]).slice(1).map(Number); return { t, c, x0, y0, x1, y1 } })
  const tipos = nos.filter((n) => /^(Letra|Cifra|Tab|Partitura)$/.test(n.t))
  return nos.filter((n) => n.c.endsWith('SvgView') && tipos.some((t) => Math.abs((t.y0 + t.y1) / 2 - (n.y0 + n.y1) / 2) < 6 && t.x0 - n.x1 >= 0 && t.x0 - n.x1 < 40))
}
// a janela do app: o 1º nó do pacote (a barra de status e a de navegação ficam fora — o relógio muda entre capturas)
// as barras do sistema (APARATO.md, "Aparelhos"): 24 dp em cima; embaixo 60 dp no AVD (BARRA_BAIXO=135 px) e 0 no Tab
const BARRA_BAIXO = Number(process.env.BARRA_BAIXO ?? 135)
const BARRA_BAIXO_RET = Number(process.env.BARRA_BAIXO_RET ?? BARRA_BAIXO)
const janela = (png) => [0, 54, png.width, png.height - (png.height > png.width ? BARRA_BAIXO_RET : BARRA_BAIXO)]
// o cursor pisca dentro de um campo de texto: o que cai num EditText dos dois dumps se conta à parte
const campos = (xml) => [...xml.matchAll(/<node [^>]*class="android\.widget\.EditText"[^>]*>/g)].map((m) => { const [x0, y0, x1, y1] = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(m[0]).slice(1).map(Number); return { x0, y0, x1, y1 } })
const B = new Map(fs.readdirSync(b).filter((f) => f.endsWith('.png')).map((f) => [chave(f), f]))
let fora = 0, n = 0
for (const f of fs.readdirSync(a).filter((x) => x.endsWith('.png')).sort()) {
  const g = B.get(chave(f)); if (!g) { console.log(`${chave(f)}\tSEM PAR no depois`); continue }
  n++
  const PA = PNG.sync.read(fs.readFileSync(`${a}/${f}`)), PB = PNG.sync.read(fs.readFileSync(`${b}/${g}`))
  if (PA.width !== PB.width || PA.height !== PB.height) { console.log(`${chave(f)}\ttamanhos diferentes`); fora++; continue }
  const D = new PNG({ width: PA.width, height: PA.height })
  const px = pixelmatch(PA.data, PB.data, D.data, PA.width, PA.height, { threshold: 0, includeAA: true, diffMask: true })
  // folha e diálogo são janelas modais: o dump não traz a tela de trás. As caixas vêm dela, capturada no mesmo estado
  const FUNDO = { 'folha-': ['S2-com-edicao-', 'S1-setlists-'], 'dialogo-': ['S2-com-edicao-'] }
  const fundo = Object.entries(FUNDO).filter(([k]) => chave(f).startsWith(k)).flatMap(([k, v]) => v.map((t) => chave(f).replace(/^[^-]+-[^-]+-/, t)))
  const deFundo = fundo.flatMap((k) => { const fa = fs.readdirSync(a).find((x) => chave(x) === k.replace('.png', '.xml')); return fa ? caixas(fs.readFileSync(`${a}/${fa}`, 'utf8')) : [] })
  const cx = [...deFundo, ...deFundo, ...caixas(fs.readFileSync(`${a}/${f.replace('.png', '.xml')}`, 'utf8')), ...caixas(fs.readFileSync(`${b}/${g.replace('.png', '.xml')}`, 'utf8'))]
  const xa = fs.readFileSync(`${a}/${f.replace('.png', '.xml')}`, 'utf8'); const [jx0, jy0, jx1, jy1] = janela(PA)
  const ed = [...campos(xa), ...campos(fs.readFileSync(`${b}/${g.replace('.png', '.xml')}`, 'utf8'))]
  let ff = 0, fj = 0, fc = 0; const pts = []
  for (let y = 0; y < PA.height; y++) for (let x = 0; x < PA.width; x++) { const i = (y * PA.width + x) * 4; if (D.data[i + 3] && (x < jx0 || x >= jx1 || y < jy0 || y >= jy1)) { fj++; continue }
    if (D.data[i + 3] && !cx.some((c) => x >= c.x0 - 2 && x <= c.x1 + 2 && y >= c.y0 - 2 && y <= c.y1 + 2) && ed.some((c) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1)) { fc++; continue }
    if (D.data[i + 3] && !cx.some((c) => x >= c.x0 - 2 && x <= c.x1 + 2 && y >= c.y0 - 2 && y <= c.y1 + 2)) { ff++; if (pts.length < 3) pts.push(`${x},${y}`) } }
  if (ff) fora++
  console.log(`${chave(f).replace('.png', '')}\t${PA.width}×${PA.height}\tpixels diferentes: ${px} (fora da janela do app: ${fj}; no campo de texto, o cursor: ${fc})\tfora das caixas dos ícones de tipo: ${ff}${ff ? ' (ex. ' + pts.join(' ') + ')' : ''}\t(caixas de tipo: ${cx.length / 2})`)
}
console.log(`capturas: ${n} · com diferença fora das caixas: ${fora}`)
