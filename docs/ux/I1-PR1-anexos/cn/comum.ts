/**
 * I1-PR1 — CN de navegador do loop mudo (H-I1-7 (d) e (e)). Núcleo comum de `ramo-b.ts` e
 * `ramo-c.ts`. ESCRITO PELO EXECUTOR, RODADO PELO MARCEL (I1-D35): a senha nunca passa pelo
 * executor. Base: `docs/ux/I1-PRECHECK-anexos/faseB/probe1.ts`, corrigido no furo do listener
 * (div. 518):
 *
 *   1. registro por CONTEXTO (`ctx.on`), não por `page` — pega também o que sai de outra página
 *      ou de um documento que a navegação cheia já descartou;
 *   2. a linha nasce no evento `request` (método, caminho, número de ordem) — nunca se perde;
 *   3. o status vem do evento `response` (cabeçalhos recebidos), NÃO do `requestfinished`: a
 *      1ª corrida do controle positivo (div. 522) mostrou `fetch` completo no navegador cujo
 *      `requestfinished` nunca chegou — a linha ficaria `pendente`. O fim (`fim`/`falhou`/`—`)
 *      vai numa coluna à parte, gravado no `requestfinished`/`requestfailed`;
 *   4. CONTROLE POSITIVO antes de medir: um `GET /api/health?cn=controle-1` simples e um
 *      `GET /api/health?cn=controle-2` disparado no mesmo tique de uma navegação cheia (o padrão
 *      em que o probe 1 perdeu linhas). Se qualquer um dos dois não aparecer no log, o script
 *      PARA (exit 1) sem fazer login.
 *
 * Alvo: http://localhost:3000 — o dev server que o Marcel sobe (`pnpm dev`, com o `.env.local`
 * dele). Nenhum request a https://octavia.rocks sai deste script: esse host é abortado no
 * navegador e contado. Os outros hosts (o Firebase Auth do login, `*.googleapis.com`) passam e
 * são listados no resumo. Conta de audit: `USER_AUDIT`/`PASSWORD_AUDIT`
 * do `.env.uxaudit` (procura em `UXAUDIT_ENV`, `./.env.uxaudit`, `../octavia/.env.uxaudit`); os
 * valores nunca são impressos nem gravados.
 *
 * Escrita declarada: NENHUMA. Não são escrita (só cookie, I1-PRECHECK §10): POST e DELETE de
 * /api/auth/session. O POST é respondido NO NAVEGADOR (500 no ramo b, 429 + Retry-After: 60 no
 * ramo c) e nunca chega ao servidor; o DELETE que o /login deslogado dispara sozinho (div. 511)
 * vai ao servidor local (limpa cookie, nada mais). Qualquer outro POST|PUT|PATCH|DELETE a /api/*
 * — em especial POST /api/profile (o perfil da audit existe) — é abortado e é PARADA: exit 1.
 */
import { chromium, type Request } from '@playwright/test'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'http://localhost:3000'
const HOST = 'localhost:3000'

export type Ramo = 'b' | 'c'

interface Linha {
  n: number
  ms: number
  metodo: string
  caminho: string
  status: string
  fim: string
}

