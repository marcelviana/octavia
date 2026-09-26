import { test } from '@playwright/test'
import { ItemRecorder, settle } from './recorder'

/**
 * Fase D — Grupo A: item 15 (balão HTML5). Os itens 1-3 (fluxo J1 até o
 * palco) e o 01b (offline pelo SW) saíram com o palco e o PWA na I1-PR3.
 *
 * Medições contra PROD com a conta de audit. Sem session-intercept: o
 * comportamento real do POST /api/auth/session faz parte do que se mede.
 */

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
