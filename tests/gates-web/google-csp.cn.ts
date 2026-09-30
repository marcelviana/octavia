/**
 * I1-PR2 (I1-D6, H-I1-3) — CN do *Entrar com Google*: o probe 2 do pre-check
 * virando gate. Sem sessão, contra o build de PRODUÇÃO local (`pnpm build &&
 * pnpm start`): no `pnpm dev` a CSP é report-only (DEVELOPMENT_SECURITY_CONFIG)
 * e o bloqueio não se reproduz.
 *
 * O Google NÃO é interceptado — o SDK carrega de verdade. O que se mede:
 *   - violações de CSP (securitypolicyviolation) e erros de console;
 *   - se o popup abre e chega a accounts.google.com;
 *   - se o opener mantém a referência do popup (`closed === false`) — o que o
 *     COOP `same-origin` corta;
 *   - a frase de falha na tela.
 * Para na página de login do Google: nunca digita, nunca clica nela.
 *
 * Escrita: ZERO. O `/login` deslogado dispara `DELETE /api/auth/session`; ele é
 * respondido NO NAVEGADOR (200 falso). Qualquer outra escrita a /api/* = parada.
 *
 * Uso (da raiz, com o servidor de produção em :3000):
 *   pnpm tsx tests/gates-web/google-csp.cn.ts [pasta-de-saída]
 * PASSA (exit 0): 0 violações de CSP, nenhum aviso de COOP fora o do Google
 * (div. 936), popup em accounts.google.com, opener com o popup, nenhuma frase
 * de falha. REPROVA (exit 1) com o motivo. Parada = exit 2.
 */
import { chromium, type BrowserContext, type Page, type Request } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

export interface Sonda {
  base: string
  /** reescreve os cabeçalhos do documento /login (só a medição da PR usa) */
  cabecalhos?: (h: Record<string, string>) => Record<string, string>
  janelaMs?: number
}

export interface Resultado {
  violacoes: string[]
  erros: string[]
  popups: string[]
  chegouAoGoogle: boolean
  popupFechadoNoOpener: boolean | null
  openerNoPopup: boolean | null
  fraseNaTela: string[]
  cabecalhosLogin: Record<string, string>
  requests: string[]
  interceptados: string[]
  parada: string
  console: string[]
}

