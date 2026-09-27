import { defineConfig } from '@playwright/test'
import path from 'node:path'

/**
 * G-faixa (I1-PR5; I1-D13, I1-D16, errata da I1-D14) — config PRÓPRIA,
 * independente do `playwright.ux-audit.config.ts`:
 *
 *  • Chromium DO PLAYWRIGHT (sem `channel`), na versão que o
 *    `@playwright/test` do lockfile fixa: 1.55.0 → Chromium 140.0.7339.16
 *    (build 1187). O medidor confere `browser.version()` contra
 *    `CHROMIUM_FIXADO` e para se divergir (div. 512: no pre-check o probe rodou
 *    no Chrome do sistema). Instalação: `pnpm exec playwright install chromium`.
 *  • Viewports 1138 · 711 · 411 (C · B · A), um projeto por largura.
 *  • SEM `baseURL` padrão: `G_FAIXA_BASE_URL` é obrigatória e, sem ela, esta
 *    config lança ANTES de qualquer navegador abrir (CN em
 *    `docs/ux/I1-PR5-anexos/cn/`).
 *  • SEM `discovery.json` e sem `globalSetup` de login por senha: a sessão é
 *    um perfil persistente (`G_FAIXA_PERFIL`, fora da árvore) em que o Marcel
 *    faz login uma vez; o executor nunca digita senha. Ver
 *    `scripts/gates-web/COMO-RODAR.md`.
 *
 * O que se commita é a MEDIÇÃO (`tests/gates-web/medicoes/<superficie>.json`);
 * o veredito do CI (`g-faixa-veredito.mjs`) lê só esses JSON.
 */
export const CHROMIUM_FIXADO = '140.0.7339.16'
export const LARGURAS = {
  'C-1138': { width: 1138, height: 711 },
  'B-711': { width: 711, height: 1138 },
  'A-411': { width: 411, height: 823 },
} as const

const BASE = process.env.G_FAIXA_BASE_URL
if (!BASE) {
  throw new Error(
    'G-faixa: G_FAIXA_BASE_URL é obrigatória (sem baseURL padrão, I1-D16). ' +
      'Ex.: G_FAIXA_BASE_URL=http://localhost:3000 — nenhum navegador foi aberto.',
  )
}
let origem: URL
try {
  origem = new URL(BASE)
} catch {
  throw new Error(`G-faixa: G_FAIXA_BASE_URL não é URL: ${BASE} — nenhum navegador foi aberto.`)
}
const perfil = process.env.G_FAIXA_PERFIL
if (perfil && !path.relative(process.cwd(), path.resolve(perfil)).startsWith('..')) {
  throw new Error(`G-faixa: G_FAIXA_PERFIL tem de ficar FORA da árvore (é a sessão do navegador): ${perfil}`)
}

export default defineConfig({
  testDir: '.',
  // a medição; e o CN da coleta (página sintética, sem servidor), que só roda quando pedido pelo caminho
  testMatch: [/scripts\/gates-web\/g-faixa-medir\.ts$/, /tests\/gates-web\/g-faixa-coleta\.cn\.ts$/],
  globalSetup: './scripts/gates-web/g-faixa-sessao.ts',
  fullyParallel: false,
  workers: 1, // o perfil persistente não abre em dois processos
  retries: 0,
  reporter: [['list']],
  timeout: 10 * 60 * 1000,
  outputDir: path.join(process.env.TMPDIR ?? '/tmp', 'g-faixa-test-results'),
  use: {
    browserName: 'chromium',
    serviceWorkers: 'block',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  metadata: { base: origem.origin, chromium: CHROMIUM_FIXADO },
  projects: Object.entries(LARGURAS).map(([name, viewport]) => ({ name, use: { viewport } })),
})
