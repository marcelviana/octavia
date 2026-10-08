// Conferência da folha congelada (QL desenho): abre docs/native/DESIGN-QL/telas.html num Chromium sem cabeça, SEM REDE
// (toda requisição que não é file:/data:/blob: é abortada e registrada) e imprime: (1) as requisições e os erros da página;
// (2) a frase do resumo da seção 13 e a tabela da conferência; (3) as molduras pelo ID, com o canvas da legenda, contra o
// molde QL-<faixa>-<superfície>-<estado>-<tema> e os canvas C 1138 × 627 · B 711 × 1054 · A 411 × 874; (4) as molduras
// que o §9 do QL-BRIEF.md pede e a folha não tem; e grava (5) as capturas das molduras-chave.
// Uso, da raiz (o @playwright/test do projeto): node docs/native/DESIGN-QL-anexos/instrumentos/conferir.mjs <telas.html> <dir-png>
import { chromium } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
const [arq, dirPng] = [path.resolve(process.argv[2]), path.resolve(process.argv[3])]
fs.mkdirSync(dirPng, { recursive: true })
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 })
const reqs = []
await ctx.route('**/*', (r) => { const u = r.request().url(); const ok = /^(file|data|blob):/.test(u); reqs.push({ esquema: u.split(':')[0], ok }); return ok ? r.continue() : r.abort() })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()) })
await p.goto('file://' + arq)
await p.waitForTimeout(6000)

const out = []
const porEsquema = {}
for (const r of reqs) porEsquema[r.esquema] = (porEsquema[r.esquema] ?? 0) + 1
out.push('## 1. A rede e os erros', `requisições: ${reqs.length} · por esquema: ${JSON.stringify(porEsquema)} · abortadas (fora de file/data/blob): ${reqs.filter((r) => !r.ok).length}`, `erros da página: ${erros.length}`, ...erros.map((e) => '  ' + e))

const sec13 = await p.evaluate(() => document.querySelector('#sec-conferencia, section[data-screen-label^="13"]')?.innerText ?? null)
out.push('', '## 2. A seção 13 (verbatim, o texto renderizado)')
if (sec13 === null) out.push('SEÇÃO 13 NÃO ACHADA')
else {
  out.push(sec13)
  out.push('', `"Na tela: todas as molduras ok" presente: ${sec13.includes('Na tela: todas as molduras ok')}`)
}

const molduras = await p.evaluate(() => [...document.querySelectorAll('div[id^="QL-"], div[id^="EST-QL-"]')].map((d) => ({ id: d.id, legenda: d.firstElementChild?.innerText ?? '' })))
const CANVAS = { C: '1138 × 627', B: '711 × 1054', A: '411 × 874' }
const MOLDE = /^QL-([ABC])-(S3|V)-([a-z0-9-]+)-(escuro|claro)$/
const norm = molduras.filter((m) => m.id.startsWith('QL-') && MOLDE.test(m.id))
const estudo = molduras.filter((m) => m.id.startsWith('EST-QL-'))
const outras = molduras.filter((m) => !norm.includes(m) && !estudo.includes(m))
out.push('', '## 3. As molduras', `normativas (no molde): ${norm.length} · de estudo (EST-): ${estudo.length} · outras: ${outras.length} (${outras.map((m) => m.id).join(', ')})`)
let falhas = 0
for (const m of [...norm, ...estudo]) {
  const faixa = m.id.replace(/^EST-/, '').split('-')[1]
  const canvasOk = m.legenda.includes(CANVAS[faixa])
  const molde = m.id.startsWith('EST-') ? 'estudo' : 'molde ok'
  if (!canvasOk) falhas++
  out.push(`  ${m.id.padEnd(46)} ${canvasOk ? '✓' : '✗'} canvas ${CANVAS[faixa]} · ${molde}`)
}
out.push(`canvas fora da faixa: ${falhas}`)

// o §9 do brief: o palco nas três faixas e nos dois temas (Letra, Cifra, Tab rolando, notas abertas/recolhidas/longa),
// o zoom 40 em B, V nas três faixas no escuro (Letra, Cifra, Tab), a âncora antes/depois de giro e de zoom, e o "nada muda"
const pede = []
for (const f of 'CBA') for (const t of ['escuro', 'claro']) for (const e of ['letra', 'cifra', 'tab-rolando', 'notas-abertas', 'notas-recolhidas', 'notas-longa']) pede.push(`QL-${f}-S3-${e}-${t}`)
for (const t of ['escuro', 'claro']) pede.push(`QL-B-S3-letra-zoom40-${t}`)
for (const f of 'CBA') for (const e of ['letra', 'cifra', 'tab']) pede.push(`QL-${f}-V-${e}-escuro`)
const ids = new Set(molduras.map((m) => m.id))
const faltam = pede.filter((x) => !ids.has(x))
const ancora = [...ids].filter((x) => x.includes('ancora'))
const nada = [...ids].filter((x) => x.includes('z22-77col'))
out.push('', '## 4. O que o §9 do brief pede', `pedidas por nome: ${pede.length} · faltam: ${faltam.length} ${faltam.join(' ')}`, `âncora (antes e depois de giro e de zoom): ${ancora.length} — ${ancora.join(' ')}`, `"nada muda" (Letra de 77 em C, zoom 22): ${nada.length} — ${nada.join(' ')}`)

const CAPTURAS = ['QL-B-S3-letra-escuro', 'QL-A-S3-cifra-escuro', 'QL-C-S3-notas-abertas-escuro', 'QL-C-S3-notas-recolhidas-escuro', 'QL-B-S3-letra-zoom40-escuro', 'QL-B-S3-ancora-giro-antes-escuro', 'QL-C-S3-ancora-giro-depois-escuro', 'QL-B-S3-ancora-zoom-antes-escuro', 'QL-B-S3-ancora-zoom-depois-escuro', 'QL-C-S3-letra-z22-77col-escuro', 'QL-divisa-amostra']
out.push('', '## 5. As capturas')
for (const id of CAPTURAS) {
  const el = p.locator(`[id="${id}"]`)
  await el.scrollIntoViewIfNeeded()
  const f = path.join(dirPng, `${id}.png`)
  await el.screenshot({ path: f })
  out.push(`  ${id}.png`)
}
console.log(out.join('\n'))
await b.close()