export async function sondar({ base, cabecalhos, janelaMs = 20_000 }: Sonda): Promise<Resultado> {
  const t0 = Date.now()
  const ms = () => String(Date.now() - t0).padStart(6)
  const host = new URL(base).host
  const r: Resultado = {
    violacoes: [], erros: [], popups: [], chegouAoGoogle: false, popupFechadoNoOpener: null,
    openerNoPopup: null, fraseNaTela: [], cabecalhosLogin: {}, requests: [], interceptados: [], parada: '', console: [],
  }
  const falsos = new WeakSet<Request>()
  const vigia = (page: Page, onde: string) => {
    page.on('requestfinished', async (q) => r.requests.push(`${ms()}  ${onde.padEnd(6)} ${q.method().padEnd(7)} ${(falsos.has(q) ? 'FALSO' : String((await q.response())?.status() ?? '-')).padEnd(5)} ${q.url().split('?')[0]}`))
    page.on('requestfailed', (q) => r.requests.push(`${ms()}  ${onde.padEnd(6)} ${q.method().padEnd(7)} FALHA ${q.url().split('?')[0]} ${q.failure()?.errorText ?? ''}`))
    page.on('console', (m) => {
      const t = m.text()
      r.console.push(`${ms()}  ${onde.padEnd(6)} ${m.type().padEnd(8)} ${t}`)
      if (t.startsWith('CSP-VIOLATION')) r.violacoes.push(`${onde}: ${t}`)
      else if (m.type() === 'error' || t.includes('Cross-Origin-Opener-Policy')) r.erros.push(`${onde}: ${t}`)
    })
    page.on('pageerror', (e) => { r.console.push(`${ms()}  ${onde.padEnd(6)} pageerror ${e.message}`); r.erros.push(`${onde}: pageerror ${e.message}`) })
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context: BrowserContext = await browser.newContext({ viewport: { width: 1138, height: 800 } })
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP-VIOLATION directive=${e.effectiveDirective} blocked=${e.blockedURI.split('?')[0]} disposition=${e.disposition}`)
    })
    const abrir = window.open.bind(window)
    window.open = (...a: Parameters<typeof window.open>) => {
      const w = abrir(...a)
      ;(window as unknown as { __sondaPopup: Window | null }).__sondaPopup = w
      return w
    }
  })
  await context.route('**/api/**', (route) => {
    const q = route.request()
    const u = new URL(q.url())
    if (u.host !== host || q.method() === 'GET' || q.method() === 'HEAD') return route.continue()
    if (u.pathname === '/api/auth/session' && q.method() === 'DELETE') {
      falsos.add(q)
      r.interceptados.push(`${ms()}  DELETE /api/auth/session → 200 falso no navegador`)
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    }
    r.parada = `escrita não declarada: ${q.method()} ${u.pathname}`
    return route.abort()
  })
  // A CSP do dev é report-only; aqui ela é APLICADA com o mesmo valor (nenhuma
  // diretiva acrescentada) — o bloqueio da produção, reproduzido no `pnpm dev`.
  await context.route(`${base}/login`, async (route) => {
    const resp = await route.fetch()
    let h = { ...resp.headers() }
    const ro = h['content-security-policy-report-only']
    if (ro && !h['content-security-policy']) {
      delete h['content-security-policy-report-only']
      h['content-security-policy'] = ro
    }
    if (cabecalhos) h = cabecalhos(h)
    route.fulfill({ response: resp, headers: h })
  })

  const page = await context.newPage()
  vigia(page, 'login')
  context.on('page', (p) => {
    vigia(p, 'popup')
    r.popups.push(`${ms()}  popup aberto: ${p.url().split('?')[0]}`)
    p.on('framenavigated', (f) => {
      if (f !== p.mainFrame()) return
      const u = f.url().split('?')[0]
      r.popups.push(`${ms()}  popup navegou: ${u}`)
      if (new URL(f.url()).host === 'accounts.google.com') r.chegouAoGoogle = true
    })
  })

  const resp = await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 60_000 })
  const h = resp?.headers() ?? {}
  for (const k of ['content-security-policy', 'content-security-policy-report-only', 'cross-origin-opener-policy']) if (h[k]) r.cabecalhosLogin[k] = h[k]
  const nAntes = r.console.length
  await page.getByRole('button', { name: /entrar com google/i }).click()
  const fim = Date.now() + janelaMs
  while (Date.now() < fim && !r.parada && !r.chegouAoGoogle) await page.waitForTimeout(250)
  // chegou ao Google: dá tempo ao SDK de sondar o `closed` do popup (o COOP corta a referência)
  await page.waitForTimeout(r.chegouAoGoogle ? 10_000 : 1_500)
  r.popupFechadoNoOpener = await page.evaluate(() => {
    const w = (window as unknown as { __sondaPopup?: Window | null }).__sondaPopup
    return w === undefined ? null : w === null ? true : w.closed
  })
  const popup = context.pages().find((p) => p !== page)
  if (popup) r.openerNoPopup = await popup.evaluate(() => window.opener !== null).catch(() => null)
  r.fraseNaTela = await page.locator('p.text-cor-error-ink').allInnerTexts().catch(() => [])
  r.console.splice(0, 0, `# ${nAntes} linhas antes do clique`)
  await browser.close()
  return r
}

/**
 * Div. 936 (aval do commit 1): o `Cross-Origin-Opener-Policy-Report-Only` da
 * própria página do Google avisa isto no opener com qualquer COOP nosso
 * (o controle `unsafe-none` dá o mesmo) — excluído POR TEXTO; outro aviso de
 * COOP reprova.
 */
export const AVISO_COOP_DO_GOOGLE = 'Cross-Origin-Opener-Policy policy would block the window.closed call.'

export function veredito(r: Resultado): string[] {
  const m: string[] = []
  if (r.violacoes.length) m.push(`${r.violacoes.length} violação(ões) de CSP — a 1ª: ${r.violacoes[0]}`)
  const coop = r.erros.filter((e) => e.includes('Cross-Origin-Opener-Policy') && !e.endsWith(`: ${AVISO_COOP_DO_GOOGLE}`))
  if (coop.length) m.push(`${coop.length} aviso(s) de COOP no console — o 1º: ${coop[0]}`)
  if (!r.chegouAoGoogle) m.push('o popup não chegou a accounts.google.com')
  if (r.popupFechadoNoOpener !== false) m.push(`o opener não mantém o popup (closed=${r.popupFechadoNoOpener})`)
  if (r.fraseNaTela.length) m.push(`frase de falha na tela: ${JSON.stringify(r.fraseNaTela)}`)
  return m
}

/** O host do authDomain do Firebase não vai para arquivo: vira `<authDomain>`. */
const semAuthDomain = (s: string) => s.replace(/[a-z0-9-]+\.firebaseapp\.com/g, '<authDomain>')

export function gravar(pasta: string, bruto: Resultado, titulo: string) {
  fs.mkdirSync(pasta, { recursive: true })
  const r: Resultado = {
    ...bruto,
    ...Object.fromEntries((['violacoes', 'erros', 'popups', 'requests', 'console', 'fraseNaTela'] as const).map((k) => [k, bruto[k].map(semAuthDomain)])),
    cabecalhosLogin: Object.fromEntries(Object.entries(bruto.cabecalhosLogin).map(([k, v]) => [k, semAuthDomain(v)])),
  }
  const m = veredito(r)
  fs.writeFileSync(path.join(pasta, 'console.txt'), r.console.join('\n') + '\n')
  fs.writeFileSync(path.join(pasta, 'requests.txt'), r.requests.join('\n') + `\n\n# interceptados no navegador\n${r.interceptados.join('\n') || '(nenhum)'}\n`)
  fs.writeFileSync(path.join(pasta, 'resumo.txt'), [
    `# ${titulo} (${new Date().toISOString()})`,
    `cabeçalhos do /login:`, ...Object.entries(r.cabecalhosLogin).map(([k, v]) => `  ${k}: ${v.replace(/'nonce-[^']+'/, "'nonce-…'")}`),
    `violações de CSP: ${r.violacoes.length}`, ...r.violacoes.map((v) => `  ${v}`),
    `erros de console (fora as violações): ${r.erros.length}`, ...r.erros.map((v) => `  ${v}`),
    `popups:`, ...(r.popups.length ? r.popups : ['  (nenhum)']),
    `chegou a accounts.google.com: ${r.chegouAoGoogle}`,
    `opener — popup.closed: ${r.popupFechadoNoOpener}`,
    `popup — window.opener !== null: ${r.openerNoPopup}`,
    `frase na tela: ${JSON.stringify(r.fraseNaTela)}`,
    `interceptados no navegador: ${r.interceptados.length}`,
    `parada: ${r.parada || '(nenhuma)'}`,
    `veredito: ${m.length ? 'REPROVA\n' + m.map((x) => `  - ${x}`).join('\n') : 'PASSA'}`,
  ].join('\n') + '\n')
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const base = process.env.GOOGLE_CSP_BASE ?? 'http://localhost:3000'
  const pasta = process.argv[2]
  sondar({ base }).then((r) => {
    if (pasta) gravar(pasta, r, `CN google-csp — ${base}`)
    const m = veredito(r)
    if (r.parada) { console.error(`PARADA: ${r.parada}`); process.exit(2) }
    if (m.length) { console.error(`google-csp: REPROVA\n${m.map((x) => `  - ${x}`).join('\n')}`); process.exit(1) }
    console.log('google-csp: PASSA — 0 violações, popup no Google, opener com o popup, nenhuma frase de falha')
  }).catch((e) => { console.error(e); process.exit(2) })
}
