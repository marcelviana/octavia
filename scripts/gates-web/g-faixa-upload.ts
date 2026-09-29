/**
 * G-faixa — o upload fabricado (`/add-content`, folha 7-upload; I1-PR-12).
 *
 * `/add-content` é CLIENTE (o SSR só confere a sessão) e escreve por duas rotas: `POST /api/storage/upload` (o arquivo,
 * `FormData`) e `POST /api/content` (uma por música no lote). Aqui as duas são FABRICADAS no navegador — respondidas,
 * seguradas ou abortadas no `route()` — e os arquivos são GERADOS em memória (`setInputFiles` com `buffer`), nunca lidos
 * do disco: o corpo do `POST` para no `route()` e não sai. Um `POST` que escapasse cairia na barreira do medidor
 * (abortado, a rodada reprova). A navegação ao content criado (`router.push('/content/g-faixa-novo')`) é SEGURADA: a
 * tela fica no pronto, que hoje pisca antes do redirecionamento.
 *
 * Commit 1b: os estados `base-*` do web VELHO (o código do app é o da `main`) — o "antes" da `casca-efeito`
 * (decisão 1 do aval). Os seletores são os do web velho; o commit 2 os troca (o "depois" mede os mesmos estados).
 *
 * Os textos são obra do projeto (os exemplos da folha 7) — a regra "anexo não carrega texto de música" não os alcança;
 * e a medição com sessão grava só hash.
 */
import type { Locator, Page } from '@playwright/test'
import { responder, segurar, type Resposta } from './g-faixa-auth'
import type { Estado } from './g-faixa-superficies'

/** O arquivo de uma música, como a folha o mostra (`partitura-12-paginas.pdf · 1,8 MiB`): `%PDF` + enchimento, 1,8 MiB. */
const CABECALHO_PDF = Buffer.from('%PDF-1.7\n% fixture do G-faixa (I1-PR-12)\n')
export const ARQUIVO_PDF = {
  name: 'partitura-12-paginas.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.concat([CABECALHO_PDF, Buffer.alloc(Math.round(1.8 * 1024 * 1024) - CABECALHO_PDF.length, 0x20)]),
}

/** O lote da folha (`UP-lote`): as quatro músicas, separadas por `---` (`lib/batch-import.ts`, `parseTextContent`). */
export const ARQUIVO_LOTE = {
  name: 'repertorio.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from(['Anunciação', 'primeira linha da música um', '---', 'Asa branca', 'primeira linha da música dois', '---',
    'Batch dois', 'primeira linha da música três', '---', 'Batch três', 'primeira linha da música quatro'].join('\n')),
}

/** O `url` que o upload fabricado devolve: um host do Storage que não existe (nada é lido dele no upload). */
export const URL_FABRICADA = 'https://g-faixa.supabase.co/storage/v1/object/public/content-files/g-faixa-upload'
export const ID_NOVO = 'g-faixa-novo'
/** Os exemplos da folha nos campos (`UP-detalhes`): o título e o artista. */
export const EXEMPLO = { titulo: 'Partitura de 12 páginas', artista: 'Compositor anônimo' }

/** `POST /api/storage/upload` fabricado (201 com o `url`, um erro, segurado ou abortado). */
export async function envio(page: Page, r: Resposta) {
  await page.route(/\/api\/storage\/upload$/, (rt) => (rt.request().method() === 'POST' ? responder(rt, r) : rt.fallback()))
}
export const ENVIO_OK: Resposta = { status: 201, corpo: { url: URL_FABRICADA, path: 'g-faixa-upload', success: true } }

/** `POST /api/content` fabricado: 201 ecoando o corpo com um id; ou um erro, segurado, abortado. */
export async function criacao(page: Page, r: Resposta | 'ecoar') {
  await page.route(/\/api\/content$/, async (rt) => {
    if (rt.request().method() !== 'POST') return rt.fallback()
    if (r !== 'ecoar') return responder(rt, r)
    const corpo = JSON.parse(rt.request().postData() ?? '{}') as Record<string, unknown>
    return responder(rt, { status: 201, corpo: { ...corpo, id: ID_NOVO } })
  })
}

