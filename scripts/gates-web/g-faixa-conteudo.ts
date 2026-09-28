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
import { responder, segurar } from './g-faixa-auth'
import type { Estado } from './g-faixa-superficies'

/** O `file_url` da partitura fabricada: um host do Storage que não existe — o `route()` responde antes de sair. */
export const PDF_URL = 'https://g-faixa.supabase.co/storage/v1/object/public/content-files/g-faixa-partitura-12p.pdf'

let pdf12: Buffer | null = null
/** O PDF de 12 páginas (A4, uma linha de texto por página), gerado uma vez por processo. */
export async function pdfDe12Paginas(): Promise<Buffer> {
  if (pdf12) return pdf12
  const doc = await PDFDocument.create()
  const fonte = await doc.embedFont(StandardFonts.Helvetica)
  for (let n = 1; n <= 12; n++) {
    const pg = doc.addPage([595, 842])
    pg.drawText(`Partitura de 12 paginas - pagina ${n} (fixture do G-faixa)`, { x: 60, y: 780, size: 14, font: fonte })
  }
  pdf12 = Buffer.from(await doc.save())
  return pdf12
}

const CORS_ARQUIVO = { 'access-control-allow-origin': '*', 'x-g-faixa': 'fabricado' }

/** O `GET` do arquivo: o PDF gerado, um status de erro, ou segurado (o "carregando o PDF"). */
export async function arquivo(page: Page, r: 'pdf' | 'segurar' | { status: number }) {
  await page.route(PDF_URL, async (rt: Route) => {
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

const ESTADOS_CONTENT_EDIT: Record<string, Estado> = {
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

export { ESTADOS_CONTENT_EDIT }
