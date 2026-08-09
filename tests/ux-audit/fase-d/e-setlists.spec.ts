import { test, type Page } from '@playwright/test'
import fs from 'node:fs'
import { ItemRecorder, trackSessionPosts, settle, gotoRoute, getBearer } from './recorder'

/**
 * Fase D — Grupo E: setlists / J3 (itens 16, 18-22; item 17 DIFERIDO).
 *
 * ESCRITA PERMITIDA APENAS na setlist "UX-AUDIT Fase D picker" (item 16;
 * nome SEM colchetes — o sanitizador strict zera nomes com [ ]). O probe do
 * item 21 usa essa mesma setlist. Item 17 (reorder): diferido — o handler
 * da UI é TODO (SET-03); não religar nesta fase.
 */

const discovery = JSON.parse(
  fs.readFileSync('tests/ux-audit/.auth/discovery.json', 'utf-8')
)
const ESTRESSE_NAME: string = discovery.setlists.estresse.name
const SHOW_NAME: string = discovery.setlists.show.name

const PICKER_SETLIST = 'UX-AUDIT Fase D picker'
const SONGS_TO_ADD = [
  'Garota de Ipanema',
  'Asa Branca',
  'Chega de Saudade',
  'Sampa',
  'Wave',
  'Romaria',
  'Andança',
  'Construção',
  'Anunciação',
  'Felicidade',
]

