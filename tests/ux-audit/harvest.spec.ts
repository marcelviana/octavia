import { test, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'
import { interceptSessionEndpoint } from './session-intercept'

/**
 * Harvester de capturas do UX assessment — execução "estados vazios"
 * (conta de audit sem dados; o seed só roda depois destas capturas).
 *
 * Para cada célula rota × estado × viewport (viewport vem do projeto
 * harvest-* no playwright.ux-audit.config.ts):
 *   1. goto + networkidle (best-effort, é prod)
 *   2. screenshot full-page  → docs/ux/capture/{rota}/{estado}-{viewport}.png
 *   3. accessibility snapshot → …/{estado}-{viewport}.a11y.json
 *   4. violações do axe-core  → …/{estado}-{viewport}.axe.json
 *
 * Cada célula registra status em docs/ux/capture/manifest-empty.json
 * (workers: 1 — leitura/escrita incremental é segura).
 *
 * Somente leitura contra prod: goto (GET) e, nos estados de erro de
 * validação, um clique em submit com formulário vazio — bloqueado pela
 * validação nativa (inputs `required`), sem request de rede.
 */

const CAPTURE_DIR = 'docs/ux/capture'
const MANIFEST_PATH = path.join(CAPTURE_DIR, 'manifest-empty.json')

interface Cell {
  route: string
  state: string
  urlPath: string
  authenticated: boolean
  prepare?: (page: Page) => Promise<void>
}

async function submitEmptyForm(page: Page): Promise<void> {
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForTimeout(1000)
}

const PUBLIC_CELLS: Cell[] = [
  { route: 'landing', state: 'default', urlPath: '/', authenticated: false },
  { route: 'login', state: 'default', urlPath: '/login', authenticated: false },
  {
    route: 'login',
    state: 'validation-error',
    urlPath: '/login',
    authenticated: false,
    prepare: submitEmptyForm,
  },
  { route: 'signup', state: 'default', urlPath: '/signup', authenticated: false },
  {
    route: 'signup',
    state: 'validation-error',
    urlPath: '/signup',
    authenticated: false,
    prepare: submitEmptyForm,
  },
]

const AUTH_CELLS: Cell[] = [
  { route: 'dashboard', state: 'empty', urlPath: '/dashboard', authenticated: true },
  { route: 'library', state: 'empty', urlPath: '/library', authenticated: true },
  {
    route: 'library',
    state: 'search-noresults',
    urlPath: '/library?search=xyzabc',
    authenticated: true,
  },
  { route: 'setlists', state: 'empty', urlPath: '/setlists', authenticated: true },
  { route: 'add-content', state: 'initial', urlPath: '/add-content', authenticated: true },
  { route: 'settings', state: 'default', urlPath: '/settings', authenticated: true },
  { route: 'profile', state: 'default', urlPath: '/profile', authenticated: true },
  { route: 'performance', state: 'empty', urlPath: '/performance', authenticated: true },
  { route: 'setup', state: 'default', urlPath: '/setup', authenticated: true },
]

interface ManifestEntry {
  route: string
  state: string
  viewport: string
  url: string
  status: 'captured' | 'failed'
  reason?: string
  files?: { screenshot: string; a11y: string; axe: string }
  axeViolations?: number
}

function recordManifest(entry: ManifestEntry): void {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true })
  let entries: ManifestEntry[] = []
  if (fs.existsSync(MANIFEST_PATH)) {
    entries = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  }
  entries = entries.filter(
    (e) => !(e.route === entry.route && e.state === entry.state && e.viewport === entry.viewport)
  )
  entries.push(entry)
  entries.sort(
    (a, b) =>
      a.route.localeCompare(b.route) ||
      a.state.localeCompare(b.state) ||
      a.viewport.localeCompare(b.viewport)
  )
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + '\n')
}

function viewportName(testInfo: TestInfo): string {
  return testInfo.project.name.replace(/^harvest-/, '')
}

async function captureCell(page: Page, cell: Cell, testInfo: TestInfo): Promise<void> {
  const viewport = viewportName(testInfo)
  const dir = path.join(CAPTURE_DIR, cell.route)
  const base = `${cell.state}-${viewport}`
  const files = {
    screenshot: path.join(dir, `${base}.png`),
    a11y: path.join(dir, `${base}.a11y.json`),
    axe: path.join(dir, `${base}.axe.json`),
  }

  try {
    fs.mkdirSync(dir, { recursive: true })

    await interceptSessionEndpoint(page)
    await page.goto(cell.urlPath, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    // networkidle best-effort: prod pode manter conexões abertas
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    if (cell.authenticated && /\/login/.test(page.url())) {
      throw new Error(`redirecionado para /login (sessão inválida?) em ${cell.urlPath}`)
    }

    if (cell.prepare) await cell.prepare(page)

    await page.screenshot({ path: files.screenshot, fullPage: true })

    const a11ySnapshot = await page.accessibility.snapshot()
    fs.writeFileSync(files.a11y, JSON.stringify(a11ySnapshot, null, 2) + '\n')

    const axeResults = await new AxeBuilder({ page }).analyze()
    fs.writeFileSync(files.axe, JSON.stringify(axeResults.violations, null, 2) + '\n')

    recordManifest({
      route: cell.route,
      state: cell.state,
      viewport,
      url: cell.urlPath,
      status: 'captured',
      files,
      axeViolations: axeResults.violations.length,
    })
  } catch (error) {
    recordManifest({
      route: cell.route,
      state: cell.state,
      viewport,
      url: cell.urlPath,
      status: 'failed',
      reason: error instanceof Error ? error.message.split('\n')[0] : String(error),
    })
    throw error
  }
}

test.describe('harvest público (sem sessão)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const cell of PUBLIC_CELLS) {
    test(`${cell.route} / ${cell.state}`, async ({ page }, testInfo) => {
      await captureCell(page, cell, testInfo)
    })
  }
})

test.describe('harvest autenticado (estados vazios)', () => {
  for (const cell of AUTH_CELLS) {
    test(`${cell.route} / ${cell.state}`, async ({ page }, testInfo) => {
      await captureCell(page, cell, testInfo)
    })
  }
})
