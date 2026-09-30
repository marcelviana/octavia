/**
 * I1-PR-13 — a PRÉ-VERIFICAÇÃO SEM SESSÃO (o roteiro das PR-9…12, com `scrollWidth`): os estados da folha 8 nas três
 * larguras, contra `tests/gates-web/esperado/8-setlists.json`, pela MESMA `coletar`, o MESMO `classificarEstado` e os
 * MESMOS roteiros do aceite (`ESTADOS_SETLISTS`/`ESTADOS_SETLISTS_BASE` de `scripts/gates-web/g-faixa-setlists.ts` — o
 * instrumento também se prova aqui). Sem `.env`, sem login, sem rede externa; as leituras e as escritas são as
 * FABRICADAS do roteiro, e qualquer escrita a `/api/*` que não seja fabricada é abortada e contada.
 *
 * Uso (da raiz de uma CÓPIA da árvore sem `.env*`, depois de `sh docs/ux/I1-PR13-anexos/pre-verificacao/remendos.sh` e
 * com `next dev -p 3110`):
 *   pnpm exec tsx docs/ux/I1-PR13-anexos/pre-verificacao/rodar.ts http://localhost:3110 <pasta de saída>
 * `G_CAPTURAS=<pasta>`: uma captura (página inteira) dos estados principais em cada largura — só fixture, sem conta.
 * `G_ESTADOS=a,b`: só esses. `SESSAO-nao-renovada` fica fora: sem Firebase não há sessão a renovar (é do aceite).
 */
