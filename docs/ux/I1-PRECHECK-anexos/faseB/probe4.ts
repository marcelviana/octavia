/**
 * I1 pre-check, Fase B — probe 4 (H-I1-5): o que a UI das setlists mostra ao criar,
 * renomear e apagar — e ao apagar uma setlist que outra aba já apagou (o 404, div. 172).
 * ESCRITO PELO EXECUTOR, RODADO PELO MARCEL (I1-D35): a senha nunca passa pelo executor.
 *
 *   pnpm tsx docs/ux/I1-PRECHECK-anexos/faseB/probe4.ts        (da raiz da árvore)
 *
 * Alvo: https://octavia.rocks (I1-D34), CONTA DE AUDIT, recurso descartável criado e
 * apagado aqui (regra 12). Credenciais: USER_AUDIT/PASSWORD_AUDIT do `.env.uxaudit`
 * (./.env.uxaudit, ../octavia/.env.uxaudit ou UXAUDIT_ENV). Nunca impressas nem gravadas.
 *
 * ESCRITAS DECLARADAS (lista fechada, conferida no resumo.txt):
 *   1 × POST   /api/setlists            (cria "I1-probe4")
 *   1 × PUT    /api/setlists/[id]       (renomeia para "I1-probe4 renomeada")
 *   1 × DELETE /api/setlists/[id] → 200 (contexto 1)
 *   1 × DELETE /api/setlists/[id] → 404 (contexto 2; não escreve)
 * CONTINGÊNCIA (só se o probe parar no meio com a setlist criada e não apagada): 1 DELETE
 * /api/setlists/[id] de limpeza, registrado como tal — a descartável não fica na conta.
 * Não são escrita (só cookie, I1-PRECHECK §10): POST/DELETE /api/auth/session do login.
 * Qualquer outro POST|PUT|PATCH|DELETE a /api/* — ou um quinto dos declarados — é PARADA
 * (bloqueado no navegador antes de sair): exit 1 com o passo.
 *
 * Saída: faseB/probe4-out/{requests,console,resumo}.txt e passo{1..6}-*.png.
 */
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { config } from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

const BASE = 'https://octavia.rocks'
const NOME = 'I1-probe4'
const NOVO = 'I1-probe4 renomeada'
const AQUI = path.dirname(new URL(import.meta.url).pathname)
const OUT = path.join(AQUI, 'probe4-out')
fs.mkdirSync(OUT, { recursive: true })

const envPath = [process.env.UXAUDIT_ENV, '.env.uxaudit', '../octavia/.env.uxaudit'].find((p) => p && fs.existsSync(p))
if (!envPath) { console.error('PARADA: .env.uxaudit não encontrado (use UXAUDIT_ENV=<caminho>)'); process.exit(1) }
config({ path: envPath, quiet: true })
const EMAIL = process.env.USER_AUDIT, SENHA = process.env.PASSWORD_AUDIT
if (!EMAIL || !SENHA) { console.error('PARADA: USER_AUDIT/PASSWORD_AUDIT ausentes no .env.uxaudit'); process.exit(1) }
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) { console.error('PARADA: USER_AUDIT não tem forma de email (aspas ou espaço no .env.uxaudit?) — valor não impresso'); process.exit(1) }

// orçamento de escrita: chave "MÉTODO /padrão" → quantas ainda podem sair
const orcamento: Record<string, number> = { 'POST /api/setlists': 1, 'PUT /api/setlists/[id]': 1, 'DELETE /api/setlists/[id]': 2 }
const escritas: string[] = []
const t0 = Date.now()
const ms = () => String(Date.now() - t0).padStart(7)
const reqs: string[] = [], cons: string[] = [], passos: string[] = []
let parada = '', passo = 'início', setlistId = ''

function padrao(p: string) { return p.replace(/^\/api\/setlists\/[0-9a-f-]{36}$/, '/api/setlists/[id]') }

