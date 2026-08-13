import { test, webkit, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance, gotoRoute } from './recorder'
import { resolveFaseDDir } from '../../../scripts/ux-audit/fase-d-dirs'
import { UX_AUDIT_STORAGE_STATE } from '../../../playwright.ux-audit.config'

/**
 * Fase D — Grupo B: PDF e renderização (itens 4-6). Decide o S1 de PERF-02.
 *
 * IMPORTANTE: rodar HEADED (--headed). O modo performance renderiza PDF num
 * <iframe> com o viewer NATIVO do browser — headless Chromium não tem PDF
 * viewer e produziria o falso "PDF branco". A captura branca do B2 pode ser
 * exatamente esse artefato; esta passada decide.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_ID: string = discovery.setlists.show.id
const PDF12_ID: string = discovery.content.pdf12.id

const EVIDENCE_DIR = resolveFaseDDir('evidence')

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo B — PDF e renderização', () => {
  test('item-04: PDF de 12 páginas no modo performance (decide PERF-02)', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      4,
      'Em Chrome desktop e Safari/iPadOS reais, o PDF de 12 páginas renderiza no iframe do modo performance? Scroll por touch entre páginas com #toolbar=0? Dark sheet (invert) legível? Zoom por transform corta conteúdo?'
    )
    trackSessionPosts(page, 'item-04')

    const proxyResponses: string[] = []
    page.on('response', (res) => {
      if (res.url().includes('/api/proxy') && proxyResponses.length < 8) {
        proxyResponses.push(`HTTP ${res.status()} ${res.url().slice(0, 140)}`)
      }
    })

    test.setTimeout(10 * 60 * 1000)
    const entered = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, rec)
    if (!entered) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 3000)

    const iframeInfo = await page.evaluate(() => {
      const iframe = document.querySelector(
        '[data-testid="optimized-content-display"] iframe'
      ) as HTMLIFrameElement | null
      if (!iframe) return null
      const rect = iframe.getBoundingClientRect()
      return { src: iframe.src.slice(0, 160), rect: `${Math.round(rect.width)}x${Math.round(rect.height)}` }
    })
    rec.measure('iframe', iframeInfo)
    rec.measure('api_proxy_respostas', proxyResponses)
    await page.waitForTimeout(3000) // tempo para o viewer nativo desenhar
    rec.measure('screenshot_render_inicial', await shot(page, 'item-04-chromium-headed-render'))

    // Scroll "touch" (wheel sobre o iframe — headed) e evidência visual
    const display = page.locator('[data-testid="optimized-content-display"]')
    const box = await display.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 800)
        await page.waitForTimeout(300)
      }
      rec.measure('screenshot_apos_scroll', await shot(page, 'item-04-chromium-apos-scroll'))
    }

    // Dark sheet
    await page.locator('[data-testid="dark-mode-toggle"]').click()
    await page.waitForTimeout(1200)
    rec.measure('screenshot_dark_sheet', await shot(page, 'item-04-chromium-dark-sheet'))
    const invertApplied = await page.evaluate(() => {
      const wrap = document.querySelector(
        '[data-testid="optimized-content-display"] iframe'
      )?.parentElement as HTMLElement | null
      return wrap ? getComputedStyle(wrap).filter : null
    })
    rec.measure('filtro_css_dark_sheet', invertApplied)
    await page.locator('[data-testid="dark-mode-toggle"]').click()
    await page.waitForTimeout(500)

    // Zoom máximo: transform scale corta conteúdo?
    const zoomIn = page.getByLabel('Zoom in')
    for (let i = 0; i < 10; i++) {
      await zoomIn.click()
      await page.waitForTimeout(120)
    }
    await page.waitForTimeout(800)
    const zoomState = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="optimized-content-display"]') as HTMLElement | null
      if (!el) return null
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        estouraHorizontal: el.scrollWidth > el.clientWidth,
      }
    })
    rec.measure('zoom_200_overflow', zoomState)
    rec.measure('screenshot_zoom_200', await shot(page, 'item-04-chromium-zoom-200'))

    rec.note(
      'Passada headed Chromium (viewer nativo de PDF). Safari/iPadOS real: item do MANUAL-CHECKLIST; ' +
        'a passada WebKit (engine do Safari) roda no teste item-04b.'
    )
    rec.save(testInfo)
  })

  test('item-04b: mesma tela na engine WebKit (proxy do Safari)', async ({}, testInfo) => {
    const rec = new ItemRecorder(
      4,
      '(continuação) Mesma tela na engine WebKit — aproximação do comportamento Safari.'
    )
    const browser = await webkit.launch({ headless: false })
    try {
      const context = await browser.newContext({
        baseURL: 'https://octavia.rocks',
        storageState: UX_AUDIT_STORAGE_STATE,
        viewport: { width: 1194, height: 834 },
      })
      const page = await context.newPage()
      await page.goto(`/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      })
      await page
        .locator('[data-testid="exit-button"]')
        .waitFor({ state: 'visible', timeout: 30_000 })
        .catch(() => rec.note('WebKit: shell do performance não montou em 30s'))
      await page.waitForTimeout(5000)
      const iframePresent = await page
        .locator('[data-testid="optimized-content-display"] iframe')
        .count()
      rec.measure('webkit_iframe_presente', iframePresent > 0)
      rec.measure('webkit_screenshot', await shot(page, 'item-04-webkit-render'))
      await context.close()
    } catch (err) {
      rec.note(`WebKit falhou: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
      rec.set('inconclusiva')
    } finally {
      await browser.close()
      rec.save(testInfo)
    }
  })

  test('item-05: play numa partitura PDF — o que acontece?', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      5,
      'Apertar play numa partitura PDF: o que o usuário observa? (Hipótese PERF-09: nada acontece e o botão reverte sozinho.)'
    )
    trackSessionPosts(page, 'item-05')

    test.setTimeout(10 * 60 * 1000)
    const entered = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, rec)
    if (!entered) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    const stateOf = () =>
      page.evaluate(() => {
        const btn = document.querySelector('[data-testid="play-pause-button"]')
        const el = document.querySelector('[data-testid="optimized-content-display"]') as HTMLElement | null
        return {
          icone: btn?.querySelector('svg.lucide-pause') ? 'pause (tocando)' : 'play (parado)',
          scrollTop: el?.scrollTop ?? null,
        }
      })

    rec.measure('antes_do_play', await stateOf())
    await rec.tap('tap: play', async () => {
      await page.locator('[data-testid="play-pause-button"]').click()
    })
    // Observa por 6s: ícone reverte? scroll anda?
    const timeline: Array<{ t: number; icone: string; scrollTop: number | null }> = []
    for (let t = 0; t <= 6000; t += 1000) {
      const s = await stateOf()
      timeline.push({ t, ...s })
      await page.waitForTimeout(1000)
    }
    rec.measure('timeline_6s_apos_play', timeline)
    rec.measure('screenshot', await shot(page, 'item-05-pdf-apos-play'))
    rec.save(testInfo)
  })

  test('item-06: viewer — taps da página 1 à 6 do PDF de 12', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      6,
      'No viewer, quantos taps da página 1 à 6 de um PDF de 12 (só há prev/next)? Pinch-to-zoom funciona em touch ou só botões de 20%?'
    )
    trackSessionPosts(page, 'item-06')

    if (!(await gotoRoute(page, `/content/${PDF12_ID}`, rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await page
      .locator('canvas')
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .catch(() => rec.note('canvas do react-pdf não apareceu em 60s no viewer'))
    await settle(page, 1500)

    const pager = page.locator('span', { hasText: /Page \d+ \/ \d+/ }).first()
    rec.measure('indicador_inicial', (await pager.textContent().catch(() => null))?.trim())

    const next = pager.locator('xpath=following-sibling::button[1]')
    for (let i = 0; i < 5; i++) {
      await rec.tap(`next → página ${i + 2}`, async () => {
        await next.click()
        await page.waitForTimeout(600)
      })
    }
    rec.measure('indicador_final', (await pager.textContent().catch(() => null))?.trim())
    rec.measure('screenshot', await shot(page, 'item-06-viewer-pagina-6'))

    // Zoom: que controles existem no viewer?
    const zoomControls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .map((b) => b.getAttribute('aria-label') || b.textContent?.trim() || '')
        .filter((t) => /zoom|%/i.test(t))
    )
    rec.measure('controles_de_zoom_no_viewer', zoomControls)
    rec.note('Pinch-to-zoom físico: item do MANUAL-CHECKLIST (gesto real de iPad).')
    rec.save(testInfo)
  })
})
