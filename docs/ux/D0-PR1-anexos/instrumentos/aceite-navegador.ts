/**
 * D-0-PR1, o aceite no navegador (§5 do prompt; regra 28, I1-D37). Rastro de instrumento (N4-D117): fora de CI, lint e
 * typecheck (`docs/**` está fora do `tsconfig`). Dado FABRICADO; nenhuma escrita real.
 *
 *   parte A — `localhost:3000` (o `pnpm dev` da árvore da PR, com o `.env.local` do Marcel), o perfil persistente
 *     `~/.octavia-g-faixa-perfil`. Para um content de cada tipo SEM dificuldade: abre `/content/<id>/edit` com o `GET`
 *     fabricado no navegador, muda *Notas* em *Detalhes* e clica *Salvar*; o `PUT /api/content` PARA no navegador (o corpo
 *     é guardado e a resposta é um 200 fabricado, `x-d0: fabricado`). Depois, uma Tab: edita o texto do painel e salva.
 *     Cada corpo guardado passa, aqui no node, pelo que a rota valida antes do banco — o esquema real
 *     (`contentSchemas.update`) e o contrato de escrita real com o tipo da linha (`checkContentData`). A barreira: toda
 *     outra escrita a `/api/*` é abortada e reprova (o `POST`/`DELETE` de `/api/auth/session` é cookie e passa); request a
 *     `octavia.rocks` é abortado e contado. Grava `parte-a.json` (corpos, veredito, a linha da Tab como ficaria gravada).
 *   parte B — a visualização do site com a linha que o `PUT` gravaria: a rota `/content/[id]` é SSR do banco (não se
 *     fabrica por `route()`), então o `ContentPageClient` REAL é montado por uma página de fumaça (`fumaca-d0.tsx`) numa
 *     CÓPIA da árvore sem `.env*`, `next dev` na porta 3110 (o molde da I1-PR-11, §16). Lê o texto do painel da Tab.
 *
 * Rodar da raiz da árvore: `pnpm exec tsx docs/ux/D0-PR1-anexos/instrumentos/aceite-navegador.ts A <saida>` e, com o
 * servidor da cópia de pé, `… B <saida>`.
 */
import { chromium, type Page, type Route } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { contentSchemas } from '@/lib/api-schemas'
import { checkContentData } from '@/lib/content-data-contract'
import type { ContentType } from '@/types/content'

const [parte, saida] = [process.argv[2], process.argv[3]]
if (!parte || !saida) throw new Error('uso: aceite-navegador.ts A|B <pasta de saída>')
fs.mkdirSync(saida, { recursive: true })
const PERFIL = path.join(process.env.HOME as string, '.octavia-g-faixa-perfil')
const T = '2026-10-08T12:00:00.000Z'
const TAB = 'e|--1--3--|\nB|--3--1--|'
const TAB_EDITADA = 'e|--1--3--5--|\nB|--3--1--0--|\nG|--2--2--2--|'
const PDF = 'https://d0.exemplo.test/storage/v1/object/public/content-files/d0-aceite.pdf'
const base = {
  user_id: 'd0-aceite', artist: 'Autor fabricado', album: null, bpm: null, capo: null, difficulty: null, genre: null,
  is_favorite: false, is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4',
  tuning: null, created_at: T, updated_at: T, file_url: null as string | null,
}
const LINHAS: Record<string, Record<string, unknown>> = {
  Lyrics: { ...base, id: '00000000-0000-4000-8000-0000000d0a01', title: 'Letra de aceite D0', content_type: 'Lyrics', content_data: { lyrics: 'Primeira linha fabricada D0' } },
  Chords: { ...base, id: '00000000-0000-4000-8000-0000000d0a02', title: 'Cifra de aceite D0', content_type: 'Chords', content_data: { chords: 'C  G\nLa la D0' } },
  Tab: { ...base, id: '00000000-0000-4000-8000-0000000d0a03', title: 'Tab de aceite D0', content_type: 'Tab', content_data: { tablature: TAB } },
  Sheet: { ...base, id: '00000000-0000-4000-8000-0000000d0a04', title: 'Partitura de aceite D0', content_type: 'Sheet', content_data: null, file_url: PDF },
}

/** O que a rota valida antes do banco (`app/api/content/route.ts`, o `PUT`): o esquema, e o contrato com o tipo da linha. */
function rota(corpo: Record<string, unknown>, tipo: string): string {
  const v = contentSchemas.update.safeParse(corpo)
  if (!v.success) return `400 esquema · ${v.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' | ')}`
  if (v.data.content_data !== undefined && v.data.content_type === undefined) {
    const c = checkContentData(tipo as ContentType, v.data.content_data)
    if (!c.ok) return `400 contrato · ${c.field}: ${c.message}`
  }
  return '200 (esquema e contrato aceitam)'
}

