import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance, gotoRoute } from './recorder'

/**
 * Fase D — Grupo H: modo performance diversos + dashboard (itens 36-41).
 * Item 35 (wake lock em hardware real): MANUAL-CHECKLIST.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_ID: string = discovery.setlists.show.id
const ESTRESSE_ID: string = discovery.setlists.estresse.id

const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo H — performance diversos', () => {
  test('item-36: geometria real dos dots (8 e 60 músicas)', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      36,
      'Dots de 8px: taxa de acerto real em tablet; e na setlist de 60? (Geometria medida aqui; precisão de toque físico: MANUAL-CHECKLIST.)'
    )
    trackSessionPosts(page, 'item-36')

    const dotGeometry = async () =>
      page.evaluate(() => {
        const bar = document.querySelector('[data-testid="bottom-controls"]')
        if (!bar) return null
        const dots = Array.from(bar.querySelectorAll('div.rounded-full')).filter((d) => {
          const r = d.getBoundingClientRect()
          return r.width > 0 && r.width <= 16
        })
        const rects = dots.map((d) => d.getBoundingClientRect())
        const first = rects[0]
        const gap = rects.length > 1 ? Math.round(rects[1].left - rects[0].right) : null
        const total = rects.length
          ? Math.round(rects[rects.length - 1].right - rects[0].left)
          : 0
        return {
          quantidade: rects.length,
          tamanho_px: first ? `${Math.round(first.width)}x${Math.round(first.height)}` : null,
          espacamento_px: gap,
          largura_total_px: total,
          largura_viewport: window.innerWidth,
          transborda: total > window.innerWidth,
        }
      })

    let ok = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, rec)
    if (ok) {
      rec.measure('dots_setlist_8', await dotGeometry())
      rec.measure('screenshot_8', await shot(page, 'item-36-dots-show8'))
    }
    ok = await gotoPerformance(page, `/performance?setlistId=${ESTRESSE_ID}&startingSongIndex=0`, rec)
    if (ok) {
      rec.measure('dots_setlist_60', await dotGeometry())
      rec.measure('screenshot_60', await shot(page, 'item-36-dots-estresse60'))
      // PERF-01: Prev/Next ainda estão na tela com 60 dots?
      const navGeo = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('[data-testid="bottom-controls"] button'))
        return btns.map((b) => {
          const r = b.getBoundingClientRect()
          return {
            label: b.textContent?.trim(),
            x: Math.round(r.left),
            right: Math.round(r.right),
            dentroDaTela: r.left >= 0 && r.right <= window.innerWidth,
            alvo_px: `${Math.round(r.width)}x${Math.round(r.height)}`,
          }
        })
      })
      rec.measure('prev_next_na_estresse60', navGeo)
    }
    rec.save(testInfo)
  })

  test('item-37: /performance por deep link sem params — "Go back" sai do app?', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      37,
      '/performance por deep link direto: "Go back" do empty state sai do app (histórico vazio)?'
    )
    // Contexto novo = histórico vazio de verdade (deep link real)
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 1194, height: 834 },
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-37')
    try {
      if (!(await gotoRoute(page, '/performance', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2500)
      rec.measure('url_apos_deep_link', page.url())
      const body = ((await page.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
      rec.measure('tela_do_empty_state', body.slice(0, 250))
      rec.measure('screenshot', await shot(page, 'item-37-empty-state'))

      const goBack = page.getByRole('button', { name: /go back|back/i }).first()
      if (await goBack.isVisible().catch(() => false)) {
        await rec.tap('tap: Go back', async () => {
          await goBack.click()
          await page.waitForTimeout(2500)
        })
        rec.measure('url_apos_go_back', page.url())
        rec.note(
          page.url().includes('performance')
            ? 'Go back com histórico vazio NÃO leva a lugar nenhum (usuário preso)'
            : `Go back levou para ${page.url()}`
        )
      } else {
        rec.note('Nenhum botão "Go back" visível no estado vazio')
      }
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-38: swipe não avança música (sem handler de gesto)', async ({ browser }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      38,
      'Confirmar que nenhum gesto de swipe avança música (código não tem handler).'
    )
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 1194, height: 834 },
      hasTouch: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-38')
    try {
      const ok = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=2`, rec)
      if (!ok) {
        rec.set('inconclusiva')
        return
      }
      await settle(page, 1500)
      const titleBefore = (await page.locator('h2').first().textContent())?.trim()
      const cdp = await context.newCDPSession(page)
      // swipe horizontal (direita→esquerda) no meio do conteúdo
      await cdp.send('Input.synthesizeScrollGesture', {
        x: 900,
        y: 400,
        xDistance: -500,
        speed: 1200,
      })
      await page.waitForTimeout(1500)
      const titleAfterLeft = (await page.locator('h2').first().textContent())?.trim()
      await cdp.send('Input.synthesizeScrollGesture', {
        x: 300,
        y: 400,
        xDistance: 500,
        speed: 1200,
      })
      await page.waitForTimeout(1500)
      const titleAfterRight = (await page.locator('h2').first().textContent())?.trim()
      rec.measure('titulo', { antes: titleBefore, apos_swipe_esq: titleAfterLeft, apos_swipe_dir: titleAfterRight })
      rec.note(
        titleBefore === titleAfterLeft && titleBefore === titleAfterRight
          ? 'Swipe em nenhuma direção troca a música — confirmado que não há handler de gesto'
          : 'INESPERADO: swipe trocou a música'
      )
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

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
