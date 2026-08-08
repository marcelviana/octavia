import { test, type Page, type TestInfo } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import path from 'node:path'
import { interceptSessionEndpoint } from './session-intercept'

/**
 * Harvester de capturas do UX assessment — Fase B2, execução "estados
 * populados" (conta de audit pós-seed: 60 conteúdos, 3 setlists).
 *
 * Mesma mecânica do harvest.spec.ts (B1): para cada célula rota × estado ×
 * viewport → goto + networkidle best-effort → screenshot full-page + a11y
 * snapshot + violações axe, com manifest incremental. Diferenças:
 *
 * - Saída em docs/ux/capture/populated/{rota}/… e manifest-populated.json
 *   (células de rota dinâmica levam content_id/setlist_id).
 * - IDs vêm de tests/ux-audit/.auth/discovery.json (gerado por
 *   scripts/ux-audit/discover.ts via GET /api/content e /api/setlists).
 * - Crash de app NÃO é failure do harvest: toda célula procura o texto do
 *   error boundary ("Something went wrong") e, se presente, registra
 *   app_crash: true no manifest — a célula conta como captured.
 *
 * Somente leitura contra prod. As interações além de goto são leitura de
 * UI: scroll, clique em card/aba/página de PDF, abrir dropdown de filtro,
 * abrir diálogo de edição (SEM salvar), toggles visuais do performance
 * mode (dark sheet/zoom — estado client-side, nenhum request de escrita).
 * Nenhum drag-and-drop, nenhum submit.
 */

const CAPTURE_DIR = 'docs/ux/capture/populated'
const MANIFEST_PATH = 'docs/ux/capture/manifest-populated.json'
const DISCOVERY_PATH = 'tests/ux-audit/.auth/discovery.json'

interface Discovery {
  content: {
    pdf1: { id: string; title: string }
    pdf12: { id: string; title: string }
    chords: { id: string; title: string }
    lyrics: { id: string; title: string }
    tab: { id: string; title: string }
    longTitle: { id: string; title: string; length: number }
    duplicates: Array<{ id: string; title: string; key: string | null; bpm: number | null }>
  }
  setlists: {
    solo: { id: string; name: string; songCount: number }
    show: { id: string; name: string; songCount: number }
    estresse: { id: string; name: string; songCount: number }
  }
  indices: {
    show_chords_index: number
    estresse_last_index: number
  }
  estresse_songs: Array<{ position: number; title: string | null }>
}

if (!fs.existsSync(DISCOVERY_PATH)) {
  throw new Error(
    `${DISCOVERY_PATH} não existe — rode antes: pnpm tsx scripts/ux-audit/discover.ts`
  )
}
const discovery: Discovery = JSON.parse(fs.readFileSync(DISCOVERY_PATH, 'utf-8'))

interface Cell {
  route: string
  state: string
  urlPath: string
  /** Anotação estática da célula (contexto do achado que ela evidencia). */
  note?: string
  content_id?: string
  setlist_id?: string
  /** default true — células de dialog/scroll usam viewport screenshot. */
  fullPage?: boolean
  prepare?: (page: Page) => Promise<void>
  /** Verificação pós-captura; retorno vira anotação dinâmica no manifest. */
  inspect?: (page: Page) => Promise<string | null>
}

// ---------------------------------------------------------------------------
// Helpers de interação (todas leitura de UI)
// ---------------------------------------------------------------------------

async function settle(page: Page, ms = 1000): Promise<void> {
  await page.waitForTimeout(ms)
}

/** Aguarda o <canvas> do react-pdf (uma página por vez) renderizar. */
async function waitForPdfCanvas(page: Page): Promise<void> {
  await page
    .locator('canvas')
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
    .catch(() => {})
  await settle(page, 1500)
}

/**
 * Evidência de renderização de PDF: o achado do desktop (B2) é que o
 * canvas do react-pdf nunca aparece em /performance (área em branco),
 * embora o MESMO arquivo renderize em segundos em /content/[id].
 */
