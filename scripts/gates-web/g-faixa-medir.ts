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
import { coletar, paraJson } from './g-faixa-coleta'
import { semResposta, soltar } from './g-faixa-auth'
import { selecionadas, type Superficie } from './g-faixa-superficies'

const BASE = new URL(process.env.G_FAIXA_BASE_URL as string)
const PERFIL = process.env.G_FAIXA_PERFIL
const TMP = process.env.G_FAIXA_TMP as string
/**
 * I1-PR11 (div. 803): `G_FAIXA_ESTADOS=a,b` mede SÓ esses estados; o fechamento (`g-faixa-sessao.ts`, `mesclar`) os
 * mescla POR ESTADO no JSON existente — os outros estados ficam byte a byte como estavam.
 */
const ESTADOS_SO = process.env.G_FAIXA_ESTADOS?.split(',').map((s) => s.trim()).filter(Boolean)
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

interface Vigia { t0: number; linhas: LinhaReq[]; porReq: Map<Request, LinhaReq>; outros: Map<string, number>; estado: { prodAbortados: 0 | number; parada: string } }
const novaVigia = (): Vigia => ({ t0: Date.now(), linhas: [], porReq: new Map(), outros: new Map(), estado: { prodAbortados: 0, parada: '' } })

/**
 * O log de requests da I1-PR1 (div. 522) e a barreira de escrita, num contexto. I1-PR6: vários
 * contextos (um por estado) escrevem na MESMA vigia; a resposta FABRICADA no navegador
 * (`x-g-faixa: fabricado`, `g-faixa-auth.ts`) é marcada como tal — não saiu, não é escrita.
 */
