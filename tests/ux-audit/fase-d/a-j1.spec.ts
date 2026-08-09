import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance } from './recorder'

/**
 * Fase D — Grupo A: fluxo J1 completo (itens 1-3) + item 15 (balão HTML5).
 *
 * Medições contra PROD com a conta de audit. Sem session-intercept: o
 * comportamento real do POST /api/auth/session faz parte do que se mede.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_ID: string = discovery.setlists.show.id
const SHOW_NAME: string = discovery.setlists.show.name
const CHORDS_INDEX: number = discovery.indices.show_chords_index

function perfPath(setlistId: string, index: number): string {
  return `/performance?setlistId=${setlistId}&startingSongIndex=${index}`
}

/** Critério de sucesso do J1: shell do modo performance visível. */
async function waitPerformanceShell(page: Page, timeout = 30_000): Promise<void> {
  await page.locator('[data-testid="exit-button"]').waitFor({ state: 'visible', timeout })
}

/** Conteúdo da música visível (texto de cifra/letra OU canvas/iframe de PDF). */
async function waitSongContent(page: Page, timeout = 30_000): Promise<string> {
  const display = page.locator('[data-testid="optimized-content-display"]')
  await display.waitFor({ state: 'visible', timeout })
  const start = Date.now()
  for (;;) {
    const kind = await display.evaluate((el) => {
      if (el.querySelector('iframe')) return 'iframe-pdf'
      if (el.querySelector('canvas')) return 'canvas'
      if (el.querySelector('img')) return 'image'
      const text = (el.textContent ?? '').trim()
      if (text.length > 20) return 'texto'
      return ''
    })
    if (kind) return kind
    if (Date.now() - start > timeout) return 'VAZIO (timeout)'
    await page.waitForTimeout(100)
  }
}

