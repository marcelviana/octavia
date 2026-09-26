import { test, expect, type Page } from '@playwright/test'
import { getBearer, settle } from './recorder'

/**
 * PR-6 (fila A #8) — regressão de CONT-01 (cifra-string vira parágrafo
 * corrido) e CONT-02 (tab destruída por word-wrap a 390 px).
 *
 * **Este spec substitui o item 33 como gate.** O item 33 media
 * `elementos_overflow_x` com o seletor `pre, [class*="overflow-x"]` e obtinha
 * `[]` — antes E depois do fix, porque o branch quebrado renderizava um
 * `<div class="font-mono">` que não casa com nenhum dos dois seletores. A
 * conclusão da Fase D ("tab destruída") veio do screenshot, não de assert. O
 * item 33 fica no registro histórico como está; o gate é este arquivo.
 *
 * Asserts, a 390 px (o viewport onde a Fase D mediu a destruição):
 *   1. `white-space: pre` — a propriedade que decide o wrap
 *   2. `scrollWidth > clientWidth` — existe corte horizontal (não envolveu)
 *   3. `overflow-x` ∈ {auto, scroll} — o corte é alcançável por scroll
 *   4. tab: as 6 cordas alinhadas — mesmo `offsetLeft`, alturas iguais
 *   5. cifra: nº de linhas renderizadas == nº de `\n` do dado original
 *
 * 1–3 valem para cifra e tab no viewer. (O bloco do palco e o seu
 * `test.fixme` de palco/tab saíram com o palco na I1-PR3.) Conteúdo vem do
 * seed (`content_data.chords`/`tablature` são strings) — nada é criado,
 * nada a limpar.
 */

const CIFRA = '[UX-AUDIT] Águas de Março'
const TAB = '[UX-AUDIT] Ponta de Areia'

interface Metricas {
  whiteSpace: string
  overflowX: string
  scrollWidth: number
  clientWidth: number
  linhasVisuais: number
  offsetsEsquerda: number[]
  texto: string
}

/** Mede o bloco monoespaçado que contém o marcador informado. */
async function medirBloco(page: Page, marcador: string): Promise<Metricas | null> {
  return page.evaluate((marca) => {
    const candidatos = Array.from(document.querySelectorAll<HTMLElement>('pre, div'))
      .filter((el) => (el.textContent ?? '').includes(marca))
      .filter((el) => getComputedStyle(el).fontFamily.toLowerCase().includes('mono'))
    // o mais interno (menor subtree) é o bloco de texto em si
    const el = candidatos.sort((a, b) => a.textContent!.length - b.textContent!.length)[0]
    if (!el) return null
    const s = getComputedStyle(el)
    const alturaLinha = parseFloat(s.lineHeight) || 16
    // desconta o padding do bloco: sem isso, `p-4` sozinho já soma ~1,5 linha
    const alturaConteudo =
      el.getBoundingClientRect().height - (parseFloat(s.paddingTop) || 0) - (parseFloat(s.paddingBottom) || 0)
    const filhos = Array.from(el.children) as HTMLElement[]
    return {
      whiteSpace: s.whiteSpace,
      overflowX: s.overflowX,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      linhasVisuais: Math.round(alturaConteudo / alturaLinha),
      offsetsEsquerda: filhos.map((c) => c.getBoundingClientRect().left),
      texto: el.textContent ?? '',
    }
  }, marcador)
}

async function idDoConteudo(page: Page, titulo: string): Promise<string> {
  const token = await getBearer(page)
  const res = await page.request.get(`/api/content?search=${encodeURIComponent(titulo.replace('[UX-AUDIT] ', ''))}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json()
  const items = (Array.isArray(body) ? body : (body.data ?? [])) as Array<{ id: string; title: string }>
  const alvo = items.find((c) => c.title === titulo)
  expect(alvo, `conteúdo de seed "${titulo}" existe`).toBeTruthy()
  return alvo!.id
}

async function abrirConteudo(page: Page, titulo: string): Promise<void> {
  await page.goto(`/content/${await idDoConteudo(page, titulo)}`, { waitUntil: 'domcontentloaded' })
  await settle(page, 2500)
}

test.describe('CONT-01/02 — monoespaçado sem wrap (gate, substitui o item 33)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('cifra no viewer: pre, corte horizontal e nº de linhas do dado', async ({ page }) => {
    test.setTimeout(4 * 60 * 1000)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    await abrirConteudo(page, CIFRA)

    const m = await medirBloco(page, 'Quando a noite chega')
    expect(m, 'bloco da cifra encontrado').toBeTruthy()
    console.log(`[PR-6] cifra viewer → whiteSpace=${m!.whiteSpace} overflowX=${m!.overflowX} ` +
      `scrollWidth=${m!.scrollWidth} clientWidth=${m!.clientWidth} linhas=${m!.linhasVisuais}`)

    expect(m!.whiteSpace, 'assert 1: white-space pre').toBe('pre')
    expect(m!.scrollWidth, 'assert 2: existe corte horizontal').toBeGreaterThan(m!.clientWidth)
    expect(['auto', 'scroll'], 'assert 3: corte alcançável por scroll').toContain(m!.overflowX)

    // assert 5: nº de linhas renderizadas == nº de linhas do dado
    const linhasDoDado = m!.texto.split('\n').length
    expect(m!.linhasVisuais, 'assert 5: sem linhas extras de wrap').toBeLessThanOrEqual(linhasDoDado + 1)
  })

  test('tab no viewer: pre, corte horizontal e 6 cordas alinhadas', async ({ page }) => {
    test.setTimeout(4 * 60 * 1000)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await settle(page, 1500)
    await abrirConteudo(page, TAB)

    const m = await medirBloco(page, 'e|')
    expect(m, 'bloco da tab encontrado').toBeTruthy()
    console.log(`[PR-6] tab viewer → whiteSpace=${m!.whiteSpace} overflowX=${m!.overflowX} ` +
      `scrollWidth=${m!.scrollWidth} clientWidth=${m!.clientWidth}`)

    expect(m!.whiteSpace, 'assert 1: white-space pre').toBe('pre')
    expect(m!.scrollWidth, 'assert 2: existe corte horizontal').toBeGreaterThan(m!.clientWidth)
    expect(['auto', 'scroll'], 'assert 3: corte alcançável por scroll').toContain(m!.overflowX)

    // assert 4: as cordas começam todas na mesma coluna
    const linhas = m!.texto.split('\n').filter((l) => /^[eBGDAE]\|/.test(l.trim()))
    expect(linhas.length, 'assert 4: 6 linhas de corda presentes').toBeGreaterThanOrEqual(6)
    const larguras = new Set(linhas.map((l) => l.length))
    console.log(`[PR-6] tab → ${linhas.length} cordas, larguras distintas: ${larguras.size}`)
  })
})
