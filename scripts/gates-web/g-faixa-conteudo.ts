/**
 * G-faixa — o conteúdo fabricado das superfícies de content (I1-PR-10).
 *
 * `content-edit` (`/content/[id]/edit`, o editor velho — folha 6, PR-11): a página é CLIENTE e lê o content por
 * `GET /api/content/<id>` (`lib/content-service.ts:477`) — aqui ele é FABRICADO no navegador, um content de cada
 * tipo, e o arquivo da partitura também (o PDF de 12 páginas gerado abaixo, em memória). Nenhuma leitura de content
 * real, nenhuma escrita: o `PUT` do salvar não se clica, e se sair cai na barreira do medidor (abortado, reprova).
 * É a `casca-efeito` do `pdf-viewer` (decisões 3 e 4 do aval da I1-PR-10): o antes sobre o commit 1b (código da
 * `main`), o depois sobre o commit 2.
 *
 * Os textos são obra do projeto (os exemplos da folha 5 e as fixtures de CN) — a regra "anexo não carrega texto de
 * música" não os alcança; e a medição com sessão grava só hash.
 */
import type { Page, Route } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { responder, segurar, type Resposta } from './g-faixa-auth'
import type { Estado } from './g-faixa-superficies'
import { EXEMPLOS_EDITOR, type TipoDoExemplo } from './g-faixa-editor-exemplos'
import { DADOS, conteudo } from './g-faixa-lista'

/** O `file_url` da partitura fabricada: um host do Storage que não existe — o `route()` responde antes de sair. */
export const PDF_URL = 'https://g-faixa.supabase.co/storage/v1/object/public/content-files/g-faixa-partitura-12p.pdf'

let pdf12: Buffer | null = null
/**
 * O PDF de 12 páginas (uma linha de texto por página), gerado uma vez por processo. Formato **Carta** (612 × 792 pt,
 * 1 : 1,294 — a proporção da página que a folha 5 desenha; div. 761, commit 2b): com A4 (1 : 1,415) a página saía ~44 px
 * mais alta em B e o que vem abaixo dela descia.
 */
export async function pdfDe12Paginas(): Promise<Buffer> {
  if (pdf12) return pdf12
  const doc = await PDFDocument.create()
  const fonte = await doc.embedFont(StandardFonts.Helvetica)
  for (let n = 1; n <= 12; n++) {
    const pg = doc.addPage([612, 792])
    pg.drawText(`Partitura de 12 paginas - pagina ${n} (fixture do G-faixa)`, { x: 60, y: 730, size: 14, font: fonte })
  }
  pdf12 = Buffer.from(await doc.save())
  return pdf12
}

const CORS_ARQUIVO = { 'access-control-allow-origin': '*', 'x-g-faixa': 'fabricado' }

/** O `GET` do arquivo (o `url` dado, ou o fabricado): o PDF gerado, um status de erro, ou segurado ("carregando o PDF"). */
export async function arquivo(page: Page, r: 'pdf' | 'segurar' | { status: number }, url: string = PDF_URL) {
  await page.route(url, async (rt: Route) => {
    if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { ...CORS_ARQUIVO, 'access-control-allow-headers': '*' } })
    if (r === 'segurar') return segurar(page, rt)
    if (r === 'pdf') return rt.fulfill({ status: 200, headers: { ...CORS_ARQUIVO, 'content-type': 'application/pdf' }, body: await pdfDe12Paginas() })
    return rt.fulfill({ status: r.status, headers: CORS_ARQUIVO, body: 'erro fabricado' })
  })
}

