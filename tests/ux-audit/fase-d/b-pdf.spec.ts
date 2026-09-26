import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute } from './recorder'
import { resolveFaseDDir } from '../../../scripts/ux-audit/fase-d-dirs'

/**
 * Fase D — Grupo B: PDF no viewer (item 6). Os itens 4, 4b e 5 (PDF no
 * palco, iframe + /api/proxy, PERF-02) saíram com o palco na I1-PR3.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const PDF12_ID: string = discovery.content.pdf12.id

const EVIDENCE_DIR = resolveFaseDDir('evidence')

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo B — PDF e renderização', () => {
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