/** A navegação ao content criado, segurada: a tela fica no pronto. */
export async function segurarNavegacao(page: Page) {
  await page.route(new RegExp(`/content/${ID_NOVO}`), (rt) => segurar(page, rt))
}

/**
 * Clica até o efeito aparecer: no `next dev` o HTML do SSR chega antes da hidratação e o 1º clique se perde (div. 795,
 * I1-PR-11).
 */
export async function clicarAte(alvo: Locator, efeito: Locator) {
  await alvo.first().waitFor({ state: 'visible', timeout: 60_000 })
  for (let i = 0; i < 20; i++) {
    await alvo.first().click()
    if (await efeito.first().waitFor({ state: 'visible', timeout: 1_500 }).then(() => true, () => false)) return
  }
  throw new Error('o efeito do clique não apareceu')
}

const arquivoInput = (p: Page) => p.locator('input[type=file]')

// ---- o web velho (commit 1b, o "antes"): os seletores da `main` ------------------------------------------------------
const V = {
  proximoCriar: (p: Page) => p.getByRole('button', { name: 'Next', exact: true }),
  importar: (p: Page) => p.getByText('Import from File', { exact: true }),
  escolher: (p: Page) => p.getByRole('button', { name: 'Browse files' }),
  lote: (p: Page) => p.getByText('Batch Import', { exact: true }),
  salvar: (p: Page) => p.getByRole('button', { name: 'Save Content' }),
  importarTodas: (p: Page) => p.getByRole('button', { name: 'Import All' }),
}
const velhoZona = async (p: Page) => { await clicarAte(V.importar(p), V.escolher(p)) }
const velhoDetalhes = async (p: Page) => {
  await velhoZona(p)
  await arquivoInput(p).setInputFiles(ARQUIVO_PDF)
  await V.salvar(p).waitFor({ state: 'visible', timeout: 60_000 })
  await p.locator('#title').fill(EXEMPLO.titulo)
  await p.locator('#artist').fill(EXEMPLO.artista)
}

/** Os estados do web velho — a `casca-efeito` do upload (antes × depois), sem seção da folha. */
export const ESTADOS_UPLOAD_ANTES: Record<string, Estado> = {
  // abre: Letra + Criar (o passo 1 com os seletores e, abaixo, o criar)
  'base-criar': { preparar: async (p) => { await V.proximoCriar(p).waitFor({ state: 'visible', timeout: 60_000 }) } },
  // *Import from File*: o passo 1 com a zona abaixo
  'base-arquivo': { preparar: velhoZona },
  // o upload fabricado 201 → o passo 2 (o formulário), título e artista da folha
  'base-detalhes': { antes: (p) => envio(p, ENVIO_OK), preparar: velhoDetalhes },
  // *Batch Import* + o lote da folha → a prévia do lote
  'base-lote': {
    antes: (p) => envio(p, ENVIO_OK),
    preparar: async (p) => {
      await velhoZona(p)
      await clicarAte(V.lote(p), p.getByText('Import multiple songs from one file.'))
      await arquivoInput(p).setInputFiles(ARQUIVO_LOTE)
      await V.importarTodas(p).waitFor({ state: 'visible', timeout: 60_000 })
    },
  },
  // o salvar fabricado 201 + a navegação segurada → o pronto (que hoje pisca)
  'base-pronto': {
    antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, 'ecoar'); await segurarNavegacao(p) },
    preparar: async (p) => {
      await velhoDetalhes(p)
      await V.salvar(p).click()
      await p.getByText(/Done!/).first().waitFor({ state: 'visible', timeout: 60_000 })
    },
  },
}