function vigiar(ctx: BrowserContext, v: Vigia = novaVigia()) {
  const { t0, linhas, porReq, outros, estado } = v
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
  ctx.on('response', (resp) => { const l = porReq.get(resp.request()); if (l) l.status = resp.headers()['x-g-faixa'] === 'fabricado' ? `fabricado ${resp.status()}` : String(resp.status()) })
  ctx.on('requestfinished', (r) => { const l = porReq.get(r); if (l) l.fim = 'fim' })
  ctx.on('requestfailed', (r) => { const l = porReq.get(r); if (l) { l.fim = `falhou ${r.failure()?.errorText ?? ''}`.trim(); if (l.status === 'pendente') l.status = semResposta.has(r) ? 'fabricado sem resposta' : 'FALHA' } })
  return v
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

/** A folha medida (`g-faixa-esperado.ts`) — o esperado da errata candidata (I1-PR6). */
function lerEsperado(folha: string): { sha256: string; estados: Record<string, { C: unknown[]; B: unknown[] } | { falta: string }> } | null {
  const f = path.join('tests/gates-web/esperado', `${folha}.json`)
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null
}

/** Solta as respostas seguradas (I1-PR6) e fecha o contexto, com teto: um `route` pendurado não trava a rodada. */
async function fechar(ctx: BrowserContext) {
  for (const p of ctx.pages()) await soltar(p)
  await Promise.race([ctx.close(), new Promise((ok) => setTimeout(ok, 15_000))])
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
    // sessão real: um perfil persistente para a superfície; sem sessão (I1-PR6): um contexto POR ESTADO
    const vigia = novaVigia()
    const abrir = async () => {
      const c = sup.sessao
        ? await chromium.launchPersistentContext(PERFIL as string, { viewport: vp, serviceWorkers: 'block' })
        : await navegador.newContext({ viewport: vp, serviceWorkers: 'block' })
      vigiar(c, vigia)
      return c
    }
    const { linhas, outros, estado } = vigia
    let ctx = await abrir()
    const page = ctx.pages()[0] ?? (await ctx.newPage())
    try {
      const controle = await controlePositivo(page, linhas, sup.sessao ? '/dashboard' : sup.rota)
      expect(controle, 'controle positivo do listener (div. 522)').not.toMatchObject({ controle1: 'AUSENTE' })
      expect(controle, 'controle positivo do listener (div. 522)').not.toMatchObject({ controle2: 'AUSENTE' })

      let url: string | null = sup.rota
      if (sup.resolver) url = await sup.resolver(page, BASE)
      const esperado = sup.implementada && sup.folha ? lerEsperado(sup.folha) : null
      const estados: Record<string, { medicao?: unknown; folha?: unknown; pulado?: string; naoAlcancado?: string; inalcancavel?: string }> = {}
      for (const [id, est] of Object.entries(sup.estados)) {
        if (ESTADOS_SO && !ESTADOS_SO.includes(id)) continue
        if (est.inalcancavel) { estados[id] = { inalcancavel: est.inalcancavel }; continue }
        if (!url) { estados[id] = { pulado: 'a rota não resolveu (ex.: nenhum content na conta)' }; continue }
        // I1-PR10: a URL por estado (o content de cada tipo); sem ela, NÃO ALCANÇADO com a razão
        const alvo = est.rota ? est.rota() : url
        if (!alvo) { estados[id] = { naoAlcancado: 'a conta não tem content deste tipo (a descoberta pela /library não achou)' }; continue }
        const t = Date.now()
        console.log(`G-faixa · ${sup.id} · ${id} · ${largura}: começa`)
        if (!sup.sessao) { await fechar(ctx); ctx = await abrir() }
        const p = sup.sessao ? page : await ctx.newPage()
        // I1-PR9: com sessão a página é a MESMA entre estados — as rotas fabricadas do estado anterior saem
        // (as do contexto, a barreira de escrita e o log, ficam) e as respostas seguradas se soltam
        if (sup.sessao) { await soltar(p); await p.unrouteAll({ behavior: 'ignoreErrors' }) }
        try {
          if (est.antes) await est.antes(p, BASE)
          await p.setViewportSize(vp)
          await p.goto(new URL(alvo, BASE).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
          await assentar(p)
          const caiu = sup.sessao && new URL(p.url()).pathname.startsWith('/login')
          expect(caiu, `a sessão caiu em ${sup.rota} (redirecionou para /login)`).toBe(false)
          if (est.preparar) { await est.preparar(p); await assentar(p) }
        } catch (e) {
          estados[id] = { naoAlcancado: `a preparação falhou: ${(e as Error).message.split('\n')[0]?.slice(0, 200)}` }
          continue
        }
        if (est.espera && !(await p.getByText(est.espera, { exact: false }).first().isVisible().catch(() => false))) {
          estados[id] = { naoAlcancado: `o texto esperado não apareceu: "${est.espera}"` }
          continue
        }
        console.log(`G-faixa · ${sup.id} · ${id} · ${largura}: preparado em ${Date.now() - t} ms`)
        const m = await p.evaluate(coletar, null)
        const medicao = { url: sup.rota, viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, sup.publica) }
        estados[id] = { medicao }
        // I1-PR11: a folha pode ser POR ESTADO (o `LIB-salvo` da folha 4, medido pelo fluxo do editor)
        const esp = est.folha ? lerEsperado(est.folha) : esperado
        const secao = est.secao && esp?.estados[est.secao]
        if (esp && secao && 'C' in secao) estados[id].folha = { C: secao.C, B: secao.B, secao: est.secao, sha256: esp.sha256, ...(est.folha ? { folha: est.folha } : {}) }
      }
      expect(estado.parada, 'escrita não declarada').toBe('')
      const peca = {
        superficie: sup.id, rota: sup.rota, folha: sup.folha ?? null, implementada: sup.implementada, publica: sup.publica,
        rodada: process.env.G_FAIXA_RODADA, base: BASE.origin, chromium: navegador.version(), commit: sha,
        largura, controlePositivo: controle, ...(ESTADOS_SO ? { estadosMedidos: ESTADOS_SO } : {}),
        requests: { linhas, outrosHosts: Object.fromEntries(outros), prodAbortados: estado.prodAbortados },
        estados,
      }
      fs.writeFileSync(path.join(TMP, `${sup.id}.${largura}.json`), JSON.stringify(peca))
      for (const [id, e] of Object.entries(estados)) if (e.medicao) {
        const c = (classificarEstado({ larguras: { [String(largura)]: e.medicao } }) as Record<string, { b: unknown[] }>)[String(largura)]
        info.annotations.push({ type: `${id} · ${largura}`, description: `(b)=${c?.b.length} · nós=${(e.medicao as { nos: unknown[] }).nos.length} (o (e) e o (d′) saem no fechamento, contra 1138)` })
      }
    } finally {
      await fechar(ctx)
      await navegador.close()
    }
  })
}
