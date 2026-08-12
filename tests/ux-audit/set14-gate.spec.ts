import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'

/**
 * Gate de regressão da PR-4 (SET-14 / FASE-D-06): offline, a listagem
 * /setlists lê o cache do IndexedDB em vez de afirmar "No setlists yet".
 *
 * O cenário exercitado é o que o item 10 da Fase D mediu e o caso real de
 * palco: rede caída com navigator.onLine === true (wi-fi conectado sem
 * internet — o setOffline do Playwright reproduz exatamente isso: requests
 * falham, onLine permanece true). O branch de modo avião (onLine=false) é
 * um atalho do mesmo caminho de cache, coberto por teste unitário.
 *
 * READ-ONLY: nenhuma mutação de dados, nenhum ItemRecorder, nada escrito
 * em docs/. Usa as setlists canônicas do discovery.json.
 *
 * PRÉ-REQUISITO (auth): o projeto set14-gate NÃO depende do projeto setup —
 * o setup queima 1 POST /api/auth/session (orçamento AUTH 5/15min) por
 * execução, então ele é rodado manualmente, uma vez, antes:
 *
 *   pnpm exec playwright test --config=playwright.ux-audit.config.ts \
 *     --project=setup --retries=0
 *   pnpm exec playwright test --config=playwright.ux-audit.config.ts \
 *     --project=set14-gate --retries=0
 *
 * (contra preview: exportar UX_AUDIT_BASE_URL e o bypass antes de AMBOS.)
 * storageState ausente/expirado produz falha explícita no primeiro passo do
 * teste — nunca skip nem falso verde.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const SHOW_NAME: string = discovery.setlists.show.name // "UX-AUDIT Show padrão"

/** Nº de itens na store de setlists do localforage (IndexedDB). */
async function cachedSetlistCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    try {
      const dbs = (await indexedDB.databases()) || []
      if (!dbs.some((d) => d.name === 'localforage')) return -1
      return await new Promise<number>((resolve) => {
        const open = indexedDB.open('localforage')
        open.onsuccess = () => {
          const db = open.result
          try {
            const tx = db.transaction('keyvaluepairs', 'readonly')
            const store = tx.objectStore('keyvaluepairs')
            const keysReq = store.getAllKeys()
            keysReq.onsuccess = () => {
              const key = (keysReq.result as IDBValidKey[])
                .map(String)
                .find((k) => k.startsWith('octavia-offline-setlists-'))
              if (!key) {
                db.close()
                return resolve(-1)
              }
              const getReq = store.get(key)
              getReq.onsuccess = () => {
                const v = getReq.result
                db.close()
                resolve(Array.isArray(v) ? v.length : -1)
              }
              getReq.onerror = () => {
                db.close()
                resolve(-1)
              }
            }
            keysReq.onerror = () => {
              db.close()
              resolve(-1)
            }
          } catch {
            db.close()
            resolve(-1)
          }
        }
        open.onerror = () => resolve(-1)
      })
    } catch {
      return -1
    }
  })
}

test.describe('SET-14 gate — /setlists offline lê o cache', () => {
  test('offline (onLine=true, rede caída) lista as setlists cacheadas', async ({
    page,
    context,
  }) => {
    test.setTimeout(5 * 60 * 1000)

    try {
      // ---- Fase online: carrega a listagem e ESPERA a escrita do cache ----
      await page.goto('/setlists', { waitUntil: 'domcontentloaded', timeout: 60_000 })
      if (page.url().includes('/login')) {
        throw new Error(
          'set14-gate: aterrissou em /login — storageState do ux-audit ausente ou ' +
            'expirado. Rode o setup antes (ver cabeçalho deste spec): ' +
            'pnpm exec playwright test --config=playwright.ux-audit.config.ts --project=setup'
        )
      }

      // Prontidão explícita, não sleep: a sonda do pre-check mediu a escrita
      // concluindo ~6-9s após o load (atrás do fetch em cascata do GET)
      await expect
        .poll(() => cachedSetlistCount(page), {
          timeout: 60_000,
          message: 'cache de setlists nunca foi gravado na fase online',
        })
        .toBeGreaterThanOrEqual(1)

      // A listagem online mostra a setlist canônica (sanidade da fase online)
      await expect(page.getByText(SHOW_NAME, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      })

      // ---- Fase offline: kill + reopen no mesmo contexto ----
      await context.setOffline(true)
      await page.close()
      const page2 = await context.newPage()
      await page2.goto('/setlists', { waitUntil: 'domcontentloaded', timeout: 30_000 })

      // Casca montou (SW serviu o HTML, React hidratou)
      await expect(page2.locator('nav, header').first()).toBeVisible({ timeout: 30_000 })

      // O gate: a setlist canônica listada, e nunca o empty state de
      // primeiro uso ("No setlists yet") com dados cacheados presentes
      await expect(page2.getByText(SHOW_NAME, { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      })
      await expect(page2.getByText('No setlists yet')).toHaveCount(0)
    } finally {
      await context.setOffline(false)
    }
  })
})
