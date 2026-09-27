/**
 * G-faixa — a MEDIÇÃO (I1-PR5; I1-D13, I1-D16). Roda LOCAL, nunca no CI:
 *   G_FAIXA_BASE_URL=http://localhost:3000 pnpm exec playwright test -c playwright.g-faixa.config.ts
 * (o resto do modo de usar está em `scripts/gates-web/COMO-RODAR.md`).
 *
 * Por superfície × estado × largura (um projeto do Playwright por largura),
 * grava o `boundingBox` de cada controle e texto identificável — papel,
 * `data-testid`, nome acessível e texto visível — com o que o veredito precisa
 * para classificar: o recorte do contêiner mais próximo que corta ou rola, e se
 * o próprio nó esconde o que transborda. A classificação é a do
 * `g-faixa-classificar.mjs`; o `g-faixa-veredito.mjs` a refaz sobre o JSON.
 *
 * REQUESTS — o listener corrigido da I1-PR1 (div. 522): por CONTEXTO, a linha
 * nasce no `request`, o status vem do `response` e o fim à parte; e um
 * CONTROLE POSITIVO antes de medir (um `GET /api/health?cn=controle-1` simples
 * e um `?cn=controle-2` disparado no mesmo tique de uma navegação cheia): se
 * um dos dois não aparecer no log, a rodada PARA.
 *
 * ESCRITA declarada: NENHUMA. `POST`/`DELETE` de `/api/auth/session` são
 * cookie (I1-PRECHECK §10) e passam; qualquer outra escrita a `/api/*` é
 * abortada no navegador e reprova a rodada. Request a `octavia.rocks` (prod) é
 * abortado e contado, salvo se a própria base for prod.
 */
import { chromium, expect, test, type BrowserContext, type Page, type Request } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { CHROMIUM_FIXADO } from '../../playwright.g-faixa.config'
import { classificarEstado } from './g-faixa-classificar.mjs'
import { coletar, medirFolha, paraJson } from './g-faixa-coleta'
import { selecionadas, type Superficie } from './g-faixa-superficies'

const BASE = new URL(process.env.G_FAIXA_BASE_URL as string)
const PERFIL = process.env.G_FAIXA_PERFIL
const TMP = process.env.G_FAIXA_TMP as string
const PROD = BASE.hostname === 'octavia.rocks' || BASE.hostname.endsWith('.octavia.rocks')

interface LinhaReq { n: number; ms: number; metodo: string; caminho: string; status: string; fim: string }

/** A página parou de mudar: `load`, fontes, e 1 s sem mutação no DOM (até 30 s). */
async function assentar(page: Page) {
  await page.waitForLoadState('load', { timeout: 120_000 }).catch(() => {})
  await page.evaluate(() => new Promise<void>((ok) => {
    let t = setTimeout(fim, 1000)
    const limite = setTimeout(fim, 30_000)
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(fim, 1000) })
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true })
    function fim() { mo.disconnect(); clearTimeout(limite); document.fonts.ready.then(() => ok()) }
  }))
}

/** O log de requests da I1-PR1 (div. 522) e a barreira de escrita. */
function vigiar(ctx: BrowserContext) {
  const t0 = Date.now()
  const linhas: LinhaReq[] = []
  const porReq = new Map<Request, LinhaReq>()
  const outros = new Map<string, number>()
  const estado = { prodAbortados: 0, parada: '' }
  void ctx.route('**/*', (route) => {
    const r = route.request(), u = new URL(r.url()), m = r.method()
    if (!PROD && (u.hostname === 'octavia.rocks' || u.hostname.endsWith('.octavia.rocks'))) { estado.prodAbortados++; return route.abort() }
    if (u.origin !== BASE.origin) { outros.set(u.host, (outros.get(u.host) ?? 0) + 1); return route.continue() }
    if (!u.pathname.startsWith('/api/') || ['GET', 'HEAD', 'OPTIONS'].includes(m) || u.pathname === '/api/auth/session') return route.continue()
    estado.parada = `escrita não declarada ${m} ${u.pathname} (abortada no navegador)`
    return route.abort()
  })
  ctx.on('request', (r) => {
    const u = new URL(r.url())
    if (u.origin !== BASE.origin) return
    const l: LinhaReq = { n: linhas.length + 1, ms: Date.now() - t0, metodo: r.method(), caminho: u.pathname.replace(/^\/content\/[^/]+/, '/content/[id]') + (u.search.includes('cn=') ? u.search : ''), status: 'pendente', fim: '—' }
    linhas.push(l); porReq.set(r, l)
  })
  ctx.on('response', (resp) => { const l = porReq.get(resp.request()); if (l) l.status = String(resp.status()) })
  ctx.on('requestfinished', (r) => { const l = porReq.get(r); if (l) l.fim = 'fim' })
  ctx.on('requestfailed', (r) => { const l = porReq.get(r); if (l) { l.fim = `falhou ${r.failure()?.errorText ?? ''}`.trim(); if (l.status === 'pendente') l.status = 'FALHA' } })
  return { linhas, outros, estado }
}

