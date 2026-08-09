import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance, gotoRoute } from './recorder'

/**
 * Fase D — Grupo F: library e busca (itens 23-29; o 30 cruza com o grupo I).
 * Prioridade: item 23 (LIB-01 — biblioteca vazia em tablet landscape).
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_ID: string = discovery.setlists.show.id

const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

/** Conta linhas de conteúdo visíveis na listagem da library. */
async function countRows(page: Page): Promise<number> {
  return page.locator('main').getByText('[UX-AUDIT]', { exact: false }).count()
}

test.describe('Grupo F — library e busca (J5)', () => {
  test('item-23: /library a 1194x834 com IndexedDB frio (LIB-01)', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      23,
      'Abrir /library a 1194×834 com IndexedDB frio: a lista monta vazia ou esvazia depois (flash)? Reload cura?'
    )
    trackSessionPosts(page, 'item-23')

    // Contexto do projeto é novo (IndexedDB de conteúdo frio; só o auth seeded)
    if (!(await gotoRoute(page, '/library', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }

    // Série temporal: contagem de linhas a cada 500ms por 12s (flash?)
    const serie: Array<{ t: number; rows: number; emptyStateVisivel: boolean }> = []
    const t0 = Date.now()
    while (Date.now() - t0 < 12_000) {
      const rows = await countRows(page).catch(() => -1)
      const empty = await page
        .getByText(/no content|empty|add your first/i)
        .first()
        .isVisible()
        .catch(() => false)
      serie.push({ t: Date.now() - t0, rows, emptyStateVisivel: empty })
      await page.waitForTimeout(500)
    }
    rec.measure('serie_temporal_12s', serie)
    rec.measure('screenshot_estado_final', await shot(page, 'item-23-library-12s'))

    const finalRows = serie[serie.length - 1]?.rows ?? -1
    if (finalRows <= 0) {
      rec.note(`LIB-01 REPRODUZIDO: lista termina com ${finalRows} linhas visíveis em 1194x834`)
      await page.reload({ waitUntil: 'domcontentloaded' })
      await settle(page, 3000)
      const afterReload = await countRows(page).catch(() => -1)
      rec.measure('linhas_apos_reload', afterReload)
      rec.measure('screenshot_apos_reload', await shot(page, 'item-23-library-reload'))
    } else {
      rec.note(`Lista montou com ${finalRows} linhas — LIB-01 não reproduzido nesta passada`)
    }
    rec.save(testInfo)
  })

  test('item-24: busca do header — dashboard até resultado', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      24,
      'Cronometrar busca do header até resultado renderizado (dashboard→resultado ≤4 taps/10s)? Submit com Enter funciona?'
    )
    trackSessionPosts(page, 'item-24')

    if (!(await gotoRoute(page, '/dashboard', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 1500)

    const search = page.getByPlaceholder('Search...').first()
    await rec.tap('tap 1: foco no campo de busca do header', async () => {
      await search.click()
    })
    await rec.tap('tap 2: digitar "Garota" (1 tap/campo)', async () => {
      await search.fill('Garota')
    })
    await rec.tap('tap 3: Enter', async () => {
      await search.press('Enter')
      await page.waitForURL(/\/library\?search=/, { timeout: 15_000 })
      await page.getByText('Garota de Ipanema').first().waitFor({ state: 'visible', timeout: 15_000 })
    })
    rec.measure('tempo_ate_resultado_ms', rec.elapsed())
    rec.measure('url_resultado', page.url())
    rec.note('Submit via Enter (equivalente ao Go do teclado mobile — mesmo evento de teclado).')
    rec.measure('screenshot', await shot(page, 'item-24-busca-resultado'))
    rec.save(testInfo)
  })

  test('item-25: typo "ipanma" e sem acento "aguas"', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      25,
      '"ipanma" e "aguas" (sem acento) com dados reais: algum caso é salvo pelo Postgres, ou ambos zeram?'
    )
    trackSessionPosts(page, 'item-25')

    for (const q of ['ipanma', 'aguas', 'Águas', 'garota']) {
      await page.goto(`/library?search=${encodeURIComponent(q)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      })
      await settle(page, 2500)
      const rows = await countRows(page).catch(() => -1)
      const emptyText = await page
        .locator('main')
        .textContent()
        .then((t) => (t ?? '').replace(/\s+/g, ' ').slice(0, 200))
        .catch(() => '')
      rec.measure(`busca_${q}`, { resultados: rows, amostra: rows === 0 ? emptyText : undefined })
      if (q === 'ipanma') {
        rec.measure('screenshot_ipanma', await shot(page, 'item-25-ipanma'))
      }
    }
    rec.save(testInfo)
  })

  test('item-26: existe caminho para busca de dentro do modo performance?', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      26,
      'Existe caminho para a busca de dentro do modo performance ("toca aquela!")? Quantos taps?'
    )
    trackSessionPosts(page, 'item-26')

    test.setTimeout(10 * 60 * 1000)
    const entered = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=1`, rec)
    if (!entered) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 1500)

    // Inventário dos controles do modo performance: existe busca?
    const controls = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, input, a'))
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          label:
            el.getAttribute('aria-label') ||
            el.getAttribute('data-testid') ||
            el.getAttribute('placeholder') ||
            el.textContent?.trim().slice(0, 30) ||
            '(sem nome)',
        }))
        .filter((c) => c.label !== '(sem nome)' || c.tag === 'input')
    )
    rec.measure('controles_disponiveis_no_performance', controls)
    const hasSearch = controls.some((c) => /search|busca/i.test(c.label))
    rec.measure('busca_dentro_do_performance', hasSearch)

    if (!hasSearch) {
      // Caminho real: sair → busca do header
      await rec.tap('tap 1: sair do modo performance (X)', async () => {
        await page.locator('[data-testid="exit-button"]').click()
        await page.waitForURL(/^(?!.*\/performance)/, { timeout: 15_000 }).catch(() => {})
      })
      await settle(page, 1000)
      rec.measure('url_apos_exit', page.url())
      const search = page.getByPlaceholder('Search...').first()
      const searchVisible = await search.isVisible().catch(() => false)
      if (searchVisible) {
        await rec.tap('tap 2: foco na busca', async () => search.click())
        await rec.tap('tap 3: digitar', async () => search.fill('Asa Branca'))
        await rec.tap('tap 4: Enter', async () => {
          await search.press('Enter')
          await page.waitForURL(/\/library\?search=/, { timeout: 15_000 })
          await page.getByText('Asa Branca').first().waitFor({ state: 'visible', timeout: 15_000 })
        })
        rec.measure('taps_saida_ate_resultado', rec.taps)
        rec.measure('tempo_ate_resultado_ms', rec.elapsed())
      } else {
        rec.note(`Após sair, a tela de destino (${page.url()}) não tem a busca do header visível`)
      }
    }
    rec.save(testInfo)
  })

  test('item-27: adicionar à setlist partindo da biblioteca', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      27,
      'Fluxo real de adicionar 10 músicas à setlist partindo da biblioteca (menu do item não tem "Add to setlist"): ≤3 taps por música sem ida-e-volta?'
    )
    trackSessionPosts(page, 'item-27')

    if (!(await gotoRoute(page, '/library', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2500)

    // Abre o menu do primeiro item e inventaria as opções
    const menuBtn = page.locator('button:has(svg.lucide-more-vertical), button:has(.lucide-ellipsis-vertical)').first()
    const menuVisible = await menuBtn.isVisible().catch(() => false)
    if (!menuVisible) {
      rec.note('Nenhum botão de menu (MoreVertical) visível na listagem — inventário impossível')
      rec.set('inconclusiva')
    } else {
      await rec.tap('tap: abrir menu do item', async () => menuBtn.click())
      await page.waitForTimeout(800)
      const options = await page
        .locator('[role="menu"] [role="menuitem"]')
        .allTextContents()
        .catch(() => [] as string[])
      rec.measure('opcoes_do_menu_do_item', options)
      rec.measure('tem_add_to_setlist', options.some((o) => /setlist/i.test(o)))
      rec.measure('screenshot_menu', await shot(page, 'item-27-menu-item-library'))
      await page.keyboard.press('Escape')
      rec.note(
        'Sem "Add to setlist" no menu, o caminho real é biblioteca → /setlists → detalhe → picker ' +
          '(medido no item 16); ou seja, ida-e-volta entre telas para cada lote.'
      )
    }
    rec.save(testInfo)
  })

  test('item-28: touch — ScrollArea interna vs página; paginação vs bottom nav', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      28,
      'Em touch, o gesto rola a ScrollArea interna ou a página? A paginação (alvos 32px) é alcançável com a bottom nav?'
    )
    // Mobile com touch real emulado
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-28')
    try {
      if (!(await gotoRoute(page, '/library', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 3000)

      const before = await page.evaluate(() => {
        const sa = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
        return { pageY: window.scrollY, saTop: sa?.scrollTop ?? null }
      })
      // Gesto de swipe-up via CDP (scroll por touch)
      const cdp = await context.newCDPSession(page)
      await cdp.send('Input.synthesizeScrollGesture', {
        x: 195,
        y: 500,
        yDistance: -400,
        speed: 800,
      })
      await page.waitForTimeout(1000)
      const after = await page.evaluate(() => {
        const sa = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
        return { pageY: window.scrollY, saTop: sa?.scrollTop ?? null }
      })
      rec.measure('scroll_antes', before)
      rec.measure('scroll_depois_swipe', after)
      rec.note(
        `Swipe de 400px sobre a lista: página rolou ${((after.pageY ?? 0) - (before.pageY ?? 0)).toFixed(0)}px, ` +
          `ScrollArea interna rolou ${((after.saTop ?? 0) - (before.saTop ?? 0)).toFixed(0)}px`
      )

      // Paginação alcançável? Mede geometria da paginação vs bottom nav
      const geo = await page.evaluate(() => {
        const nav = Array.from(document.querySelectorAll('nav, [class*="bottom"]')).find(
          (el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().bottom > window.innerHeight - 4
        )
        const pagination = Array.from(document.querySelectorAll('button')).filter((b) =>
          /^\d+$|next|previous/i.test(b.textContent?.trim() ?? '')
        )
        return {
          bottomNavTop: nav ? Math.round(nav.getBoundingClientRect().top) : null,
          viewportH: window.innerHeight,
          paginacao: pagination.map((b) => {
            const r = b.getBoundingClientRect()
            return { label: b.textContent?.trim(), y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }
          }),
        }
      })
      rec.measure('geometria_paginacao_vs_bottom_nav', geo)
      rec.measure('screenshot', await shot(page, 'item-28-mobile-scroll-paginacao'))
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-29: badges do dropdown de filtros — alvos e seleção múltipla', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      29,
      'Os badges text-xs do dropdown de filtros são tocáveis com confiança? Seleção múltipla se comporta?'
    )
    trackSessionPosts(page, 'item-29')

    if (!(await gotoRoute(page, '/library', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2500)

    await rec.tap('tap: abrir dropdown Filters', async () => {
      await page.locator('button:has(svg.lucide-filter)').first().click()
    })
    await page.waitForTimeout(800)

    const targets = await page.evaluate(() => {
      const menu = document.querySelector('[role="menu"]')
      if (!menu) return null
      return Array.from(menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], .badge, [class*="badge"]')).map(
        (el) => {
          const r = el.getBoundingClientRect()
          return {
            label: el.textContent?.trim().slice(0, 30),
            w: Math.round(r.width),
            h: Math.round(r.height),
            alvo48px: r.width >= 48 && r.height >= 48,
          }
        }
      )
    })
    rec.measure('alvos_do_dropdown', targets)
    rec.measure('screenshot_dropdown', await shot(page, 'item-29-filtros-dropdown'))

    // Seleção múltipla: Tab + Chords
    const menu = page.locator('[role="menu"]')
    await rec.tap('tap: selecionar "Tab"', async () => {
      await menu.getByText('Tab', { exact: true }).click()
    })
    await page.waitForTimeout(600)
    const menuStillOpen = await menu.isVisible().catch(() => false)
    rec.measure('menu_continua_aberto_apos_1a_selecao', menuStillOpen)
    if (!menuStillOpen) {
      await rec.tap('tap: reabrir dropdown', async () => {
        await page.locator('button:has(svg.lucide-filter)').first().click()
      })
      await page.waitForTimeout(600)
    }
    await rec.tap('tap: selecionar "Chords"', async () => {
      await menu.getByText('Chords', { exact: true }).click()
    })
    await page.waitForTimeout(1200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(800)

    const state = await page.evaluate(() => {
      const main = document.querySelector('main')
      const text = (main?.textContent ?? '').replace(/\s+/g, ' ')
      return {
        temChipDeFiltroAtivo: /clear|limpar|filter.*active|×/i.test(text),
        amostra: text.slice(0, 250),
      }
    })
    const rows = await countRows(page)
    rec.measure('linhas_apos_dois_filtros', rows)
    rec.measure('indicacao_de_filtro_ativo', state)
    rec.measure('screenshot_filtrado', await shot(page, 'item-29-filtros-aplicados'))
    rec.save(testInfo)
  })
})