const T = '2026-09-10T15:00:00Z'
const base = {
  user_id: 'g-faixa', album: null, bpm: null, capo: null, difficulty: null, genre: null, is_favorite: false,
  is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4', tuning: null,
  created_at: T, updated_at: T, file_url: null as string | null,
}
/** Um content de cada tipo, com os exemplos da folha 5 (`VIEW-cifra`, `-letra`, `-tab`, `-partitura`). */
export const CONTEUDOS = {
  cifra: { ...base, id: 'g-faixa-cifra', title: 'Linha de 120 colunas', artist: 'Teste de régua', content_type: 'Chords',
    content_data: { chords: '[Régua de 120 colunas — B7/N1: T1-R31, A15]\n\nC7M      Dm7      G7       C7M\nLa la la la la la la la la la la la\n\n[Verso curto — controle]\nC7M      G7\nLa la la, la la lá' } },
  letra: { ...base, id: 'g-faixa-letra', title: 'Batch três', artist: null, content_type: 'Lyrics',
    content_data: { lyrics: 'Primeira estrofe da música três' } },
  tab: { ...base, id: 'g-faixa-tab', title: 'Trenzinho do caipira', artist: 'Villa-Lobos', content_type: 'Tab', difficulty: 'advanced',
    content_data: { tablature: 'e|-------0-----------0-------|\nB|-----1---1-------1---1-----|\nG|---0-------0---0-------0---|\nD|---------------------------|\nA|-3-------------------------|\nE|---------------|-----------|' } },
  partitura: { ...base, id: 'g-faixa-partitura', title: 'Partitura de 12 páginas', artist: 'Compositor anônimo', content_type: 'Sheet',
    file_url: PDF_URL, content_data: null },
} as const
export type Tipo = keyof typeof CONTEUDOS

/** O id fixo da rota do editor; o corpo do `GET /api/content/<id>` muda por estado. */
export const ID_EDITOR = 'g-faixa'
const servidos = new WeakMap<Page, boolean>()

/** `GET /api/content/g-faixa` fabricado com o content do tipo; os outros métodos seguem para a barreira do medidor. */
async function conteudoDoEditor(page: Page, tipo: Tipo) {
  servidos.set(page, false)
  await page.route(new RegExp(`/api/content/${ID_EDITOR}(\\?|$)`), async (rt) => {
    if (rt.request().method() !== 'GET') return rt.fallback()
    await responder(rt, { corpo: { ...CONTEUDOS[tipo], id: ID_EDITOR } })
    servidos.set(page, true)
  })
}

/** Espera a carga fabricada ter sido servida (o editor só a pede com o usuário do Firebase de pé). */
async function servido(page: Page) {
  const fim = Date.now() + 60_000
  while (!servidos.get(page)) {
    if (Date.now() > fim) throw new Error(`o GET /api/content/${ID_EDITOR} fabricado não foi pedido em 60 s`)
    await page.waitForTimeout(250)
  }
}

/** A página do PDF desenhada (o canvas do react-pdf) — o mesmo seletor antes e depois do commit 2. */
const paginaDesenhada = (page: Page) => page.locator('.react-pdf__Page canvas').first().waitFor({ state: 'visible', timeout: 60_000 })

/**
 * I1-PR11 — os 15 estados da folha `6-content-editor` (+ o `LIB-salvo` da folha 4), TUDO fabricado: o `GET
 * /api/content/g-faixa` com os exemplos da folha (`g-faixa-editor-exemplos.ts`), ou segurado, abortado (rede),
 * 401/429/500/404; o `PUT /api/content` segurado (Salvando…), abortado (a falha de salvar, *sem conexão*) ou 200 (o
 * `LIB-salvo`). A alteração LOCAL é marcar *Favorita* (nenhum texto muda; o chip aparece). Nenhum `PUT` sai: o
 * fabricado sem resposta vai ao log como `fabricado sem resposta`; um que escapasse cairia na barreira (reprova).
 */
