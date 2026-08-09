import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute } from './recorder'

/**
 * Fase D — verificação dos itens 30 e 46 (o item recém-importado é
 * localizável sem reload manual?).
 *
 * Separado do i-add.spec.ts de propósito: o item 42 já consumiu o upload;
 * repetir aquele teste inteiro queimaria orçamento do limiter de UPLOAD
 * (10/hora) sem necessidade. Aqui só se navega e se busca.
 */

const TITLE = '[UX-AUDIT] Fase D import solo'
const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test('item-30 + item-46: item recém-importado localizável sem reload', async ({ browser }, testInfo) => {
  test.setTimeout(10 * 60 * 1000)
  const rec30 = new ItemRecorder(
    30,
    'Item recém-importado aparece na biblioteca ao voltar, sem reload manual (cache de 30s + refresh por foco)?'
  )
  const rec46 = new ItemRecorder(
    46,
    'Item recém-importado aparece na busca/biblioteca sem reload manual (critério "imediatamente localizável")?'
  )
  const context = await browser.newContext({
    baseURL: 'https://octavia.rocks',
    storageState: 'tests/ux-audit/.auth/user.json',
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  trackSessionPosts(page, 'item-30+46')

  try {
    if (!(await gotoRoute(page, '/library', rec30))) {
      rec30.set('inconclusiva')
      rec46.set('inconclusiva')
      return
    }
    await settle(page, 3000)

    // O item importado no item 42 aparece na primeira página da listagem?
    const naPrimeiraPagina = await page.getByText(TITLE).count()
    rec30.measure('visivel_na_primeira_pagina_da_library', naPrimeiraPagina > 0)
    rec30.measure('screenshot_library', await shot(page, 'item-30-library-apos-import'))

    // Qual é a ordenação padrão? (se for por created_at desc, o novo estaria no topo)
    const primeirosTitulos = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h3, h4, p'))
        .map((e) => e.textContent?.trim())
        .filter((t) => t?.startsWith('[UX-AUDIT]'))
        .slice(0, 5)
    )
    rec30.measure('primeiros_titulos_da_listagem', primeirosTitulos)

    if (naPrimeiraPagina === 0) {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await settle(page, 3000)
      rec30.measure('visivel_apos_reload_manual', (await page.getByText(TITLE).count()) > 0)
      rec30.note(
        'Não aparece na primeira página da listagem: a ordenação padrão não põe o item novo no topo ' +
          '(a listagem pagina de 20 em 20 sobre 60+ itens), então "voltar à biblioteca" não mostra o que acabou de ser importado.'
      )
    }

    // Item 46: localizável pela busca
    const search = page.getByPlaceholder('Search...').first()
    if (await search.isVisible().catch(() => false)) {
      await rec46.tap('tap: busca do header', async () => search.tap())
      await rec46.tap('tap: digitar "Fase D import"', async () => search.fill('Fase D import'))
      await rec46.tap('tap: Enter', async () => {
        await search.press('Enter')
        await page.waitForURL(/\/library\?search=/, { timeout: 20_000 })
      })
      await settle(page, 3000)
    } else {
      await gotoRoute(page, '/library', rec46)
      await page.goto(`/library?search=${encodeURIComponent('Fase D import')}`, {
        waitUntil: 'domcontentloaded',
      })
      await settle(page, 3000)
    }
    const achadoNaBusca = await page.getByText(TITLE).count()
    rec46.measure('localizavel_pela_busca', achadoNaBusca > 0)
    rec46.measure('tempo_ate_resultado_ms', rec46.elapsed())
    rec46.measure('screenshot_busca', await shot(page, 'item-46-busca-item-novo'))
    rec46.note(
      achadoNaBusca > 0
        ? 'Item importado é encontrado pela busca imediatamente, sem reload manual — critério do J4 atendido pela busca'
        : 'Item importado NÃO aparece na busca'
    )
  } finally {
    rec30.save(testInfo)
    rec46.save(testInfo)
    await context.close()
  }
})
