import { test, expect } from '@playwright/test'
import fs from 'node:fs'

/**
 * Gate de regressão da PR-1 (PERF-02): a CSP não bloqueia o <iframe> de PDF
 * do modo performance — frame-src permite blob: (o único iframe do app, cujo
 * src é sempre blob: do próprio origin via /api/proxy → createObjectURL).
 *
 * Três asserts:
 *   1. header: a CSP viva de /performance tem frame-src com blob:, sem 'none'
 *   2. runtime: zero securitypolicyviolation de frame-src após o load do PDF
 *      (o observável direto do bloqueio — antes do fix, o Chrome mostrava
 *      "This content is blocked" e disparava a violação)
 *   3. DOM: o iframe presente com src blob:
 *
 * O assert 2 funciona headless; a RODADA de validação usa Chromium HEADED
 * (headless não tem viewer de PDF — a confirmação visual do render é parte
 * do procedimento):
 *
 *   pnpm exec playwright test --config=playwright.ux-audit.config.ts \
 *     --project=perf02-gate --retries=0 --headed
 *
 * Controle negativo (regra nº 7 do plano): rodado contra o código SEM o fix
 * (prod pré-merge), falha esperada nos asserts 1 e 2.
 *
 * PRÉ-REQUISITO (auth): mesmo do set14-gate — rodar o projeto setup
 * manualmente antes (1 POST do orçamento AUTH 5/15min); contra preview,
 * exportar UX_AUDIT_BASE_URL e o bypass antes de ambos. storageState
 * ausente/expirado → falha explícita no primeiro passo (nunca falso verde).
 * Sessão expira ~55 min após o setup (AUTH-02 — nota operacional do plano).
 *
 * READ-ONLY: nenhuma mutação de dados, nenhum ItemRecorder, nada em docs/.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
// 1ª música da Show padrão é o PDF de 12 páginas (Fase D, itens 4 e 9)
const SHOW_ID: string = discovery.setlists.show.id

test.describe('PERF-02 gate — CSP permite o iframe de PDF do palco', () => {
  test('frame-src blob: no header, zero violações, iframe com src blob:', async ({
    page,
  }) => {
    test.setTimeout(5 * 60 * 1000)

    // Coletor de violações de CSP, instalado antes de qualquer navegação
    await page.addInitScript(() => {
      ;(window as any).__cspViolations = []
      document.addEventListener('securitypolicyviolation', (e) => {
        ;(window as any).__cspViolations.push({
          directive: e.violatedDirective,
          blockedURI: (e.blockedURI || '').slice(0, 80),
        })
      })
    })

    const response = await page.goto(
      `/performance?setlistId=${SHOW_ID}&startingSongIndex=0`,
      { waitUntil: 'domcontentloaded', timeout: 60_000 }
    )
    if (page.url().includes('/login')) {
      throw new Error(
        'perf02-gate: aterrissou em /login — storageState do ux-audit ausente ou ' +
          'expirado (sessão dura ~55min, AUTH-02). Rode o setup antes (ver cabeçalho): ' +
          'pnpm exec playwright test --config=playwright.ux-audit.config.ts --project=setup'
      )
    }

    // Assert 1 — header vivo da resposta do documento
    const csp = response?.headers()['content-security-policy'] ?? ''
    const frameSrc = /frame-src[^;]*/.exec(csp)?.[0] ?? '(diretiva ausente)'
    expect(frameSrc, `CSP recebida: ${frameSrc}`).toContain('blob:')
    expect(frameSrc, `CSP recebida: ${frameSrc}`).not.toContain("'none'")

    // Assert 3 — o iframe do PDF montou com src blob:
    const iframe = page.locator('[data-testid="optimized-content-display"] iframe')
    await expect(iframe).toBeVisible({ timeout: 60_000 })
    const src = (await iframe.getAttribute('src')) ?? ''
    expect(src.startsWith('blob:'), `src do iframe: ${src.slice(0, 60)}`).toBe(true)

    // Tempo para o browser tentar carregar o conteúdo do frame (é aqui que a
    // violação dispararia com frame-src 'none')
    await page.waitForTimeout(5000)

    // Assert 2 — zero violações de frame-src sobre o iframe do app (blob:).
    // Filtro por blockedURI blob: o preview da Vercel injeta um widget
    // (vercel.live) cujo frame nossa CSP corretamente bloqueia — ruído de
    // ambiente, não regressão (visto na validação da PR-1, rodada headed).
    // Com frame-src 'none', o blob bloqueado aparece aqui como "blob".
    const violations = (await page.evaluate(
      () => (window as any).__cspViolations
    )) as Array<{ directive: string; blockedURI: string }>
    const frameViolations = violations.filter(
      (v) => v.directive.includes('frame-src') && v.blockedURI.startsWith('blob')
    )
    expect(
      frameViolations,
      `violações de frame-src sobre blob: ${JSON.stringify(frameViolations)} (todas: ${JSON.stringify(violations)})`
    ).toHaveLength(0)

    // Evidência visual da rodada headed (test-results/, nunca docs/)
    await page.screenshot({
      path: test.info().outputPath('perf02-render.png'),
      fullPage: false,
    })
  })
})
