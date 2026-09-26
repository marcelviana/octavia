/**
 * I1 pre-check, Fase B — probe 1 (H-I1-2): o loop mudo do POST /api/auth/session.
 * ESCRITO PELO EXECUTOR, RODADO PELO MARCEL (I1-D35): a senha nunca passa pelo executor.
 *
 *   pnpm tsx docs/ux/I1-PRECHECK-anexos/faseB/probe1.ts        (da raiz da árvore)
 *
 * Alvo: https://octavia.rocks (I1-D34), conta de audit. Credenciais: USER_AUDIT e
 * PASSWORD_AUDIT do `.env.uxaudit` (procura em ./.env.uxaudit e em ../octavia/.env.uxaudit,
 * ou no caminho de UXAUDIT_ENV). Nunca são impressas nem gravadas.
 * Login pela UI do próprio app (o formulário de /login) — é o fluxo que o probe mede.
 *
 * Três ramos, cada um num contexto novo (sem cookie, sem IndexedDB):
 *   a) caminho feliz, sem interceptação, 30 s de observação;
 *   b) POST /api/auth/session respondido NO NAVEGADOR com 500, 60 s;
 *   c) o mesmo com 429 (+ Retry-After: 60), 60 s.
 * Em b) e c) o POST nunca chega a prod: aparece como FALSO no requests.txt.
 *
 * Escrita declarada: NENHUMA. Não são escrita (só cookie, I1-PRECHECK §10): POST e DELETE
 * de /api/auth/session. Qualquer outro POST|PUT|PATCH|DELETE a /api/* — em especial
 * POST /api/profile (o perfil da audit existe) — é PARADA: exit 1.
 *
 * Saída: faseB/probe1-out/{requests,console,resumo}.txt e {a,b,c}-*.png.
 */
import { chromium, type BrowserContext, type Request } from '@playwright/test'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://octavia.rocks'
const AQUI = path.dirname(new URL(import.meta.url).pathname)
const OUT = path.join(AQUI, 'probe1-out')
fs.mkdirSync(OUT, { recursive: true })

const envPath = [process.env.UXAUDIT_ENV, '.env.uxaudit', '../octavia/.env.uxaudit'].find((p) => p && fs.existsSync(p))
if (!envPath) { console.error('PARADA: .env.uxaudit não encontrado (use UXAUDIT_ENV=<caminho>)'); process.exit(1) }
config({ path: envPath, quiet: true })
const EMAIL = process.env.USER_AUDIT, SENHA = process.env.PASSWORD_AUDIT
if (!EMAIL || !SENHA) { console.error('PARADA: USER_AUDIT/PASSWORD_AUDIT ausentes no .env.uxaudit'); process.exit(1) }
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) { console.error('PARADA: USER_AUDIT não tem forma de email (aspas ou espaço no .env.uxaudit?) — valor não impresso'); process.exit(1) }

const t0 = Date.now()
const ms = () => String(Date.now() - t0).padStart(7)
const reqs: string[] = [], cons: string[] = [], resumo: string[] = []
let parada = ''
let passo = 'início'

