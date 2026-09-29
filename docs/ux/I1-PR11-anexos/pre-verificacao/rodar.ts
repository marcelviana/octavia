/**
 * I1-PR-11 — a PRÉ-VERIFICAÇÃO SEM SESSÃO (o roteiro das PR-9/10 com `scrollWidth`): os 15 estados da folha 6 nas três
 * larguras, contra `tests/gates-web/esperado/6-content-editor.json`, pela MESMA `coletar` e o MESMO
 * `classificarEstado` do G-faixa. Sem `.env`, sem login, sem rede externa, sem `PUT` (nenhum estado clica em *Salvar*;
 * um `PUT`/`POST`/`DELETE` a `/api/*` é abortado e o estado sai NÃO ALCANÇADO).
 *
 * Uso (da raiz de uma CÓPIA da árvore, com `app/fumaca-i1pr11/[estado]/page.tsx` copiado de `pagina-fumaca.tsx` e
 * `next dev -p 3110` sem `.env`):
 *   pnpm exec tsx docs/ux/I1-PR11-anexos/pre-verificacao/rodar.ts http://localhost:3110 <pasta de saída>
 * Com `G_CAPTURAS=<pasta>`: uma captura (página inteira) de cinco estados em cada largura — só fixture, sem conta.
 */
import { chromium, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { coletar, paraJson } from '../../../../scripts/gates-web/g-faixa-coleta'
import { classificarEstado } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'

const BASE = process.argv[2] ?? 'http://localhost:3110'
const SAIDA = process.argv[3] ?? 'docs/ux/I1-PR11-anexos/pre-verificacao'
const LARGURAS = [1138, 711, 411]
const CAPTURAS = process.env.G_CAPTURAS
const PRINCIPAIS = ['EDIT-cifra', 'EDIT-tab', 'EDIT-letra', 'EDIT-salvar-erro', 'EDIT-erro-rede']
const FAIXA: Record<number, string> = { 1138: 'C-1138', 711: 'B-711', 411: 'A-411' }
const esperado = JSON.parse(fs.readFileSync('tests/gates-web/esperado/6-content-editor.json', 'utf8'))
const ESTADOS = Object.keys(esperado.estados).filter((e) => 'C' in esperado.estados[e])
const EDITADOS = ['EDIT-cifra', 'EDIT-tab', 'EDIT-letra', 'EDIT-salvando', 'EDIT-salvar-erro']
const TELA: Record<string, string> = {
  'EDIT-carregando-auth': 'edit-carregando-sessao', 'EDIT-sem-usuario': 'edit-carregando-sessao', 'EDIT-carregando': 'edit-carregando',
  'EDIT-carregando-editor': 'edit-carregando-editor', 'EDIT-404': 'edit-nao-existe',
}

async function preparar(p: Page, estado: string) {
  const ver = (sel: string) => p.locator(sel).first().waitFor({ state: 'visible', timeout: 90_000 })
  if (TELA[estado]) return ver(`[data-tela="${TELA[estado]}"]`)
  if (estado.startsWith('EDIT-erro')) return ver('[data-tela="edit-erro"]')
  await p.getByRole('button', { name: /^(Salvar|Salvando…)$/ }).waitFor({ state: 'visible', timeout: 90_000 })
  const favorita = p.getByRole('checkbox', { name: 'Favorita' })
  // a alteração LOCAL: marcar *Favorita* (nenhum texto muda; o chip aparece) — nada sai (não se clica em Salvar)
  // repetido até o chip aparecer: o HTML do SSR chega antes da hidratação no `next dev`
  if (EDITADOS.includes(estado)) for (let i = 0; i < 20; i++) {
    if ((await favorita.getAttribute('aria-checked')) !== 'true') await favorita.click()
    if (await p.getByText('alterações não salvas').waitFor({ state: 'visible', timeout: 1_500 }).then(() => true, () => false)) return
    await p.waitForTimeout(500)
  }
}

async function assentar(p: Page) {
  await p.evaluate(() => new Promise<void>((ok) => {
    let t = setTimeout(fim, 800); const lim = setTimeout(fim, 20_000)
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(fim, 800) })
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true })
    function fim() { mo.disconnect(); clearTimeout(lim); document.fonts.ready.then(() => ok()) }
  }))
}

