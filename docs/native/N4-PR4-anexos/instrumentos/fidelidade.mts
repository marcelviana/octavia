// N4-PR4 §4 — fidelidade à folha: cada registro do catálogo × o mesmo ícone da folha, mesmo Chromium, mesma escala.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
const ARV = process.env.ARV!
const req = createRequire(ARV + '/package.json')
const { chromium } = req('@playwright/test')
const { desenhos, TRACO } = await import(ARV + '/packages/identidade/src/index.ts')
const b = readFileSync(ARV + '/docs/native/DESIGN-N4/telas.html', 'utf8')
const t: string = JSON.parse(/<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/.exec(b)![1])
const sec = t.slice(t.indexOf('data-screen-label="5 Ícones — decididos"'), t.indexOf('data-screen-label="5b'))
const row = (id: string) => [...new RegExp(`>${id}</td>([\\s\\S]*?)</tr>`).exec(sec)![1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => [...c[1].matchAll(/<svg [\s\S]*?<\/svg>/g)].map((s) => s[0]).filter((s) => s.includes('viewBox="0 0 24 24"')))
const COR = '#A9A5B5'
// o catálogo pelas regras de quem renderiza: 'nativo' = Icone.tsx (preenchido sem traço); 'web' = components/identidade/icone.tsx
function catalogo(nome: string, tam: 20 | 24 | 28, estado: string, modo: 'nativo' | 'web', traco?: number) {
  const d = (desenhos as any)[nome]
  let l = estado === 'ativo' ? d.ativo : estado === 'inerte' ? d.inerte : estado === 'ativoInerte' ? d.ativoInerte : (tam === 20 && d.em20) || d.normal
  if (modo === 'web') l = (tam === 20 && d.em20) || d.normal // o web não lê estado
  const sw = traco ?? TRACO[tam]
  const els = l.map((p: any) => {
    const pint = p.fill ? (modo === 'nativo' ? `fill="${COR}" stroke="none"` : `fill="${COR}" stroke-width="${p.traco ?? sw}"`) : `stroke="${COR}"${p.traco ? ` stroke-width="${p.traco}"` : ''}`
    return p.d ? `<path d="${p.d}" ${pint}/>` : ''
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${COR}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${els}</svg>`
}
const folhaCor = (s: string) => s.replace(/#[0-9A-Fa-f]{6}/g, COR).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
const casos: { rot: string; a: string; b: string; tam: number }[] = []
const tipos: [string, string][] = [['P-I9', 'letra'], ['P-I10', 'cifra'], ['P-I11', 'tab'], ['P-I12', 'partitura']]
for (const [id, n] of tipos) {
  const [f20, f24, f28] = row(id)[2]
  casos.push({ rot: `${n} 20 (nativo)`, a: folhaCor(f20), b: catalogo(n, 20, 'normal', 'nativo'), tam: 20 })
  casos.push({ rot: `${n} 20 (web)`, a: folhaCor(f20), b: catalogo(n, 20, 'normal', 'web'), tam: 20 })
  // 24/28: a geometria da folha com o traço do catálogo (N4-D86) — a folha re-renderizada com o <g> no traço da família
  for (const [tam, f] of [[24, f24], [28, f28]] as const) {
    const fAjust = folhaCor(f).replace(/<g transform="scale\(1\.2\)" stroke-width="1\.5">/, `<g transform="scale(1.2)" stroke-width="${TRACO[tam] / 1.2}">`)
    casos.push({ rot: `${n} ${tam} (nativo; folha com o traço da família, N4-D86)`, a: fAjust, b: catalogo(n, tam, 'normal', 'nativo'), tam })
    casos.push({ rot: `${n} ${tam} (nativo × markup da folha, 1,8 — a diferença que a N4-D86 decidiu)`, a: folhaCor(f), b: catalogo(n, tam, 'normal', 'nativo'), tam })
  }
}
for (const [id, n, est, ine] of [['P-I1a', 'estrela', 'normal', 'inerte'], ['P-I1b', 'estrela', 'ativo', 'ativoInerte'], ['P-I2', 'tocar', 'normal', 'inerte']] as const) {
  const c = row(id)
  casos.push({ rot: `${n} ${est} 24 (célula normal)`, a: folhaCor(c[1][0]), b: catalogo(n, 24, est, 'nativo'), tam: 24 })
  casos.push({ rot: `${n} ${ine} 24 (célula inerte)`, a: folhaCor(c[3][0]), b: catalogo(n, 24, ine, 'nativo', 1.75), tam: 24 })
  for (const [i, tam] of [[0, 20], [1, 24], [2, 28]] as const) casos.push({ rot: `${n} ${est} ${tam}`, a: folhaCor(c[5][i]), b: catalogo(n, tam, est, 'nativo'), tam })
}
// CONTROLE DE RASTER (independente da conversão do gate): a mesma folha, com o <g scale(1.2)> × as coordenadas
// ORIGINAIS num viewBox de 20, sem transform e com o traço 1,5 — matematicamente o mesmo desenho.
const ctrl: typeof casos = []
for (const [id, n] of tipos) {
  const f20 = folhaCor(row(id)[2][0])
  const vb20 = f20.replace('viewBox="0 0 24 24"', 'viewBox="0 0 20 20"').replace(/<g transform="scale\(1\.2\)" stroke-width="1\.5">/, '<g stroke-width="1.5">')
  ctrl.push({ rot: `CONTROLE DE RASTER ${n} 20: folha scale(1.2) × folha em viewBox 20`, a: f20, b: vb20, tam: 20 })
}
for (const [id, n] of tipos) {
  const f20 = folhaCor(row(id)[2][0])
  // o catálogo com o traço que a FOLHA calcula (1.5 × 1.2 em ponto flutuante = 1.7999999999999998), no lugar de 1,8
  const flut = catalogo(n, 20, 'normal', 'nativo').replace(/stroke-width="1\.8"/g, `stroke-width="${1.5 * 1.2}"`)
  ctrl.push({ rot: `CONTROLE DE PONTO FLUTUANTE ${n} 20: folha × catálogo com o traço 1.5×1.2 da folha`, a: f20, b: flut, tam: 20 })
  const [, f24] = row(id)[2]
  const fAjust = folhaCor(f24).replace(/<g transform="scale\(1\.2\)" stroke-width="1\.5">/, '<g transform="scale(1.2)" stroke-width="1.75">').replace('<g transform="scale(1.2)" stroke-width="1.75">', '<g transform="scale(1.2)" stroke-width="' + (1.75 / 1.2) + '">')
  ctrl.push({ rot: `CONTROLE DE PONTO FLUTUANTE ${n} 24: folha (traço ${(1.75 / 1.2) * 1.2}) × catálogo com o mesmo traço`, a: fAjust, b: catalogo(n, 24, 'normal', 'nativo').replace('stroke-width="1.75"', `stroke-width="${(1.75 / 1.2) * 1.2}"`), tam: 24 })
}
{
  // CONTROLE DO PIPELINE: uma forma qualquer (não é do catálogo nem da folha), o mesmo desenho pelos dois caminhos —
  // grade 24 com viewBox 24 a 20 px (o do catálogo) × grade 20 com viewBox 20 a 20 px (o da folha).
  const sv = (vb: number, d: string, sw: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 ${vb} ${vb}" fill="none" stroke="${COR}" stroke-width="${sw}" stroke-linecap="round"><path d="${d}"/></svg>`
  ctrl.push({ rot: 'CONTROLE DO PIPELINE círculo+traço: grade 24 a 0,833 × grade 20 a 1', a: sv(24, 'M12 6a6 6 0 1 0 0 12a6 6 0 1 0 0-12M6 21h12', 1.8), b: sv(20, 'M10 5a5 5 0 1 0 0 10a5 5 0 1 0 0-10M5 17.5h10', 1.5), tam: 20 })
  ctrl.push({ rot: 'CONTROLE DO PIPELINE só retas: grade 24 a 0,833 × grade 20 a 1', a: sv(24, 'M6 6h12M6 18h12', 1.8), b: sv(20, 'M5 5h10M5 15h10', 1.5), tam: 20 })
}
casos.unshift(...ctrl)
const br = await chromium.launch()
const out: string[] = []
for (const dpr of [1, 2.25]) {
  const pg = await br.newPage({ deviceScaleFactor: dpr })
  await pg.setContent('<html><body style="margin:0;background:#100F16"></body></html>')
  await pg.addScriptTag({ content: `window.comparar = async function ({ a, b, tam, dpr }) {
      var px = Math.round(tam * dpr)
      async function draw(svg) {
        var img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode()
        var cv = document.createElement('canvas'); cv.width = px; cv.height = px
        var x = cv.getContext('2d'); x.fillStyle = '#100F16'; x.fillRect(0, 0, px, px); x.drawImage(img, 0, 0, px, px)
        return x.getImageData(0, 0, px, px).data
      }
      var A = await draw(a), B = await draw(b), n = 0, max = 0
      for (var i = 0; i < A.length; i += 4) { var d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d > 0) n++; if (d > max) max = d }
      return { n: n, max: max, total: px * px }
    }` })
  out.push(`## escala ${dpr}`)
  for (const c of [{ rot: 'CONTROLE folha × folha (letra 20)', a: folhaCor(row('P-I9')[2][0]), b: folhaCor(row('P-I9')[2][0]), tam: 20 }, ...casos]) {
    const r = await pg.evaluate(`comparar(${JSON.stringify({ ...c, dpr })})`)
    out.push(`${c.rot}\t${r.n} de ${r.total} px diferentes\t(maior Δ de canal ${r.max})`)
  }
}
await br.close()
console.log(out.join('\n'))
