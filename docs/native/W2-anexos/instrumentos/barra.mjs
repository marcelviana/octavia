#!/usr/bin/env node
/**
 * W2 — a barra inferior do palco num `uiautomator dump`: os sete controles na
 * ordem do JSX, com `bounds` em px e dp, `enabled`, `clickable` e o
 * `content-desc`; mais as margens, as folgas e o vão entre os dois grupos.
 *
 * Densidade 360 => 2,25 px/dp. Janela de 2560 px = 1137,8 dp.
 *
 * Uso: node barra.mjs <dump.xml> [...]
 */
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'

const DP = 2.25
const JANELA = 2560
const ORDEM = ['auto-scroll', 'zoom-menos', 'zoom-mais', 'tema', 'indice', 'busca', 'sair']
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10;/g, ' ')
const n2 = (x) => (Math.round(x * 10) / 10).toFixed(1)

for (const f of process.argv.slice(2)) {
  const xml = readFileSync(f, 'utf8')
  const porId = new Map()
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a = {}
    for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
    const id = (a['resource-id'] ?? '').replace(/^.*:id\//, '')
    if (!ORDEM.includes(id)) continue
    const b = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(a.bounds ?? '')
    if (b === null) continue
    const [x1, y1, x2, y2] = b.slice(1).map(Number)
    porId.set(id, { x1, y1, x2, y2, enabled: a.enabled, clickable: a.clickable, desc: dec(a['content-desc'] ?? '') })
  }
  console.log(`\n=== ${basename(f, '.xml')} ===`)
  if (porId.size === 0) { console.log('  (barra ausente neste dump)'); continue }
  let ant = null
  for (const id of ORDEM) {
    const c = porId.get(id)
    if (c === undefined) { console.log(`  ${id.padEnd(12)} AUSENTE`); ant = null; continue }
    const folga = ant === null ? null : (c.x1 - ant.x2) / DP
    console.log(
      `  ${id.padEnd(12)} x=[${String(c.x1).padStart(4)},${String(c.x2).padStart(4)}]` +
      `  x1=${n2(c.x1 / DP).padStart(6)} dp  larg=${n2((c.x2 - c.x1) / DP)}×${n2((c.y2 - c.y1) / DP)} dp` +
      `  enabled=${String(c.enabled).padEnd(5)} clickable=${String(c.clickable).padEnd(5)}` +
      (folga === null ? `  margem esq=${n2(c.x1 / DP)} dp` : `  folga=${n2(folga)} dp`) +
      `  desc="${c.desc}"`,
    )
    ant = c
  }
  const ult = porId.get(ORDEM[ORDEM.length - 1])
  if (ult !== undefined) {
    console.log(`  --- margem DIREITA: ${n2((JANELA - ult.x2) / DP)} dp   (esquerda: ${n2((porId.get(ORDEM[0])?.x1 ?? 0) / DP)} dp)`)
  }
  const tema = porId.get('tema'), indice = porId.get('indice')
  if (tema !== undefined && indice !== undefined) {
    console.log(`  --- VÃO entre tema e indice: ${n2((indice.x1 - tema.x2) / DP)} dp`)
  }
  const ins = ORDEM.filter((id) => porId.get(id)?.enabled === 'false')
  console.log(`  --- enabled=false em: ${ins.length === 0 ? '(nenhum)' : ins.join(', ')}`)
}