test.describe('Grupo A — fluxo J1 (medições)', () => {
  test('item-01: abertura logada até a primeira música em tela cheia', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      1,
      'Do tap no ícone do PWA (start_url /) até a primeira música em tela cheia: taps e segundos (alvo ≤4 taps/10s)? Custo do desvio landing → Sign In → /login → redirect (AUTH-03)?'
    )
    trackSessionPosts(page, 'item-01')

    // "Abrir o app": goto / não conta como tap (é o tap no ícone do PWA)
    const tOpen = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await settle(page)
    const landedOn = page.url()
    rec.measure('start_url_/_leva_para', landedOn)
    rec.measure('tempo_carga_inicial_ms', Date.now() - tOpen)

    if (/\/(dashboard|home)/.test(landedOn)) {
      rec.note('start_url / redirecionou direto para o dashboard — desvio AUTH-03 não ocorreu')
    } else {
      rec.note(`start_url / manteve o usuário logado na landing de marketing (AUTH-03 confirmado): ${landedOn}`)
      // Desvio: achar o Sign In na landing
      const signIn = page.getByRole('link', { name: /sign in/i }).first()
      const signInVisible = await signIn.isVisible().catch(() => false)
      if (!signInVisible) {
        rec.note('Nenhum link "Sign In" visível na landing — procurando botão')
      }
      const target = signInVisible ? signIn : page.getByText(/sign in/i).first()
      const tSignIn = Date.now()
      await rec.tap('tap 1: "Sign In" na landing', async () => {
        await target.click()
        await page.waitForURL(/\/(login|dashboard)/, { timeout: 30_000 })
      })
      if (/\/login/.test(page.url())) {
        await page.waitForURL(/\/dashboard/, { timeout: 30_000 }).catch(() => {})
      }
      rec.measure('custo_desvio_landing_login_redirect_ms', Date.now() - tSignIn)
      rec.measure('url_apos_desvio', page.url())
    }

    // Do dashboard: Setlists → Start Performance no card
    await settle(page)
    await rec.tap('tap: item "Setlists" na navegação', async () => {
      await page.getByText('Setlists', { exact: true }).first().click()
      await page.waitForURL(/\/setlists/, { timeout: 30_000 })
    })
    await settle(page)

    const card = page.locator('div.cursor-pointer', { hasText: SHOW_NAME })
    const tPerf = Date.now()
    await rec.tap('tap: "Start Performance" no card da setlist do show', async () => {
      await card.getByRole('button', { name: /start performance/i }).first().click()
      await waitPerformanceShell(page)
    })
    rec.measure('shell_performance_visivel_ms_apos_tap', Date.now() - tPerf)

    const contentKind = await waitSongContent(page)
    rec.measure('primeira_musica_conteudo', contentKind)
    rec.measure('tempo_total_ate_conteudo_ms', rec.elapsed())
    rec.note(
      `Total: ${rec.taps} taps do primeiro tap até a primeira música; alvo ≤4 taps/10s. ` +
        `Conteúdo da 1ª música: ${contentKind} (1ª música da Show padrão é o PDF de 12 páginas).`
    )
    rec.save(testInfo)
  })

  test('item-01b: o desvio landing→login→redirect funciona offline?', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      1,
      '(continuação) O redirect landing → Sign In → /login → dashboard funciona offline?'
    )
    trackSessionPosts(page, 'item-01b')

    // Passada online primeiro para popular o SW/caches deste contexto
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await settle(page, 2000)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await settle(page, 2000)
    const swState = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker?.getRegistrations?.()
      return regs?.map((r) => ({ scope: r.scope, active: !!r.active })) ?? []
    })
    rec.measure('service_workers_registrados', swState)

    await page.context().setOffline(true)
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForTimeout(2000)
      const body = (await page.textContent('body').catch(() => '')) ?? ''
      rec.measure('landing_offline_render', body.slice(0, 300))
      const signIn = page.getByRole('link', { name: /sign in/i }).first()
      if (await signIn.isVisible().catch(() => false)) {
        await rec.tap('tap: Sign In offline', async () => {
          await signIn.click()
          await page.waitForTimeout(4000)
        })
        rec.measure('url_apos_sign_in_offline', page.url())
        const after = (await page.textContent('body').catch(() => '')) ?? ''
        rec.measure('tela_apos_sign_in_offline', after.slice(0, 300))
      } else {
        rec.note('Sem link Sign In visível na landing offline')
      }
    } catch (err) {
      rec.note(`goto / offline falhou: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
    } finally {
      await page.context().setOffline(false)
    }
    rec.save(testInfo)
  })

  test('item-02: latência de troca de música e resposta do play/pause', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      2,
      'Latência de troca de música no modo performance (critério <1s) e resposta do play/pause (<100ms percebido)?'
    )
    trackSessionPosts(page, 'item-02')
    test.setTimeout(8 * 60 * 1000)

    // Entra direto na cifra (música de texto) para medir trocas texto→texto
    const entered = await gotoPerformance(page, perfPath(SHOW_ID, CHORDS_INDEX), rec)
    if (!entered) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    try {
    const title = page.locator('h2').first()
    const titleBefore = await title.textContent()

    // Troca de música: Next (3 medições consecutivas)
    for (let i = 0; i < 3; i++) {
      const prevTitle = await title.textContent()
      const t = Date.now()
      await rec.tap(`Next (${i + 1})`, async () => {
        await page.getByRole('button', { name: 'Next' }).click()
      })
      // Sucesso: título mudou E conteúdo presente
      await expect(title).not.toHaveText(prevTitle ?? '', { timeout: 10_000 })
      const kind = await waitSongContent(page, 10_000)
      rec.measure(`troca_${i + 1}_ms`, Date.now() - t)
      rec.measure(`troca_${i + 1}_conteudo`, kind)
    }
    rec.note(`Título inicial: "${titleBefore?.trim()}" (índice ${CHORDS_INDEX} da Show padrão)`)

    // Play/pause: tempo até o ícone trocar (Play→Pause)
    const playBtn = page.locator('[data-testid="play-pause-button"]')
    for (let i = 0; i < 2; i++) {
      const t = Date.now()
      await rec.tap(`play/pause toggle (${i + 1})`, async () => {
        await playBtn.click()
      })
      await page
        .waitForFunction(
          (want) => {
            const btn = document.querySelector('[data-testid="play-pause-button"]')
            return !!btn?.querySelector(want)
          },
          i === 0 ? 'svg.lucide-pause' : 'svg.lucide-play',
          { timeout: 5000 }
        )
        .catch(() => rec.note(`toggle ${i + 1}: ícone não trocou em 5s`))
      rec.measure(`playpause_${i + 1}_feedback_ms`, Date.now() - t)
    }
    } finally {
      rec.save(testInfo)
    }
  })

  test('item-03: rotação do tablet no meio da música', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      3,
      'Girar o tablet na música 4: o layout com paddings fixos e barras absolutas sobrevive? O scroll se mantém?'
    )
    trackSessionPosts(page, 'item-03')
    test.setTimeout(8 * 60 * 1000)

    const entered = await gotoPerformance(page, perfPath(SHOW_ID, 3), rec)
    if (!entered) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 1500)

    try {
    const display = page.locator('[data-testid="optimized-content-display"]')
    // Rola um pouco para testar se a posição sobrevive à rotação
    await display.evaluate((el) => {
      el.scrollTop = 200
    })
    const scrollBefore = await display.evaluate((el) => el.scrollTop)

    const snapshot = async () => {
      return page.evaluate(() => {
        const el = document.querySelector('[data-testid="optimized-content-display"]')
        const exit = document.querySelector('[data-testid="exit-button"]')
        const bottom = document.querySelector('[data-testid="bottom-controls"]')
        const rect = el?.getBoundingClientRect()
        return {
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          contentRect: rect ? `${Math.round(rect.width)}x${Math.round(rect.height)} @y=${Math.round(rect.top)}` : null,
          scrollTop: (el as HTMLElement | null)?.scrollTop ?? null,
          exitVisivel: !!exit && (exit as HTMLElement).offsetParent !== null,
          bottomControlsVisivel: !!bottom && (bottom as HTMLElement).offsetParent !== null,
          overflowHorizontal: document.documentElement.scrollWidth > window.innerWidth,
        }
      })
    }

    rec.measure('landscape_antes', await snapshot())
    // Rotação: landscape 1194x834 → portrait 834x1194
    await page.setViewportSize({ width: 834, height: 1194 })
    await page.waitForTimeout(1500)
    rec.measure('portrait_depois', await snapshot())
    const scrollAfter = await display.evaluate((el) => el.scrollTop)
    rec.measure('scrollTop_antes_depois', `${scrollBefore} → ${scrollAfter}`)

    // Volta para landscape
    await page.setViewportSize({ width: 1194, height: 834 })
    await page.waitForTimeout(1500)
    rec.measure('landscape_volta', await snapshot())

    const crash = /something went wrong/i.test((await page.textContent('body').catch(() => '')) ?? '')
    rec.measure('error_boundary', crash)
    } finally {
      rec.save(testInfo)
    }
  })
})

test.describe('Item 15 — balão HTML5 no idioma do SO', () => {
  test.use({ locale: 'pt-BR' })

  test('item-15: validationMessage em pt-BR vs UI em inglês', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      15,
      'O balão HTML5 aparece no idioma do SO (pt-BR), divergindo da UI em inglês (GLOB-01/AUTH-04)?'
    )
    // Contexto SEM sessão: /login como usuário deslogado (como Marcel veria)
    test.setTimeout(3 * 60 * 1000)
    const context = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1194, height: 834 } })
    const page = await context.newPage()
    try {
      await page.goto('https://octavia.rocks/login', { waitUntil: 'domcontentloaded', timeout: 90_000 })
      await settle(page)
      // Submete vazio para disparar a validação nativa
      await rec
        .tap('tap: submit com campos vazios', async () => {
          await page
            .getByRole('button', { name: /sign in|log in|entrar/i })
            .first()
            .click({ timeout: 10_000 })
        })
        .catch((err) => rec.note(`click no submit falhou: ${String(err).split('\n')[0]}`))
      await page.waitForTimeout(500)
      const msg = await page.evaluate(() => {
        let input = document.querySelector('input:invalid') as HTMLInputElement | null
        if (!input) {
          // fallback: dispara a validação nativa diretamente
          const form = document.querySelector('form')
          form?.reportValidity()
          input = document.querySelector('input:invalid') as HTMLInputElement | null
        }
        return input ? { validationMessage: input.validationMessage, type: input.type } : null
      })
      rec.measure('validationMessage', msg)
      const uiSample = await page.evaluate(() =>
        Array.from(document.querySelectorAll('label, button'))
          .map((el) => el.textContent?.trim())
          .filter(Boolean)
          .slice(0, 8)
      )
      rec.measure('amostra_ui_ingles', uiSample)
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })
})
