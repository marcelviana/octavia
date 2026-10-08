// O texto renderizado da folha (document.body.innerText), sem rede — a entrada do nomes.py. Uso, da raiz:
// node docs/native/DESIGN-QL-anexos/instrumentos/texto-renderizado.mjs <telas.html> <saida.txt>
import { chromium } from '@playwright/test'
import fs from 'node:fs'
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 1200 } })
await ctx.route('**/*', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort())
const p = await ctx.newPage(); await p.goto('file://' + process.argv[2]); await p.waitForTimeout(6000)
fs.writeFileSync(process.argv[3], await p.evaluate(() => document.body.innerText)); await b.close()
