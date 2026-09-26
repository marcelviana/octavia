import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute } from './recorder'
import { resolveFaseDDir } from '../../../scripts/ux-audit/fase-d-dirs'

/**
 * Fase D — Grupo H: dashboard (itens 39-41). Os itens 35-38 (wake lock,
 * dots, deep link e swipe do palco) saíram com o palco na I1-PR3.
 */

const EVIDENCE_DIR = resolveFaseDDir('evidence')

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo H — dashboard', () => {
  test('item-39 + item-40: stat cards do dashboard e "Recent: 10" vs lista de 5', async ({ page }, testInfo) => {
    const rec39 = new ItemRecorder(
      39,
      'Tocar nos stat cards do dashboard: confirmar a falsa affordance (nada acontece).'
    )
    const rec40 = new ItemRecorder(
      40,
      'Stat "Recent: 10" vs lista de 5: origem do número; se as abas ficarem, deveriam mostrar 10.'
    )
    trackSessionPosts(page, 'item-39+40')

    if (!(await gotoRoute(page, '/dashboard', rec39))) {
      rec39.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec39.set('inconclusiva')
      rec40.set('inconclusiva')
      rec39.save(testInfo)
      rec40.save(testInfo)
      return
    }
    await settle(page, 2500)

    // Item 39: clica em cada stat card e observa se navega
    const cards = ['Total Content', 'Setlists', 'Favorites', 'Recent']
    for (const label of cards) {
      const card = page.getByText(label, { exact: true }).first()
      if (!(await card.isVisible().catch(() => false))) {
        rec39.note(`Stat card "${label}" não encontrado`)
        continue
      }
      const urlBefore = page.url()
      await rec39.tap(`tap: stat card "${label}"`, async () => {
        await card.click()
        await page.waitForTimeout(1200)
      })
      const urlAfter = page.url()
      rec39.measure(`card_${label}`, {
        navegou: urlBefore !== urlAfter,
        url_apos: urlAfter !== urlBefore ? urlAfter : undefined,
        cursor: await card.evaluate((el) => getComputedStyle(el.closest('div[class*="card"], div') as Element).cursor),
      })
      if (urlBefore !== urlAfter) {
        await page.goBack()
        await settle(page, 1500)
      }
    }
    rec39.save(testInfo)

    // Item 40: número do stat Recent vs itens listados na aba Recent
    const recentStat = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('div, p, span')).find(
        (e) => e.textContent?.trim() === 'Recent' && e.parentElement
      )
      const container = el?.closest('div[class*="card"], div')
      const num = container?.textContent?.match(/(\d+)/)?.[1]
      return num ?? null
    })
    // Conta itens da lista "Recent Content"
    const recentListCount = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('*')).find((e) =>
        e.textContent?.trim() === 'Recent Content'
      )
      const section = heading?.closest('div[class*="card"], section, div')
      if (!section) return null
      return Array.from(section.querySelectorAll('button, li, a')).filter((e) =>
        /\[UX-AUDIT\]/.test(e.textContent ?? '')
      ).length
    })
    rec40.measure('stat_recent', recentStat)
    rec40.measure('itens_na_lista_recent', recentListCount)
    rec40.measure('screenshot', await shot(page, 'item-40-dashboard-recent'))
    rec40.save(testInfo)
  })

  test('item-41: Recent Content → /content/[id] e voltar', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      41,
      'Recent Content → /content/[id]: tempo até render; o voltar preserva aba/scroll do dashboard?'
    )
    trackSessionPosts(page, 'item-41')

    test.setTimeout(6 * 60 * 1000)
    try {
    if (!(await gotoRoute(page, '/dashboard', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      return
    }
    await settle(page, 2500)

    // Troca para a aba Favorites primeiro (para testar preservação da aba)
    const favTab = page.getByRole('tab', { name: /favorites/i }).first()
    const hasTabs = await favTab.isVisible().catch(() => false)
    if (hasTabs) {
      await rec.tap('tap: aba Favorites', async () => favTab.click())
      await page.waitForTimeout(1200)
    }
    await page.evaluate(() => window.scrollTo(0, 300))
    const scrollBefore = await page.evaluate(() => window.scrollY)

    // O card do dashboard expõe aria-label "View <título> content"
    const firstRecent = page.getByRole('button', { name: /^View .*content$/i }).first()
    if (!(await firstRecent.isVisible().catch(() => false))) {
      rec.note('Nenhum card de conteúdo visível no dashboard nesta aba — item inconclusivo')
      rec.set('inconclusiva')
      return
    }
    rec.measure('card_alvo', (await firstRecent.getAttribute('aria-label')) ?? '(sem aria-label)')
    const t = Date.now()
    await rec.tap('tap: item do dashboard', async () => {
      await firstRecent.click()
      await page.waitForURL(/\/content\//, { timeout: 20_000 })
    })
    // Render do conteúdo: título + corpo
    await page
      .waitForFunction(() => {
        const main = document.querySelector('main') ?? document.body
        return (main.textContent ?? '').length > 200
      }, { timeout: 20_000 })
      .catch(() => rec.note('conteúdo não rendeu em 20s'))
    rec.measure('tempo_ate_render_content_ms', Date.now() - t)

    await page.goBack()
    await settle(page, 2000)
    const stateAfterBack = await page.evaluate(() => ({
      url: location.href,
      scrollY: window.scrollY,
      abaAtiva: document.querySelector('[role="tab"][aria-selected="true"], [data-state="active"][role="tab"]')?.textContent?.trim() ?? null,
    }))
    rec.measure('scroll_antes', scrollBefore)
    rec.measure('estado_apos_voltar', stateAfterBack)
    if (hasTabs) {
      rec.note(
        stateAfterBack.abaAtiva?.toLowerCase().includes('favorite')
          ? 'Aba preservada ao voltar'
          : `Aba NÃO preservada (voltou em "${stateAfterBack.abaAtiva}")`
      )
    }
    } finally {
      rec.save(testInfo)
    }
  })
})