async function contexto(browser: Browser, rotulo: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ viewport: { width: 1138, height: 800 } })
  await ctx.route('**/api/**', (route) => {
    const r = route.request(), u = new URL(r.url()), m = r.method()
    if (u.host !== 'octavia.rocks' || m === 'GET' || m === 'HEAD') return route.continue()
    if (u.pathname === '/api/auth/session') {
      // o DELETE que o /login deslogado dispara sozinho: respondido no navegador (div. 511); o POST do login segue
      if (m === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' })
      return route.continue()
    }
    const k = `${m} ${padrao(u.pathname)}`
    if ((orcamento[k] ?? 0) > 0) { orcamento[k] = (orcamento[k] ?? 0) - 1; return route.continue() }
    parada = `escrita fora da lista em "${passo}": ${k}`
    return route.abort()
  })
  const page = await ctx.newPage()
  page.on('requestfinished', async (r) => {
    const u = new URL(r.url()); if (u.host !== 'octavia.rocks') return
    const res = await r.response(); const st = res?.status() ?? '-'
    reqs.push(`${ms()}  ${rotulo}  ${r.method().padEnd(6)} ${String(st).padEnd(4)} ${u.pathname}`)
    if (!['GET', 'HEAD'].includes(r.method()) && u.pathname.startsWith('/api/setlists')) {
      escritas.push(`${r.method()} ${padrao(u.pathname)} → ${st}`)
      if (r.method() === 'POST' && u.pathname === '/api/setlists' && res) setlistId = (await res.json().catch(() => ({})))?.id ?? setlistId
    }
  })
  page.on('requestfailed', (r) => { const u = new URL(r.url()); if (u.host === 'octavia.rocks') reqs.push(`${ms()}  ${rotulo}  ${r.method().padEnd(6)} FALHA ${u.pathname} ${r.failure()?.errorText ?? ''}`) })
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push(`${ms()}  ${rotulo}  ${m.type().padEnd(7)} ${m.text().slice(0, 400)}`) })
  // login pela UI do app
  // commit 3b: espera-se o campo, não 'networkidle' (estourou 60 s na 1ª rodada do probe 1)
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.locator('#email').waitFor({ state: 'visible', timeout: 60_000 })
  // commit 3b (2ª rodada do Marcel): preencher ANTES da hidratação do React perde o valor — o input
  // controlado volta a "" (ramo a: "Please enter a valid email address."; b/c: "Please fill out this field.").
  // Espera o React ligar os handlers no campo; preenche; confere que ficou (sem imprimir valor).
  await page.waitForFunction(() => { const e = document.querySelector('#email'); return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps')) }, null, { timeout: 60_000 })
  await page.locator('#email').fill(EMAIL!)
  await page.locator('#password').fill(SENHA!)
  if ((await page.locator('#email').inputValue()) !== EMAIL || (await page.locator('#password').inputValue()).length !== SENHA!.length) throw new Error('os campos de login não guardaram o valor preenchido')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard', { timeout: 60_000 })
  await page.goto(`${BASE}/setlists`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.getByRole('button', { name: /create (your first )?setlist/i }).first().waitFor({ state: 'visible', timeout: 60_000 })
  return { ctx, page }
}

/** O que a tela diz depois de um passo: toasts (sonner e shadcn), diálogo aberto, a setlist na lista. */
async function observa(page: Page, n: number, rotulo: string, nome: string) {
  await page.waitForTimeout(2500)
  const toasts = await page.locator('[data-sonner-toast], [role="status"], li[role="status"], [data-radix-toast-viewport] li').allInnerTexts().catch(() => [])
  const dialogo = await page.locator('[role="dialog"], [role="alertdialog"]').allInnerTexts().catch(() => [])
  const naLista = await page.getByText(nome, { exact: true }).count()
  const mask = [page.getByText(EMAIL!, { exact: false })]
  await page.screenshot({ path: path.join(OUT, `passo${n}-${rotulo}.png`), mask }).catch(() => {})
  passos.push(`passo ${n} (${rotulo}): toast=${JSON.stringify(toasts)} · diálogo aberto=${dialogo.length ? JSON.stringify(dialogo.map((d) => d.replace(/\s+/g, ' ').slice(0, 160))) : 'não'} · "${nome}" na lista=${naLista}`)
}

function cartao(page: Page, nome: string) {
  // o div mais interno que contém o nome e o botão de apagar (setlist-card.tsx:120,138)
  return page.locator('div').filter({ has: page.getByText(nome, { exact: true }) }).filter({ has: page.getByRole('button', { name: 'Delete setlist' }) }).last()
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: !process.env.HEADED })
  let limpeza: Page | null = null
  try {
    passo = 'login contexto 1'
    const c1 = await contexto(browser, 'c1')
    limpeza = c1.page
    passo = 'criar'
    await c1.page.getByRole('button', { name: /create (your first )?setlist/i }).first().click()
    await c1.page.locator('#name').fill(NOME)
    await c1.page.getByRole('button', { name: 'Create Setlist' }).last().click()
    await observa(c1.page, 1, 'criada', NOME)
    if (parada) throw new Error(parada)

    passo = 'renomear'
    await cartao(c1.page, NOME).getByRole('button', { name: 'Edit setlist' }).click()
    await c1.page.locator('#name').fill(NOVO)
    await c1.page.getByRole('button', { name: 'Update Setlist' }).click()
    await observa(c1.page, 2, 'renomeada', NOVO)
    if (parada) throw new Error(parada)

    passo = 'login contexto 2'
    const c2 = await contexto(browser, 'c2')
    await observa(c2.page, 3, 'c2-antes', NOVO)

    passo = 'apagar no contexto 1'
    await cartao(c1.page, NOVO).getByRole('button', { name: 'Delete setlist' }).click()
    await c1.page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await observa(c1.page, 4, 'c1-apagada', NOVO)
    if (parada) throw new Error(parada)

    passo = 'apagar no contexto 2 (o 404)'
    await cartao(c2.page, NOVO).getByRole('button', { name: 'Delete setlist' }).click()
    await c2.page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await observa(c2.page, 5, 'c2-404', NOVO)
    if (parada) throw new Error(parada)

    passo = 'prova final'
    const r = await c1.page.request.get(`${BASE}/api/setlists`)
    const lista = await r.json().catch(() => null)
    const arr: Array<{ id: string; name: string }> = Array.isArray(lista) ? lista : (lista?.setlists ?? lista?.data ?? [])
    const sobrou = arr.filter((s) => s.id === setlistId || s.name === NOME || s.name === NOVO)
    passos.push(`prova final: GET /api/setlists → ${r.status()}; setlists com id ${setlistId || '(?)'} ou nome "${NOME}"/"${NOVO}": ${sobrou.length}`)
    reqs.push(`${ms()}  c1  GET    ${r.status()}  /api/setlists (prova final, page.request)`)
    if (sobrou.length) throw new Error(`a setlist descartável ainda existe (${sobrou.length})`)
  } catch (e) {
    parada = parada || `${passo}: ${String((e as Error)?.message ?? e).replaceAll(SENHA!, '<omitido>').replaceAll(EMAIL!, '<omitido>').slice(0, 300)}`
  } finally {
    if (parada && setlistId && limpeza) {
      const ainda = await limpeza.request.get(`${BASE}/api/setlists/${setlistId}`).catch(() => null)
      if (ainda?.status() === 200) {
        const d = await limpeza.request.delete(`${BASE}/api/setlists/${setlistId}`).catch(() => null)
        escritas.push(`LIMPEZA DELETE /api/setlists/[id] → ${d?.status() ?? 'falhou'}`)
        passos.push(`limpeza de contingência: DELETE → ${d?.status() ?? 'falhou'}`)
      }
    }
    await browser.close()
  }

  const declaradas = ['POST /api/setlists → 201', 'PUT /api/setlists/[id] → 200', 'DELETE /api/setlists/[id] → 200', 'DELETE /api/setlists/[id] → 404']
  fs.writeFileSync(path.join(OUT, 'requests.txt'), `# probe 4 — requests a octavia.rocks (ms · contexto · método · status · caminho)\n${reqs.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'console.txt'), `# probe 4 — console, só error/warning\n${cons.join('\n')}\n`)
  fs.writeFileSync(path.join(OUT, 'resumo.txt'), [
    `# probe 4 — resumo (${new Date().toISOString()}) · alvo ${BASE} · conta de audit · Chrome do sistema`,
    `resultado: ${parada ? `EXIT 1 — ${parada}` : 'EXIT 0'}`,
    `escritas declaradas: ${declaradas.join(' · ')}`,
    `escritas medidas:    ${escritas.join(' · ') || '(nenhuma)'}`,
    `orçamento restante:  ${JSON.stringify(orcamento)}`,
    '',
    ...passos,
  ].join('\n') + '\n')
  if (parada) { console.error(`probe 4: EXIT 1 — ${parada}`); process.exit(1) }
  console.log('probe 4: exit 0 — ver probe4-out/resumo.txt')
}

main()
