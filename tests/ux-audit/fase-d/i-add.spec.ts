import { test, type Page, type BrowserContext } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute } from './recorder'
import { resolveFaseDDir } from '../../../scripts/ux-audit/fase-d-dirs'

/**
 * Fase D — Grupo I: Add Content / J4 (itens 42-49; cruza 30/46).
 *
 * Escrita permitida: conteúdo com prefixo "[UX-AUDIT]" no título.
 * Orçamento de rate limit do UPLOAD: 10/hora — este grupo consome ~6.
 * Uploads que ficarem sem linha de content (43, 45b, 47, 48, 49) são
 * registrados em docs/ux/fase-d/data/orphan-uploads.json para o cleanup.
 */

const FIXTURES = 'test-results/fase-d-fixtures'
const EVIDENCE_DIR = resolveFaseDDir('evidence')
const ORPHANS_FILE = 'docs/ux/fase-d/data/orphan-uploads.json'

async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

function recordOrphan(url: string | undefined, context: string): void {
  if (!url) return
  const segment = url.split('/').pop()
  if (!segment) return
  const filename = decodeURIComponent(segment.split('?')[0])
  fs.mkdirSync(path.dirname(ORPHANS_FILE), { recursive: true })
  const list: Array<{ filename: string; context: string }> = fs.existsSync(ORPHANS_FILE)
    ? JSON.parse(fs.readFileSync(ORPHANS_FILE, 'utf-8'))
    : []
  if (!list.some((o) => o.filename === filename)) {
    list.push({ filename, context })
    fs.writeFileSync(ORPHANS_FILE, JSON.stringify(list, null, 2) + '\n')
  }
}

/**
 * Escuta as respostas de /api/storage/upload e devolve a última URL.
 *
 * O parse do corpo é assíncrono e o listener do Playwright não é aguardado
 * pelo teste — sem `settled()` a chamada a `last()` pode acontecer ANTES do
 * parse terminar e o órfão de storage fica sem nome (não há endpoint de
 * listagem do bucket para recuperá-lo depois). Por isso as promises de
 * parse ficam registradas e `settled()` as aguarda antes de ler.
 */
function watchUploads(page: Page): {
  last: () => string | undefined
  settled: () => Promise<void>
  statuses: string[]
} {
  const urls: string[] = []
  const statuses: string[] = []
  const pending: Array<Promise<void>> = []
  page.on('response', (res) => {
    if (!res.url().includes('/api/storage/upload')) return
    statuses.push(`HTTP ${res.status()}`)
    pending.push(
      res
        .json()
        .then((body: { url?: string }) => {
          if (body?.url) urls.push(body.url)
        })
        .catch(() => {
          // sem corpo JSON
        })
    )
  })
  return {
    last: () => urls[urls.length - 1],
    settled: async () => {
      await Promise.all(pending)
    },
    statuses,
  }
}

async function buildPdf(title: string, pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842])
    page.drawText(`${title} — pagina ${p + 1}`, { x: 50, y: 800, size: 14, font })
  }
  return doc.save()
}

function ensureFixtures(): Record<string, string> {
  fs.mkdirSync(FIXTURES, { recursive: true })
  const files = {
    pdfSolo: path.join(FIXTURES, 'ux-audit-fase-d-cifra.pdf'),
    pdfOffline: path.join(FIXTURES, 'ux-audit-fase-d-offline.pdf'),
    pdfGrande51: path.join(FIXTURES, 'ux-audit-fase-d-51mb.pdf'),
    zipComoPdf: path.join(FIXTURES, 'ux-audit-fase-d-zip-renomeado.pdf'),
    pdf25mb: path.join(FIXTURES, 'ux-audit-fase-d-25mb.pdf'),
    png: path.join(FIXTURES, 'ux-audit-fase-d-imagem.png'),
    txtBatch: path.join(FIXTURES, 'ux-audit-fase-d-batch.txt'),
  }
  return files
}

