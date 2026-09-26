// I1-PR3, commit 3 — aceite A: o visualizador e as telas depois do corte (Chromium, 1138 px).
// Anexo (rastro executável), não código do app. Alvo fixo: http://localhost:3000 (`next dev`,
// div. 570 — `next start` em http não serve páginas).
//
//   node docs/ux/I1-PR3-anexos/aceite/aceite-a.mjs publico
//     EXECUTOR. Sem login: captura `/` e `/privacy-policy`, e registra para onde cada página
//     protegida manda sem sessão (esperado: /login). Grava em aceite/out-publico/.
//
//   node <caminho absoluto>/docs/ux/I1-PR3-anexos/aceite/aceite-a.mjs sessao
//     MARCEL (a senha nunca passa pelo executor — I1-D35, o mesmo rito da PR-1). Dev server da
//     branch com o `.env.local` dele (copiado para a árvore — passo dele). Login pela tela com
//     USER_AUDIT/PASSWORD_AUDIT do `.env.uxaudit` (UXAUDIT_ENV, ./.env.uxaudit, ../octavia/.env.uxaudit);
//     os valores nunca são impressos nem gravados. Escolhe um content `[UX-AUDIT]` de cada tipo
//     (texto de fixture do projeto — regra "anexo não carrega texto de música") e captura
//     /content/[id] × 4 (Sheet com PDF), /content/[id]/edit, /setlists, /dashboard, /library.
//     Grava em aceite/out-sessao/.
//
// ESCRITA DECLARADA: NENHUMA. POST/DELETE de /api/auth/session são cookie (I1-PRECHECK §10) e
// passam; qualquer outro POST|PUT|PATCH|DELETE a /api/* é ABORTADO no navegador e é PARADA
// (exit 1). Requests a octavia.rocks são abortados e contados (esperado 0). Leituras que saem
// de localhost: Firebase Auth (login) e o objeto do PDF no storage do Supabase (o visualizador
// lê o `file_url` direto — é o que a I1-D36 prova). Tudo listado no resumo.
//
// Durante a medição nada se grava na árvore (o `next dev` a vigia — div. 531 da PR-1): as
// capturas vão para um diretório temporário e são copiadas ao fim.
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE = 'http://localhost:3000'
const HOST = 'localhost:3000'
const modo = process.argv[2]
if (!['publico', 'sessao'].includes(modo)) {
  console.error('uso: node aceite-a.mjs <publico|sessao>')
  process.exit(2)
}
const aqui = path.dirname(new URL(import.meta.url).pathname)
const destino = path.join(aqui, `out-${modo}`)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `i1-pr3-aceite-a-${modo}-`))
const t0 = Date.now()
const resumo = [`# I1-PR3 aceite A — modo ${modo} — ${new Date().toISOString()} · alvo ${BASE} · Chrome do sistema, 1138×800`]
const log = (l) => { resumo.push(l); console.log(l) }

let EMAIL = '', SENHA = ''
if (modo === 'sessao') {
  const { config } = await import('dotenv')
  const envPath = [process.env.UXAUDIT_ENV, '.env.uxaudit', '../octavia/.env.uxaudit'].find((p) => p && fs.existsSync(p))
  if (!envPath) { console.error('PARADA: .env.uxaudit não encontrado (use UXAUDIT_ENV=<caminho>)'); process.exit(1) }
  config({ path: envPath, quiet: true })
  EMAIL = process.env.USER_AUDIT ?? ''; SENHA = process.env.PASSWORD_AUDIT ?? ''
  if (!EMAIL || !SENHA) { console.error('PARADA: USER_AUDIT/PASSWORD_AUDIT ausentes'); process.exit(1) }
}

let parada = null
let prodAbortados = 0
const outrosHosts = new Map()
const escritas = []

