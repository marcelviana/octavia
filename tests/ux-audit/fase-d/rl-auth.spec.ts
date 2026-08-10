import { test, chromium, type Page } from '@playwright/test'
import fs from 'node:fs'
import { config as loadEnv } from 'dotenv'
import { ItemRecorder, settle } from './recorder'
import { UX_AUDIT_STORAGE_STATE } from '../../../playwright.ux-audit.config'

/**
 * Fase D — FINALE de rate limit, parte 2: itens 11-12 (decide AUTH-01).
 *
 * RODAR POR ÚLTIMO, 15+ min depois do rl-13 (janela AUTH é 5 req/15min).
 * Login REAL pela UI com a conta de audit (.env.uxaudit) + trocas de aba,
 * contando os POST /api/auth/session e seus status.
 */

loadEnv({ path: '.env.uxaudit', quiet: true })

const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

interface SessionPost {
  n: number
  status: number
  atMs: number
}

test('item-12 + item-11: POSTs de sessão no login e trocas de aba; 429 + token velho expulsa?', async ({ browser }, testInfo) => {
  test.setTimeout(15 * 60 * 1000)
  const rec12 = new ItemRecorder(
    12,
    'Quantos POSTs a /api/auth/session um login completo dispara? Login + 3 trocas de aba já estoura o limite de 5?'
  )
  const rec11 = new ItemRecorder(
    11,
    'AUTH-01: 5+ trocas de aba em <15min disparam 429 no /api/auth/session? Depois do 429 + token >1h, reload de /dashboard expulsa para /login?'
  )

  const email = process.env.USER_AUDIT
  const password = process.env.PASSWORD_AUDIT
  if (!email || !password) {
    rec12.note('USER_AUDIT/PASSWORD_AUDIT ausentes no ambiente — login de UI impossível')
    rec12.set('inconclusiva')
    rec11.set('inconclusiva')
    rec12.save(testInfo)
    rec11.save(testInfo)
    return
  }

  // Instância PRÓPRIA do browser: com o `browser` fixture compartilhado do
  // projeto, `goto('/login')` aterrissava no /dashboard já logado (o teste
  // registrou url_da_tela_de_login = /dashboard). Um launch dedicado
  // garante o estado deslogado que o item exige.
  const ownBrowser = await chromium.launch({ headless: true })
  const context = await ownBrowser.newContext({
    baseURL: 'https://octavia.rocks',
    viewport: { width: 1194, height: 834 },
  })
  const page = await context.newPage()
  const posts: SessionPost[] = []
  const t0 = Date.now()
  const listen = (p: Page) =>
    p.on('response', (res) => {
      if (res.url().includes('/api/auth/session') && res.request().method() === 'POST') {
        posts.push({ n: posts.length + 1, status: res.status(), atMs: Date.now() - t0 })
      }
    })
  listen(page)

  try {
    // ---- Item 12: login completo pela UI ----
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await settle(page, 1500)
    // Diagnóstico: numa execução anterior o campo #email nunca apareceu e o
    // teste morreu no timeout. Registrar onde a página realmente parou.
    rec12.measure('url_da_tela_de_login', page.url())
    rec12.measure(
      'inputs_presentes',
      await page.evaluate(() => Array.from(document.querySelectorAll('input')).map((i) => i.id || i.type))
    )
    rec12.measure('screenshot_login', await shot(page, 'item-12-tela-de-login'))
    await rec12.tap('taps: email + senha + Sign In (3)', async () => {
      await page.locator('#email').fill(email)
      await page.locator('#password').fill(password)
      await page.getByRole('button', { name: /^sign in$/i }).click()
    }, 3)
    await page.waitForURL(/dashboard/, { timeout: 60_000 }).catch(() => rec12.note('não chegou ao dashboard em 60s'))
    await settle(page, 4000)
    const postsAposLogin = posts.length
    rec12.measure('posts_sessao_no_login', postsAposLogin)
    rec12.measure('sequencia_login', posts.map((p) => `#${p.n}:${p.status}@${(p.atMs / 1000).toFixed(1)}s`))

    // ---- 3 trocas de aba ----
    const tab2 = await context.newPage()
    await tab2.goto('about:blank')
    for (let i = 1; i <= 3; i++) {
      await tab2.bringToFront()
      await tab2.waitForTimeout(1500)
      await page.bringToFront()
      await page.waitForTimeout(3000)
    }
    rec12.measure('posts_apos_3_trocas', posts.length)
    rec12.measure('sequencia_completa', posts.map((p) => `#${p.n}:${p.status}@${(p.atMs / 1000).toFixed(1)}s`))
    const any429 = posts.some((p) => p.status === 429)
    rec12.note(
      `Login disparou ${postsAposLogin} POST(s); com 3 trocas de aba: ${posts.length} POST(s) no total; ` +
        `429 presente? ${any429}. Limite AUTH = 5/15min por IP.`
    )
    rec12.save(testInfo)

    // ---- Item 11: trocas até 429 ----
    let extraSwitches = 0
    while (!posts.some((p) => p.status === 429) && extraSwitches < 8) {
      await tab2.bringToFront()
      await tab2.waitForTimeout(1200)
      await page.bringToFront()
      await page.waitForTimeout(2500)
      extraSwitches++
    }
    const got429 = posts.some((p) => p.status === 429)
    rec11.measure('trocas_extra_ate_429', extraSwitches)
    rec11.measure('sequencia_ate_429', posts.map((p) => `#${p.n}:${p.status}@${(p.atMs / 1000).toFixed(1)}s`))
    rec11.measure('429_disparou', got429)
    rec11.measure('screenshot_pos_429', await shot(page, 'item-11-apos-429'))

    // token >1h: injeta o cookie de sessão VELHO do storageState de ontem
    const oldState = JSON.parse(fs.readFileSync(UX_AUDIT_STORAGE_STATE, 'utf-8')) as {
      cookies: Array<{ name: string; value: string; domain: string; path: string }>
    }
    const oldCookie = oldState.cookies.find((c) => c.name === 'firebase-session')
    if (oldCookie) {
      await context.addCookies([
        {
          name: 'firebase-session',
          value: oldCookie.value,
          url: 'https://octavia.rocks',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax' as const,
        },
      ])
      rec11.note('Cookie firebase-session substituído pelo de >12h atrás (idToken de 1h vencido) — simula a sessão velha do AUTH-02')
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      await page.waitForTimeout(6000)
      rec11.measure('url_apos_reload_com_token_velho', page.url())
      const body = ((await page.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
      rec11.measure('tela_apos_reload', body.slice(0, 250))
      rec11.measure('screenshot_final', await shot(page, 'item-11-reload-token-velho'))
      rec11.measure('sequencia_final', posts.map((p) => `#${p.n}:${p.status}@${(p.atMs / 1000).toFixed(1)}s`))
      rec11.note(
        /\/login/.test(page.url())
          ? 'EXPULSO para /login com token velho + 429 no POST de sessão — AUTH-01 confirmado no pior caso'
          : `Permaneceu em ${page.url()} — client-side SDK segurou a sessão (ver sequência de POSTs)`
      )
    } else {
      rec11.note('Cookie velho não encontrado no storageState — parte do token >1h inconclusiva')
    }
  } finally {
    rec11.save(testInfo)
    rec12.save(testInfo)
    await context.close()
    await ownBrowser.close()
  }
})