async function ramo(nome: 'a' | 'b' | 'c', segundos: number, falso?: 500 | 429) {
  passo = `ramo ${nome}`
  const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED })
  const ctx: BrowserContext = await browser.newContext({ viewport: { width: 1138, height: 800 } })
  const falsos = new WeakSet<Request>()
  const falsosDel = new WeakSet<Request>() // o DELETE que o /login deslogado dispara sozinho — respondido no navegador (div. 511)
  const conta: Record<string, number> = {}
  const navs: string[] = []
  const soma = (k: string) => { conta[k] = (conta[k] ?? 0) + 1 }

  await ctx.route('**/api/**', (route) => {
    const r = route.request(), u = new URL(r.url()), m = r.method()
    if (u.host !== 'octavia.rocks' || m === 'GET' || m === 'HEAD') return route.continue()
    if (u.pathname === '/api/auth/session' && (m === 'POST' || m === 'DELETE')) {
      if (falso && m === 'POST') {
        falsos.add(r)
        return route.fulfill({
          status: falso, contentType: 'application/json',
          headers: falso === 429 ? { 'Retry-After': '60' } : {},
          body: JSON.stringify({ error: falso === 429 ? 'Too many requests' : 'Internal server error' }),
        })
      }
      if (m === 'DELETE') {
        falsosDel.add(r)
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
      }
      return route.continue()
    }
    parada = `ramo ${nome}: escrita não declarada ${m} ${u.pathname}`
    return route.abort()
  })

  const page = await ctx.newPage()
  page.on('requestfinished', async (r) => {
    const u = new URL(r.url())
    const st = falsos.has(r) ? `FALSO-${falso}` : falsosDel.has(r) ? 'FALSO' : String((await r.response())?.status() ?? '-')
    if (u.host === 'octavia.rocks') reqs.push(`${ms()}  ${nome}  ${r.method().padEnd(6)} ${st.padEnd(9)} ${u.pathname}`)
    if (u.pathname === '/api/auth/session') soma(`${r.method()} /api/auth/session ${falsos.has(r) || falsosDel.has(r) ? '(falso, não chegou a prod)' : '(real)'}`)
    if (u.pathname === '/api/profile') soma(`${r.method()} /api/profile`)
  })
  page.on('requestfailed', (r) => { const u = new URL(r.url()); if (u.host === 'octavia.rocks') reqs.push(`${ms()}  ${nome}  ${r.method().padEnd(6)} FALHA     ${u.pathname} ${r.failure()?.errorText ?? ''}`) })
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push(`${ms()}  ${nome}  ${m.type().padEnd(7)} ${m.text().slice(0, 400)}`) })
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) { const p = new URL(f.url()).pathname; navs.push(`${ms()} ${p}`); soma(`navegação ${p}`) } })

  // commit 3b: 'networkidle' estourou 60 s na 1ª rodada do Marcel; espera-se o campo, não a rede parada
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.locator('#email').waitFor({ state: 'visible', timeout: 60_000 })
  // commit 3b (2ª rodada do Marcel): preencher ANTES da hidratação do React perde o valor — o input
  // controlado volta a "" (ramo a: "Please enter a valid email address."; b/c: "Please fill out this field.").
  // Espera o React ligar os handlers no campo; preenche; confere que ficou (sem imprimir valor).
  await page.waitForFunction(() => { const e = document.querySelector('#email'); return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps')) }, null, { timeout: 60_000 })
  await page.locator('#email').fill(EMAIL!)
  await page.locator('#password').fill(SENHA!)
  if ((await page.locator('#email').inputValue()) !== EMAIL || (await page.locator('#password').inputValue()).length !== SENHA!.length) throw new Error('os campos de login não guardaram o valor preenchido')
  const inicio = Date.now()
  await page.locator('button[type="submit"]').click()
  // máscara: o email da audit nunca aparece nas capturas (campo de login e cabeçalho)
  const mask = [page.locator('#email'), page.locator('#password'), page.getByText(EMAIL!, { exact: false })]
  let n = 0
  while (Date.now() - inicio < segundos * 1000) {
    if (parada) break
    if (conta['POST /api/profile']) { parada = `ramo ${nome}: POST /api/profile ≠ 0 (o perfil da audit existe)`; break }
    await page.waitForTimeout(1000)
    if (++n % 15 === 0) await page.screenshot({ path: path.join(OUT, `${nome}-${String(n).padStart(2, '0')}s.png`), mask }).catch(() => {})
  }
  await page.screenshot({ path: path.join(OUT, `${nome}-fim.png`), mask }).catch(() => {})
  // um ramo sem nenhum GET /api/profile não logou (o login-panel.tsx:44 o faz a todo usuário) — não mediu nada
  if (!parada && !conta['GET /api/profile']) parada = `ramo ${nome}: o login não aconteceu (0 GET /api/profile) — ver ${nome}-fim.png`
  const tela = (await page.locator('[role="alert"]').allInnerTexts().catch(() => [])).join(' | ')
  const url = page.url()
  await browser.close()

  resumo.push(
    `## ramo ${nome} — ${falso ? `POST /api/auth/session → ${falso} no navegador` : 'sem interceptação'}, ${segundos} s depois do submit`,
    ...Object.entries(conta).sort().map(([k, v]) => `  ${String(v).padStart(4)}  ${k}`),
    `  URL ao fim: ${new URL(url).pathname}`,
    `  alerta na tela ao fim: ${tela || '(nenhum)'}`,
    `  navegações (ms · caminho): ${navs.join(' · ')}`,
    `  navegações nos últimos 10 s da janela: ${navs.filter((l) => Number(l.trim().split(' ')[0]) > Date.now() - t0 - 10_000).length} (0 = o loop parou; > 0 = continuava)`,
    '',
  )
}

async function main() {
  await ramo('a', 30)
  if (!parada) await ramo('b', 60, 500)
  if (!parada) await ramo('c', 60, 429)
  const reais = reqs.filter((l) => /\/api\//.test(l) && !/ GET | HEAD /.test(l) && !/FALSO/.test(l) && !/\/api\/auth\/session/.test(l))
  fs.writeFileSync(path.join(OUT, 'requests.txt'), `# probe 1 — requests a octavia.rocks (ms · ramo · método · status · caminho). FALSO-n = respondido no navegador, não chegou a prod\n${reqs.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'console.txt'), `# probe 1 — console, só error/warning (ms · ramo · tipo · texto)\n${cons.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'resumo.txt'), [
    `# probe 1 — resumo (${new Date().toISOString()}) · alvo ${BASE} · conta de audit · Chrome do sistema`,
    `resultado: ${parada ? `EXIT 1 — parou em "${passo}": ${parada}` : 'EXIT 0 — três ramos completos'}`,
    `escritas a /api/* fora de /api/auth/session que chegaram a prod: ${reais.length}${reais.length ? '\n' + reais.join('\n') : ''}`,
    '',
    ...resumo,
  ].join('\n') + '\n')
  if (parada || reais.length) { console.error(`PARADA (${passo}): ${parada || reais.join('; ')}`); process.exit(1) }
  console.log('probe 1: exit 0 — ver probe1-out/resumo.txt')
}

main().catch((e) => {
  fs.writeFileSync(path.join(OUT, 'requests.txt'), `# probe 1 — requests até a parada (ms · ramo · método · status · caminho)\n${reqs.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'console.txt'), `# probe 1 — console até a parada\n${cons.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'resumo.txt'), `# probe 1 — EXIT 1 em "${passo}": ${String(e?.message ?? e).replaceAll(SENHA!, '<omitido>').replaceAll(EMAIL!, '<omitido>')}\n`)
  console.error(`probe 1: exit 1 em "${passo}"`)
  process.exit(1)
})
