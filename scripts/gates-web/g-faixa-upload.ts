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
 * Commit 1b: os estados `base-*` do web VELHO (o código do app era o da `main`) — o "antes" da `casca-efeito`
 * (decisão 1 do aval), medido sobre `7b33d06`. Commit 2: os 21 estados da folha `7-upload` (20 seções + `UP-lote-lendo`,
 * I1-E2, contra a seção `UP-lote`) e os mesmos cinco `base-*`, agora com os seletores do upload novo (o "depois").
 *
 * Os textos são obra do projeto (os exemplos da folha 7) — a regra "anexo não carrega texto de música" não os alcança;
 * e a medição com sessão grava só hash.
 */
import type { Locator, Page } from '@playwright/test'
import { PDFDocument, StandardFonts } from 'pdf-lib'
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
    // o efeito já veio (o clique anterior valeu): não clica de novo — o alvo pode já ser outro botão de mesmo nome
    if (await efeito.first().isVisible().catch(() => false)) return
    await alvo.first().click()
    if (await efeito.first().waitFor({ state: 'visible', timeout: 1_500 }).then(() => true, () => false)) return
  }
  throw new Error('o efeito do clique não apareceu')
}

const arquivoInput = (p: Page) => p.locator('input[type=file]')

/** O lote como a folha o nomeia (`repertorio.docx`): o MESMO texto, com o tipo `text/plain` — é por ele que o app escolhe o leitor. */
export const ARQUIVO_LOTE_DA_FOLHA = { ...ARQUIVO_LOTE, name: 'repertorio.docx' }
/** Um lote sem música nenhuma (só linhas em branco): `parseTextContent` devolve 0. */
export const ARQUIVO_LOTE_VAZIO = { name: 'repertorio.docx', mimeType: 'text/plain', buffer: Buffer.from('\n\n\n') }
/** O tipo não aceito da folha (`UP-extensao`): o cliente o recusa pela extensão — nenhum request. */
export const ARQUIVO_RECUSADO = { name: 'foto.heic', mimeType: 'image/heic', buffer: Buffer.from('fixture do G-faixa') }
/** 5 MiB gerados em memória (`UP-limite`): o `POST` fabricado responde o 400 do contrato — o arquivo NÃO sai. */
export const ARQUIVO_GRANDE = { name: 'partitura-12-paginas.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([CABECALHO_PDF, Buffer.alloc(5 * 1024 * 1024 - CABECALHO_PDF.length, 0x20)]) }
const LIMITE_400: Resposta = { status: 400, corpo: { error: 'Validation failed', code: 'VALIDATION_ERROR', details: [{ field: 'size', message: 'File exceeds the 4MB limit', code: 'too_big' }] } }
const ERRO_500: Resposta = { status: 500, corpo: { error: 'x', code: 'INTERNAL_ERROR' } }

let pdfDoLote: Buffer | null = null
/** Um lote em PDF (para `UP-lote-lendo`: o worker do pdf.js fica segurado e a leitura não termina). */
async function loteEmPdf() {
  if (!pdfDoLote) {
    const doc = await PDFDocument.create()
    const fonte = await doc.embedFont(StandardFonts.HelveticaBold)
    doc.addPage([612, 792]).drawText('Anunciacao (fixture do G-faixa)', { x: 60, y: 730, size: 14, font: fonte })
    pdfDoLote = Buffer.from(await doc.save())
  }
  return { name: 'repertorio.pdf', mimeType: 'application/pdf', buffer: pdfDoLote }
}

// ---- o upload novo (commit 2): os seletores da folha ----------------------------------------------------------------
const N = {
  escolha: (p: Page, nome: string | RegExp) => p.getByRole('radio', { name: nome }),
  botao: (p: Page, nome: string) => p.getByRole('button', { name: nome, exact: true }),
  zona: (p: Page) => p.getByTestId('zona-arquivo'),
}
/** Marca a escolha — repetido até `aria-checked` (o clique antes da hidratação se perde, div. 795). */
async function marcar(p: Page, nome: string | RegExp) {
  const e = N.escolha(p, nome).first()
  await e.waitFor({ state: 'visible', timeout: 60_000 })
  for (let i = 0; i < 20; i++) {
    if ((await e.getAttribute('aria-checked')) === 'true') return
    await e.click()
    await p.waitForTimeout(300)
  }
  throw new Error(`a escolha ${String(nome)} não ficou marcada`)
}
const IMPORTAR = /^Importar de arquivo/
/** Do passo 1 à zona: *Importar de arquivo* (e *Várias músicas*), *Próximo*. O tipo é o de abertura, **Letra** (decisão 4). */
async function ateAZona(p: Page, lote = false) {
  await marcar(p, IMPORTAR)
  if (lote) await marcar(p, 'Várias músicas num arquivo')
  await clicarAte(N.botao(p, 'Próximo'), N.zona(p))
}
const enviar = (arq: { name: string; mimeType: string; buffer: Buffer }, lote = false) => async (p: Page) => {
  await ateAZona(p, lote)
  await arquivoInput(p).setInputFiles(arq)
}
/** Até o formulário, com os exemplos da folha: o título e (salvo no `-inativo`) o artista. Nada sai: é digitação. */
const ateOFormulario = (comArtista = true) => async (p: Page) => {
  await enviar(ARQUIVO_PDF)(p)
  await p.getByTestId('campo-titulo').waitFor({ state: 'visible', timeout: 60_000 })
  await p.getByTestId('campo-titulo').fill(EXEMPLO.titulo)
  if (comArtista) await p.getByTestId('campo-artista').fill(EXEMPLO.artista)
}
const salvar = async (p: Page) => { await ateOFormulario()(p); await N.botao(p, 'Salvar').click() }
/** Até a prévia do lote, com os artistas da folha nas duas primeiras (as outras ficam com o que o app põe). */
const ateOLote = (arq = ARQUIVO_LOTE_DA_FOLHA) => async (p: Page) => {
  await enviar(arq, true)(p)
  await N.botao(p, 'Importar todas').waitFor({ state: 'visible', timeout: 60_000 })
  const artistas = p.getByTestId('campo-lote-artista')
  await artistas.nth(0).fill('Alceu Valença')
  await artistas.nth(1).fill('Luiz Gonzaga')
}
const importar = async (p: Page) => { await ateOLote()(p); await N.botao(p, 'Importar todas').click() }
const aoCriar = async (p: Page) => {
  await N.escolha(p, 'Letra').first().waitFor({ state: 'visible', timeout: 60_000 })
  await clicarAte(N.botao(p, 'Próximo'), p.getByTestId('campo-criar-titulo'))
}
const CRIADO: Resposta = { status: 201, corpo: { id: ID_NOVO, title: EXEMPLO.titulo, artist: EXEMPLO.artista } }

/**
 * Os 21 estados da folha `7-upload`, TUDO fabricado. `UP-como` com **Letra** (decisão 4 do aval: a partitura esconde o
 * *como*). `UP-lote-lendo` (I1-E2) mede contra a seção `UP-lote` (decisão 13). Inalcançáveis com a sessão do perfil,
 * declarados no README da PR (§7): o *carregando…* pelo `isLoading` do Firebase e pelo "sem usuário" — a tela é a
 * MESMA do `UP-carregando`, aqui alcançada pelo pedaço do `dynamic` segurado.
 */
export const ESTADOS_UPLOAD: Record<string, Estado> = {
  'UP-carregando': {
    secao: 'UP-carregando', espera: 'carregando…',
    // o pedaço do `dynamic` (next dev: `…components_add-content_tsx…`) — segurado [hipótese sobre o nome]
    antes: async (p) => { await p.route(/\/_next\/static\/chunks\/[^/]*components_add-content/, (rt) => segurar(p, rt)) },
  },
  'UP-como': { secao: 'UP-como', preparar: (p) => marcar(p, IMPORTAR), espera: 'como você quer adicionar?' },
  'UP-arquivo': { secao: 'UP-arquivo', preparar: (p) => ateAZona(p), espera: 'arraste o arquivo para cá' },
  'UP-enviando': { secao: 'UP-enviando', antes: (p) => envio(p, 'segurar'), preparar: enviar(ARQUIVO_PDF), espera: 'enviando o arquivo…' },
  'UP-extensao': { secao: 'UP-extensao', preparar: enviar(ARQUIVO_RECUSADO), espera: 'tipo de arquivo não aceito: foto.heic' },
  'UP-limite': { secao: 'UP-limite', antes: (p) => envio(p, LIMITE_400), preparar: enviar(ARQUIVO_GRANDE), espera: 'o arquivo passa de 4 MiB — escolha um menor' },
  'UP-envio-rede': { secao: 'UP-envio-rede', antes: (p) => envio(p, 'abortar'), preparar: enviar(ARQUIVO_PDF), espera: 'o arquivo não foi enviado — sem conexão' },
  'UP-envio-servidor': { secao: 'UP-envio-servidor', antes: (p) => envio(p, ERRO_500), preparar: enviar(ARQUIVO_PDF), espera: 'o arquivo não foi enviado — falha no servidor' },
  'UP-detalhes': { secao: 'UP-detalhes', antes: (p) => envio(p, ENVIO_OK), preparar: ateOFormulario(), espera: 'Opções avançadas' },
  'UP-detalhes-inativo': { secao: 'UP-detalhes-inativo', antes: (p) => envio(p, ENVIO_OK), preparar: ateOFormulario(false), espera: 'título e artista são obrigatórios' },
  'UP-salvando': { secao: 'UP-salvando', antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, 'segurar') }, preparar: salvar, espera: 'Salvando…' },
  'UP-salvar-erro': { secao: 'UP-salvar-erro', antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, ERRO_500) }, preparar: salvar, espera: 'não foi possível salvar — falha no servidor' },
  'UP-criar': { secao: 'UP-criar', preparar: aoCriar },
  'UP-criar-validacao': { secao: 'UP-criar-validacao', preparar: async (p) => { await aoCriar(p); await N.botao(p, 'Próximo').click() }, espera: 'o título é obrigatório' },
  'UP-lote': { secao: 'UP-lote', antes: (p) => envio(p, ENVIO_OK), preparar: ateOLote(), espera: '4 músicas encontradas em repertorio.docx' },
  'UP-lote-lendo': {
    secao: 'UP-lote', espera: 'carregando…',
    // o worker do pdf.js (`lib/pdf-utils.ts`: `/pdf.worker.min.mjs`) segurado: a leitura do lote em PDF não termina
    antes: async (p) => { await envio(p, ENVIO_OK); await p.route(/\/pdf\.worker\.min\.mjs/, (rt) => segurar(p, rt)) },
    preparar: async (p) => { await enviar(await loteEmPdf(), true)(p) },
  },
  'UP-lote-importando': { secao: 'UP-lote-importando', antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, 'segurar') }, preparar: importar, espera: 'Importando…' },
  'UP-lote-erro': { secao: 'UP-lote-erro', antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, ERRO_500) }, preparar: importar, espera: 'não foi possível importar as músicas — falha no servidor' },
  'UP-lote-vazio': { secao: 'UP-lote-vazio', antes: (p) => envio(p, ENVIO_OK), preparar: enviar(ARQUIVO_LOTE_VAZIO, true), espera: 'nenhuma música encontrada no arquivo' },
  'UP-lote-sucesso': { secao: 'UP-lote-sucesso', antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, 'ecoar') }, preparar: importar, espera: '4 músicas importadas' },
  'UP-pronto': {
    secao: 'UP-pronto', espera: 'está na biblioteca',
    antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, CRIADO); await segurarNavegacao(p) },
    preparar: salvar,
  },
}

/**
 * Os cinco estados do 1b, para a `casca-efeito` (antes × depois), sem seção da folha: o MESMO ponto do fluxo que o
 * "antes" mediu no web velho (`7b33d06`), agora no upload novo. `base-criar` é a tela como abre (antes, o passo 1 com o
 * criar abaixo; agora, o passo 1 sozinho).
 */
export const ESTADOS_UPLOAD_BASE: Record<string, Estado> = {
  'base-criar': { preparar: async (p) => { await N.botao(p, 'Próximo').waitFor({ state: 'visible', timeout: 60_000 }) } },
  'base-arquivo': { preparar: (p) => ateAZona(p) },
  'base-detalhes': { antes: (p) => envio(p, ENVIO_OK), preparar: ateOFormulario() },
  'base-lote': { antes: (p) => envio(p, ENVIO_OK), preparar: ateOLote(ARQUIVO_LOTE) },
  'base-pronto': { antes: async (p) => { await envio(p, ENVIO_OK); await criacao(p, 'ecoar'); await segurarNavegacao(p) }, preparar: salvar },
}