async function inspectPdfRendered(page: Page): Promise<string | null> {
  const canvases = await page.locator('canvas').count()
  return canvases > 0
    ? `pdf_render ok: ${canvases} canvas visível(is)`
    : 'pdf_render FALHOU: nenhum canvas após 60s — área de conteúdo em branco'
}

/** Scrolla o viewport interno do ScrollArea (Radix) da library até o fim. */
async function scrollLibraryListToBottom(page: Page): Promise<void> {
  await settle(page, 1500)
  await page
    .evaluate(() => {
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
      if (viewport) viewport.scrollTop = viewport.scrollHeight
    })
    .catch(() => {})
  await settle(page, 800)
}

/** Seleciona uma setlist clicando no card pelo nome (detalhe é inline). */
async function openSetlistDetail(page: Page, name: string): Promise<void> {
  await page.getByText(name, { exact: true }).first().click()
  await settle(page, 1500)
}

function performancePath(setlistId: string, index: number): string {
  return `/performance?setlistId=${setlistId}&startingSongIndex=${index}`
}

/**
 * Toda célula checa o error boundary: crash de app é achado documentado
 * (captured + anotação), nunca failure do harvest.
 */
async function detectAppCrash(page: Page): Promise<string | null> {
  const body = (await page.textContent('body').catch(() => '')) ?? ''
  if (/something went wrong/i.test(body)) {
    return 'app_crash: error boundary "Something went wrong" visível na página'
  }
  return null
}

// ---------------------------------------------------------------------------
// Matriz B2
// ---------------------------------------------------------------------------

const { content, setlists, indices } = discovery
const lastEstresseTitle =
  discovery.estresse_songs[indices.estresse_last_index]?.title ?? null

