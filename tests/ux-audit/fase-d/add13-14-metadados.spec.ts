import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { getBearer, settle } from './recorder'

/**
 * PR-3 (fila A #3 e #4) — regressão de ADD-13 (metadados descartados) e
 * ADD-14 (double-submit).
 *
 * CENÁRIO TESTADO, declarado: **duplicata por clique, ONLINE**. Um save
 * disparado duas vezes em sequência rápida deve produzir **uma única linha**,
 * e os metadados digitados devem ser os persistidos (não o filename).
 *
 * CENÁRIO **FORA** DESTE SPEC: a duplicata por **replay da fila offline**
 * (`enqueueRequest` em lib/content-service.ts) — quando o POST chega ao
 * servidor mas a resposta se perde, o reprocessamento cria uma segunda linha.
 * Nenhuma guarda de UI cobre isso; é problema de idempotência do
 * `POST /api/content` — item **B9** do docs/ux/PLANO-TRANSICAO.md. Este spec
 * verde NÃO significa que o caso medido no item 43 (offline) está resolvido.
 */

const FIXTURES = 'test-results/fase-d-fixtures'
const TITULO = `[UX-AUDIT] PR3 metadados ${Date.now()}`
const ARTISTA = 'Conjunto PR-3'
const KEY = 'F'
const BPM = 120

async function pdfFixture(): Promise<string> {
  fs.mkdirSync(FIXTURES, { recursive: true })
  const file = path.join(FIXTURES, 'ux-audit-pr3-cifra.pdf')
  if (!fs.existsSync(file)) {
    // PDF real (pdf-lib), como nos fixtures do i-add.spec.ts: um PDF
    // artesanal não passa pelo fluxo de upload.
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const page = doc.addPage([595, 842])
    page.drawText('UX-AUDIT PR-3 cifra', { x: 50, y: 800, size: 14, font })
    fs.writeFileSync(file, await doc.save())
  }
  return file
}

async function contarPorTitulo(page: Page, auth: Record<string, string>, titulo: string) {
  const res = await page.request.get(`/api/content?search=${encodeURIComponent('PR3 metadados')}`, {
    headers: auth,
  })
  const body = await res.json()
  const items = Array.isArray(body) ? body : (body.data ?? body.content ?? [])
  return items.filter((c: { title?: string }) => c.title === titulo)
}

test('ADD-13 + ADD-14: metadados persistidos e double-click online cria 1 linha', async ({ page }) => {
  test.setTimeout(6 * 60 * 1000)

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await settle(page, 1500)
  const token = await getBearer(page)
  expect(token, 'accessToken disponível').toBeTruthy()
  const auth = { Authorization: `Bearer ${token}` }

  const criados: string[] = []
  try {
    await page.goto('/add-content', { waitUntil: 'domcontentloaded' })
    await settle(page, 2000)

    await page.getByText('Chords', { exact: true }).first().click()
    await page.getByText(/import from file|^import$/i).first().click()
    await page.waitForTimeout(800)
    await page.locator('input[type="file"]').setInputFiles(await pdfFixture())
    // O StepIndicator já mostra "Add Details" no passo 1 — esperar por esse
    // texto casa imediatamente. Espera o campo de título de verdade.
    await page
      .locator('input#title, input[name="title"], input[placeholder*="title" i]')
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 })
    await settle(page, 1500)

    await page.locator('input#title, input[name="title"], input[placeholder*="title" i]').first().fill(TITULO)
    await page.locator('input#artist, input[name="artist"], input[placeholder*="artist" i]').first().fill(ARTISTA)

    // Campos avançados: são os que o item 42 mediu como PERDIDOS (key/bpm).
    // Sem preenchê-los, o read-back não prova nada sobre o strip do schema.
    const advanced = page.getByText(/advanced options/i).first()
    if (await advanced.isVisible().catch(() => false)) {
      await advanced.click()
      await page.waitForTimeout(600)
      const keyTrigger = page.locator('[role="combobox"]').first()
      if (await keyTrigger.isVisible().catch(() => false)) {
        await keyTrigger.click()
        await page.waitForTimeout(400)
        await page.getByRole('option', { name: new RegExp(`^${KEY}$`) }).first().click().catch(() => {})
      }
      await page.locator('input#bpm').fill(String(BPM)).catch(() => {})
    }

    // --- ADD-14: dois cliques em sequência rápida ---
    const save = page.getByRole('button', { name: /save content/i }).first()
    await save.click()
    const segundoCliqueBloqueado = await save
      .click({ timeout: 2000 })
      .then(() => false)
      .catch(() => true)
    console.log(
      `[PR-3] segundo clique bloqueado pela UI (botão desabilitado): ${segundoCliqueBloqueado}` +
        ' — se false, a guarda de in-flight é quem precisa segurar'
    )

    await page
      .waitForFunction(() => /successfully|library/i.test(document.body.textContent ?? ''), { timeout: 30_000 })
      .catch(() => {})
    await settle(page, 3000)

    // --- Asserts ---
    const linhas = await contarPorTitulo(page, auth, TITULO)
    for (const c of linhas) criados.push(c.id)
    console.log(`[PR-3] linhas criadas com o título digitado: ${linhas.length}`)

    expect(linhas.length, 'ADD-14: double-click online cria exatamente 1 linha').toBe(1)

    const item = linhas[0]
    expect(item.title, 'ADD-13: título digitado persistido (não o filename)').toBe(TITULO)
    expect(item.artist, 'ADD-13: artista digitado persistido').toBe(ARTISTA)

    // Read-back dos campos avançados: prova que o schema do POST /api/content
    // NÃO stripa o que o branch de upload passou a enviar. key e bpm são
    // exatamente os que o item 42 mediu perdidos (key veio null).
    const readBack = await page.request.get(`/api/content/${item.id}`, { headers: auth })
    expect(readBack.ok(), 'GET do item recém-criado').toBe(true)
    const fresh = await readBack.json()
    const dado = fresh?.data ?? fresh?.content ?? fresh
    console.log(
      `[PR-3] read-back → key=${JSON.stringify(dado.key)} bpm=${JSON.stringify(dado.bpm)} ` +
        `title="${dado.title}" artist="${dado.artist}"`
    )
    expect(dado.key, 'ADD-13: tom persistido (item 42 media null)').toBe(KEY)
    expect(dado.bpm, 'ADD-13: bpm persistido como número').toBe(BPM)
  } finally {
    for (const id of criados) {
      await page.request.delete(`/api/content/${id}`, { headers: auth }).catch(() => {})
    }
  }
})