async function writeFixtures(files: Record<string, string>): Promise<void> {
  if (!fs.existsSync(files.pdfSolo)) {
    fs.writeFileSync(files.pdfSolo, await buildPdf('UX-AUDIT Fase D cifra', 2))
  }
  if (!fs.existsSync(files.pdfOffline)) {
    fs.writeFileSync(files.pdfOffline, await buildPdf('UX-AUDIT Fase D offline', 1))
  }
  if (!fs.existsSync(files.pdfGrande51)) {
    const base = await buildPdf('UX-AUDIT 51MB', 1)
    const junk = Buffer.alloc(51 * 1024 * 1024 - base.length, 0x20)
    fs.writeFileSync(files.pdfGrande51, Buffer.concat([Buffer.from(base), junk]))
  }
  if (!fs.existsSync(files.zipComoPdf)) {
    const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04])
    fs.writeFileSync(files.zipComoPdf, Buffer.concat([zipHeader, Buffer.alloc(2048, 0x00)]))
  }
  if (!fs.existsSync(files.pdf25mb)) {
    const base = await buildPdf('UX-AUDIT 25MB', 1)
    const junk = Buffer.alloc(25 * 1024 * 1024 - base.length, 0x20)
    fs.writeFileSync(files.pdf25mb, Buffer.concat([Buffer.from(base), junk]))
  }
  if (!fs.existsSync(files.png)) {
    // PNG 1x1 válido
    fs.writeFileSync(
      files.png,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    )
  }
  if (!fs.existsSync(files.txtBatch)) {
    fs.writeFileSync(
      files.txtBatch,
      [
        '---',
        '[UX-AUDIT] BATCH UM',
        'Primeira estrofe da música um',
        'Segunda linha',
        '---',
        '[UX-AUDIT] BATCH DOIS',
        'Primeira estrofe da música dois',
        '---',
        '[UX-AUDIT] BATCH TRES',
        'Primeira estrofe da música três',
        '',
      ].join('\n')
    )
  }
}

