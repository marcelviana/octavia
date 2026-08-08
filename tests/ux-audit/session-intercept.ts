import type { BrowserContext, Page } from '@playwright/test'

/**
 * Intercepta POST/DELETE /api/auth/session com 200 fake, por dois motivos:
 *
 * 1. Rate limit: o endpoint usa RATE_LIMIT_CONFIGS.AUTH (5 req / 15 min por
 *    IP). Cada page load autenticado dispara um POST (setSessionCookie no
 *    firebase-auth-context) e cada load deslogado dispara um DELETE
 *    (clearSessionCookie) — o harvest tem dezenas de células e estouraria o
 *    limite imediatamente.
 *
 * 2. Escrita zero contra prod durante o harvest: o único POST real de
 *    sessão é o do auth.setup.ts (via Node fetch, fora do browser).
 *
 * O cookie injetado no setup vale 7 dias, então o POST por página é
 * redundante para nós; o resultado visual é idêntico ao de um usuário real
 * cujo POST retorna 200.
 */
export async function interceptSessionEndpoint(target: BrowserContext | Page): Promise<void> {
  await target.route('**/api/auth/session', (route) => {
    const method = route.request().method()
    if (method === 'POST' || method === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    }
    return route.continue()
  })
}