const EVIDENCE_DIR = 'docs/ux/fase-d/evidence'
async function shot(page: Page, name: string): Promise<string> {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
  const file = `${EVIDENCE_DIR}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  return file
}

test.describe('Grupo E — setlists (J3)', () => {
  test('item-16: criar setlist e adicionar 10 músicas pelo picker', async ({ page }, testInfo) => {
    test.setTimeout(10 * 60 * 1000)
    const rec = new ItemRecorder(
      16,
      'Adicionar 10 músicas pelo picker: quantos taps por música na prática (alvo ≤3, sem sair da tela)?'
    )
    trackSessionPosts(page, 'item-16')

    if (!(await gotoRoute(page, '/setlists', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await settle(page, 2500)

    // --- Criar a setlist (mede o "criar vazia ≤3 taps" do J3) ---
    const existing = await page.getByText(PICKER_SETLIST, { exact: true }).count()
    if (existing > 0) {
      rec.note('Setlist do picker já existia (re-execução) — pulando criação')
      await page.getByText(PICKER_SETLIST, { exact: true }).first().click()
      await settle(page, 1500)
    } else {
      await rec.tap('tap 1: botão de nova setlist', async () => {
        await page.getByRole('button', { name: /new setlist|create/i }).first().click()
        await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
      })
      await rec.tap('tap 2: digitar o nome (1 tap/campo)', async () => {
        await page.locator('#name').fill(PICKER_SETLIST)
      })
      await rec.tap('tap 3: confirmar criação', async () => {
        await page
          .getByRole('dialog')
          .getByRole('button', { name: /create/i })
          .click()
        await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15_000 })
      })
      rec.measure('criar_setlist_vazia', { taps: 3, ms: rec.elapsed() })
      await settle(page, 1500)

      // Nome persistido corretamente? (SET-02: sanitizador)
      const visible = await page.getByText(PICKER_SETLIST, { exact: true }).count()
      rec.measure('nome_persistido_visivel', visible > 0)
      if (visible > 0) {
        await page.getByText(PICKER_SETLIST, { exact: true }).first().click()
        await settle(page, 1500)
      } else {
        rec.note('Nome não apareceu na lista — sanitizador pode ter alterado; procurando card vazio')
      }
    }

    // Estado vazio da setlist recém-criada orienta o próximo passo?
    const emptyStateText = await page
      .locator('main')
      .textContent()
      .then((t) => (t ?? '').replace(/\s+/g, ' ').slice(0, 300))
    rec.measure('estado_apos_selecionar_setlist', emptyStateText)
    rec.measure('screenshot_estado_vazio', await shot(page, 'item-16-setlist-vazia'))

    // --- Adicionar 10 músicas pelo picker ---
    const tapsBefore = rec.taps
    const tAdd = Date.now()
    await rec.tap('tap: "Add Songs" (abre o picker)', async () => {
      await page.getByRole('button', { name: /add songs/i }).first().click()
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10_000 })
    })
    const dialog = page.getByRole('dialog')
    const search = dialog.getByPlaceholder(/search by title/i)

    for (const song of SONGS_TO_ADD) {
      await rec.tap(`buscar "${song}" (1 tap/campo)`, async () => {
        await search.fill(song)
        await page.waitForTimeout(350)
      })
      await rec.tap(`selecionar "${song}"`, async () => {
        await dialog
          .locator('div.cursor-pointer', { hasText: song })
          .first()
          .click()
      })
    }
    await rec.tap('tap: "Add 10 Songs"', async () => {
      await dialog.getByRole('button', { name: /add \d+ song/i }).click()
    })
    // Sucesso: dialog fecha e as músicas aparecem na lista
    const closed = await dialog
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .then(() => true)
      .catch(() => false)
    rec.measure('picker_fechou_apos_add', closed)
    await settle(page, 2000)
    const rowsAfter = await page.locator('main').getByText('[UX-AUDIT]').count()
    rec.measure('musicas_visiveis_no_detalhe', rowsAfter)

    const tapsAdding = rec.taps - tapsBefore
    rec.measure('adicionar_10_musicas', {
      taps_total: tapsAdding,
      taps_por_musica: tapsAdding / 10,
      ms_total: Date.now() - tAdd,
      saiu_da_tela_da_setlist: false,
    })
    rec.measure('screenshot_final', await shot(page, 'item-16-setlist-10-musicas'))
    rec.note(
      `Picker é multi-select num dialog: ${tapsAdding} taps para 10 músicas ` +
        `(1 abrir + 10×(busca+seleção) + 1 confirmar) = ${(tapsAdding / 10).toFixed(1)} taps/música, sem sair da tela.`
    )
    rec.save(testInfo)
  })

  test('item-21: probe da constraint (setlist_id, position) no banco vivo', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      21,
      'A unique (setlist_id, content_id) já está confirmada. (setlist_id, position) também existe no banco vivo? (Muda o risco do reorder / SET-07.)'
    )
    trackSessionPosts(page, 'item-21')

    // Descobre a setlist do picker e uma música que ainda não está nela
    await gotoRoute(page, '/dashboard', rec)
    const bearer = await getBearer(page)
    const authHeaders = bearer ? { Authorization: `Bearer ${bearer}` } : {}
    const setlistsRes = await page.request.get('https://octavia.rocks/api/setlists', { headers: authHeaders })
    if (!setlistsRes.ok()) {
      rec.note(`GET /api/setlists respondeu HTTP ${setlistsRes.status()} — probe adiado (lockout?)`)
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    const setlists = (await setlistsRes.json()) as Array<{ id: string; name: string; setlist_songs: Array<{ position: number; content_id: string }> }>
    const picker = setlists.find((s) => s.name === PICKER_SETLIST)
    if (!picker) {
      rec.note('Setlist do picker não encontrada — rodar item 16 antes')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    const usedPositions = picker.setlist_songs.map((s) => s.position)
    const usedContent = new Set(picker.setlist_songs.map((s) => s.content_id))
    const dupPosition = usedPositions[0]

    const contentRes = await page.request.get('https://octavia.rocks/api/content?page=1&pageSize=100', { headers: authHeaders })
    const content = (await contentRes.json()) as { data: Array<{ id: string; title: string }> }
    const freeItem = content.data.find((c) => c.title.startsWith('[UX-AUDIT]') && !usedContent.has(c.id))
    if (!freeItem || dupPosition === undefined) {
      rec.note('Sem conteúdo livre ou sem posição para duplicar — probe abortado')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }

    // POST com position DUPLICADA na setlist do audit
    const res = await page.request.post(`https://octavia.rocks/api/setlists/${picker.id}/songs`, {
      headers: authHeaders,
      data: { content_id: freeItem.id, position: dupPosition },
    })
    const body = await res.text().catch(() => '')
    rec.measure('probe_post_position_duplicada', {
      setlist: PICKER_SETLIST,
      position_duplicada: dupPosition,
      status: res.status(),
      body: body.slice(0, 300),
    })
    rec.note(
      res.status() >= 500
        ? 'HTTP 5xx na posição duplicada → constraint (setlist_id, position) EXISTE no banco vivo (risco do reorder confirmado)'
        : res.ok()
          ? 'Posição duplicada ACEITA → constraint (setlist_id, position) NÃO existe no banco vivo'
          : `Resposta ${res.status()} — interpretar manualmente`
    )
    rec.save(testInfo)
  })

  test('item-18: touch emulado — hover-only, taps para remover, drag', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      18,
      'Em iPad simulado: o drag inicia com toque? Os ícones hover-only aparecem com um tap? Quantos taps até remover uma música?'
    )
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 1194, height: 834 },
      hasTouch: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-18')
    try {
      if (!(await gotoRoute(page, '/setlists', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2500)
      await page.getByText(PICKER_SETLIST, { exact: true }).first().tap()
      await settle(page, 1500)

      const row = page.locator('div[draggable="true"]').first()
      const rowVisible = await row.isVisible().catch(() => false)
      rec.measure('linha_draggable_encontrada', rowVisible)
      if (!rowVisible) {
        rec.note('Nenhuma linha draggable no detalhe — rodar item 16 antes')
        rec.set('inconclusiva')
        rec.save(testInfo)
        return
      }

      // Ícones hover-only aparecem com um tap na linha?
      const iconState = async () =>
        row.evaluate((el) => {
          const btns = Array.from(el.querySelectorAll('button'))
          return btns.map((b) => ({
            label: b.getAttribute('aria-label') || b.getAttribute('title') || '(sem nome)',
            opacity: getComputedStyle(b).opacity,
            w: Math.round(b.getBoundingClientRect().width),
            h: Math.round(b.getBoundingClientRect().height),
          }))
        })
      rec.measure('icones_antes_do_tap', await iconState())
      await rec.tap('tap na linha', async () => {
        await row.tap()
      })
      await page.waitForTimeout(600)
      rec.measure('icones_apos_tap', await iconState())
      rec.measure('url_apos_tap_na_linha', page.url())
      if (!/\/setlists/.test(page.url())) {
        rec.note('Tap na linha NAVEGOU para fora do detalhe — voltando')
        await page.goBack()
        await settle(page, 1500)
      }

      // Drag por touch: sequência touchstart/move/end sobre o grip
      const grip = row.locator('svg.lucide-grip-vertical').first()
      const gripBox = await grip.boundingBox().catch(() => null)
      const rowBoxBefore = await row.boundingBox()
      if (gripBox) {
        const cdp = await context.newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: gripBox.x + 5, y: gripBox.y + 5 }],
        })
        for (let i = 1; i <= 6; i++) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: gripBox.x + 5, y: gripBox.y + 5 + i * 25 }],
          })
          await page.waitForTimeout(80)
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await page.waitForTimeout(1000)
        const rowBoxAfter = await row.boundingBox()
        const titleFirstBefore = await page.locator('div[draggable="true"]').first().textContent()
        rec.measure('drag_touch', {
          moveu: JSON.stringify(rowBoxBefore) !== JSON.stringify(rowBoxAfter),
          primeira_linha_apos: titleFirstBefore?.replace(/\s+/g, ' ').slice(0, 80),
        })
        rec.note('Drag HTML5 nativo não escuta touch events (SET-04) — resultado esperado: nada move. Confirmação física no iPad: MANUAL-CHECKLIST.')
      }

      // Remover uma música: quantos taps?
      const removeBtn = row.getByRole('button', { name: 'Remove song' })
      const tapsBefore = rec.taps
      const removeVisible = await removeBtn
        .evaluate((el) => getComputedStyle(el).opacity !== '0')
        .catch(() => false)
      if (!removeVisible) {
        rec.note('Botão Remove está opacity-0 (hover-only) — tentando tap direto mesmo assim')
      }
      await rec.tap('tap: Remove song (Trash)', async () => {
        await removeBtn.tap({ force: true })
      })
      await page.waitForTimeout(1500)
      const confirmDialog = page.getByRole('dialog')
      if (await confirmDialog.isVisible().catch(() => false)) {
        await rec.tap('tap: confirmar remoção', async () => {
          await confirmDialog.getByRole('button', { name: /remove|delete|confirm/i }).click()
        })
      }
      await settle(page, 1500)
      rec.measure('taps_para_remover', rec.taps - tapsBefore)
      const rowsLeft = await page.locator('div[draggable="true"]').count()
      rec.measure('linhas_restantes', rowsLeft)
      rec.measure('screenshot', await shot(page, 'item-18-touch-remocao'))
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-19: mobile — do card ao detalhe, quanto scroll?', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      19,
      'Mobile: após tocar num card, quanto scroll até a primeira música do detalhe? Existe auto-scroll invisível em screenshot?'
    )
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-19')
    try {
      if (!(await gotoRoute(page, '/setlists', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
      await settle(page, 2500)
      const scrollBefore = await page.evaluate(() => window.scrollY)
      await rec.tap(`tap no card "${SHOW_NAME}"`, async () => {
        await page.getByText(SHOW_NAME, { exact: true }).first().tap()
      })
      await page.waitForTimeout(2000)
      const state = await page.evaluate((showName) => {
        const heading = Array.from(document.querySelectorAll('h1,h2,h3,h4')).find((h) =>
          h.textContent?.includes(showName)
        )
        // primeira música do detalhe (linha draggable)
        const firstSong = document.querySelector('div[draggable="true"]')
        const r = firstSong?.getBoundingClientRect()
        return {
          scrollY: window.scrollY,
          url: location.href,
          detalheHeadingCount: heading ? 1 : 0,
          primeiraMusicaTop: r ? Math.round(r.top) : null,
          viewportH: window.innerHeight,
          primeiraMusicaVisivel: r ? r.top >= 0 && r.top < window.innerHeight : false,
        }
      }, SHOW_NAME)
      rec.measure('scroll_antes', scrollBefore)
      rec.measure('estado_apos_tap', state)
      rec.measure('screenshot_apos_tap', await shot(page, 'item-19-mobile-apos-tap'))
      if (state.primeiraMusicaTop !== null && !state.primeiraMusicaVisivel) {
        rec.note(
          `Detalhe existe mas a 1ª música está a ${state.primeiraMusicaTop - state.viewportH}px abaixo da dobra — exige scroll manual`
        )
      }
      if (state.primeiraMusicaTop === null) {
        rec.note('Nenhuma linha de música renderizada após o tap — detalhe não abriu (SET-10)?')
      }
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-20: /setlists com seed completo — load e jank na Estresse', async ({ page }, testInfo) => {
    const rec = new ItemRecorder(
      20,
      'Scroll da setlist de 60 sem virtualização: jank perceptível? Tempo de load de /setlists com o seed completo?'
    )
    trackSessionPosts(page, 'item-20')

    let apiMs: number | null = null
    page.on('response', async (res) => {
      if (res.url().endsWith('/api/setlists') && res.request().method() === 'GET') {
        apiMs = res.request().timing().responseEnd
      }
    })
    const t0 = Date.now()
    if (!(await gotoRoute(page, '/setlists', rec))) {
      rec.note('rota indisponível após retries de bounce — item inconclusivo nesta passada')
      rec.set('inconclusiva')
      rec.save(testInfo)
      return
    }
    await page.getByText(ESTRESSE_NAME, { exact: true }).first().waitFor({ state: 'visible', timeout: 60_000 })
    // Medição limpa: reload direto (sem os retries de bounce na conta)
    apiMs = null
    const tClean = Date.now()
    await page.goto('/setlists', { waitUntil: 'domcontentloaded', timeout: 90_000 })
    await page.getByText(ESTRESSE_NAME, { exact: true }).first().waitFor({ state: 'visible', timeout: 60_000 })
    rec.measure('load_setlists_ate_cards_ms', Date.now() - tClean)
    rec.measure('get_api_setlists_ms', apiMs)

    const tDetail = Date.now()
    await page.getByText(ESTRESSE_NAME, { exact: true }).first().click()
    await page.locator('div[draggable="true"]').first().waitFor({ state: 'visible', timeout: 60_000 })
    rec.measure('abrir_detalhe_estresse_ms', Date.now() - tDetail)
    const rows = await page.locator('div[draggable="true"]').count()
    rec.measure('linhas_renderizadas', rows)

    // Jank: mede frames longos durante scroll programático suave
    const frameStats = await page.evaluate(async () => {
      const deltas: number[] = []
      let last = performance.now()
      let raf = 0
      const tick = (now: number) => {
        deltas.push(now - last)
        last = now
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      const el = document.scrollingElement!
      const start = el.scrollTop
      const target = el.scrollHeight
      const dur = 3000
      const t0 = performance.now()
      await new Promise<void>((resolve) => {
        const scrollStep = (now: number) => {
          const p = Math.min((now - t0) / dur, 1)
          el.scrollTop = start + (target - start) * p
          if (p < 1) requestAnimationFrame(scrollStep)
          else resolve()
        }
        requestAnimationFrame(scrollStep)
      })
      cancelAnimationFrame(raf)
      const long = deltas.filter((d) => d > 33.4)
      return {
        frames: deltas.length,
        p95_ms: deltas.sort((a, b) => a - b)[Math.floor(deltas.length * 0.95)],
        max_ms: Math.max(...deltas),
        frames_acima_2vsync: long.length,
      }
    })
    rec.measure('scroll_3s_frame_stats', frameStats)
    rec.measure('screenshot_fundo', await shot(page, 'item-20-estresse-fundo'))
    rec.save(testInfo)
  })

  test('item-22: bottom nav encobre a última linha? (mobile)', async ({ browser }, testInfo) => {
    const rec = new ItemRecorder(
      22,
      'Bottom nav: a última linha fica permanentemente encoberta (DASH-04) ou o scroll a expõe? Tocar no item semi-visível funciona?'
    )
    const context = await browser.newContext({
      baseURL: 'https://octavia.rocks',
      storageState: 'tests/ux-audit/.auth/user.json',
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    })
    const page = await context.newPage()
    trackSessionPosts(page, 'item-22')
    try {
      for (const route of ['/dashboard', '/setlists']) {
        if (!(await gotoRoute(page, route, rec))) {
          rec.note(`rota ${route} indisponível após retries de bounce — pulando`)
          continue
        }
        await settle(page, 2500)
        // Rola até o fim
        await page.evaluate(() => {
          const el = document.scrollingElement!
          el.scrollTop = el.scrollHeight
        })
        await page.waitForTimeout(1200)
        const geo = await page.evaluate(() => {
          const nav = Array.from(document.querySelectorAll('nav, div')).find(
            (el) =>
              getComputedStyle(el).position === 'fixed' &&
              el.getBoundingClientRect().top > window.innerHeight * 0.8 &&
              el.getBoundingClientRect().height > 40 &&
              el.getBoundingClientRect().height < 140
          )
          const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight
          // último elemento de conteúdo dentro de main
          const main = document.querySelector('main') ?? document.body
          const candidates = Array.from(main.querySelectorAll('a, button, [class*="card"], li, div[draggable]')).filter(
            (el) => el.getBoundingClientRect().height > 20 && (el.textContent ?? '').trim().length > 0
          )
          const last = candidates[candidates.length - 1]
          const lastRect = last?.getBoundingClientRect()
          return {
            navTop: Math.round(navTop),
            navHeight: nav ? Math.round(nav.getBoundingClientRect().height) : null,
            ultimoElemento: last?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ?? null,
            ultimoBottom: lastRect ? Math.round(lastRect.bottom) : null,
            encobertoPx: lastRect ? Math.max(0, Math.round(lastRect.bottom - navTop)) : null,
            scrollNoFim: true,
          }
        })
        rec.measure(`geometria_${route.replace('/', '')}`, geo)
        rec.measure(`screenshot_${route.replace('/', '')}`, await shot(page, `item-22-fundo-${route.replace('/', '')}`))
      }
    } finally {
      rec.save(testInfo)
      await context.close()
    }
  })

  test('item-17: reorder — registrado como diferido', async ({}, testInfo) => {
    const rec = new ItemRecorder(
      17,
      'Reorder pós-religação: latência de um drag na setlist de 60 (120 UPDATEs)? Interromper no meio deixa posições 10000+?'
    )
    rec.set('diferida')
    rec.note(
      'DIFERIDO por decisão da Fase D: o handler de drop da UI é um TODO (SET-03) — o reorder nunca chega à API. ' +
        'Religar o fio nesta fase alteraria o objeto medido. Medir latência/consistência dos 2N UPDATEs quando o fix de SET-03 existir.'
    )
    rec.save(testInfo)
  })
})