const CELLS: Cell[] = [
  // ---- dashboard -----------------------------------------------------------
  {
    route: 'dashboard',
    state: 'populated',
    urlPath: '/dashboard',
    note: 'Stats com 60 conteúdos/3 setlists; cards Recent (5) e Favorites preenchidos',
  },

  // ---- library --------------------------------------------------------------
  {
    route: 'library',
    state: 'populated-default',
    urlPath: '/library',
    note: 'Topo da lista de 60 (pageSize fixo 20 → 3 páginas; paginação clássica)',
  },
  {
    route: 'library',
    state: 'list-bottom-page3',
    urlPath: '/library?page=3',
    note: 'Fundo da lista de 60: última página + ScrollArea interno rolado até o fim',
    prepare: scrollLibraryListToBottom,
  },
  {
    route: 'library',
    state: 'search-aguas-duplicados',
    urlPath: `/library?search=${encodeURIComponent('Águas de Março')}`,
    note: 'Busca com resultado: deve trazer o par duplicado exato (mesmo título/artista/key)',
    inspect: async (page) => {
      const hits = await page.getByText('Águas de Março').count()
      return `ocorrências visíveis de "Águas de Março" na listagem: ${hits}`
    },
  },
  {
    route: 'library',
    state: 'search-artista',
    urlPath: `/library?search=${encodeURIComponent('Caetano Veloso')}`,
    note: 'Busca por artista (o ilike da API cobre title/artist/album)',
  },
  {
    route: 'library',
    state: 'filter-type-tab',
    urlPath: '/library',
    note:
      'Filtro por tipo ativo (Tab) — filtro NÃO é URL-addressável, só estado ' +
      'de cliente via dropdown Filters',
    prepare: async (page) => {
      await settle(page, 1500)
      await page.locator('button:has(.lucide-filter)').first().click()
      await page.locator('[role="menu"]').getByText('Tab', { exact: true }).click()
      await settle(page, 800)
      await page.keyboard.press('Escape')
      await settle(page, 800)
    },
  },
  {
    route: 'library',
    state: 'long-titles-listing',
    urlPath: '/library?search=viol',
    note:
      'Como a listagem trata os títulos de 186/183 chars ("viol" casa violeiro/violão ' +
      'apenas nos dois títulos longos do seed)',
  },

  // ---- content/[id] ----------------------------------------------------------
  {
    route: 'content',
    state: 'pdf-1pagina',
    urlPath: `/content/${content.pdf1.id}`,
    content_id: content.pdf1.id,
    prepare: waitForPdfCanvas,
    inspect: inspectPdfRendered,
  },
  {
    route: 'content',
    state: 'pdf-12paginas-p1',
    urlPath: `/content/${content.pdf12.id}`,
    content_id: content.pdf12.id,
    note: 'react-pdf renderiza UMA página por vez; navegação só por chevrons sem aria-label',
    prepare: waitForPdfCanvas,
    inspect: inspectPdfRendered,
  },
  {
    route: 'content',
    state: 'pdf-12paginas-p6',
    urlPath: `/content/${content.pdf12.id}`,
    content_id: content.pdf12.id,
    note: 'Página ~6 de 12 — alcançada com 5 cliques no chevron (não há campo de página)',
    prepare: async (page) => {
      await waitForPdfCanvas(page)
      const pager = page.locator('span', { hasText: /Page \d+ \/ \d+/ }).first()
      const next = pager.locator('xpath=following-sibling::button[1]')
      for (let i = 0; i < 5; i++) {
        await next.click()
        await page.waitForTimeout(700)
      }
      await settle(page, 1500)
    },
    inspect: async (page) => {
      const label = await page
        .locator('span', { hasText: /Page \d+ \/ \d+/ })
        .first()
        .textContent()
        .catch(() => null)
      return label ? `indicador de página após 5 cliques: "${label.trim()}"` : null
    },
  },
  {
    route: 'content',
    state: 'cifra',
    urlPath: `/content/${content.chords.id}`,
    content_id: content.chords.id,
  },
  {
    route: 'content',
    state: 'letra',
    urlPath: `/content/${content.lyrics.id}`,
    content_id: content.lyrics.id,
  },
  {
    route: 'content',
    state: 'tablatura',
    urlPath: `/content/${content.tab.id}`,
    content_id: content.tab.id,
  },
  {
    route: 'content',
    state: 'titulo-186-chars',
    urlPath: `/content/${content.longTitle.id}`,
    content_id: content.longTitle.id,
    note: `Título com ${content.longTitle.length} chars — sem breadcrumb; h1 direto no header`,
  },
  {
    route: 'content',
    state: 'duplicado-a',
    urlPath: `/content/${content.duplicates[0].id}`,
    content_id: content.duplicates[0].id,
    note: 'Duplicado exato 1/2 de "Águas de Março" — a tela diferencia qual é qual?',
  },
  {
    route: 'content',
    state: 'duplicado-b',
    urlPath: `/content/${content.duplicates[1].id}`,
    content_id: content.duplicates[1].id,
    note: 'Duplicado exato 2/2 — comparar com duplicado-a: nada além do id na URL difere',
  },

  // ---- setlists ---------------------------------------------------------------
  {
    route: 'setlists',
    state: 'populated-list',
    urlPath: '/setlists',
    note: 'Listagem com as 3 setlists (Solo/1, Show padrão/8, Estresse/60)',
  },
  {
    route: 'setlists',
    state: 'detail-solo',
    urlPath: '/setlists',
    setlist_id: setlists.solo.id,
    note: 'Detalhe inline (não existe rota /setlists/[id]); setlist de 1 música',
    prepare: async (page) => openSetlistDetail(page, setlists.solo.name),
  },
  {
    route: 'setlists',
    state: 'detail-show-padrao',
    urlPath: '/setlists',
    setlist_id: setlists.show.id,
    note:
      'Verificação explícita venue/data/notes: seed enviou venue="Bar do Zé — Pelourinho", ' +
      'date=2026-09-12, notes="Chegar 19h…" — schema Zod da API descartou tudo (colunas inatingíveis)',
    prepare: async (page) => openSetlistDetail(page, setlists.show.name),
    inspect: async (page) => {
      const body = (await page.textContent('body').catch(() => '')) ?? ''
      const evidence = [
        ['venue "Bar do Zé"', /Bar do Zé/i.test(body)],
        ['venue "Pelourinho"', /Pelourinho/i.test(body)],
        ['performance_date (2026 / 9/12)', /09\/12|12\/09|Sep.*2026|set.*2026/i.test(body)],
        ['notes "Chegar 19h"', /Chegar 19h|passagem de som/i.test(body)],
      ] as const
      const found = evidence.filter(([, hit]) => hit).map(([label]) => label)
      return found.length === 0
        ? 'CONFIRMADO: nenhum venue/performance_date/notes do seed visível na UI de detalhe'
        : `INESPERADO: encontrado na UI: ${found.join(', ')}`
    },
  },
  {
    route: 'setlists',
    state: 'detail-estresse-top',
    urlPath: '/setlists',
    setlist_id: setlists.estresse.id,
    fullPage: false,
    note: 'Topo da lista de 60 músicas (lista cresce a página, sem virtualização)',
    prepare: async (page) => openSetlistDetail(page, setlists.estresse.name),
  },
  {
    route: 'setlists',
    state: 'detail-estresse-bottom',
    urlPath: '/setlists',
    setlist_id: setlists.estresse.id,
    fullPage: false,
    note: 'Fundo da lista de 60 músicas (última música visível)',
    prepare: async (page) => {
      await openSetlistDetail(page, setlists.estresse.name)
      if (lastEstresseTitle) {
        await page
          .getByText(lastEstresseTitle, { exact: false })
          .last()
          .scrollIntoViewIfNeeded()
          .catch(() => {})
      } else {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      }
      await settle(page, 800)
    },
  },
  {
    route: 'setlists',
    state: 'detail-estresse-full',
    urlPath: '/setlists',
    setlist_id: setlists.estresse.id,
    note: 'Página inteira do detalhe com 60 músicas (full-page; mostra o comprimento total)',
    prepare: async (page) => openSetlistDetail(page, setlists.estresse.name),
  },
  {
    route: 'setlists',
    state: 'edit-dialog-show-padrao',
    urlPath: '/setlists',
    setlist_id: setlists.show.id,
    fullPage: false,
    note:
      'UI de edição ABERTA (leitura; nada salvo). Reorder não tem modo próprio: é ' +
      'drag-and-drop nativo sempre ativo e o callback é um TODO (console.log) — não arrastado. ' +
      'O diálogo expõe campos que a API descarta (evidência das colunas inatingíveis).',
    prepare: async (page) => {
      await openSetlistDetail(page, setlists.show.name)
      await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
      await settle(page, 1200)
    },
  },

  // ---- performance ---------------------------------------------------------------
  {
    route: 'performance',
    state: 'setlist-show-primeira-musica',
    urlPath: performancePath(setlists.show.id, 0),
    setlist_id: setlists.show.id,
    note:
      'Entrada via setlist Show padrão, 1ª música (que é o PDF de 12 páginas — ' +
      'também cobre "música com PDF" via setlist)',
    prepare: waitForPdfCanvas,
    inspect: inspectPdfRendered,
  },
  {
    route: 'performance',
    state: 'setlist-show-cifra',
    urlPath: performancePath(setlists.show.id, indices.show_chords_index),
    setlist_id: setlists.show.id,
    note: `Música com cifra (índice ${indices.show_chords_index} da Show padrão)`,
  },
  {
    route: 'performance',
    state: 'pdf-12paginas-avulso',
    urlPath: `/performance?contentId=${content.pdf12.id}`,
    content_id: content.pdf12.id,
    note: 'PDF de 12 páginas via ?contentId= (caminho de conteúdo avulso)',
    prepare: waitForPdfCanvas,
    inspect: inspectPdfRendered,
  },
  {
    route: 'performance',
    state: 'controles-apos-10s-idle',
    urlPath: performancePath(setlists.show.id, indices.show_chords_index),
    setlist_id: setlists.show.id,
    fullPage: false,
    note:
      'Controles visíveis vs. ocultos: NÃO existe auto-hide implementado (showControls ' +
      'nunca vira false; handleMouseMove órfão) — captura após 10s sem interação como evidência',
    prepare: async (page) => {
      await page.waitForTimeout(10_000)
    },
  },
  {
    route: 'performance',
    state: 'dark-sheet',
    urlPath: performancePath(setlists.show.id, indices.show_chords_index),
    setlist_id: setlists.show.id,
    note: 'Dark sheet ativo (toggle client-side, sem escrita)',
    prepare: async (page) => {
      await settle(page, 1500)
      await page.locator('[data-testid="dark-mode-toggle"]').click()
      await settle(page, 800)
    },
  },
  {
    route: 'performance',
    state: 'zoom-maximo',
    urlPath: performancePath(setlists.show.id, indices.show_chords_index),
    setlist_id: setlists.show.id,
    note: 'Zoom máximo (10 cliques em "Zoom in": 100% → teto de 200%)',
    prepare: async (page) => {
      await settle(page, 1500)
      const zoomIn = page.getByLabel('Zoom in')
      for (let i = 0; i < 10; i++) {
        await zoomIn.click()
        await page.waitForTimeout(150)
      }
      await settle(page, 800)
    },
  },
  {
    route: 'performance',
    state: 'setlist-estresse-ultima-musica',
    urlPath: performancePath(setlists.estresse.id, indices.estresse_last_index),
    setlist_id: setlists.estresse.id,
    note: `Última música (${indices.estresse_last_index + 1}/60) — estado de fim de setlist`,
  },
]