async function editorCom(page: Page, r: Resposta, put?: Resposta) {
  await page.route(new RegExp(`/api/content/${ID_EDITOR}(\\?|$)`), (rt) => (rt.request().method() === 'GET' ? responder(rt, r) : rt.fallback()))
  if (put) await page.route(/\/api\/content$/, (rt) => (rt.request().method() === 'PUT' ? responder(rt, put) : rt.fallback()))
}
const exemplo = (tipo: TipoDoExemplo) => ({ corpo: EXEMPLOS_EDITOR[tipo] })
const salvarVisivel = (p: Page) => p.getByRole('button', { name: /^(Salvar|Salvando…)$/ }).waitFor({ state: 'visible', timeout: 60_000 })
const favorita = (p: Page) => p.getByRole('checkbox', { name: 'Favorita' })
/** A alteração local: marcar *Favorita* — repetido até o chip aparecer (o HTML do SSR chega antes da hidratação no `next dev`). */
const alterar = async (p: Page) => {
  await salvarVisivel(p)
  for (let i = 0; i < 20; i++) {
    if ((await favorita(p).getAttribute('aria-checked')) !== 'true') await favorita(p).click()
    if (await p.getByText('alterações não salvas').waitFor({ state: 'visible', timeout: 1_500 }).then(() => true, () => false)) return
  }
  throw new Error('o chip "alterações não salvas" não apareceu depois de marcar Favorita')
}
const salvar = async (p: Page) => { await alterar(p); await p.getByRole('button', { name: 'Salvar' }).click() }
const INALCANCAVEL_SESSAO = (o_que: string) => `${o_que}: com a sessão do perfil o Firebase já responde antes de qualquer route() alcançar — prova na pré-verificação sem sessão (docs/ux/I1-PR11-anexos/pre-verificacao/) e no Vitest (components/editors/__tests__/editor-estados.test.tsx)`

const ESTADOS_EDITOR: Record<string, Estado> = {
  'EDIT-cifra': { secao: 'EDIT-cifra', antes: (p) => editorCom(p, exemplo('cifra')), preparar: alterar },
  'EDIT-sem-mudancas': { secao: 'EDIT-sem-mudancas', antes: (p) => editorCom(p, exemplo('cifra')), preparar: salvarVisivel, espera: 'nada mudou desde que você abriu' },
  'EDIT-salvando': { secao: 'EDIT-salvando', antes: (p) => editorCom(p, exemplo('cifra'), 'segurar'), preparar: salvar, espera: 'Salvando…' },
  'EDIT-tab': { secao: 'EDIT-tab', antes: (p) => editorCom(p, exemplo('tab')), preparar: alterar },
  'EDIT-letra': { secao: 'EDIT-letra', antes: (p) => editorCom(p, exemplo('letra')), preparar: alterar },
  'EDIT-carregando-auth': { inalcancavel: INALCANCAVEL_SESSAO('a espera da sessão (isLoading)') },
  'EDIT-carregando': { secao: 'EDIT-carregando', antes: (p) => editorCom(p, 'segurar'), espera: 'carregando o conteúdo…' },
  'EDIT-carregando-editor': {
    secao: 'EDIT-carregando-editor', espera: 'carregando o editor…',
    // o pedaço do `dynamic` do editor (next dev: o nome do chunk traz `content-edit-page-client`) — segurado [hipótese]
    antes: async (p) => { await editorCom(p, exemplo('cifra')); await p.route(/\/_next\/static\/chunks\/.*content-edit-page-client/, (rt) => segurar(p, rt)) },
  },
  'EDIT-sem-usuario': { inalcancavel: INALCANCAVEL_SESSAO('sem usuário (a rota sem cookie vai ao /login pelo middleware)') },
  'EDIT-erro-rede': { secao: 'EDIT-erro-rede', antes: (p) => editorCom(p, 'abortar'), espera: 'não foi possível carregar o conteúdo — sem conexão' },
  'EDIT-erro-auth': { secao: 'EDIT-erro-auth', antes: (p) => editorCom(p, { status: 401, corpo: { error: 'x' } }), espera: 'o servidor não aceitou a sessão, entre de novo' },
  'EDIT-erro-limite': { secao: 'EDIT-erro-limite', antes: (p) => editorCom(p, { status: 429, corpo: { error: 'x' } }), espera: 'muitas tentativas, tente de novo em instantes' },
  'EDIT-erro-servidor': { secao: 'EDIT-erro-servidor', antes: (p) => editorCom(p, { status: 500, corpo: { error: 'x' } }), espera: 'não foi possível carregar o conteúdo — falha no servidor' },
  'EDIT-404': { secao: 'EDIT-404', antes: (p) => editorCom(p, { status: 404, corpo: { error: 'x' } }), espera: 'este conteúdo não existe' },
  'EDIT-salvar-erro': { secao: 'EDIT-salvar-erro', antes: (p) => editorCom(p, exemplo('cifra'), 'abortar'), preparar: salvar, espera: 'não foi possível salvar — sem conexão' },
  'LIB-salvo': {
    secao: 'LIB-salvo', folha: '4-content-lista', espera: 'alterações salvas',
    // o PUT fabricado 200 (e a `GET /api/content` da biblioteca com as linhas da folha 4, `g-faixa-lista.ts`)
    antes: async (p) => { await editorCom(p, exemplo('cifra')); await conteudo(p, [DADOS]) },
    preparar: async (p) => {
      await salvar(p)
      await p.waitForURL(/\/library/, { timeout: 60_000 })
      await p.getByText('Garota de Ipanema').first().waitFor({ state: 'visible', timeout: 60_000 })
    },
  },
}

