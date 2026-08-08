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
    ...Object.entries(UX_AUDIT_VIEWPORTS).map(([name, viewport]) => ({
      name: `harvest-${name}`,
      testMatch: /harvest\.spec\.ts/,
      dependencies: ['setup'] as string[],
      use: {
        storageState: UX_AUDIT_STORAGE_STATE,
        viewport,
      },
    })),
  ],
})
