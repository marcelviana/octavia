import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance, gotoRoute } from './recorder'
import { resolveFaseDDir } from '../../../scripts/ux-audit/fase-d-dirs'

/**
 * Fase D — Grupo C: offline / J6 (itens 8-10).
 *
 * Service worker LIGADO (projeto fase-d). "Kill + reopen" é aproximado por
 * fechar a page e abrir outra no MESMO contexto (contexto novo no Playwright
 * perderia o SW/caches — anotado como limitação em cada item).
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_ID: string = discovery.setlists.show.id
const ESTRESSE_ID: string = discovery.setlists.estresse.id
const PICKER_SETLIST = 'UX-AUDIT Fase D picker'

const EVIDENCE_DIR = resolveFaseDDir('evidence')
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo C — offline (J6)', () => {
  test('item-08: kill+reopen offline com sessão >1h', async ({ page, context }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      8,
      'Kill + reopen em modo avião com sessão >1h: o app chega ao dashboard ou o middleware bloqueia em /login (AUTH-02)? O setSessionCookie falhando offline degrada algo visível?'
    )
    trackSessionPosts(page, 'item-08')

    try {
      // Aquecimento online (SW + caches)
      if (!(await gotoRoute(page, '/dashboard', rec))) {
        rec.set('inconclusiva')
        return
      }
      await settle(page, 3000)

      // Simula sessão >1h: expira o accessToken no IndexedDB (refresh offline falhará)
      await page.evaluate(async () => {
        await new Promise<void>((resolve, reject) => {
          const open = indexedDB.open('firebaseLocalStorageDb')
          open.onsuccess = () => {
            const db = open.result
            const tx = db.transaction('firebaseLocalStorage', 'readwrite')
            const store = tx.objectStore('firebaseLocalStorage')
            const getAll = store.getAll()
            getAll.onsuccess = () => {
              for (const rec of getAll.result as Array<{ fbase_key: string; value: any }>) {
                if (rec.fbase_key.startsWith('firebase:authUser:')) {
                  rec.value.stsTokenManager.expirationTime = Date.now() - 2 * 60 * 60 * 1000
                  store.put(rec)
                }
              }
            }
            tx.oncomplete = () => {
              db.close()
              resolve()
            }
            tx.onerror = () => reject(tx.error)
          }
          open.onerror = () => reject(open.error)
        })
      })
      rec.note('accessToken do IndexedDB expirado à força (−2h) para simular sessão velha; cookie de sessão do storageState também tem >12h')

      await context.setOffline(true)
      await page.close() // "kill"
      const page2 = await context.newPage() // "reopen"
      trackSessionPosts(page2, 'item-08-reopen')
      const consoleErrors: string[] = []
      page2.on('console', (m) => {
        if (m.type() === 'error' && consoleErrors.length < 10) consoleErrors.push(m.text().slice(0, 150))
      })

      const nav = await page2
        .goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 })
        .then(() => 'ok')
        .catch((e) => `falhou: ${String(e).split('\n')[0]}`)
      await page2.waitForTimeout(5000)
      const body = ((await page2.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
      rec.measure('goto_dashboard_offline', nav)
      rec.measure('url_final', page2.url())
      rec.measure('tela', body.slice(0, 300))
      rec.measure('console_errors', consoleErrors)
      rec.measure('screenshot', await shot(page2, 'item-08-dashboard-offline'))
      rec.note('Limitação: "kill+reopen" = nova page no mesmo contexto (contexto novo perderia SW/caches do Playwright)')

      // start_url / offline também (caminho do ícone do PWA)
      const nav2 = await page2
        .goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 })
        .then(() => 'ok')
        .catch((e) => `falhou: ${String(e).split('\n')[0]}`)
      await page2.waitForTimeout(3000)
      rec.measure('goto_starturl_offline', { nav: nav2, url: page2.url() })
    } finally {
      await context.setOffline(false)
      rec.save(testInfo)
    }
  })

  test('item-09: setlist cacheada abre completa offline? E música nunca cacheada?', async ({ page, context }, testInfo) => {
    test.setTimeout(15 * 60 * 1000)
    const rec = new ItemRecorder(
      9,
      'A setlist cacheada abre completa offline, incluindo PDFs? O que aparece para música cujo arquivo nunca foi cacheado?'
    )
    trackSessionPosts(page, 'item-09')

    try {
      // Aquecimento: toca 3 músicas da Show padrão ONLINE (inclui o PDF na 1ª)
      const ok = await gotoPerformance(page, `/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, rec)
      if (!ok) {
        rec.set('inconclusiva')
        return
      }
      await settle(page, 4000)
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: 'Next' }).click()
        await page.waitForTimeout(2500)
      }
      rec.note('Cache aquecido online: músicas 1-3 da Show padrão visitadas (1ª é o PDF de 12 páginas)')

      await context.setOffline(true)
      await page.close()
      const page2 = await context.newPage()
      trackSessionPosts(page2, 'item-09-offline')

      const nav = await page2
        .goto(`/performance?setlistId=${SHOW_ID}&startingSongIndex=0`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        })
        .then(() => 'ok')
        .catch((e) => `falhou: ${String(e).split('\n')[0]}`)
      rec.measure('reopen_performance_offline', nav)
      await page2.waitForTimeout(5000)
      rec.measure('url_apos_reopen', page2.url())

      const shellVisible = await page2
        .locator('[data-testid="exit-button"]')
        .isVisible()
        .catch(() => false)
      rec.measure('shell_performance_offline', shellVisible)

      if (shellVisible) {
        // percorre as 3 músicas aquecidas
        for (let i = 0; i < 3; i++) {
          const kind = await page2.evaluate(() => {
            const el = document.querySelector('[data-testid="optimized-content-display"]')
            if (!el) return 'SEM DISPLAY'
            if (el.querySelector('iframe')) return 'iframe-pdf'
            if (el.querySelector('canvas')) return 'canvas'
            if (el.querySelector('img')) return 'imagem'
            const t = (el.textContent ?? '').trim()
            return t.length > 20 ? 'texto' : `VAZIO ("${t.slice(0, 40)}")`
          })
          const title = (await page2.locator('h2').first().textContent().catch(() => null))?.trim()
          rec.measure(`musica_${i + 1}_offline`, { titulo: title, conteudo: kind })
          await shot(page2, `item-09-offline-musica-${i + 1}`)
          if (i < 2) {
            await page2.getByRole('button', { name: 'Next' }).click().catch(() => {})
            await page2.waitForTimeout(2000)
          }
        }
      } else {
        const body = ((await page2.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
        rec.measure('tela_sem_shell', body.slice(0, 300))
        rec.measure('screenshot', await shot(page2, 'item-09-offline-sem-shell'))
      }

      // Música nunca cacheada: Estresse nunca aberta neste contexto
      const nav2 = await page2
        .goto(`/performance?setlistId=${ESTRESSE_ID}&startingSongIndex=5`, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        })
        .then(() => 'ok')
        .catch((e) => `falhou: ${String(e).split('\n')[0]}`)
      await page2.waitForTimeout(5000)
      const bodyNever = ((await page2.textContent('body').catch(() => '')) ?? '').replace(/\s+/g, ' ')
      rec.measure('setlist_nunca_cacheada_offline', {
        nav: nav2,
        url: page2.url(),
        tela: bodyNever.slice(0, 300),
      })
      rec.measure('screenshot_nunca_cacheada', await shot(page2, 'item-09-nunca-cacheada'))
    } finally {
      await context.setOffline(false)
      rec.save(testInfo)
    }
  })

  test('item-10: editar setlist → offline → cache mostra a versão antiga (SET-14)?', async ({ page, context }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      10,
      'Editar setlist → modo avião → reabrir: a versão cacheada é a anterior à edição (SET-14)?'
    )
    trackSessionPosts(page, 'item-10')
    const NEW_NAME = 'UX-AUDIT Fase D picker v2'

    try {
      // 1. Carrega /setlists online (grava cache com o estado A)
      if (!(await gotoRoute(page, '/setlists', rec))) {
        rec.set('inconclusiva')
        return
      }
      await settle(page, 3000)
      const hasPicker = (await page.getByText(PICKER_SETLIST, { exact: true }).count()) > 0
      if (!hasPicker) {
        rec.note(`Setlist "${PICKER_SETLIST}" não encontrada (item 16 rodou?) — usando a primeira do audit se existir`)
      }
      const target = hasPicker ? PICKER_SETLIST : null
      if (!target) {
        rec.set('inconclusiva')
        return
      }

      // 2. Edita o nome (escrita permitida: é a setlist do audit)
      await page.getByText(target, { exact: true }).first().click()
      await settle(page, 1500)
      await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
      await page.locator('#name').fill(NEW_NAME)
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /save|update/i })
        .click()
      await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15_000 })
      await settle(page, 2000)
      const renamed = (await page.getByText(NEW_NAME, { exact: true }).count()) > 0
      rec.measure('rename_online_visivel', renamed)

      // 3. Offline + kill/reopen → /setlists vem do cache
      await context.setOffline(true)
      await page.close()
      const page2 = await context.newPage()
      const nav = await page2
        .goto('/setlists', { waitUntil: 'domcontentloaded', timeout: 30_000 })
        .then(() => 'ok')
        .catch((e) => `falhou: ${String(e).split('\n')[0]}`)
      await page2.waitForTimeout(5000)
      const offlineState = {
        nav,
        url: page2.url(),
        mostraNomeNovo: (await page2.getByText(NEW_NAME, { exact: true }).count().catch(() => 0)) > 0,
        mostraNomeAntigo: (await page2.getByText(PICKER_SETLIST, { exact: true }).count().catch(() => 0)) > 0,
      }
      rec.measure('reopen_offline', offlineState)
      rec.measure('screenshot', await shot(page2, 'item-10-setlists-offline'))
      rec.note(
        offlineState.mostraNomeAntigo && !offlineState.mostraNomeNovo
          ? 'SET-14 CONFIRMADO: offline mostra o nome ANTERIOR à edição'
          : offlineState.mostraNomeNovo
            ? 'Offline mostra o nome novo — cache atualizado na edição (SET-14 não reproduzido)'
            : 'Nenhum dos nomes visível offline — ver screenshot'
      )
      await context.setOffline(false)

      // 4. Reconecta e desfaz a edição (volta ao nome canônico do audit)
      const page3 = await context.newPage()
      await page3.goto('/setlists', { waitUntil: 'domcontentloaded', timeout: 90_000 })
      await settle(page3, 2500)
      if ((await page3.getByText(NEW_NAME, { exact: true }).count()) > 0) {
        await page3.getByText(NEW_NAME, { exact: true }).first().click()
        await settle(page3, 1500)
        await page3.getByRole('button', { name: 'Edit', exact: true }).first().click()
        await page3.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
        await page3.locator('#name').fill(PICKER_SETLIST)
        await page3
          .getByRole('dialog')
          .getByRole('button', { name: /save|update/i })
          .click()
        await page3.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15_000 })
        rec.note('Edição desfeita: nome restaurado para o canônico do audit')
      }
    } finally {
      await context.setOffline(false)
      rec.save(testInfo)
    }
  })
})
