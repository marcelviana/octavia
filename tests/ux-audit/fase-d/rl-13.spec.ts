import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute, getBearer } from './recorder'

/**
 * Fase D — FINALE de rate limit, parte 1: item 13 (SET-05).
 *
 * RODAR POR ÚLTIMO (com o grupo de auth 15+ min depois): dispara 429 no
 * defaultLimiter compartilhado por IP e contamina qualquer teste seguinte.
 *
 * Monta a setlist do audit para 50+ músicas pela UI (Select All no picker)
 * e registra em qual adição o 429 dispara, o que o usuário vê e o estado
 * final (persistido vs. local).
 */

const PICKER_SETLIST = 'UX-AUDIT Fase D picker'
const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test('item-13: em qual adição o 429 dispara ao montar setlist de 50+?', async ({ page }, testInfo) => {
  test.setTimeout(15 * 60 * 1000)
  const rec = new ItemRecorder(
    13,
    'SET-05: em qual adição o 429 dispara ao montar setlist de 50+? O que o usuário vê e em que estado fica a setlist (persistidas vs. estado local)?'
  )
  trackSessionPosts(page, 'item-13')

  const posts: Array<{ i: number; status: number; remaining: string | null; retryAfter: string | null }> = []
  page.on('response', (res) => {
    if (/\/api\/setlists\/[^/]+\/songs$/.test(res.url()) && res.request().method() === 'POST') {
      posts.push({
        i: posts.length + 1,
        status: res.status(),
        remaining: res.headers()['x-ratelimit-remaining'] ?? null,
        retryAfter: res.headers()['retry-after'] ?? null,
      })
    }
  })

  try {
    if (!(await gotoRoute(page, '/setlists', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2500)
    await page.getByText(PICKER_SETLIST, { exact: true }).first().click()
    await settle(page, 1500)
    const rowsBefore = await page.locator('div[draggable="true"]').count()
    rec.measure('musicas_antes', rowsBefore)

    await rec.tap('tap: Add Songs', async () => {
      await page.getByRole('button', { name: /add songs/i }).first().click()
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
    })
    const dialog = page.getByRole('dialog')
    await rec.tap('tap: Select all', async () => {
      await dialog.locator('#select-all').click()
    })
    await page.waitForTimeout(800)
    const addBtnText = await dialog.getByRole('button', { name: /add \d+ song/i }).textContent()
    rec.measure('botao_add', addBtnText?.trim())

    const t0 = Date.now()
    await rec.tap('tap: Add N Songs (dispara o burst sequencial)', async () => {
      await dialog.getByRole('button', { name: /add \d+ song/i }).click()
    })

    // Espera o burst terminar: nenhum POST novo por 10s ou dialog fechar + toast
    let lastCount = -1
    while (posts.length !== lastCount) {
      lastCount = posts.length
      await page.waitForTimeout(10_000)
    }
    rec.measure('duracao_burst_ms', Date.now() - t0)
    rec.measure('posts_total', posts.length)
    const first429 = posts.find((p) => p.status === 429)
    rec.measure('primeiro_429', first429 ?? 'nenhum 429')
    rec.measure('sequencia_status', posts.map((p) => p.status).join(','))
    rec.measure('ok_antes_do_429', first429 ? first429.i - 1 : posts.filter((p) => p.status < 300).length)

    // O que o usuário vê
    const userView = await page.evaluate(() => {
      const toasts = Array.from(
        document.querySelectorAll('[data-sonner-toast], [role="alert"], [role="status"], li[data-type]')
      ).map((t) => t.textContent?.trim().slice(0, 200))
      return { toasts, dialogAberto: !!document.querySelector('[role="dialog"]') }
    })
    rec.measure('visao_do_usuario', userView)
    rec.measure('screenshot_apos_burst', await shot(page, 'item-13-apos-burst'))

    const rowsUiAfter = await page.locator('div[draggable="true"]').count()
    rec.measure('musicas_na_ui_apos_burst', rowsUiAfter)

    // Verdade do servidor
    const bearer13 = await getBearer(page)
    const server = await page.request
      .get('https://octavia.rocks/api/setlists', { headers: bearer13 ? { Authorization: `Bearer ${bearer13}` } : {} })
      .then((r) => r.json() as Promise<Array<{ name: string; setlist_songs: unknown[] }>>)
      .catch(() => null)
    const picker = server?.find((s) => s.name === PICKER_SETLIST)
    rec.measure('musicas_no_servidor', picker?.setlist_songs.length ?? 'GET falhou (lockout?)')
    rec.note(
      `UI local: ${rowsUiAfter} músicas visíveis; servidor: ${picker?.setlist_songs.length ?? '?'} — ` +
        'divergência = achado (o handler aborta o loop no primeiro erro sem reconciliar o estado local)'
    )

    // Reload para ver o estado que o usuário encontraria
    await page.reload({ waitUntil: 'domcontentloaded' })
    await settle(page, 3000)
    await page.getByText(PICKER_SETLIST, { exact: true }).first().click().catch(() => {})
    await settle(page, 2000)
    rec.measure('musicas_apos_reload', await page.locator('div[draggable="true"]').count())
    rec.measure('screenshot_apos_reload', await shot(page, 'item-13-apos-reload'))
  } finally {
    rec.save(testInfo)
  }
})