async function parteA() {
  const ctx = await chromium.launchPersistentContext(PERFIL, { headless: true, viewport: { width: 1138, height: 900 }, serviceWorkers: 'block' })
  const log: string[] = []
  const barrados: string[] = []
  let prod = 0
  await ctx.route('**/*', (r: Route) => {
    const u = new URL(r.request().url()), m = r.request().method()
    if (u.hostname === 'octavia.rocks' || u.hostname.endsWith('.octavia.rocks')) { prod++; return r.abort() }
    if (u.origin === 'http://localhost:3000' && u.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(m) && u.pathname !== '/api/auth/session') {
      barrados.push(`${m} ${u.pathname}`); return r.abort()
    }
    return r.continue()
  })
  ctx.on('request', (q) => { const u = new URL(q.url()); if (u.origin === 'http://localhost:3000' && u.pathname.startsWith('/api/')) log.push(`${q.method()} ${u.pathname}`) })
  const page = ctx.pages()[0] ?? (await ctx.newPage())
  const resultados: Record<string, unknown>[] = []

  const abrir = async (p: Page, linha: Record<string, unknown>) => {
    const corpos: string[] = []
    await p.unrouteAll({ behavior: 'ignoreErrors' })
    await p.route(`**/api/content/${linha.id}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'x-d0': 'fabricado' }, body: JSON.stringify(linha) }))
    await p.route('**/api/content', (r) => {
      if (r.request().method() !== 'PUT') return r.fallback()
      const c = r.request().postData() ?? ''
      corpos.push(c)
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'x-d0': 'fabricado' }, body: JSON.stringify({ ...linha, ...JSON.parse(c) }) })
    })
    await p.goto(`http://localhost:3000/content/${linha.id}/edit`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    if (new URL(p.url()).pathname.startsWith('/login')) throw new Error('a sessão do perfil caiu (redirecionou para /login)')
    await p.getByRole('button', { name: 'Salvar', exact: true }).waitFor({ timeout: 120_000 })
    return corpos
  }
  const salvar = async (p: Page, corpos: string[], tipo: string, nome: string) => {
    await p.getByRole('button', { name: 'Salvar', exact: true }).click()
    await p.waitForURL(/\/library/, { timeout: 60_000 })
    const corpo = JSON.parse(corpos[0]) as Record<string, unknown>
    const r = { caso: nome, tipo, putsNoNavegador: corpos.length, difficulty: corpo.difficulty, content_data: corpo.content_data === null ? null : `{${Object.keys(corpo.content_data as object).join(',')}}`, rota: rota(corpo, tipo), foiParaLibrary: true }
    resultados.push(r)
    console.log(`  ${nome}: PUT ${corpos.length} (parado no navegador) · difficulty=${JSON.stringify(corpo.difficulty)} · content_data=${r.content_data} · ${r.rota}`)
    return corpo
  }

  for (const tipo of ['Lyrics', 'Chords', 'Tab', 'Sheet']) {
    const corpos = await abrir(page, LINHAS[tipo])
    await page.getByTestId('campo-notas').fill('nota fabricada D0')
    await salvar(page, corpos, tipo, `${tipo} sem dificuldade · Notas em Detalhes`)
  }

  // a Tab: o painel abre a tablature; editar o texto e salvar
  const linhaTab = { ...LINHAS.Tab, id: '00000000-0000-4000-8000-0000000d0a05' }
  const corpos = await abrir(page, linhaTab)
  const painel = page.getByTestId('campo-tablatura')
  const aberto = await painel.inputValue()
  console.log(`  Tab: o painel abre com ${aberto.length} car. · = a tablature da linha: ${aberto === TAB}`)
  await painel.fill(TAB_EDITADA)
  await page.screenshot({ path: path.join(saida, 'editor-tab-editada-1138.png'), fullPage: true })
  const corpo = await salvar(page, corpos, 'Tab', 'Tab · o texto editado no painel')
  // a linha como o banco a guardaria (o `update` da rota: cada chave do corpo que a rota conhece; o content_data substitui)
  const gravada = { ...linhaTab, ...Object.fromEntries(Object.entries(corpo).filter(([k]) => !['id', 'updated_at'].includes(k))), updated_at: T }
  const r = { resultados, tabAbriu: { comprimento: aberto.length, igualALinha: aberto === TAB }, tabGravada: gravada, requests: log, barrados, prodAbortados: prod }
  fs.writeFileSync(path.join(saida, 'parte-a.json'), JSON.stringify(r, null, 1) + '\n')
  console.log(`  requests a /api/*: ${log.length} · escritas barradas: ${barrados.length} · prod abortados: ${prod}`)
  await ctx.close()
  if (barrados.length) throw new Error(`escrita não declarada: ${barrados.join(', ')}`)
}

async function parteB() {
  const a = JSON.parse(fs.readFileSync(path.join(saida, 'parte-a.json'), 'utf8')) as { tabGravada: Record<string, unknown> }
  const b64 = Buffer.from(JSON.stringify(a.tabGravada), 'utf8').toString('base64')
  const nav = await chromium.launch()
  const p = await nav.newPage({ viewport: { width: 1138, height: 900 } })
  await p.goto(`http://localhost:3110/fumaca-d0#${b64}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const painel = p.locator('section[data-testid="painel-tab"]')
  await painel.waitFor({ timeout: 120_000 })
  const texto = (await painel.locator('[data-rolagem="painel"] > div').first().textContent()) ?? ''
  await p.screenshot({ path: path.join(saida, 'visualizacao-tab-1138.png'), fullPage: true })
  console.log(`  visualização do site: painel-tab com ${texto.length} car. · = o texto editado: ${texto === TAB_EDITADA}`)
  fs.writeFileSync(path.join(saida, 'parte-b.json'), JSON.stringify({ comprimento: texto.length, igualAoEditado: texto === TAB_EDITADA }, null, 1) + '\n')
  await nav.close()
}

void (parte === 'A' ? parteA() : parteB()).catch((e) => { console.error(e); process.exit(1) })