/** Controle positivo (regra 7): duas requests conhecidas têm de aparecer no log. */
async function controlePositivo(page: Page, linhas: LinhaReq[], rota: string) {
  await page.goto(new URL(rota, BASE).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await page.evaluate(() => fetch('/api/health?cn=controle-1').then((r) => r.status).catch(() => 0))
  await page.evaluate(() => { void fetch('/api/health?cn=controle-2').catch(() => 0); location.reload() })
  await page.waitForLoadState('domcontentloaded', { timeout: 180_000 })
  await page.waitForTimeout(1_500)
  const achou = (cn: string) => linhas.find((l) => l.caminho.includes(`cn=${cn}`))
  const c1 = achou('controle-1'), c2 = achou('controle-2')
  return { controle1: c1 ? `${c1.metodo} ${c1.status} ${c1.fim}` : 'AUSENTE', controle2: c2 ? `${c2.metodo} ${c2.status} ${c2.fim}` : 'AUSENTE' }
}

const sha = (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() + (execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() ? '+sujo' : '') } catch { return 'desconhecido' }
})()

for (const sup of selecionadas()) {
  test(sup.id, async ({ viewport }, info) => {
    test.skip(sup.sessao && !PERFIL, 'superfície com sessão e sem G_FAIXA_PERFIL')
    const vp = viewport as { width: number; height: number }
    const largura = vp.width

    const navegador = await chromium.launch()
    expect(navegador.version(), 'Chromium do Playwright na versão fixada (div. 512)').toBe(CHROMIUM_FIXADO)
    const ctx = sup.sessao
      ? await chromium.launchPersistentContext(PERFIL as string, { viewport: vp, serviceWorkers: 'block' })
      : await navegador.newContext({ viewport: vp, serviceWorkers: 'block' })
    const { linhas, outros, estado } = vigiar(ctx)
    const page = ctx.pages()[0] ?? (await ctx.newPage())
    try {
      const controle = await controlePositivo(page, linhas, sup.sessao ? '/dashboard' : sup.rota)
      expect(controle, 'controle positivo do listener (div. 522)').not.toMatchObject({ controle1: 'AUSENTE' })
      expect(controle, 'controle positivo do listener (div. 522)').not.toMatchObject({ controle2: 'AUSENTE' })

      let url: string | null = sup.rota
      if (sup.resolver) {
        await page.goto(new URL('/library', BASE).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await assentar(page)
        url = await sup.resolver(page)
      }
      const estados: Record<string, { medicao?: unknown; folha?: unknown; pulado?: string }> = {}
      for (const [id, est] of Object.entries(sup.estados)) {
        if (!url) { estados[id] = { pulado: 'a rota não resolveu (ex.: nenhum content na conta)' }; continue }
        await page.setViewportSize(vp)
        await page.goto(new URL(url, BASE).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await assentar(page)
        const caiu = sup.sessao && new URL(page.url()).pathname.startsWith('/login')
        expect(caiu, `a sessão caiu em ${sup.rota} (redirecionou para /login)`).toBe(false)
        if (est.preparar) { await est.preparar(page); await assentar(page) }
        const m = await page.evaluate(coletar, null)
        const medicao = { url: sup.rota, viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, sup.publica) }
        estados[id] = { medicao }
        if (sup.implementada && sup.folha && est.secao && largura === 1138) {
          const pf = await navegador.newPage()
          estados[id].folha = await medirFolha(pf, sup.folha, est.secao, sup.publica)
          await pf.close()
        }
      }
      expect(estado.parada, 'escrita não declarada').toBe('')
      const peca = {
        superficie: sup.id, rota: sup.rota, folha: sup.folha ?? null, implementada: sup.implementada, publica: sup.publica,
        rodada: process.env.G_FAIXA_RODADA, base: BASE.origin, chromium: navegador.version(), commit: sha,
        largura, controlePositivo: controle,
        requests: { linhas, outrosHosts: Object.fromEntries(outros), prodAbortados: estado.prodAbortados },
        estados,
      }
      fs.writeFileSync(path.join(TMP, `${sup.id}.${largura}.json`), JSON.stringify(peca))
      for (const [id, e] of Object.entries(estados)) if (e.medicao) {
        const c = (classificarEstado({ larguras: { [String(largura)]: e.medicao } }) as Record<string, { b: unknown[] }>)[String(largura)]
        info.annotations.push({ type: `${id} · ${largura}`, description: `(b)=${c?.b.length} · nós=${(e.medicao as { nos: unknown[] }).nos.length} (o (e) e o (d′) saem no fechamento, contra 1138)` })
      }
    } finally {
      await ctx.close()
      await navegador.close()
    }
  })
}
