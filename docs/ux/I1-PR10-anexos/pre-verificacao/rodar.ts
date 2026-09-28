/**
 * I1-PR-10 — a PRÉ-VERIFICAÇÃO SEM SESSÃO (decisão 1 do aval; o roteiro da I1-PR-9 com `scrollWidth`): os 13
 * estados da folha 5 com fixture, nas três larguras, contra `tests/gates-web/esperado/5-content-visualizacao.json`,
 * pela MESMA `coletar` e o MESMO `classificarEstado` do G-faixa. Sem `.env`, sem login, sem rede externa: o arquivo
 * da partitura é respondido pelo `route()` (o PDF de 12 páginas gerado, segurado, ou 500).
 *
 * Uso (da raiz, com `app/fumaca-i1pr10/[estado]/page.tsx` copiado de `pagina-fumaca.tsx` e `next dev -p 3110`):
 *   pnpm exec tsx docs/ux/I1-PR10-anexos/pre-verificacao/rodar.ts http://localhost:3110
 * Com `G_CAPTURAS=<pasta>`: uma captura (página inteira) dos cinco estados principais em cada largura — só fixture,
 * sem conta (as capturas do aceite, div. 730 da I1-PR-9).
 */
import { chromium, type Page } from '@playwright/test'
import fs from 'node:fs'
import { coletar, paraJson } from '../../../../scripts/gates-web/g-faixa-coleta'
import { classificarEstado } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'
import { pdfDe12Paginas } from '../../../../scripts/gates-web/g-faixa-conteudo'
import { FIXTURES, PDF_URL } from './fixtures'

const BASE = process.argv[2] ?? 'http://localhost:3110'
const LARGURAS = [1138, 711, 411]
const CAPTURAS = process.env.G_CAPTURAS
const PRINCIPAIS = ['VIEW-cifra', 'VIEW-partitura', 'VIEW-partitura-cheia', 'VIEW-erro-pdf', 'VIEW-vazio-letra']
const FAIXA: Record<number, string> = { 1138: 'C-1138', 711: 'B-711', 411: 'A-411' }
const esperado = JSON.parse(fs.readFileSync('tests/gates-web/esperado/5-content-visualizacao.json', 'utf8'))
const ARQUIVO: Record<string, 'pdf' | 'segurar' | 500> = {
  'VIEW-partitura': 'pdf', 'VIEW-partitura-cheia': 'pdf', 'VIEW-carregando-pdf': 'segurar', 'VIEW-erro-pdf': 500,
}

async function preparar(p: Page, estado: string) {
  const ver = (sel: string) => p.locator(sel).first().waitFor({ state: 'visible', timeout: 60_000 })
  if (estado === 'VIEW-partitura' || estado === 'VIEW-partitura-cheia') await ver('.react-pdf__Page canvas')
  if (estado === 'VIEW-partitura-cheia') {
    await p.getByRole('button', { name: 'Tela cheia', exact: true }).click()
    await p.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 15_000 })
  }
  if (estado === 'VIEW-carregando-pdf') await p.getByText('carregando o PDF…').waitFor({ timeout: 60_000 })
  if (estado.startsWith('VIEW-erro')) await ver('[role="alert"]')
  if (!ARQUIVO[estado] && !estado.startsWith('VIEW-erro')) await ver('section[data-testid^="painel-"]')
}

async function assentar(p: Page) {
  await p.waitForLoadState('load').catch(() => {})
  await p.evaluate(() => new Promise<void>((ok) => {
    let t = setTimeout(fim, 1000); const lim = setTimeout(fim, 30_000)
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(fim, 1000) })
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true })
    function fim() { mo.disconnect(); clearTimeout(lim); document.fonts.ready.then(() => ok()) }
  }))
}

async function main() {
  const nav = await chromium.launch()
  console.log(`chromium ${nav.version()} · base ${BASE}`)
  const medicoes: Record<string, Record<string, unknown>> = {}
  for (const w of LARGURAS) for (const estado of Object.keys(FIXTURES)) {
    const ctx = await nav.newContext({ viewport: { width: w, height: 900 } })
    const p = await ctx.newPage()
    await p.addInitScript('window.__name = (f) => f')
    const presos: { abort: () => Promise<void> }[] = []
    await p.route(PDF_URL, async (rt) => {
      const r = ARQUIVO[estado]
      if (r === 'segurar') { presos.push(rt); return }
      if (r === 500) return rt.fulfill({ status: 500, headers: { 'access-control-allow-origin': '*' }, body: 'x' })
      return rt.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/pdf' }, body: await pdfDe12Paginas() })
    })
    let erro = ''
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        await p.goto(`${BASE}/fumaca-i1pr10/${estado}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await preparar(p, estado); await assentar(p); erro = ''; break
      } catch (e) { erro = (e as Error).message.split('\n')[0] ?? 'erro' }
    }
    if (erro) { console.log(`${estado} · ${w}: NÃO ALCANÇADO — ${erro}`); await ctx.close(); continue }
    const m = await p.evaluate(coletar, null)
    if (CAPTURAS && PRINCIPAIS.includes(estado)) await p.screenshot({ path: `${CAPTURAS}/${estado}-${FAIXA[w]}.png`, fullPage: estado !== 'VIEW-partitura-cheia' })
    ;(medicoes[estado] ??= {})[String(w)] = { viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, true) }
    for (const r of presos) await r.abort().catch(() => {})
    await ctx.close()
  }
  await nav.close()
  const linhas: string[] = []
  let e = 0, b = 0, sw = 0, total = 0
  for (const [estado, larguras] of Object.entries(medicoes)) {
    const f = esperado.estados[estado]
    const c = classificarEstado({ larguras, folha: f && 'C' in f ? { C: f.C, B: f.B } : undefined }) as Record<string, { e: unknown[]; b: { k: string; tipo: string }[]; errata: { k: string; delta: number[] }[]; semPar: { folha: { rotulo?: string }[]; app: { par: string }[] } }>
    for (const [L, r] of Object.entries(c)) {
      const doc = (larguras[L] as { doc: { scrollWidth: number; clientWidth: number } }).doc
      total++; e += r.e.length; b += r.b.length; if (doc.scrollWidth === Number(L)) sw++
      const nos = (larguras[L] as { nos: { k: string; rotulo?: string }[] }).nos
      const nome = (k: string) => JSON.stringify(nos.find((n) => n.k === k)?.rotulo?.slice(0, 50) ?? k)
      linhas.push(`${estado} · ${L}: (e) ${r.e.length} · (b) ${r.b.length} · scrollWidth ${doc.scrollWidth} · errata candidata ${r.errata.length} · sem par folha ${r.semPar.folha.length} / app ${r.semPar.app.length}`)
      for (const o of r.b) linhas.push(`    (b) ${o.tipo}: ${nome(o.k)}`)
      for (const o of r.errata) linhas.push(`    Δ[x,y,w,h] ${JSON.stringify(o.delta)} ${nome(o.k)}`)
      for (const o of r.semPar.folha) linhas.push(`    sem par (folha): ${JSON.stringify(o.rotulo?.slice(0, 50))}`)
      for (const o of r.semPar.app as unknown as { k: string }[]) linhas.push(`    sem par (app): ${nome(o.k)}`)
    }
  }
  console.log(linhas.join('\n'))
  console.log(`\nTOTAL: ${total} (estado × largura) · (e) ${e} · (b) ${b} · scrollWidth = viewport em ${sw}/${total}`)
  fs.writeFileSync('docs/ux/I1-PR10-anexos/pre-verificacao/medicoes.json', JSON.stringify(medicoes))
}
void main()
