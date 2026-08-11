import { defineConfig } from '@playwright/test'

/**
 * Config do projeto ux-audit — captura de evidências de UX contra PROD.
 *
 * Separado do playwright.config.ts da suíte e2e de propósito: roda serial
 * (workers: 1) contra https://octavia.rocks, sem webServer local, sem
 * global-setup da e2e. A autenticação vem de tests/ux-audit/auth.setup.ts
 * (Firebase REST → cookie de sessão → storageState), nunca da UI de login.
 *
 * serviceWorkers: 'block' — queremos o app real servido pela rede, não o
 * cache do service worker.
 */

export const UX_AUDIT_STORAGE_STATE = 'tests/ux-audit/.auth/user.json'

export const UX_AUDIT_VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  'tablet-portrait': { width: 834, height: 1194 },
  desktop: { width: 1440, height: 900 },
  'tablet-landscape': { width: 1194, height: 834 },
} as const

export default defineConfig({
  testDir: './tests/ux-audit',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Timeout generoso: cada teste captura várias células contra prod
  timeout: 15 * 60 * 1000,
  expect: { timeout: 15_000 },
  outputDir: 'test-results/ux-audit',
  use: {
    baseURL: process.env.UX_AUDIT_BASE_URL || 'https://octavia.rocks',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    // NÃO usar extraHTTPHeaders para o bypass do Vercel: ele é global e
    // injeta o header também em requisições CROSS-ORIGIN (identitytoolkit,
    // securetoken). Um header custom dispara preflight que o Google recusa
    // ("no Access-Control-Allow-Origin") e derruba o SDK do Firebase no
    // browser — o que trava qualquer fluxo que precise de token (upload).
    // O bypass viaja no COOKIE `_vercel_jwt`, semeado pelo auth.setup.ts e
    // carregado no storageState. Ver auth.setup.ts.
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'smoke',
      testMatch: /auth\.smoke\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: UX_AUDIT_STORAGE_STATE,
        viewport: UX_AUDIT_VIEWPORTS.desktop,
      },
    },
    {
      // Fase D — execução ao vivo dos fluxos contra PROD (medições).
      // Diferenças deliberadas vs. harvest: service worker LIGADO (o SW é
      // parte do app real e o offline/J6 depende dele), trace ligado em tudo
      // (traces são a evidência das medições) e SEM dependência do setup —
      // o setup queima 1 POST /api/auth/session (orçamento AUTH 5/15min) por
      // execução; na Fase D ele é rodado manualmente uma única vez.
      name: 'fase-d',
      testMatch: /fase-d\/.*\.spec\.ts/,
      use: {
        storageState: UX_AUDIT_STORAGE_STATE,
        viewport: UX_AUDIT_VIEWPORTS['tablet-landscape'],
        serviceWorkers: 'allow',
        trace: 'on',
        // O default do Playwright para ações é 0 = espera INFINITA. Numa
        // suíte de medição contra prod isso troca uma falha em 20s por um
        // teste morrendo no timeout de 10-15min sem salvar nada (aconteceu
        // nos itens 16 e 11/12). Um teto explícito transforma o travamento
        // em erro rápido e legível.
        actionTimeout: 20_000,
      },
    },
    ...Object.entries(UX_AUDIT_VIEWPORTS).map(([name, viewport]) => ({
      name: `harvest-${name}`,
      // Casa harvest.spec.ts (B1, estados vazios) e harvest-populated.spec.ts
      // (B2) — rode UMA passada por vez filtrando pelo arquivo na CLI, senão
      // o B1 sobrescreve capturas com a conta já populada.
      testMatch: /harvest(-populated)?\.spec\.ts/,
      dependencies: ['setup'] as string[],
      use: {
        storageState: UX_AUDIT_STORAGE_STATE,
        viewport,
      },
    })),
  ],
})