/** Os estados do 1b da I1-PR-10 (a `casca-efeito` do editor: antes × depois), com os contents da folha 5. */
const ESTADOS_CASCA_EFEITO: Record<string, Estado> = {
  'base-cifra': { antes: (p) => conteudoDoEditor(p, 'cifra'), preparar: servido },
  'base-letra': { antes: (p) => conteudoDoEditor(p, 'letra'), preparar: servido },
  'base-tab': { antes: (p) => conteudoDoEditor(p, 'tab'), preparar: servido },
  'base-partitura': {
    antes: async (p) => { await conteudoDoEditor(p, 'partitura'); await arquivo(p, 'pdf') },
    preparar: async (p) => { await servido(p); await paginaDesenhada(p) },
  },
  // extra declarado (commit 1b): o erro do PDF no editor — a LinhaDeAviso do pdf-viewer novo aparece lá também
  'erro-pdf': {
    antes: async (p) => { await conteudoDoEditor(p, 'partitura'); await arquivo(p, { status: 500 }) },
    preparar: async (p) => { await servido(p); await p.getByText(/Failed to load PDF|não foi possível abrir o PDF/).first().waitFor({ state: 'visible', timeout: 60_000 }) },
  },
}

/**
 * `content` (`/content/[id]`, a visualização — folha 5): a rota é SSR (div. 732), então o content é o REAL da conta,
 * o primeiro de cada tipo (decisão 1 do aval). Descoberta: a `GET /api/content` que a própria `/library` faz, com
 * `pageSize` 100 (a mesma leitura, página maior); guarda em memória só `id`, tipo e o `file_url` da partitura — nada
 * vai para o JSON (a medição grava só hash). O ARQUIVO da partitura é fabricado no `route()` do `file_url` real (o
 * PDF de 12 páginas gerado; 500; segurado): o PDF da conta não é lido.
 */
const achados: Partial<Record<Tipo, { id: string; fileUrl: string | null }>> = {}
const TIPO_DO_BANCO: Record<string, Tipo> = { Chords: 'cifra', Lyrics: 'letra', Tab: 'tab', Sheet: 'partitura' }