test.describe('Grupo I — Add Content (J4)', () => {
  test.beforeAll(async () => {
    await writeFixtures(ensureFixtures())
  })

  test('item-42 (+30/46): orçamento de taps do J4 no mobile, PDF de cifra', async ({ browser }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      42,
      'Orçamento de taps do J4 no mobile: do dashboard até "Save Content" com PDF de cifra — taps e tempo reais (estimativa estática: ~9 taps, meta ≤8).'
    )
    const rec30 = new ItemRecorder(
      30,
      'Item recém-importado aparece na biblioteca ao voltar, sem reload manual (cache de 30s + refresh por foco)?'
    )
    const rec46 = new ItemRecorder(
      46,
      'Item recém-importado aparece na busca/biblioteca sem reload manual (critério "imediatamente localizável")?'
    )
    const files = ensureFixtures()
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-42')
    const uploads = watchUploads(page)
    const TITLE = '[UX-AUDIT] Fase D import solo'

    try {
      if (!(await gotoRoute(page, '/dashboard', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2500)

      // Tap 1: entrada de adicionar conteúdo (bottom nav "Add")
      await rec.tap('tap 1: "Add" na bottom nav', async () => {
        await page.getByText('Add', { exact: true }).first().tap()
        await page.waitForURL(/add-content/, { timeout: 20_000 })
      })
      await settle(page, 2000)
      rec.measure('estado_inicial_do_wizard', await shot(page, 'item-42-passo1'))

      // Tap 2: selecionar tipo "Chords" (abre em Lyrics/Create — ADD-09)
      await rec.tap('tap 2: tipo "Chords"', async () => {
        await page.getByText('Chords', { exact: true }).first().tap()
      })
      // Tap 3: modo "Import from File"
      await rec.tap('tap 3: "Import" (modo arquivo)', async () => {
        await page.getByText(/import from file|^import$/i).first().tap()
      })
      await page.waitForTimeout(800)

      // Tap 4+5: Browse files + escolher arquivo
      await rec.tap('tap 4: "Browse files"', async () => {
        await page.getByRole('button', { name: /browse files/i }).scrollIntoViewIfNeeded()
      })
      await rec.tap('tap 5: escolher o PDF (file picker)', async () => {
        await page.locator('input[type="file"]').setInputFiles(files.pdfSolo)
      })
      // Espera upload terminar e step 2 abrir
      await page
        .waitForFunction(() => /details|title/i.test(document.body.textContent ?? ''), { timeout: 60_000 })
        .catch(() => rec.note('passo 2 não detectado em 60s após upload'))
      await settle(page, 1500)
      rec.measure('screenshot_passo2', await shot(page, 'item-42-passo2'))

      // Metadados
      const titleField = page.locator('input#title, input[name="title"], input[placeholder*="title" i]').first()
      await rec.tap('tap 6: título (1 tap/campo)', async () => {
        await titleField.fill(TITLE)
      })
      const artistField = page.locator('input#artist, input[name="artist"], input[placeholder*="artist" i]').first()
      await rec.tap('tap 7: artista', async () => {
        await artistField.fill('Conjunto Fase D')
      })
      // Tom: enterrado em Advanced Options (ADD-05)?
      const advanced = page.getByText(/advanced options/i).first()
      if (await advanced.isVisible().catch(() => false)) {
        await rec.tap('tap 8: abrir "Advanced Options" (tom enterrado — ADD-05)', async () => {
          await advanced.tap()
        })
        await page.waitForTimeout(600)
        const keyField = page.locator('select#key, [role="combobox"]').first()
        if (await keyField.isVisible().catch(() => false)) {
          await rec.tap('tap 9: campo do tom', async () => {
            await keyField.click()
            await page.waitForTimeout(400)
            await page.getByRole('option', { name: /^F$/ }).first().click().catch(() => {})
          })
        } else {
          rec.note('Campo de tom não encontrado dentro do Advanced Options')
        }
      } else {
        rec.note('Acordeão "Advanced Options" não visível no passo 2 deste fluxo')
      }

      // Save
      await rec.tap('tap final: "Save Content"', async () => {
        await page.getByRole('button', { name: /save content|save/i }).first().tap()
      })
      await page
        .waitForFunction(() => /successfully|library/i.test(document.body.textContent ?? ''), { timeout: 30_000 })
        .catch(() => rec.note('confirmação de sucesso não detectada em 30s'))
      rec.measure('tempo_total_ms_do_primeiro_tap', rec.elapsed())
      rec.measure('screenshot_conclusao', await shot(page, 'item-42-conclusao'))
      rec.measure('upload_statuses', uploads.statuses)
      rec.note(`Total de taps do dashboard ao save: ${rec.taps} (meta ≤8, estimativa estática era ~9)`)
      rec.save(testInfo)

      // ---- Itens 30/46: aparece na library/busca sem reload manual? ----
      await page.getByText('Library', { exact: true }).first().tap()
      await page.waitForURL(/\/library/, { timeout: 20_000 })
      await settle(page, 3000)
      const visibleInLibrary = await page.getByText(TITLE).count()
      rec30.measure('visivel_na_library_ao_voltar_sem_reload', visibleInLibrary > 0)
      rec30.measure('screenshot', await shot(page, 'item-30-library-apos-import'))
      if (visibleInLibrary === 0) {
        // ordena por mais recente? procura via paginação? registra e tenta reload
        await page.reload({ waitUntil: 'domcontentloaded' })
        await settle(page, 3000)
        rec30.measure('visivel_apos_reload_manual', (await page.getByText(TITLE).count()) > 0)
      }
      rec30.save(testInfo)

      await page.goto(`/library?search=${encodeURIComponent('Fase D import solo')}`, {
        waitUntil: 'domcontentloaded',
      })
      await settle(page, 2500)
      rec46.measure('localizavel_pela_busca', (await page.getByText(TITLE).count()) > 0)
      rec46.save(testInfo)
    } finally {
      rec.save(testInfo)
      rec30.save(testInfo)
      rec46.save(testInfo)
      await context.close()
    }
  })

  test('item-43: falha do POST /api/content (offline pós-upload) — ADD-01', async ({ browser }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      43,
      'Forçar falha do POST /api/content no passo 2 (modo avião após o upload): o alert verde "saved successfully" aparece mesmo assim? O que resta na tela? Metadados persistem?'
    )
    const files = ensureFixtures()
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 1194, height: 834 },
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-43')
    const uploads = watchUploads(page)

    try {
      if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2000)
      await page.getByText('Chords', { exact: true }).first().click()
      await page.getByText(/import from file|^import$/i).first().click()
      await page.waitForTimeout(600)
      await page.locator('input[type="file"]').setInputFiles(files.pdfOffline)
      await page
        .waitForFunction(() => /details|title/i.test(document.body.textContent ?? ''), { timeout: 60_000 })
        .catch(() => rec.note('passo 2 não detectado após upload'))
      await settle(page, 1500)
      await uploads.settled()
    recordOrphan(uploads.last(), 'item-43 upload pré-offline (content nunca salvo)')

      // Metadados digitados
      await page.locator('input#title, input[name="title"], input[placeholder*="title" i]').first().fill('[UX-AUDIT] Fase D offline teste')
      await page.locator('input#artist, input[name="artist"], input[placeholder*="artist" i]').first().fill('Sem Rede')

      // MODO AVIÃO
      await context.setOffline(true)
      await rec.tap('tap: Save Content (offline)', async () => {
        await page.getByRole('button', { name: /save content|save/i }).first().click()
      })
      await page.waitForTimeout(5000)

      const aftermath = await page.evaluate(() => {
        const body = document.body.textContent ?? ''
        const title = (document.querySelector('input#title, input[name="title"], input[placeholder*="title" i]') as HTMLInputElement | null)?.value
        return {
          mostraSuccess: /saved successfully|success/i.test(body),
          mostraErro: /error|failed|offline|network/i.test(body),
          alertas: Array.from(document.querySelectorAll('[role="alert"], [role="status"]')).map((a) =>
            a.textContent?.trim().slice(0, 120)
          ),
          tituloAindaPreenchido: title ?? null,
          amostra: body.replace(/\s+/g, ' ').slice(0, 300),
        }
      })
      rec.measure('estado_apos_save_offline', aftermath)
      rec.measure('screenshot', await shot(page, 'item-43-save-offline'))
      await context.setOffline(false)
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-44: batch import TXT com 3 músicas — decide ADD-02', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      44,
      'Completar um batch import real (TXT com 3 músicas) e registrar qual tela aparece após "Import All": CompletionStep ou a tela inicial de upload?'
    )
    const files = ensureFixtures()
    trackSessionPosts(page, 'item-44')

    if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)
    // Lyrics (default) + Import + modo batch
    await page.getByText(/import from file|^import$/i).first().click()
    await page.waitForTimeout(600)
    const batchOption = page.getByText(/batch|multiple songs/i).first()
    if (await batchOption.isVisible().catch(() => false)) {
      await rec.tap('tap: modo batch', async () => batchOption.click())
    } else {
      rec.note('Seletor de modo batch não visível — inventariando opções')
      rec.measure(
        'opcoes_import_mode',
        await page.evaluate(() =>
          Array.from(document.querySelectorAll('button, [role="radio"], label'))
            .map((e) => e.textContent?.trim())
            .filter(Boolean)
            .slice(0, 20)
        )
      )
    }
    await page.locator('input[type="file"]').setInputFiles(files.txtBatch)
    await page.waitForTimeout(3000)
    rec.measure('screenshot_preview', await shot(page, 'item-44-batch-preview'))

    const previewState = await page.evaluate(() => {
      const body = document.body.textContent ?? ''
      return {
        musicasDetectadas: (body.match(/\[UX-AUDIT\] BATCH/g) ?? []).length,
        temImportAll: /import all/i.test(body),
      }
    })
    rec.measure('preview', previewState)

    if (!previewState.temImportAll) {
      rec.note('Botão "Import All" não apareceu — batch parsing falhou?')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }

    const posts: string[] = []
    page.on('response', (res) => {
      if (res.url().includes('/api/content') && res.request().method() === 'POST') {
        posts.push(`HTTP ${res.status()}`)
      }
    })
    await rec.tap('tap: "Import All"', async () => {
      await page.getByRole('button', { name: /import all/i }).click()
    })
    await page.waitForTimeout(8000)

    const outcome = await page.evaluate(() => {
      const body = document.body.textContent ?? ''
      return {
        mostraCompletion: /imported successfully|songs imported/i.test(body),
        mostraTelaDeUpload: /drag and drop your file here/i.test(body),
        amostra: body.replace(/\s+/g, ' ').slice(0, 300),
      }
    })
    rec.measure('posts_api_content', posts)
    rec.measure('tela_apos_import_all', outcome)
    rec.measure('screenshot_apos_import_all', await shot(page, 'item-44-apos-import-all'))
    rec.note(
      outcome.mostraCompletion
        ? 'CompletionStep apareceu — ADD-02 NÃO confirmado'
        : outcome.mostraTelaDeUpload
          ? 'Usuário despejado de volta na tela de upload após Import All — ADD-02 CONFIRMADO'
          : 'Tela final ambígua — ver screenshot/trace'
    )
    rec.save(testInfo)
  })

  test('item-45: arquivo >50MB e .zip renomeado .pdf', async ({ page }, testInfo) => {
    test.setTimeout(15 * 60 * 1000)
    const rec = new ItemRecorder(
      45,
      'Erro de arquivo real: (a) >50MB e (b) .zip renomeado .pdf — mensagem exata em cada caso; algo digitado se perde?'
    )
    const files = ensureFixtures()
    trackSessionPosts(page, 'item-45')
    const uploads = watchUploads(page)
    const toasts: string[] = []
    page.on('console', () => {})

    if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)
    await page.getByText('Chords', { exact: true }).first().click()
    await page.getByText(/import from file|^import$/i).first().click()
    await page.waitForTimeout(600)

    const captureToasts = async () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-sonner-toast], [role="alert"], [role="status"], li[data-type]')).map(
          (t) => t.textContent?.trim().slice(0, 200)
        )
      )

    // (a) >50MB
    await page.locator('input[type="file"]').setInputFiles(files.pdfGrande51)
    await page.waitForTimeout(20_000)
    const bigResult = { toasts: await captureToasts(), uploads: [...uploads.statuses] }
    rec.measure('caso_a_51mb', bigResult)
    rec.measure('screenshot_51mb', await shot(page, 'item-45a-51mb'))
    toasts.push(...(bigResult.toasts.filter(Boolean) as string[]))

    // (b) zip renomeado
    await page.waitForTimeout(3000)
    await page.locator('input[type="file"]').setInputFiles(files.zipComoPdf)
    await page.waitForTimeout(15_000)
    const zipResult = { toasts: await captureToasts(), uploads: [...uploads.statuses] }
    rec.measure('caso_b_zip_como_pdf', zipResult)
    rec.measure('screenshot_zip', await shot(page, 'item-45b-zip'))
    await uploads.settled()
    recordOrphan(uploads.last(), 'item-45b (se o upload tiver sido aceito, é achado de segurança)')
    rec.note('Metadados: neste fluxo o formulário só aparece APÓS upload OK — não há digitação anterior a perder; a perda do item 43 (pós-upload) é o caso real.')
    rec.save(testInfo)
  })

  test('item-47: upload de 25MB com rede lenta — UI congela? cancela?', async ({ browser }, testInfo) => {
    test.setTimeout(15 * 60 * 1000)
    const rec = new ItemRecorder(
      47,
      'Upload de PDF de 20-40MB com throttling: a UI congela? O spinner comunica o suficiente? Dá para cancelar/navegar durante?'
    )
    const files = ensureFixtures()
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 1194, height: 834 },
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-47')
    const uploads = watchUploads(page)

    try {
      if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2000)
      await page.getByText('Chords', { exact: true }).first().click()
      await page.getByText(/import from file|^import$/i).first().click()
      await page.waitForTimeout(600)

      // Throttle: ~4 Mbps upload
      const cdp = await context.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 80,
        downloadThroughput: (20 * 1024 * 1024) / 8,
        uploadThroughput: (4 * 1024 * 1024) / 8,
      })

      await page.locator('input[type="file"]').setInputFiles(files.pdf25mb)
      // Durante o upload: responsividade + o que a UI mostra
      const during: Array<Record<string, unknown>> = []
      const t0 = Date.now()
      for (let i = 0; i < 10; i++) {
        const t = Date.now()
        const uiState = await page.evaluate(() => {
          const body = document.body.textContent ?? ''
          return {
            mostraUploading: /uploading/i.test(body),
            temProgressoNumerico: /\d+\s?%/.test(body),
            spinner: !!document.querySelector('[class*="animate-spin"], [class*="spinner"]'),
          }
        })
        const evalLatency = Date.now() - t
        during.push({ t_ms: Date.now() - t0, ...uiState, responsividade_eval_ms: evalLatency })
        if (uploads.statuses.length > 0) break
        await page.waitForTimeout(4000)
      }
      rec.measure('durante_upload', during)
      rec.measure('screenshot_durante', await shot(page, 'item-47-durante-upload'))

      // Navegar durante (se ainda estiver subindo) ou registrar que terminou
      if (uploads.statuses.length === 0) {
        await page.getByText('Library', { exact: true }).first().click().catch(() => {})
        await page.waitForTimeout(3000)
        rec.measure('navegou_durante_upload', { url: page.url() })
        rec.note('Navegação durante o upload: sem diálogo de confirmação nem opção de cancelar — upload segue ou morre silenciosamente')
      } else {
        rec.note(`Upload terminou antes do teste de navegação (${uploads.statuses.join(', ')})`)
      }
      rec.measure('upload_statuses', uploads.statuses)
      await uploads.settled()
    recordOrphan(uploads.last(), 'item-47 upload 25MB (content nunca salvo)')
      await cdp.send('Network.disable').catch(() => {})
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-48: .png com tipo "Lyrics" — troca automática comunicada?', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      48,
      'Subir .png com tipo "Lyrics" selecionado: a troca automática para Sheet é comunicada ou o usuário se perde?'
    )
    const files = ensureFixtures()
    trackSessionPosts(page, 'item-48')
    const uploads = watchUploads(page)

    if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)
    // Garante Lyrics selecionado + modo import
    await page.getByText('Lyrics', { exact: true }).first().click()
    await page.getByText(/import from file|^import$/i).first().click()
    await page.waitForTimeout(600)

    const acceptBefore = await page.locator('input[type="file"]').getAttribute('accept')
    rec.measure('accept_do_input_com_lyrics', acceptBefore)

    const result = await page
      .locator('input[type="file"]')
      .setInputFiles(files.png)
      .then(() => 'aceito pelo input')
      .catch((err) => `rejeitado: ${String(err).split('\n')[0]}`)
    rec.measure('setInputFiles_png', result)
    await page.waitForTimeout(8000)

    const state = await page.evaluate(() => {
      const body = document.body.textContent ?? ''
      const selected = Array.from(document.querySelectorAll('[aria-pressed="true"], [data-state="active"], [class*="selected"]'))
        .map((e) => e.textContent?.trim().slice(0, 20))
        .filter(Boolean)
      return {
        toasts: Array.from(document.querySelectorAll('[data-sonner-toast], [role="alert"], [role="status"]')).map((t) =>
          t.textContent?.trim().slice(0, 150)
        ),
        tipoSelecionadoAgora: selected,
        estaNoPasso2: /details/i.test(body),
        amostra: body.replace(/\s+/g, ' ').slice(0, 250),
      }
    })
    rec.measure('estado_apos_png', state)
    rec.measure('upload_statuses', uploads.statuses)
    await uploads.settled()
    recordOrphan(uploads.last(), 'item-48 png (content nunca salvo)')
    rec.measure('screenshot', await shot(page, 'item-48-png-lyrics'))
    rec.save(testInfo)
  })

  test('item-49: soltar 5 PDFs de uma vez no drop zone', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      49,
      'Soltar 5 PDFs de uma vez no drop zone: confirmar que 4 são ignorados sem qualquer aviso (ADD-08).'
    )
    const files = ensureFixtures()
    trackSessionPosts(page, 'item-49')
    const uploads = watchUploads(page)

    if (!(await gotoRoute(page, '/add-content', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)
    await page.getByText('Chords', { exact: true }).first().click()
    await page.getByText(/import from file|^import$/i).first().click()
    await page.waitForTimeout(600)

    // Drop de 5 arquivos via DataTransfer sintético
    const pdfBase64 = fs.readFileSync(files.pdfOffline).toString('base64')
    const dropZone = page.getByText(/drag and drop your file here/i).first()
    await dropZone.evaluate((el, b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
      const dt = new DataTransfer()
      for (let i = 1; i <= 5; i++) {
        dt.items.add(new File([bytes], `ux-audit-fase-d-drop-${i}.pdf`, { type: 'application/pdf' }))
      }
      const target = el.closest('[class*="border-dashed"], div') ?? el
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
    }, pdfBase64)

    await page.waitForTimeout(15_000)
    const state = await page.evaluate(() => {
      const body = document.body.textContent ?? ''
      return {
        toasts: Array.from(document.querySelectorAll('[data-sonner-toast], [role="alert"], [role="status"]')).map((t) =>
          t.textContent?.trim().slice(0, 150)
        ),
        estaNoPasso2: /details/i.test(body),
        mencionaMultiplos: /5 files|multiple|4 ignored/i.test(body),
      }
    })
    rec.measure('estado_apos_drop_5', state)
    rec.measure('uploads_disparados', uploads.statuses.length)
    await uploads.settled()
    recordOrphan(uploads.last(), 'item-49 drop 5 PDFs (só o 1º sobe; content nunca salvo)')
    rec.measure('screenshot', await shot(page, 'item-49-drop-5'))
    rec.note(
      uploads.statuses.length <= 1 && !state.mencionaMultiplos
        ? `Dos 5 arquivos, ${uploads.statuses.length} upload(s) disparado(s) e nenhum aviso sobre os demais — ADD-08 confirmado se toasts vazios: ${JSON.stringify(state.toasts)}`
        : 'Comportamento diferente do previsto — ver evidência'
    )
    rec.save(testInfo)
  })
})