async function main() {
  const nav = await chromium.launch()
  console.log(`chromium ${nav.version()} · base ${BASE}`)
  const medicoes: Record<string, Record<string, unknown>> = {}
  const so = process.env.G_ESTADOS?.split(',').filter(Boolean)
  let escritas = 0
  for (const w of LARGURAS) for (const estado of ESTADOS.filter((e) => !so || so.includes(e))) {
    const ctx = await nav.newContext({ viewport: { width: w, height: 900 } })
    const p = await ctx.newPage()
    await p.addInitScript('window.__name = (f) => f')
    await p.route('**/api/**', (rt) => (['GET', 'HEAD', 'OPTIONS'].includes(rt.request().method()) ? rt.fallback() : (escritas++, rt.abort())))
    const url = `${BASE}/fumaca-i1pr11/${estado}`
    let erro = ''
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 180_000 }); await preparar(p, estado); await assentar(p); erro = ''; break }
      catch (e) { erro = (e as Error).message.split('\n')[0] ?? 'erro' }
    }
    if (erro) { console.log(`${estado} · ${w}: NÃO ALCANÇADO — ${erro}`); await ctx.close(); continue }
    const m = await p.evaluate(coletar, null)
    if (CAPTURAS && PRINCIPAIS.includes(estado)) await p.screenshot({ path: path.join(CAPTURAS, `${estado}-${FAIXA[w]}.png`), fullPage: true })
    ;(medicoes[estado] ??= {})[String(w)] = { viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, true) }
    await ctx.close()
  }
  await nav.close()
  const linhas: string[] = []
  let e = 0, b = 0, sw = 0, total = 0, cand = 0
  for (const [estado, larguras] of Object.entries(medicoes)) {
    const f = esperado.estados[estado]
    const c = classificarEstado({ larguras, folha: { C: f.C, B: f.B } }) as Record<string, { e: unknown[]; b: { k: string; tipo: string }[]; errata: { k: string; delta: number[] }[]; semPar: { folha: { rotulo?: string }[]; app: { k: string }[] } }>
    for (const [L, r] of Object.entries(c)) {
      const doc = (larguras[L] as { doc: { scrollWidth: number } }).doc
      total++; e += r.e.length; b += r.b.length; cand += L === '411' ? 0 : r.errata.length; if (doc.scrollWidth === Number(L)) sw++
      const nos = (larguras[L] as { nos: { k: string; rotulo?: string }[] }).nos
      const nome = (k: string) => JSON.stringify(nos.find((n) => n.k === k)?.rotulo?.slice(0, 50) ?? k)
      linhas.push(`${estado} · ${L}: (e) ${r.e.length} · (b) ${r.b.length} · scrollWidth ${doc.scrollWidth} · errata candidata ${r.errata.length} · sem par folha ${r.semPar.folha.length} / app ${r.semPar.app.length}`)
      for (const o of r.b) linhas.push(`    (b) ${o.tipo}: ${nome(o.k)}`)
      for (const o of r.errata) linhas.push(`    Δ[x,y,w,h] ${JSON.stringify(o.delta)} ${nome(o.k)}`)
      for (const o of r.semPar.folha) linhas.push(`    sem par (folha): ${JSON.stringify(o.rotulo?.slice(0, 50))}`)
      for (const o of r.semPar.app) linhas.push(`    sem par (app): ${nome(o.k)}`)
    }
  }
  console.log(linhas.join('\n'))
  console.log(`\nTOTAL: ${total} (estado × largura) · (e) ${e} · (b) ${b} · scrollWidth = viewport em ${sw}/${total} · errata candidata (C e B) ${cand} · escritas a /api abortadas ${escritas}`)
  fs.writeFileSync(path.join(SAIDA, 'medicoes.json'), JSON.stringify(medicoes))
}
void main()
