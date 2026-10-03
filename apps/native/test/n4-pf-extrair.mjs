// N4-PR3 — extrai da folha RENDERIZADA a tabela "Frases" da seção 7 e escreve a lista esperada das P-F aceitas.
// Uso (da raiz do repositório): node apps/native/test/n4-pf-extrair.mjs docs/native/DESIGN-N4/telas.html > apps/native/test/n4-pf-esperado.json
// Chromium do Playwright 1.55.0 do repositório, sem rede (toda request que não é file/data/blob é abortada e contada).
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const arq = process.argv[2]
const sha = createHash('sha256').update(fs.readFileSync(arq)).digest('hex')
const ACEITAS = ['P-F1', 'P-F3', 'P-F4', 'P-F5', 'P-F6', 'P-F7', 'P-F9', 'P-F10', 'P-F11'] // N4-D67; P-F8 existe (N4-E5)
const b = await chromium.launch()
const p = await b.newPage()
let externas = 0
await p.route('**/*', (r) => (/^(file|data|blob):/.test(r.request().url()) ? r.continue() : (externas++, r.abort())))
await p.goto('file://' + path.resolve(arq))
await p.waitForFunction(() => [...document.querySelectorAll('tr')].some((tr) => tr.cells[0]?.textContent.trim() === 'P-F11'), null, { timeout: 30000 })
const tabela = await p.evaluate(() => [...document.querySelectorAll('tr')].map((tr) => [...tr.cells].map((c) => c.textContent)))
const linhas = tabela.filter((c) => /^P-F\d+$/.test((c[0] ?? '').trim()))
// A tabela das espécies da legenda de `N4-*-L-favoritar-falhou` (cabeçalho ESPÉCIE · A LINHA DE AVISO… · ORIGEM…):
// a linha de aviso composta com frases que já existem (N4-D29).
const i0 = tabela.findIndex((c) => /^esp[ée]cie$/i.test((c[0] ?? '').trim()) && /linha de aviso/i.test(c[1] ?? ''))
const especies = i0 < 0 ? [] : tabela.slice(i0 + 1, i0 + 7).map((c) => ({ especie: c[0].trim(), linha: c[1], origem: c[2].trim() }))
await b.close()
if (externas) throw new Error(`requests externas: ${externas}`)
// A célula da FRASE é a da folha, verbatim. Duas trazem mais do que a frase, e a regra de recorte é esta, escrita:
//   P-F1: "nome acessível <frase> (linha da L e V) · sem rótulo visível" → o que está entre "nome acessível " e " (";
//   P-F5: duas frases separadas por " · " (em voo: favoritar e tirar) → as duas.
const recorte = (id, celula) => {
  if (id === 'P-F1') return [celula.slice('nome acessível '.length, celula.indexOf(' ('))]
  if (id === 'P-F5') return celula.split(' · ')
  return [celula]
}
const pf = linhas.filter((c) => ACEITAS.includes(c[0].trim())).map((c) => {
  const id = c[0].trim(), celula = c[1], decisao = c[2].trim()
  if (decisao !== 'entrou') throw new Error(`${id}: decisão "${decisao}" — a lista P-F aceita mudou`)
  return { id, celula, frases: recorte(id, celula) }
})
if (pf.length !== ACEITAS.length) throw new Error(`achei ${pf.length} de ${ACEITAS.length} P-F aceitas`)
if (especies.length !== 6) throw new Error(`achei ${especies.length} de 6 espécies na tabela do favoritar`)
console.log(JSON.stringify({ origem: 'docs/native/DESIGN-N4/telas.html', sha256: sha, secao: '7 · propostas — decididas na rodada 2, tabela Frases', aceitas: 'N4-D67 (P-F1, P-F3…P-F7, P-F9…P-F11); P-F8 existe (N4-E5)', pf, especies: { secao: 'legenda de N4-*-L-favoritar-falhou, tabela das espécies', linhas: especies } }, null, 2))