const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED })
let exit = 0
try {
  const ctx = await browser.newContext({ viewport: { width: 1138, height: 800 } })
  await ctx.route('**/*', (route) => {
    const r = route.request(), u = new URL(r.url()), m = r.method()
    if (u.hostname === 'octavia.rocks' || u.hostname.endsWith('.octavia.rocks')) { prodAbortados++; return route.abort() }
    if (u.host !== HOST) { outrosHosts.set(`${m} ${u.host}`, (outrosHosts.get(`${m} ${u.host}`) ?? 0) + 1); return route.continue() }
    if (!u.pathname.startsWith('/api/') || m === 'GET' || m === 'HEAD') return route.continue()
    if (u.pathname === '/api/auth/session' && (m === 'POST' || m === 'DELETE')) { escritas.push(`${m} ${u.pathname} (cookie, declarado)`); return route.continue() }
    parada = `escrita não declarada ${m} ${u.pathname} (abortada no navegador)`
    return route.abort()
  })
  const page = await ctx.newPage()
  const erros = []
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message.split('\n')[0].slice(0, 200)}`))

  const captura = async (nome, url, esperar, opcoes = {}) => {
    await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
    let prova = 'sem espera'
    if (esperar) prova = await esperar().then((p) => p ?? 'ok', (e) => `FALHOU: ${e.message.split('\n')[0]}`)
    await page.waitForTimeout(800)
    const arquivo = `${nome}.png`
    await page.screenshot({ path: path.join(tmp, arquivo), fullPage: opcoes.fullPage ?? false, mask: opcoes.mask ?? [] })
    log(`${nome.padEnd(22)} ${url.padEnd(48)} → ${new URL(page.url()).pathname.padEnd(40)} ${prova} · ${arquivo}`)
    return prova
  }

  if (modo === 'publico') {
    log('## públicas (sem sessão)')
    await captura('landing', '/', () => page.locator('a[href="/login"]').first().waitFor({ timeout: 60_000 }).then(() => 'link /login visível'), { fullPage: true })
    await captura('privacy-policy', '/privacy-policy', () => page.getByText('dpo@octavia.app').first().waitFor({ timeout: 60_000 }).then(() => 'mailto do DPO visível'), { fullPage: true })
    log('## protegidas sem sessão (esperado: /login — o corpo delas é do modo sessao)')
    for (const url of ['/dashboard', '/library', '/setlists', '/content/aceite-sem-sessao', '/content/aceite-sem-sessao/edit']) {
      await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
      await page.waitForTimeout(500)
      log(`sem sessão ${url.padEnd(34)} → ${new URL(page.url()).pathname}`)
    }
  } else {
    log('## login pela tela (conta de audit)')
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
    await page.locator('#email').waitFor({ state: 'visible', timeout: 60_000 })
    await page.waitForFunction(() => { const e = document.querySelector('#email'); return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps')) }, null, { timeout: 60_000 })
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(SENHA)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('**/dashboard', { timeout: 90_000 })
    log(`login: ok → ${new URL(page.url()).pathname}`)

    const bearer = await page.evaluate(() => new Promise((resolve) => {
      const open = indexedDB.open('firebaseLocalStorageDb')
      open.onsuccess = () => {
        try {
          const g = open.result.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAll()
          g.onsuccess = () => resolve(g.result.find((r) => r.fbase_key.startsWith('firebase:authUser:'))?.value?.stsTokenManager?.accessToken ?? null)
          g.onerror = () => resolve(null)
        } catch { resolve(null) }
      }
      open.onerror = () => resolve(null)
    }))
    if (!bearer) throw new Error('sem token no IndexedDB depois do login')
    const res = await page.request.get(`${BASE}/api/content?search=${encodeURIComponent('UX-AUDIT')}&pageSize=100`, { headers: { Authorization: `Bearer ${bearer}` } })
    const itens = ((await res.json()).data ?? []).filter((c) => (c.title ?? '').startsWith('[UX-AUDIT]'))
    log(`GET /api/content?search=UX-AUDIT → ${res.status()} · ${itens.length} content [UX-AUDIT]`)
    const escolha = {
      Lyrics: itens.find((c) => c.content_type === 'Lyrics'),
      Chords: itens.find((c) => c.content_type === 'Chords'),
      Tab: itens.find((c) => c.content_type === 'Tab'),
      Sheet: itens.find((c) => c.content_type === 'Sheet' && /\.pdf(\?|$)/i.test(c.file_url ?? '')),
    }
    for (const [tipo, c] of Object.entries(escolha)) log(`escolhido ${tipo.padEnd(6)} ${c ? `${c.id} · ${c.title}${c.file_url ? ` · file_url termina em ${c.file_url.split('/').pop()}` : ''}` : 'NENHUM [UX-AUDIT] deste tipo'}`)

    const mask = [page.getByText(EMAIL, { exact: false })]
    log('## visualização /content/[id] — os quatro tipos (I1-D36)')
    for (const [tipo, c] of Object.entries(escolha)) {
      if (!c) continue
      const esperar = tipo === 'Sheet'
        ? () => page.locator('canvas').first().waitFor({ state: 'visible', timeout: 60_000 }).then(async () => `canvas do PDF visível (${await page.locator('canvas').count()}); "Failed to load file" na tela: ${await page.getByText('Failed to load file').count()}`)
        : () => page.getByText(c.title).first().waitFor({ timeout: 60_000 }).then(() => 'título visível')
      await captura(`content-${tipo.toLowerCase()}`, `/content/${c.id}`, esperar, { mask })
    }
    log('## as outras telas')
    const alvoEdicao = escolha.Sheet ?? escolha.Chords
    if (alvoEdicao) await captura('content-edit', `/content/${alvoEdicao.id}/edit`, () => page.locator('canvas, textarea, input').first().waitFor({ timeout: 60_000 }).then(() => 'editor montado'), { mask })
    await captura('setlists', '/setlists', () => page.locator('main').first().waitFor({ timeout: 60_000 }).then(async () => `botões "Start Performance": ${await page.getByText('Start Performance').count()}`), { mask })
    await captura('dashboard', '/dashboard', () => page.locator('main').first().waitFor({ timeout: 60_000 }).then(() => 'ok'), { mask })
    await captura('library', '/library', () => page.locator('main').first().waitFor({ timeout: 60_000 }).then(() => 'ok'), { mask })
  }

  log('## contabilidade')
  log(`escrita a /api/* fora de /api/auth/session: ${parada ? 'PARADA — ' + parada : '0'}`)
  log(`/api/auth/session (cookie, declarado): ${escritas.length ? escritas.join(' · ') : '0'}`)
  log(`requests a octavia.rocks: ${prodAbortados} (abortados no navegador; o esperado é 0)`)
  log(`outros hosts (fora de localhost): ${outrosHosts.size ? [...outrosHosts].map(([h, n]) => `${h} ×${n}`).join(' · ') : 'nenhum'}`)
  log(`erros de página: ${erros.length ? erros.join(' | ') : 'nenhum'}`)
  if (parada) exit = 1
} catch (e) {
  log(`ERRO: ${e.message.split('\n')[0]}`)
  exit = 1
} finally {
  await browser.close()
  resumo.push(`resultado: EXIT ${exit} · ${Math.round((Date.now() - t0) / 1000)} s`)
  fs.mkdirSync(destino, { recursive: true })
  for (const f of fs.readdirSync(tmp)) fs.copyFileSync(path.join(tmp, f), path.join(destino, f))
  fs.writeFileSync(path.join(destino, 'resumo.txt'), resumo.join('\n') + '\n')
  console.log(`gravado em ${destino}`)
}
process.exit(exit)
