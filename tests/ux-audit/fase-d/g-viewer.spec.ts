import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoPerformance, gotoRoute, getBearer } from './recorder'

/**
 * Fase D — Grupo G: viewer e anotações / J2 (itens 31-34).
 * Escrita permitida no item 32 (anotação em content_data de item do seed).
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const CHORDS_ID: string = discovery.content.chords.id
const TAB_ID: string = discovery.content.tab.id

const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo G — viewer e anotações (J2)', () => {
  test('item-31: favoritar no viewer e recarregar (CONT-05)', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      31,
      'Favoritar no viewer, recarregar: a estrela volta ao estado anterior (CONT-05)?'
    )
    trackSessionPosts(page, 'item-31')

    const writes: string[] = []
    page.on('request', (req) => {
      if (/api\/content/.test(req.url()) && ['POST', 'PUT', 'PATCH'].includes(req.method())) {
        writes.push(`${req.method()} ${req.url().slice(0, 120)}`)
      }
    })

    if (!(await gotoRoute(page, `/content/${CHORDS_ID}`, rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    const star = page.locator('button:has(svg.lucide-star)').first()
    const stateOf = () =>
      star.evaluate((btn) => ({
        preenchida: !!btn.querySelector('svg.fill-current'),
        classe: btn.className.includes('text-yellow-500') ? 'amarela' : 'cinza',
      }))
    rec.measure('estrela_antes', await stateOf())
    await rec.tap('tap: estrela (favoritar)', async () => star.click())
    await page.waitForTimeout(1500)
    rec.measure('estrela_apos_tap', await stateOf())
    rec.measure('requests_de_escrita_disparados', writes)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await settle(page, 2000)
    rec.measure('estrela_apos_reload', await stateOf())
    rec.note(
      writes.length === 0
        ? 'Nenhum request de escrita ao favoritar — o estado é só client-side (CONT-05 confirmado se reverter no reload)'
        : `Foram disparados ${writes.length} request(s) de escrita ao favoritar`
    )
    rec.save(testInfo)
  })

  test('item-32: do viewer ao canvas de anotação; anotação salva é invisível?', async ({ page }, testInfo) => {
    test.setTimeout(5 * 60 * 1000)
    const rec = new ItemRecorder(
      32,
      'Partindo do viewer, criar uma anotação: quantos taps até o canvas do editor? Após salvar, confirmar que ela não aparece nem no viewer nem no modo performance (CONT-03/04).'
    )
    trackSessionPosts(page, 'item-32')

    if (!(await gotoRoute(page, `/content/${CHORDS_ID}`, rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    // O viewer tem botão Edit? (CONT-04: UI aponta botão inexistente)
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .map((b) => b.getAttribute('aria-label') || b.textContent?.trim() || '(icon-only sem nome)')
        .filter((t) => t.length > 0)
        .slice(0, 25)
    )
    rec.measure('botoes_do_viewer', buttons)
    const editBtn = page.getByRole('button', { name: /edit/i }).first()
    const hasEdit = await editBtn.isVisible().catch(() => false)
    rec.measure('viewer_tem_botao_edit', hasEdit)

    if (hasEdit) {
      await rec.tap('tap: Edit no viewer', async () => editBtn.click())
    } else {
      rec.note('Sem botão Edit no viewer (CONT-04) — indo por URL direta /content/[id]/edit (caminho que o usuário não descobre pela UI)')
      if (!(await gotoRoute(page, `/content/${CHORDS_ID}/edit`, rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    }
    await settle(page, 2500)
    rec.measure('url_editor', page.url())
    rec.measure('screenshot_editor', await shot(page, 'item-32-editor'))

    // Existe canvas de anotação no editor deste tipo (Chords)?
    const canvasCount = await page.locator('canvas').count()
    rec.measure('canvas_de_anotacao_presente', canvasCount)

    // Campo de anotação textual? Inventário do editor
    const editorFields = await page.evaluate(() =>
      Array.from(document.querySelectorAll('textarea, input, [role="tab"], button'))
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          label:
            el.getAttribute('aria-label') ||
            el.getAttribute('placeholder') ||
            el.textContent?.trim().slice(0, 40) ||
            '(sem nome)',
        }))
        .filter((f) => f.label !== '(sem nome)')
        .slice(0, 30)
    )
    rec.measure('campos_do_editor', editorFields)

    if (canvasCount === 0) {
      rec.note(
        'Editor de Chords NÃO expõe canvas de anotação (AnnotationTools só renderiza para Sheet sem arquivo reconhecido) — ' +
          'a anotação do J2 é inalcançável pela UI para cifra. CONT-03 confirmado por inacessibilidade.'
      )
      // Fallback: grava anotação direto em content_data (probe de round-trip),
      // p/ verificar se ALGUMA anotação persistida aparece no viewer/performance
      const bearer = await getBearer(page)
      const authHeaders = bearer ? { Authorization: `Bearer ${bearer}` } : {}
      const before = await page.request.get(`https://octavia.rocks/api/content/${CHORDS_ID}`, { headers: authHeaders })
      if (before.ok()) {
        const row = (await before.json()) as { content_data?: Record<string, unknown> }
        const newData = {
          ...(row.content_data ?? {}),
          annotations: [
            {
              id: 'ux-audit-fase-d',
              type: 'text',
              text: 'UX-AUDIT anotação Fase D — entrar mais suave aqui',
              x: 40,
              y: 40,
              color: '#FF0000',
            },
          ],
        }
        const put = await page.request.put(`https://octavia.rocks/api/content`, {
          headers: authHeaders,
          data: { id: CHORDS_ID, content_data: newData },
        })
        rec.measure('probe_put_annotation_status', put.status())
        if (put.ok()) {
          // Reabre viewer e performance: a anotação aparece?
          await page.goto(`/content/${CHORDS_ID}`, { waitUntil: 'domcontentloaded' })
          await settle(page, 2000)
          const viewerHasIt = await page
            .getByText('entrar mais suave aqui')
            .count()
          rec.measure('anotacao_visivel_no_viewer', viewerHasIt > 0)
          rec.measure('screenshot_viewer_pos_anotacao', await shot(page, 'item-32-viewer-pos-anotacao'))

          const enteredPerf = await gotoPerformance(page, `/performance?contentId=${CHORDS_ID}`, rec)
          await settle(page, 2000)
          const perfHasIt = enteredPerf ? await page.getByText('entrar mais suave aqui').count() : -1
          rec.measure('anotacao_visivel_no_performance', enteredPerf ? perfHasIt > 0 : 'inconclusivo (bounce)')
          rec.measure('screenshot_perf_pos_anotacao', await shot(page, 'item-32-performance-pos-anotacao'))
        }
      }
    } else {
      rec.note('Canvas presente — anotação via UI (contar taps manualmente no trace)')
    }
    rec.save(testInfo)
  })

  test('item-33: tab — overflow-x é descobrível/operável?', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      33,
      'Tab: o overflow-x-auto é descobrível/operável em touch? Há affordance de conteúdo cortado?'
    )
    trackSessionPosts(page, 'item-33')

    if (!(await gotoRoute(page, `/content/${TAB_ID}`, rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    const overflowInfo = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('pre, [class*="overflow-x"]'))
      return els.map((el) => {
        const s = getComputedStyle(el)
        return {
          tag: el.tagName.toLowerCase(),
          overflowX: s.overflowX,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          cortado: el.scrollWidth > el.clientWidth,
          scrollbarVisivel: s.overflowX === 'auto' || s.overflowX === 'scroll',
          sombra_ou_gradiente: /gradient|shadow/.test(s.background + s.boxShadow),
        }
      })
    })
    rec.measure('elementos_overflow_x', overflowInfo)
    rec.measure('screenshot_tab_viewer', await shot(page, 'item-33-tab-1194'))

    // Em 390px o corte é mais provável
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(1200)
    const overflowMobile = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('pre, [class*="overflow-x"]'))
      return els.map((el) => ({
        cortado: el.scrollWidth > el.clientWidth,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      }))
    })
    rec.measure('overflow_390px', overflowMobile)
    rec.measure('screenshot_tab_390', await shot(page, 'item-33-tab-390'))
    rec.note('Operabilidade do gesto horizontal em touch físico: MANUAL-CHECKLIST.')
    rec.save(testInfo)
  })

  test('item-34: viewer → Performance — latência até tela cheia', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      34,
      'Botão Performance do header do viewer: latência até tela cheia (mede J5→J1).'
    )
    trackSessionPosts(page, 'item-34')

    // Caminho real J5→J1: dashboard → busca → resultado → viewer → Performance
    if (!(await gotoRoute(page, '/dashboard', rec))) {
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    const search = page.getByPlaceholder('Search...').first()
    await search.click()
    await search.fill('Garota')
    await search.press('Enter')
    await page.waitForURL(/\/library\?search=/, { timeout: 20_000 })
    await settle(page, 2000)
    await page.getByText('Garota de Ipanema').first().click()
    await page.waitForURL(/\/content\//, { timeout: 20_000 }).catch(() => {})
    if (!/\/content\//.test(page.url())) {
      rec.note(`clicar no resultado não levou ao viewer (url: ${page.url()})`)
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2000)

    const perfBtn = page.locator('button:has(svg.lucide-play)').first()
    await rec.tap('tap: botão Performance', async () => {
      await perfBtn.click()
      await page.locator('[data-testid="exit-button"]').waitFor({ state: 'visible', timeout: 30_000 })
    })
    rec.measure('shell_visivel_ms', rec.elapsed())
    // Conteúdo renderizado
    const t = Date.now()
    await page
      .waitForFunction(() => {
        const el = document.querySelector('[data-testid="optimized-content-display"]')
        return !!el && ((el.textContent ?? '').trim().length > 20 || !!el.querySelector('iframe, canvas, img'))
      }, { timeout: 15_000 })
      .catch(() => rec.note('conteúdo não detectado em 15s'))
    rec.measure('conteudo_visivel_ms', rec.elapsed())
    rec.measure('overhead_conteudo_apos_shell_ms', Date.now() - t)
    rec.save(testInfo)
  })
})
