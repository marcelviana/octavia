/**
 * I1 pre-check, Fase B — probe 2 (H-I1-3): o que o clique em "Continue with Google"
 * faz em https://octavia.rocks/login, SEM login.
 *
 * Roda pelo executor: `pnpm tsx docs/ux/I1-PRECHECK-anexos/faseB/probe2.ts` (da raiz).
 * Chrome do sistema (`channel: 'chrome'`), perfil temporário, headless.
 *
 * Escrita: ZERO. O `/login` deslogado dispara sozinho `DELETE /api/auth/session`
 * (`clearSessionCookie`, contexts/firebase-auth-context.tsx:187); ele é respondido
 * NO NAVEGADOR com 200 falso (o molde é tests/ux-audit/session-intercept.ts) e nunca
 * chega a prod. Qualquer outro POST|PUT|PATCH|DELETE a octavia.rocks/api/* = parada.
 *
 * Para no primeiro erro de console depois do clique ou quando uma página de
 * accounts.google.com abre; nunca interage com a página do Google.
 */
import { chromium, type Page, type Request } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://octavia.rocks'
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'probe2-out')
fs.mkdirSync(OUT, { recursive: true })

const t0 = Date.now()
const ms = () => String(Date.now() - t0).padStart(6)
const reqs: string[] = []
const cons: string[] = []
const interceptados: string[] = []
let parada = ''
const falsos = new WeakSet<Request>() // respondidos no navegador por route.fulfill — não chegam a prod

function grava(req: Request, status: string, onde: string) {
  reqs.push(`${ms()}  ${onde.padEnd(6)} ${req.method().padEnd(7)} ${status.padEnd(5)} ${req.url().split('?')[0]}`)
}

function vigia(page: Page, onde: string) {
  page.on('requestfinished', async (r) => grava(r, falsos.has(r) ? 'FALSO' : String((await r.response())?.status() ?? '-'), onde))
  page.on('requestfailed', (r) => grava(r, 'FALHA', onde + ' ' + (r.failure()?.errorText ?? '')))
  page.on('console', (m) => cons.push(`${ms()}  ${onde.padEnd(6)} ${m.type().padEnd(8)} ${m.text()}`))
  page.on('pageerror', (e) => cons.push(`${ms()}  ${onde.padEnd(6)} pageerror ${e.message}`))
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 1138, height: 800 } })
  await context.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP-VIOLATION directive=${e.effectiveDirective} blocked=${e.blockedURI} source=${e.sourceFile}:${e.lineNumber}`)
    })
  })
  await context.route('**/api/**', (route) => {
    const r = route.request()
    const u = new URL(r.url())
    if (u.host !== 'octavia.rocks' || r.method() === 'GET' || r.method() === 'HEAD') return route.continue()
    if (u.pathname === '/api/auth/session' && r.method() === 'DELETE') {
      falsos.add(r)
      interceptados.push(`${ms()}  DELETE /api/auth/session → 200 falso no navegador (não chegou a prod)`)
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
    }
    parada = `escrita não declarada: ${r.method()} ${u.pathname}`
    return route.abort()
  })

  const page = await context.newPage()
  vigia(page, 'login')
  const popups: string[] = []
  context.on('page', (p) => {
    vigia(p, 'popup')
    popups.push(`${ms()}  popup aberto: ${p.url()}`)
    p.on('framenavigated', (f) => { if (f === p.mainFrame()) popups.push(`${ms()}  popup navegou: ${f.url().split('?')[0]}`) })
  })

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 60_000 })
  await page.screenshot({ path: path.join(OUT, '1-antes.png') })
  const nConsoleAntes = cons.length

  const botao = page.getByRole('button', { name: /continue with google/i })
  await botao.click()
  const fim = Date.now() + 15_000
  let motivo = 'janela de 15 s esgotada'
  while (Date.now() < fim) {
    if (parada) { motivo = parada; break }
    if (popups.some((l) => l.includes('accounts.google.com'))) { motivo = 'a página do Google abriu (popup)'; break }
    if (page.url().includes('accounts.google.com')) { motivo = 'a página do Google abriu (navegação)'; break }
    if (cons.slice(nConsoleAntes).some((l) => / error | pageerror /.test(l))) { motivo = 'primeiro erro de console depois do clique'; break }
    await page.waitForTimeout(250)
  }
  await page.waitForTimeout(1500) // deixa o erro chegar à tela, se chegar
  await page.screenshot({ path: path.join(OUT, '2-depois.png') })
  const erroNaTela = await page.locator('[role="alert"], .text-red-600, .text-destructive').allInnerTexts().catch(() => [])
  await browser.close()

  const escritasProd = reqs.filter((l) => /octavia\.rocks\/api\//.test(l) && !/ GET | HEAD /.test(l) && !/ FALSO /.test(l))
  fs.writeFileSync(path.join(OUT, 'requests.txt'), `# probe 2 — requests (ms desde o início · página · método · status · URL sem query)\n${reqs.join('\n')}\n\n# interceptados no navegador\n${interceptados.join('\n') || '(nenhum)'}\n`)
  fs.writeFileSync(path.join(OUT, 'console.txt'), `# probe 2 — console (ms · página · tipo · texto); ${nConsoleAntes} linhas antes do clique\n${cons.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'resumo.txt'), [
    `# probe 2 — resumo (${new Date().toISOString()})`,
    `alvo: ${BASE}/login · Chrome do sistema, headless, 1138×800, perfil temporário, sem login`,
    `parou por: ${motivo}`,
    `popups:\n${popups.join('\n') || '  (nenhum)'}`,
    `URL final da página: ${page.url().split('?')[0]}`,
    `erro na tela: ${JSON.stringify(erroNaTela)}`,
    `violações de CSP: ${cons.filter((l) => l.includes('CSP-VIOLATION')).length}`,
    `requests a octavia.rocks/api/* com método de escrita que chegaram a prod: ${escritasProd.length}`,
    `interceptados no navegador: ${interceptados.length}`,
  ].join('\n') + '\n')
  if (parada || escritasProd.length) { console.error(`PARADA: ${parada || escritasProd.join('; ')}`); process.exit(1) }
  console.log(`probe 2: ${motivo}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