import { chromium, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { coletar, paraJson } from '../../../../scripts/gates-web/g-faixa-coleta'
import { classificarEstado } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'
import { soltar } from '../../../../scripts/gates-web/g-faixa-auth'
import { ESTADOS_SETLISTS, ESTADOS_SETLISTS_BASE } from '../../../../scripts/gates-web/g-faixa-setlists'

const BASE = process.argv[2] ?? 'http://localhost:3110'
const SAIDA = process.argv[3] ?? 'docs/ux/I1-PR13-anexos/pre-verificacao'
const LARGURAS = [1138, 711, 411]
const CAPTURAS = process.env.G_CAPTURAS
const PRINCIPAIS = ['SET', 'SET-nenhuma', 'SET-vazio', 'SET-erro', 'SET-criar-validacao', 'SET-criar-erro', 'SET-apagar-erro', 'SET-ja-apagada', 'SET-adicionar', 'SET-adicionar-erro', 'SET-remover-erro']
const FAIXA: Record<number, string> = { 1138: 'C-1138', 711: 'B-711', 411: 'A-411' }
const esperado = JSON.parse(fs.readFileSync('tests/gates-web/esperado/8-setlists.json', 'utf8'))
const { 'SESSAO-nao-renovada': _semSessao, ...DA_FOLHA } = ESTADOS_SETLISTS
const TODOS: typeof ESTADOS_SETLISTS = { ...DA_FOLHA, ...ESTADOS_SETLISTS_BASE }

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
  const fabricados: string[] = []
  for (const w of LARGURAS) for (const [estado, est] of Object.entries(TODOS).filter(([e]) => !so || so.includes(e))) {
    const ctx = await nav.newContext({ viewport: { width: w, height: 900 } })
    const p = await ctx.newPage()
    await p.addInitScript('window.__name = (f) => f')
    // a barreira: o que não é leitura e não foi fabricado pelo roteiro (as rotas da página vêm antes desta) é abortado
    await ctx.route('**/api/**', (rt) => (['GET', 'HEAD', 'OPTIONS'].includes(rt.request().method()) ? rt.fallback() : (escritas++, rt.abort())))
    p.on('response', (r) => { if (r.headers()['x-g-faixa'] === 'fabricado' && r.request().method() !== 'GET') fabricados.push(`${r.request().method()} ${new URL(r.url()).pathname} ${r.status()}`) })
    let erro = ''
    try {
      if (est.antes) await est.antes(p, new URL(BASE))
      await p.goto(`${BASE}/fumaca-i1pr13/${estado}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      if (est.preparar) await est.preparar(p)
      await assentar(p)
      if (est.espera && !(await p.getByText(est.espera, { exact: false }).first().isVisible().catch(() => false))) erro = `o texto esperado não apareceu: "${est.espera}"`
    } catch (e) { erro = (e as Error).message.split('\n')[0] ?? 'erro' }
    if (erro) { console.log(`${estado} · ${w}: NÃO ALCANÇADO — ${erro}`); await soltar(p); await ctx.close(); continue }
    const m = await p.evaluate(coletar, null)
    if (CAPTURAS && PRINCIPAIS.includes(estado)) await p.screenshot({ path: path.join(CAPTURAS, `${estado}-${FAIXA[w]}.png`), fullPage: true })
    ;(medicoes[estado] ??= {})[String(w)] = { viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, true) }
    await soltar(p)
    await ctx.close()
  }
  await nav.close()
  const linhas: string[] = []
  let e = 0, b = 0, sw = 0, total = 0, cand = 0
  const candPorEstado: Record<string, number> = {}
  for (const [estado, larguras] of Object.entries(medicoes)) {
    const secao = TODOS[estado]?.secao
    const f = secao ? esperado.estados[secao] : null
    const c = classificarEstado(f ? { larguras, folha: { C: f.C, B: f.B } } : { larguras }) as Record<string, { e: unknown[]; b: { k: string; tipo: string }[]; errata?: { k: string; delta: number[] }[]; semPar?: { folha: { rotulo?: string }[]; app: { k: string }[] } }>
    for (const [L, r] of Object.entries(c)) {
      const doc = (larguras[L] as { doc: { scrollWidth: number } }).doc
      const errata = r.errata ?? []
      total++; e += r.e.length; b += r.b.length; if (L !== '411') { cand += errata.length; candPorEstado[estado] = (candPorEstado[estado] ?? 0) + errata.length }
      if (doc.scrollWidth === Number(L)) sw++
      const nos = (larguras[L] as { nos: { k: string; rotulo?: string }[] }).nos
      const nome = (k: string) => JSON.stringify(nos.find((n) => n.k === k)?.rotulo?.slice(0, 50) ?? k)
      linhas.push(`${estado} · ${L}${secao && secao !== estado ? ` (contra ${secao})` : ''}: (e) ${r.e.length} · (b) ${r.b.length} · scrollWidth ${doc.scrollWidth} · errata candidata ${errata.length} · sem par folha ${r.semPar?.folha.length ?? '—'} / app ${r.semPar?.app.length ?? '—'}`)
      for (const o of r.b) linhas.push(`    (b) ${o.tipo}: ${nome(o.k)}`)
      for (const o of errata) linhas.push(`    Δ[x,y,w,h] ${JSON.stringify(o.delta)} ${nome(o.k)}`)
      for (const o of r.semPar?.folha ?? []) linhas.push(`    sem par (folha): ${JSON.stringify(o.rotulo?.slice(0, 50))}`)
      for (const o of r.semPar?.app ?? []) linhas.push(`    sem par (app): ${nome(o.k)}`)
    }
  }
  console.log(linhas.join('\n'))
  console.log(`\nerrata candidata por estado (C + B): ${JSON.stringify(candPorEstado)}`)
  const contagem: Record<string, number> = {}
  for (const f of fabricados) contagem[f] = (contagem[f] ?? 0) + 1
  console.log(`respostas fabricadas (não-GET): ${JSON.stringify(contagem)}`)
  console.log(`\nTOTAL: ${total} (estado × largura) · (e) ${e} · (b) ${b} · scrollWidth = viewport em ${sw}/${total} · errata candidata (C e B) ${cand} · escritas a /api NÃO fabricadas (abortadas) ${escritas}`)
  fs.writeFileSync(path.join(SAIDA, 'medicoes.json'), JSON.stringify(medicoes))
}
void main()
