// N4-PR4 §4 — a prova por imagem no site: capturas full page, Chromium do Playwright, perfil persistente (I1-D37),
// localhost:3000, barreira de escrita (toda escrita a /api/* abortada e contada, exceto o cookie de sessão).
// Uso: ARV=<árvore com node_modules> SAIDA=<pasta> tsx site-prova.mts
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const ARV = process.env.ARV!, SAIDA = process.env.SAIDA!
const req = createRequire(ARV + '/package.json')
const { chromium } = req('@playwright/test')
const BASE = 'http://localhost:3000'
const PERFIL = process.env.HOME + '/.octavia-g-faixa-perfil'
mkdirSync(SAIDA, { recursive: true })
// os `d` que identificam um ícone de tipo — o velho e o novo (para achar a caixa nos dois lados)
const MARCAS = ['M4 5.25h13M4 9.75h16', 'M4 9.5h16', 'M3 3h18M3 6.6h1.225', 'M3 4.2h18M3 9.4h2.1', 'M3 5h18M3 8.5h18M3 12h18', 'M3 19.8L7.5 5.4', 'M12 21.3c-3.84', 'M3 4.8h4.8M16.8 4.8h4.2', 'M14.1 17.1V3.6']
const LINHAS = [
  ['g1', 'Garota de Ipanema', 'Tom Jobim', 'Chords', true], ['g2', 'Linha de 120 colunas', 'Teste de régua', 'Chords', false],
  ['g3', 'Batch três', null, 'Lyrics', false], ['g4', 'Trenzinho do caipira', 'Villa-Lobos', 'Tab', false],
  ['g5', 'Partitura de 12 páginas', 'Compositor anônimo', 'Sheet', false], ['g6', 'Construção', 'Chico Buarque', 'Lyrics', true],
].map(([id, title, artist, content_type, is_favorite]) => ({ id, title, artist, album: null, content_type, is_favorite, created_at: '2026-09-10T15:00:00Z', updated_at: '2026-09-10T15:00:00Z', user_id: 'g-faixa' }))
const DADOS = { data: LINHAS, total: 60, page: 1, pageSize: 20, hasMore: true, totalPages: 3 }
const LARG = { C: { width: 1138, height: 711 }, B: { width: 711, height: 1138 } } as const
const estado = { escritasAbortadas: 0, prod: 0 }
type Tela = { nome: string; rota: string; fabricada: boolean; preparar?: (p: any) => Promise<void> }
const TELAS: Tela[] = [
  { nome: 'library', rota: '/library', fabricada: true, preparar: async (p) => { await p.getByText('Trenzinho do caipira').first().waitFor({ timeout: 60_000 }) } },
  { nome: 'library-filtros', rota: '/library', fabricada: true, preparar: async (p) => { await p.getByText('Trenzinho do caipira').first().waitFor({ timeout: 60_000 }); await p.getByRole('button', { name: /^Filtros/ }).click(); await p.getByRole('button', { name: 'Partitura', exact: true }).waitFor() } },
  { nome: 'add-content', rota: '/add-content', fabricada: true, preparar: async (p) => { await p.getByText('Partitura', { exact: true }).first().waitFor({ timeout: 60_000 }) } },
  { nome: 'dashboard', rota: '/dashboard', fabricada: false, preparar: async (p) => { await p.waitForLoadState('load'); await p.locator('svg path').first().waitFor({ timeout: 60_000 }); await p.waitForTimeout(2500) } },
]
const ctx = await chromium.launchPersistentContext(PERFIL, { viewport: LARG.C, serviceWorkers: 'block', deviceScaleFactor: 1 })
await ctx.route('**/*', async (rt: any) => {
  const u = new URL(rt.request().url()), m = rt.request().method()
  if (u.hostname === 'octavia.rocks' || u.hostname.endsWith('.octavia.rocks')) { estado.prod++; return rt.abort() }
  if (u.origin === BASE && u.pathname.startsWith('/api/') && m !== 'GET' && m !== 'HEAD' && u.pathname !== '/api/auth/session') { estado.escritasAbortadas++; return rt.abort() }
  return rt.fallback()
})
{
  // a visualização é SSR (div. 732): o primeiro /content/<id> que o painel lista — leitura da conta, imagem fora do repositório
  const p = await ctx.newPage(); await p.goto(BASE + '/dashboard', { waitUntil: 'load' }); await p.locator('a[href^="/content/"]').first().waitFor({ timeout: 60_000 })
  const href = await p.locator('a[href^="/content/"]').first().getAttribute('href'); await p.close()
  TELAS.push({ nome: 'content', rota: href!, fabricada: false, preparar: async (q) => { await q.waitForLoadState('load'); await q.locator('svg path').first().waitFor({ timeout: 60_000 }); await q.waitForTimeout(2500) } })
}
const relatorio: string[] = []
for (const [faixa, vp] of Object.entries(LARG)) {
  for (const t of TELAS) {
    const p = await ctx.newPage()
    await p.setViewportSize(vp)
    if (t.fabricada) await p.route(/\/api\/content(\?|$)/, (rt: any) => rt.request().method() === 'GET' ? rt.fulfill({ status: 200, headers: { 'content-type': 'application/json', 'x-g-faixa': 'fabricado' }, body: JSON.stringify(DADOS) }) : rt.fallback())
    await p.goto(BASE + t.rota, { waitUntil: 'domcontentloaded' })
    if (new URL(p.url()).pathname === '/login') throw new Error('sessão caída: o perfil abriu /login')
    await t.preparar?.(p)
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important} nextjs-portal{display:none!important}' })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(800)
    const caixas = await p.evaluate((marcas: string[]) => [...document.querySelectorAll('svg')].filter((s) => [...s.querySelectorAll('path')].some((q) => marcas.some((m) => (q.getAttribute('d') ?? '').startsWith(m)))).map((s) => { const r = s.getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height] }), MARCAS)
    const arq = `${t.nome}-${faixa}`
    await p.screenshot({ path: join(SAIDA, arq + '.png'), fullPage: true })
    writeFileSync(join(SAIDA, arq + '.json'), JSON.stringify({ caixas, fabricada: t.fabricada }))
    relatorio.push(`${arq}\tícones de tipo na tela: ${caixas.length}\t${t.fabricada ? 'fabricada' : 'SSR (conta real, leitura)'}`)
    await p.close()
  }
}
await ctx.close()
relatorio.push(`escritas abortadas pela barreira: ${estado.escritasAbortadas} · requests a octavia.rocks abortadas: ${estado.prod}`)
writeFileSync(join(SAIDA, 'relatorio.txt'), relatorio.join('\n') + '\n')
console.log(relatorio.join('\n'))
