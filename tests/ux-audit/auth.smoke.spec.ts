import { test, expect } from '@playwright/test'
import { interceptSessionEndpoint } from './session-intercept'

/**
 * Teste trivial de validação do storageState (critério de aceite da B1):
 * abrir /dashboard autenticado e NÃO ser redirecionado para /login.
 */
test('dashboard autenticado não redireciona para login', async ({ page }) => {
  await interceptSessionEndpoint(page)
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  await expect(page).not.toHaveURL(/\/login/)
})
