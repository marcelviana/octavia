#!/usr/bin/env node
/**
 * G5 — alvos de toque >= 48 dp, medidos no `uiautomator dump`.
 *
 * Densidade 360 => 2,25 px/dp (AVD octavia_tab32 e Tab S6, N1-h2).
 *
 * REGRA DE RECORTE (V1-PRECHECK div. 21 / C2): um nó de lista recortado pela
 * viewport aparece no dump com os bounds VISÍVEIS, não com o tamanho real.
 * Descarta-se o nó cujo `y1` OU `y2` coincide com o `y1`/`y2` de um ancestral
 * rolável — as DUAS bordas, cada uma valendo por si.
 *
 * Uso: node g5.mjs <dir-com-xml> [...]
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

const DP = 2.25
const MIN = 48

function parseBounds(s) {
  const m = /\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(s)
  if (m === null) return null
  return { x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] }
}

/** Parser de tags: o dump do uiautomator é XML plano com tags auto-fechadas. */
function nodes(xml) {
  const out = []
  const pilha = []
  const re = /<node\b([^>]*?)(\/?)>|<\/node>/g
  let m
  while ((m = re.exec(xml)) !== null) {
    if (m[0] === '</node>') { pilha.pop(); continue }
    const attrs = {}
    for (const a of m[1].matchAll(/(\w[\w-]*)="([^"]*)"/g)) attrs[a[1]] = a[2]
    const no = {
      id: attrs['resource-id'] ?? '',
      cls: attrs['class'] ?? '',
      clickable: attrs['clickable'] === 'true',
      scrollable: attrs['scrollable'] === 'true',
      desc: attrs['content-desc'] ?? '',
      text: attrs['text'] ?? '',
      b: parseBounds(attrs['bounds'] ?? ''),
      pais: [...pilha],
    }
    out.push(no)
    if (m[2] !== '/') pilha.push(no)
  }
  return out
}

/** Recortado por uma das DUAS bordas de um ancestral rolável. */
function recortado(no) {
  for (const p of no.pais) {
    if (!p.scrollable || p.b === null || no.b === null) continue
    if (no.b.y2 === p.b.y2 || no.b.y1 === p.b.y1) return p
  }
  return null
}

const dirs = process.argv.slice(2)
const arquivos = []
for (const d of dirs) for (const f of readdirSync(d)) if (f.endsWith('.xml')) arquivos.push(join(d, f))
arquivos.sort()

const pequenos = new Map()   // id|w|h -> Set(estado)
const semId = []
let total = 0
const recortados = []

for (const arq of arquivos) {
  const estado = basename(arq, '.xml')
  for (const no of nodes(readFileSync(arq, 'utf8'))) {
    if (!no.clickable || no.b === null) continue
    total++
    const w = (no.b.x2 - no.b.x1) / DP
    const h = (no.b.y2 - no.b.y1) / DP
    if (no.id === '') {
      const rot = (no.desc !== '' ? no.desc : no.text).slice(0, 48).replace(/\s+/g, ' ')
      semId.push(`${estado} :: (sem testID) ${rot}`)
    }
    if (w >= MIN && h >= MIN) continue
    const pai = recortado(no)
    if (pai !== null) {
      recortados.push(`${estado} :: ${no.id || '(sem testID)'} ${w.toFixed(1)} × ${h.toFixed(1)} dp — RECORTADO por ${pai.cls} [${pai.b.x1},${pai.b.y1}][${pai.b.x2},${pai.b.y2}]`)
      continue
    }
    const k = `${no.id}|${w.toFixed(1)}|${h.toFixed(1)}`
    if (!pequenos.has(k)) pequenos.set(k, new Set())
    pequenos.get(k).add(estado)
  }
}

console.log(`alvos tocáveis medidos: ${total} em ${arquivos.length} estados`)
const ocorrencias = [...pequenos.values()].reduce((a, s) => a + s.size, 0)
const ids = new Set([...pequenos.keys()].map((k) => k.split('|')[0]))
console.log(`ABAIXO de ${MIN} dp: ${ocorrencias} ocorrências / ${ids.size} resource-ids`)
for (const [k, estados] of [...pequenos].sort()) {
  const [id, w, h] = k.split('|')
  console.log(`  ${(id || '(sem testID)').padEnd(22)} ${w.padStart(7)} × ${h.padStart(6)} dp   (${[...estados].sort().join(', ')})`)
}
console.log(`\ndescartados por recorte (div. 21): ${recortados.length}`)
for (const r of recortados.sort()) console.log(`  ${r}`)
console.log(`\nalvos SEM testID (inalcançáveis por resource-id): ${new Set(semId).size}`)
for (const s of [...new Set(semId)].sort()) console.log(`  ${s}`)
process.exit(ocorrencias === 0 ? 0 : 1)