export async function rodar(ramo: Ramo, falso: 500 | 429, segundos = 60): Promise<void> {
  const fase = process.argv[2]
  if (fase !== 'antes' && fase !== 'depois') {
    console.error(`uso: pnpm tsx <caminho>/ramo-${ramo}.ts antes|depois   (antes = dev server na main; depois = na branch)`)
    process.exit(2)
  }
  const aqui = path.dirname(new URL(import.meta.url).pathname)
  // CN_SO_CONTROLE=1: roda só o controle positivo (sem .env.uxaudit, sem login), grava em out-controle/ e sai
  const soControle = process.env.CN_SO_CONTROLE === '1'
  const out = path.join(aqui, soControle ? 'out-controle' : `out-${fase}`)
  fs.mkdirSync(out, { recursive: true })
  const pre = `ramo-${ramo}`

  let EMAIL = '', SENHA = ''
  if (!soControle) {
    const envPath = [process.env.UXAUDIT_ENV, '.env.uxaudit', '../octavia/.env.uxaudit'].find((p) => p && fs.existsSync(p))
    if (!envPath) { console.error('PARADA: .env.uxaudit não encontrado (use UXAUDIT_ENV=<caminho>)'); process.exit(1) }
    config({ path: envPath, quiet: true })
    EMAIL = process.env.USER_AUDIT ?? ''; SENHA = process.env.PASSWORD_AUDIT ?? ''
    if (!EMAIL || !SENHA) { console.error('PARADA: USER_AUDIT/PASSWORD_AUDIT ausentes no .env.uxaudit'); process.exit(1) }
  }
  const limpa = (s: string) => (SENHA ? s.replaceAll(SENHA, '<omitido>') : s).replaceAll(EMAIL || '\u0000', '<omitido>')

  const t0 = Date.now()
  const linhas: Linha[] = []
  const porReq = new Map<Request, Linha>()
  const cons: string[] = []
  const navs: Array<{ ms: number; caminho: string }> = []
  const falsos = new WeakSet<Request>()
  let parada = ''
  let passo = 'início'
  let prodAbortados = 0
  const outrosHosts = new Map<string, number>()

  const gravar = (resumo: string[]) => {
    const req = linhas.map((l) => `${String(l.n).padStart(5)} ${String(l.ms).padStart(7)}  ${l.metodo.padEnd(6)} ${l.status.padEnd(9)} ${l.fim.padEnd(8)} ${l.caminho}`)
    fs.writeFileSync(path.join(out, `${pre}-requests.txt`), `# CN ${pre} (${fase}) — requests a ${HOST} (nº de ordem · ms · método · status · fim · caminho). FALSO-n = respondido no navegador, não chegou ao servidor; status pendente = nenhuma resposta; fim — = nem requestfinished nem requestfailed\n${req.join('\n')}\n`)
    fs.writeFileSync(path.join(out, `${pre}-console.txt`), `# CN ${pre} (${fase}) — console, só error/warning (ms · tipo · texto)\n${cons.join('\n')}\n`)
    fs.writeFileSync(path.join(out, `${pre}-resumo.txt`), limpa(resumo.join('\n')) + '\n')
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED })
  try {
    const ctx = await browser.newContext({ viewport: { width: 1138, height: 800 } })

    await ctx.route('**/*', (route) => {
      const r = route.request(), u = new URL(r.url()), m = r.method()
      if (u.hostname === 'octavia.rocks' || u.hostname.endsWith('.octavia.rocks')) { prodAbortados++; return route.abort() }
      if (u.host !== HOST) { outrosHosts.set(u.host, (outrosHosts.get(u.host) ?? 0) + 1); return route.continue() }
      if (!u.pathname.startsWith('/api/') || m === 'GET' || m === 'HEAD') return route.continue()
      if (u.pathname === '/api/auth/session' && m === 'POST' && passo === 'medição') {
        falsos.add(r)
        return route.fulfill({
          status: falso, contentType: 'application/json',
          headers: falso === 429 ? { 'Retry-After': '60' } : {},
          body: JSON.stringify({ error: falso === 429 ? 'Too many requests' : 'Internal server error' }),
        })
      }
      if (u.pathname === '/api/auth/session' && m === 'DELETE') return route.continue()
      parada = `escrita não declarada ${m} ${u.pathname} (abortada no navegador)`
      return route.abort()
    })

    // (1) e (2): por contexto; a linha nasce no `request`
    ctx.on('request', (r) => {
      const u = new URL(r.url())
      if (u.host !== HOST) return
      const l: Linha = { n: linhas.length + 1, ms: Date.now() - t0, metodo: r.method(), caminho: u.pathname + (u.search.includes('cn=') ? u.search : ''), status: 'pendente', fim: '—' }
      linhas.push(l); porReq.set(r, l)
    })
    // (3): o status vem do `response`; o fim, à parte
    ctx.on('response', (resp) => {
      const l = porReq.get(resp.request()); if (!l) return
      l.status = falsos.has(resp.request()) ? `FALSO-${falso}` : String(resp.status())
    })
    ctx.on('requestfinished', (r) => { const l = porReq.get(r); if (l) l.fim = 'fim' })
    ctx.on('requestfailed', (r) => {
      const l = porReq.get(r); if (!l) return
      l.fim = `falhou ${r.failure()?.errorText ?? ''}`.trim()
      if (l.status === 'pendente') l.status = 'FALHA'
    })

    const page = await ctx.newPage()
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push(`${String(Date.now() - t0).padStart(7)}  ${m.type().padEnd(7)} ${limpa(m.text()).slice(0, 400)}`) })
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push({ ms: Date.now() - t0, caminho: new URL(f.url()).pathname }) })

    // (4) controle positivo — antes do login
    passo = 'controle positivo'
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.evaluate(() => fetch('/api/health?cn=controle-1').then((r) => r.status))
    await page.evaluate(() => { void fetch('/api/health?cn=controle-2'); window.location.href = '/login?cn=controle-nav' })
    await page.waitForURL('**/login?cn=controle-nav', { timeout: 60_000 })
    await page.waitForTimeout(1000)
    const c1 = linhas.find((l) => l.caminho === '/api/health?cn=controle-1')
    const c2 = linhas.find((l) => l.caminho === '/api/health?cn=controle-2')
    const controle = `controle positivo: controle-1 ${c1 ? `no log, status ${c1.status}` : 'AUSENTE'} · controle-2 (junto de navegação cheia) ${c2 ? `no log, status ${c2.status}` : 'AUSENTE'}`
    if (!c1 || c1.status !== '200' || !c2) {
      parada = `controle positivo reprovou — o log não é confiável; nada foi medido (${controle})`
      throw new Error(parada)
    }
    if (soControle) {
      gravar([`# CN ${pre} — ${fase} — só o controle positivo (CN_SO_CONTROLE=1) — ${new Date().toISOString()} · alvo ${BASE}`, 'resultado: EXIT 0', controle])
      await browser.close()
      console.log(`CN ${pre} (${fase}): controle positivo passou — ${controle}`)
      return
    }

    // login pela tela (o fluxo que o CN mede)
    passo = 'login'
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.locator('#email').waitFor({ state: 'visible', timeout: 60_000 })
    // preencher antes da hidratação perde o valor (div. 521): espera o React ligar o campo
    await page.waitForFunction(() => { const e = document.querySelector('#email'); return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps')) }, null, { timeout: 60_000 })
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(SENHA)
    if ((await page.locator('#email').inputValue()) !== EMAIL || (await page.locator('#password').inputValue()).length !== SENHA.length) throw new Error('os campos de login não guardaram o valor preenchido')

    passo = 'medição'
    const nAntes = linhas.length
    const navAntes = navs.length
    const inicio = Date.now()
    await page.locator('button[type="submit"]').click()
    const mask = [page.locator('#email'), page.locator('#password'), page.getByText(EMAIL, { exact: false })]
    let s = 0
    while (Date.now() - inicio < segundos * 1000) {
      if (parada) break
      await page.waitForTimeout(1000)
      if (++s % 15 === 0) await page.screenshot({ path: path.join(out, `${pre}-${String(s).padStart(2, '0')}s.png`), mask }).catch(() => {})
    }
    await page.screenshot({ path: path.join(out, `${pre}-fim.png`), mask }).catch(() => {})
    await page.waitForTimeout(1500) // deixa os `requestfinished` pendentes assentarem antes de contar

    const janela = linhas.slice(nAntes)
    const conta = (metodo: string, caminho: string) => janela.filter((l) => l.metodo === metodo && l.caminho === caminho).length
    const post = conta('POST', '/api/auth/session')
    const getPerfil = conta('GET', '/api/profile')
    const postPerfil = conta('POST', '/api/profile')
    const navsJanela = navs.slice(navAntes)
    const ultimos10 = navsJanela.filter((n) => n.ms > Date.now() - t0 - 10_000 - 1500).length
    const alertas = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).map((t) => t.trim()).filter(Boolean)
    const pendentes = janela.filter((l) => l.status === 'pendente').length
    const cumpreDepois = post === 1 && getPerfil === 0 && navsJanela.length === 0 && alertas.length === 1
    const mostraLoop = navsJanela.length >= 50 && getPerfil >= 50

    if (postPerfil) parada = parada || `POST /api/profile ≠ 0 (${postPerfil}) — o perfil da audit existe`

    gravar([
      `# CN ${pre} — ${fase} — ${new Date().toISOString()} · alvo ${BASE} · conta de audit · Chrome do sistema`,
      `resultado: ${parada ? `EXIT 1 — ${parada}` : 'EXIT 0'}`,
      controle,
      `interceptação: POST /api/auth/session → ${falso}${falso === 429 ? ' (Retry-After: 60)' : ''} no navegador, ${segundos} s depois do submit`,
      `requests a octavia.rocks: ${prodAbortados} (abortados no navegador; o esperado é 0)`,
      `outros hosts (passaram): ${[...outrosHosts].map(([h, n]) => `${h} ×${n}`).join(' · ') || '(nenhum)'}`,
      '',
      '## contagem da janela (depois do submit)',
      `  ${String(post).padStart(4)}  POST /api/auth/session (falso, não chegou ao servidor)`,
      `  ${String(getPerfil).padStart(4)}  GET /api/profile (real, servidor local)`,
      `  ${String(postPerfil).padStart(4)}  POST /api/profile`,
      `  ${String(navsJanela.length).padStart(4)}  navegações do quadro principal`,
      `  ${String(ultimos10).padStart(4)}  navegações nos últimos 10 s (0 = parou; > 0 = continuava)`,
      `  ${String(alertas.length).padStart(4)}  frase(s) em [role="alert"] ao fim`,
      `  ${String(pendentes).padStart(4)}  linha(s) sem resposta (status pendente) — o furo da div. 518 ficaria aqui, visível`,
      `  frase(s): ${alertas.length ? alertas.map((t) => `"${t}"`).join(' | ') : '(nenhuma)'}`,
      `  URL ao fim: ${new URL(page.url()).pathname}`,
      `  navegações (ms · caminho): ${navsJanela.map((n) => `${n.ms} ${n.caminho}`).join(' · ') || '(nenhuma)'}`,
      '',
      '## critério (H-I1-7 (d)/(e))',
      `  antes  — ≥ 50 voltas e ≥ 50 GET /api/profile: ${mostraLoop ? 'OBSERVADO' : 'não observado'}`,
      `  depois — 1 POST, 0 GET /api/profile, 0 navegações, 1 frase: ${cumpreDepois ? 'CUMPRE' : 'NÃO CUMPRE'}`,
    ])
    await browser.close()
    if (parada) { console.error(`CN ${pre}: EXIT 1 — ${parada}`); process.exit(1) }
    console.log(`CN ${pre} (${fase}): exit 0 — ver ${path.relative(process.cwd(), out)}/${pre}-resumo.txt`)
  } catch (e) {
    gravar([`# CN ${pre} — ${fase} — EXIT 1 em "${passo}": ${String((e as Error)?.message ?? e)}`])
    await browser.close().catch(() => {})
    console.error(`CN ${pre}: exit 1 em "${passo}"`)
    process.exit(1)
  }
}
