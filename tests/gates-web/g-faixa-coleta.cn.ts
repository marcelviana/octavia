/**
 * G-faixa (I1-PR5) — CN da COLETA no navegador: a mesma `coletar` da medição,
 * sobre uma página SINTÉTICA (sem servidor), com um exemplo de cada coisa que
 * o gate tem de ver. As superfícies públicas do web velho deram (e)=0 e (b)=0
 * em 711 — este CN prova que isso é da página, não de um instrumento cego.
 *
 * Roda só pelo caminho (a config exige G_FAIXA_BASE_URL, que aqui não é usada):
 *   G_FAIXA_BASE_URL=http://localhost G_FAIXA_SUPERFICIES=nenhuma \
 *     pnpm exec playwright test -c playwright.g-faixa.config.ts tests/gates-web/g-faixa-coleta.cn.ts --project B-711
 */
import { expect, test } from '@playwright/test'
// @ts-expect-error — módulo .mjs sem tipos
import { classificarEstado } from '../../scripts/gates-web/g-faixa-classificar.mjs'
import { coletar, medirFolha, paraJson } from '../../scripts/gates-web/g-faixa-coleta'

const HTML = `<!doctype html><html><head><style>
  body { margin: 0; font: 16px sans-serif }
  .nav { display: flex; gap: 8px } @media (max-width: 767px) { .nav { display: none } }
  .gaveta { width: 200px; overflow: hidden; white-space: nowrap }
  .largo { position: absolute; top: 0; left: 650px; width: 200px }
  .elide { width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  .rola { height: 60px; overflow: auto }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0) }
</style></head><body>
  <nav class="nav"><a href="/a">Painel</a><a href="/b">Biblioteca</a></nav>
  <div class="gaveta"><button style="margin-left: 180px">Adicionar</button></div>
  <button class="largo">Apagar setlist</button>
  <p class="elide">um aviso comprido que não cabe na linha</p>
  <div class="rola"><p>linha 1</p><p>linha 2</p><p>linha 3</p><p>linha 4</p></div>
  <span class="sr">só para leitor de tela, com texto comprido</span>
</body></html>`

test('coleta: (e), (b) e rolagem numa página sintética, em 1138 e 711', async ({ browser }) => {
  const larguras: Record<string, unknown> = {}
  for (const w of [1138, 711]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } })
    await page.setContent(HTML)
    const m = await page.evaluate(coletar, null)
    larguras[String(w)] = { viewport: m.viewport, doc: m.doc, nos: paraJson(m.nos, true) }
    await page.close()
  }
  const c = classificarEstado({ larguras })
  const rot = (L: string, lista: { k: string; tipo?: string }[]) =>
    lista.map((o) => `${o.tipo ?? ''}: ${(larguras[L] as { nos: { k: string; rotulo: string }[] }).nos.find((n) => n.k === o.k)?.rotulo ?? (larguras['1138'] as { nos: { k: string; rotulo: string }[] }).nos.find((n) => n.k === o.k)?.rotulo ?? o.k}`)
  const relato = {
    '1138': { e: rot('1138', c['1138'].e), b: rot('1138', c['1138'].b), saidas: c['1138'].saidas },
    '711': { e: rot('711', c['711'].e), b: rot('711', c['711'].b), saidas: c['711'].saidas },
  }
  console.log(JSON.stringify(relato, null, 2))
  expect(relato['1138'].e).toEqual([])
  expect(relato['1138'].b).toEqual(['borda do contêiner: Adicionar', 'conteúdo cortado no próprio nó: um aviso comprido que não cabe na linha'])
  expect(relato['711'].e).toEqual(['sem nó: Painel', 'sem nó: Biblioteca'])
  expect(relato['711'].b).toEqual(['página com rolagem horizontal: (página)', 'borda do contêiner: Adicionar', 'borda do viewport: Apagar setlist', 'conteúdo cortado no próprio nó: um aviso comprido que não cabe na linha'])
  expect(c['711'].saidas.rolagem).toBeGreaterThan(0)
})

test('folha: a moldura C e a B de AUTH-login medidas; a folha contra si mesma dá 0 errata; 5 px de desvio dá 1', async ({ browser }) => {
  const page = await browser.newPage()
  const folha = await medirFolha(page, '1-auth', 'AUTH-login', true)
  await page.close()
  const C = folha.C as { k: string; rotulo: string; x: number; w: number }[]
  const B = folha.B as { k: string; rotulo: string; x: number; w: number }[]
  console.log(`folha 1-auth · AUTH-login: C ${C.length} nós · B ${B.length} nós`)
  console.log(C.slice(0, 8).map((n) => `  ${n.rotulo.slice(0, 30)} x=${n.x} w=${n.w}`).join('\n'))
  expect(C.length).toBeGreaterThan(5)
  expect(Math.max(...C.map((n) => n.x + n.w))).toBeLessThanOrEqual(1138) // coordenadas da moldura, não da página
  const med = (nos: unknown[]) => ({ viewport: { w: 1138, h: 711 }, doc: { scrollWidth: 1138, clientWidth: 1138 }, nos })
  expect(classificarEstado({ larguras: { 1138: med(C) }, folha })['1138'].errata).toEqual([])
  const desviado = C.map((n, i) => (i === 0 ? { ...n, x: n.x + 5 } : n))
  const e = classificarEstado({ larguras: { 1138: med(desviado) }, folha })['1138'].errata
  console.log('desvio de 5 px no 1º nó →', JSON.stringify(e))
  expect(e).toEqual([{ k: C[0]!.k, delta: [5, 0, 0, 0] }])
})