// ---------------------------------------------------------------------------
// Captura + manifest (mesmo formato do B1 + content_id/setlist_id/notes)
// ---------------------------------------------------------------------------

interface ManifestEntry {
  route: string
  state: string
  viewport: string
  url: string
  status: 'captured' | 'failed'
  reason?: string
  content_id?: string
  setlist_id?: string
  notes?: string[]
  files?: { screenshot: string; a11y: string; axe: string }
  axeViolations?: number
}

function recordManifest(entry: ManifestEntry): void {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
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
  const notes: string[] = cell.note ? [cell.note] : []

  // Diagnóstico por célula: erros de console/página e respostas não-2xx do
  // /api/proxy (caminho de arquivo do performance mode) viram notas.
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && consoleErrors.length < 5) {
      consoleErrors.push(msg.text().split('\n')[0].slice(0, 200))
    }
  })
  page.on('pageerror', (err) => {
    if (consoleErrors.length < 5) consoleErrors.push(`pageerror: ${err.message.slice(0, 200)}`)
  })
  const proxyFailures: string[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/proxy') && !res.ok() && proxyFailures.length < 5) {
      proxyFailures.push(`HTTP ${res.status()} em ${res.url().slice(0, 160)}`)
    }
  })

  try {
    fs.mkdirSync(dir, { recursive: true })

    await interceptSessionEndpoint(page)
    await page.goto(cell.urlPath, { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})

    if (/\/login/.test(page.url())) {
      throw new Error(`redirecionado para /login (sessão inválida?) em ${cell.urlPath}`)
    }

    if (cell.prepare) await cell.prepare(page)

    const crash = await detectAppCrash(page)
    if (crash) notes.push(crash)

    if (cell.inspect) {
      const dynamicNote = await cell.inspect(page)
      if (dynamicNote) notes.push(dynamicNote)
    }

    if (proxyFailures.length > 0) notes.push(`api_proxy: ${proxyFailures.join(' | ')}`)
    if (consoleErrors.length > 0) notes.push(`console_errors: ${consoleErrors.join(' | ')}`)

    await page.screenshot({ path: files.screenshot, fullPage: cell.fullPage !== false })

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
      ...(cell.content_id ? { content_id: cell.content_id } : {}),
      ...(cell.setlist_id ? { setlist_id: cell.setlist_id } : {}),
      ...(notes.length > 0 ? { notes } : {}),
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
      ...(cell.content_id ? { content_id: cell.content_id } : {}),
      ...(cell.setlist_id ? { setlist_id: cell.setlist_id } : {}),
      ...(notes.length > 0 ? { notes } : {}),
      reason: error instanceof Error ? error.message.split('\n')[0] : String(error),
    })
    throw error
  }
}

test.describe('harvest autenticado (estados populados — B2)', () => {
  for (const cell of CELLS) {
    test(`${cell.route} / ${cell.state}`, async ({ page }, testInfo) => {
      await captureCell(page, cell, testInfo)
    })
  }
})