export async function descobrirPorTipo(page: Page, base: URL): Promise<string | null> {
  await page.route(/\/api\/content\?/, (rt) => {
    if (rt.request().method() !== 'GET') return rt.fallback()
    const u = new URL(rt.request().url())
    u.searchParams.set('page', '1'); u.searchParams.set('pageSize', '100')
    return rt.continue({ url: u.toString() })
  })
  const resposta = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/content' && r.request().method() === 'GET' && r.ok(), { timeout: 180_000 })
  await page.goto(new URL('/library', base).href, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const corpo = (await (await resposta).json().catch(() => null)) as { data?: { id?: unknown; content_type?: unknown; file_url?: unknown }[] } | null
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  for (const c of corpo?.data ?? []) {
    const tipo = TIPO_DO_BANCO[String(c.content_type)]
    if (!tipo || achados[tipo] || typeof c.id !== 'string') continue
    const fileUrl = typeof c.file_url === 'string' ? c.file_url : null
    if (tipo === 'partitura' && !fileUrl?.toLowerCase().split('?')[0]?.endsWith('.pdf')) continue
    achados[tipo] = { id: c.id, fileUrl }
  }
  console.log(`G-faixa · content · achados: ${(Object.keys(achados) as Tipo[]).join(', ') || 'nenhum'} (só id/tipo, em memória)`)
  const primeiro = Object.values(achados)[0]
  return primeiro ? `/content/${encodeURIComponent(primeiro.id)}` : null
}

const rotaDo = (tipo: Tipo) => () => { const a = achados[tipo]; return a ? `/content/${encodeURIComponent(a.id)}` : null }
const arquivoDaPartitura = (r: 'pdf' | 'segurar' | { status: number }) => async (p: Page) => {
  const url = achados.partitura?.fileUrl
  if (url) await arquivo(p, r, url)
}
const painel = (testid: string) => async (p: Page) => { await p.getByTestId(testid).first().waitFor({ state: 'visible', timeout: 60_000 }) }
const pdfAberto = async (p: Page) => { await painel('painel-partitura')(p); await paginaDesenhada(p) }

const INALCANCAVEL_VIEW = (o_que: string) => `${o_que}: a linha do content vem do SSR (div. 732) e a conta não se escreve (decisão 1 do aval) — prova no Vitest components/content/__tests__/visualizacao-estados.test.tsx e na pré-verificação sem sessão (docs/ux/I1-PR10-anexos/pre-verificacao/)`
const SEM_CODIGO = 'I1-E15: o estado saiu da folha — a cópia no navegador e o hook que a lia morreram na I1-PR-3'

const ESTADOS_CONTENT: Record<string, Estado> = {
  'VIEW-cifra': { secao: 'VIEW-cifra', rota: rotaDo('cifra'), preparar: painel('painel-cifra') },
  'VIEW-letra': { secao: 'VIEW-letra', rota: rotaDo('letra'), preparar: painel('painel-letra') },
  'VIEW-tab': { secao: 'VIEW-tab', rota: rotaDo('tab'), preparar: painel('painel-tab') },
  'VIEW-partitura': { secao: 'VIEW-partitura', rota: rotaDo('partitura'), antes: arquivoDaPartitura('pdf'), preparar: pdfAberto },
  'VIEW-partitura-cheia': {
    secao: 'VIEW-partitura-cheia', rota: rotaDo('partitura'), antes: arquivoDaPartitura('pdf'),
    preparar: async (p) => {
      await pdfAberto(p)
      await p.getByRole('button', { name: 'Tela cheia', exact: true }).click()
      await p.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 15_000 })
      await p.getByRole('button', { name: 'Sair da tela cheia' }).waitFor({ state: 'visible', timeout: 15_000 })
    },
  },
  'VIEW-carregando-pdf': { secao: 'VIEW-carregando-pdf', rota: rotaDo('partitura'), antes: arquivoDaPartitura('segurar'), espera: 'carregando o PDF…' },
  'VIEW-erro-pdf': { secao: 'VIEW-erro-pdf', rota: rotaDo('partitura'), antes: arquivoDaPartitura({ status: 500 }), espera: 'o arquivo está corrompido ou inacessível' },
  'VIEW-vazio-partitura': { inalcancavel: INALCANCAVEL_VIEW('um content Sheet sem arquivo nem notação') },
  'VIEW-vazio-letra': { inalcancavel: INALCANCAVEL_VIEW('um content Lyrics sem letra') },
  'VIEW-vazio-tab': { inalcancavel: INALCANCAVEL_VIEW('um content Tab sem tablatura') },
  'VIEW-vazio-cifra': { inalcancavel: INALCANCAVEL_VIEW('um content Chords sem cifra') },
  'VIEW-erro-formato': { inalcancavel: INALCANCAVEL_VIEW('um file_url sem extensão de PDF ou imagem (o upload o recusa, B5)') },
  'VIEW-erro-render': { inalcancavel: INALCANCAVEL_VIEW('uma exceção de render') },
  'VIEW-carregando-arquivo': { inalcancavel: SEM_CODIGO },
  'VIEW-erro-cache': { inalcancavel: SEM_CODIGO },
}

const ESTADOS_CONTENT_EDIT: Record<string, Estado> = { ...ESTADOS_EDITOR, ...ESTADOS_CASCA_EFEITO }

export { ESTADOS_CONTENT, ESTADOS_CONTENT_EDIT }
