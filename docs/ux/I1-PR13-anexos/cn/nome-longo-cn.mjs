// I1-PR-13 (commit 2b) — o CN da mudança de regra do G-faixa (I1-D7 item 4: rótulo curto COM nome acessível longo).
// (1) O classificador de ANTES (`git show <base>:scripts/gates-web/g-faixa-classificar.mjs`) × o de AGORA sobre TODOS os
//     JSON commitados de `tests/gates-web/medicoes/` (com as subpastas): a regra nova não pode mover nenhum resultado.
// (2) A fixture: *Adicionar* / aria-label "Adicionar músicas a X" em B contra *Adicionar músicas* / o mesmo aria-label em
//     C → (e) 0; sem aria-label → (e) 1; e o cartão que perde conteúdo com o mesmo aria-label (que não contém o texto) → (e) 1.
// Os JSON são lidos DO COMMIT de antes (`git show <base>:…`), não da árvore: a prova é sobre o que estava commitado
// quando a regra mudou, e não se move com a re-medição que vem depois.
// Uso: node docs/ux/I1-PR13-anexos/cn/nome-longo-cn.mjs [<commit de antes>]   (padrão: 5a8dc93)
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as novo from '../../../../scripts/gates-web/g-faixa-classificar.mjs'

const base = process.argv[2] ?? '5a8dc93'
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'g-faixa-cn-')), 'classificar-antes.mjs')
fs.writeFileSync(tmp, execFileSync('git', ['show', `${base}:scripts/gates-web/g-faixa-classificar.mjs`]))
const velho = await import(pathToFileURL(tmp).href)

const jsons = execFileSync('git', ['ls-tree', '-r', '--name-only', base, 'tests/gates-web/medicoes'], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.json'))
let n = 0, divergem = 0
for (const f of jsons) {
  const s = JSON.parse(execFileSync('git', ['show', `${base}:${f}`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }))
  for (const [id, estado] of Object.entries(s.estados ?? {})) {
    if (!estado.larguras || Object.keys(estado.larguras).length === 0) continue
    const a = velho.classificarEstado(estado), b = novo.classificarEstado(estado)
    for (const L of Object.keys(a)) {
      n++
      if (JSON.stringify(a[L]) !== JSON.stringify(b[L])) { divergem++; console.log(`  ✗ ${f} · ${id} · ${L}: (e) ${a[L].e.length} → ${b[L].e.length} · nome-acessível ${a[L].saidas.nomeAcessivel} → ${b[L].saidas.nomeAcessivel}`) }
    }
  }
}
console.log(`(1) classificador de ${base} × o de agora, sobre os JSON commitados em ${base}: ${jsons.length} JSON · ${n} (estado × largura) · divergem: ${divergem}`)

const no = (texto, n_, nome, w = 200, nl = !!nome) => ({ k: `button:${texto}#1`, role: 'button', tag: 'button', testid: null, h_texto: texto, h_nome: nome, n: n_, x: 10, y: 100, w, h: 56, sr: false, clip: null, ...(nl ? { nl: true } : {}), corta: { x: false, y: false } })
const med = (vw, nos) => ({ viewport: { w: vw, h: 800 }, doc: { scrollWidth: vw, clientWidth: vw }, nos })
const LONGO = 'Adicionar músicas a X'
const caso = (rotulo, c, b) => {
  const estado = { larguras: { 1138: med(1138, [c]), 711: med(711, [b]) } }
  const v = velho.classificarEstado(estado)['711'], x = novo.classificarEstado(estado)['711']
  console.log(`(2) ${rotulo}: antes (e) ${v.e.length} · nome-acessível ${v.saidas.nomeAcessivel} → agora (e) ${x.e.length} · nome-acessível ${x.saidas.nomeAcessivel}${x.e.length ? ` [${x.e[0].tipo}]` : ''}`)
  return x.e.length
}
const com = caso('"Adicionar músicas" (C) → "Adicionar" (B), o MESMO aria-label "Adicionar músicas a X"', no('Adicionar músicas', 17, LONGO), no('Adicionar', 9, LONGO, 120))
const sem = caso('"Adicionar músicas" (C) → "Adicionar" (B), SEM aria-label', no('Adicionar músicas', 17, null), no('Adicionar', 9, null, 120))
const cartao = caso('o cartão que perde conteúdo: o MESMO aria-label, que NÃO contém o texto (48 → 36 car.)', no('título artista tipo data', 48, 'Abrir o conteúdo', 600, false), no('título artista tipo', 36, 'Abrir o conteúdo', 500, false))
const ok = divergem === 0 && com === 0 && sem === 1 && cartao === 1
console.log(ok ? 'CN: PASSA' : 'CN: REPROVA')
process.exit(ok ? 0 : 1)
