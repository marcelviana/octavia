/**
 * G-faixa — as setlists fabricadas (`/setlists`, folha 8-setlists; I1-PR-13).
 *
 * `/setlists` é CLIENTE (o SSR só confere a sessão): lê `GET /api/setlists` e `GET /api/content` e escreve por cinco
 * rotas (`POST /api/setlists`, `PUT`/`DELETE /api/setlists/{id}`, `POST /api/setlists/{id}/songs`, `DELETE
 * /api/setlists/songs/{id}`). Aqui TUDO é fabricado no navegador (`page.route`, `x-g-faixa: fabricado`): as duas
 * leituras respondem com as linhas da folha — nenhuma setlist nem content da conta é lido — e nenhuma escrita sai. Uma
 * escrita que escapasse cairia na barreira do medidor (abortada, a rodada reprova). Lidos de verdade só a sessão
 * (`/api/profile`, o `securetoken`).
 *
 * Commit 1: os estados `base-*` do web VELHO (o código do app era o da `main`) — o "antes" da `casca-efeito`, medido
 * sobre `aa772df`. Commit 2: os 20 estados da folha `8-setlists`; o editar contra as seções `SET-criar*` e a N10 contra
 * `SET-adicionar-vazio` (decisão 20 do aval); `SESSAO-nao-renovada` (sem seção nesta folha); e os mesmos cinco `base-*`,
 * agora com os seletores das setlists novas (o "depois").
 *
 * Os textos são obra do projeto (os exemplos da folha 8) — a regra "anexo não carrega texto de música" não os alcança;
 * e a medição com sessão grava só hash.
 */
import type { Page } from '@playwright/test'
import { responder, segurar, type Resposta } from './g-faixa-auth'
import { clicarAte } from './g-faixa-upload'
import type { Estado } from './g-faixa-superficies'

const T = '2026-09-10T15:00:00Z'
interface Conteudo { id: string; title: string; artist: string | null; content_type: string; bpm: number | null }
const c = (id: string, title: string, artist: string | null, content_type: string, bpm: number | null = null): Conteudo => ({ id, title, artist, content_type, bpm })

/** As cinco linhas que a folha desenha em *Show padrão* + três (a folha escreve "8 músicas · 32 min"). */
const DO_SHOW: Conteudo[] = [
  c('g-s1', 'Garota de Ipanema', 'Tom Jobim', 'Chords'),
  c('g-s2', 'Construção', 'Chico Buarque', 'Lyrics'),
  c('g-s3', 'Trenzinho do caipira', 'Villa-Lobos', 'Tab'),
  c('g-s4', 'Anunciação', 'Alceu Valença', 'Lyrics'),
  c('g-s5', 'Partitura de 12 páginas', 'Compositor anônimo', 'Sheet'),
  // (o artista destas três não repete nenhum texto da folha: o par com a folha é pelo texto, na ordem)
  c('g-s6', 'Verso curto', 'Autor de teste', 'Chords'),
  c('g-s7', 'Compasso de espera', 'Autor de teste', 'Tab'),
  c('g-s8', 'Régua de 80 colunas', 'Autor de teste', 'Lyrics'),
]
/** As quatro que o picker da folha lista (`SET-adicionar`), na ordem dela (título A–Z). */
const DISPONIVEIS: Conteudo[] = [
  c('g-d1', 'Asa branca', 'Luiz Gonzaga', 'Lyrics'),
  c('g-d2', 'Batch dois', null, 'Lyrics'),
  c('g-d3', 'Batch três', null, 'Lyrics'),
  c('g-d4', 'Linha de 120 colunas', 'Teste de régua', 'Chords'),
]
/** *Estresse*: 60 músicas e "4 h 6 min" — 58 × 4 min + 2 × 7 min (BPM 140: `bpm / 60 × 3`, a conta de hoje). */
const DO_ESTRESSE: Conteudo[] = Array.from({ length: 60 }, (_, i) =>
  c(`g-e${i + 1}`, `Música de estresse ${String(i + 1).padStart(2, '0')}`, 'Teste de régua', 'Lyrics', i < 2 ? 140 : null))

const comoNaRota = (x: Conteudo) => ({ id: x.id, title: x.title, artist: x.artist, content_type: x.content_type, key: null, bpm: x.bpm, file_url: null, content_data: null })
const setlist = (id: string, name: string, description: string | null, musicas: Conteudo[]) => ({
  id, user_id: 'g-faixa', name, description, performance_date: null, venue: null, notes: null, created_at: T, updated_at: T,
  setlist_songs: musicas.map((m, i) => ({ id: `${id}-linha-${i + 1}`, setlist_id: id, content_id: m.id, position: i + 1, notes: null, content: comoNaRota(m) })),
})

/** O que `GET /api/setlists` devolve: as três setlists da folha, na ordem dela. */
export const SETLISTS = [
  setlist('g-set-estresse', 'Estresse', null, DO_ESTRESSE),
  setlist('g-set-show', 'Show padrão', 'show completo com bloco acústico e bloco elétrico', DO_SHOW),
  setlist('g-set-solo', 'Solo', null, [DO_SHOW[0] as Conteudo]),
]
const linhaDaBiblioteca = (x: Conteudo) => ({
  ...comoNaRota(x), user_id: 'g-faixa', album: null, genre: null, difficulty: null, time_signature: null, tags: null, notes: null,
  capo: null, tuning: null, thumbnail_url: null, is_favorite: false, is_public: false, created_at: T, updated_at: T,
})
/** O que `GET /api/content` devolve: as do show + as quatro disponíveis (12 — cabe no teto de 100 da rota). */
const BIBLIOTECA = [...DO_SHOW, ...DISPONIVEIS].map(linhaDaBiblioteca)
const PAGINA = (data: unknown[]): Resposta => ({ corpo: { data, total: data.length, page: 1, pageSize: 100, hasMore: false, totalPages: 1 } })

export interface Fabrica {
  /** `GET /api/setlists`, em sequência (a última se repete) — a 2ª é a lista RELIDA depois de um 404 */
  setlists?: Resposta[]
  biblioteca?: Resposta
  /** toda escrita a `/api/setlists*` (200 genérico, se o estado não disser) */
  escrita?: Resposta
}

/** As leituras fabricadas e TODA escrita a `/api/setlists*` respondida no navegador — nenhuma sai. */
export async function fabricar(page: Page, f: Fabrica = {}) {
  let n = 0
  const listas = f.setlists ?? [{ corpo: SETLISTS }]
  await page.route(/\/api\/content(\?|$)/, (rt) => (rt.request().method() === 'GET' ? responder(rt, f.biblioteca ?? PAGINA(BIBLIOTECA)) : rt.fallback()))
  await page.route(/\/api\/setlists(\/|$|\?)/, (rt) =>
    rt.request().method() === 'GET' ? responder(rt, listas[Math.min(n++, listas.length - 1)] as Resposta) : responder(rt, f.escrita ?? { corpo: { success: true } }))
}

const SEM_O_SHOW = SETLISTS.filter((s) => s.id !== 'g-set-show')
const SHOW_SEM_MUSICAS = SETLISTS.map((s) => (s.id === 'g-set-show' ? { ...s, setlist_songs: [] } : s))
const ERRO_500: Resposta = { status: 500, corpo: { error: 'x', code: 'INTERNAL_ERROR' } }
const NAO_ENCONTRADA: Resposta = { status: 404, corpo: { error: 'Setlist not found', code: 'NOT_FOUND' } }

// ---- os seletores das setlists novas (a folha `8-setlists`) ---------------------------------------------------------
const N = {
  cartao: (p: Page, nome: string) => p.getByRole('button', { name: new RegExp(`^${nome}(\\s|$)`, 'i') }).first(),
  botao: (p: Page, nome: string | RegExp) => p.getByRole('button', { name: nome, exact: true }),
  dialogo: (p: Page) => p.getByRole('dialog'),
  /** o *Adicionar músicas* do cabeçalho: rótulo curto em B e A, o mesmo nome acessível longo nas três faixas */
  adicionarMusicas: (p: Page) => p.getByRole('button', { name: 'Adicionar músicas a Show padrão', exact: true }),
}
const SHOW = 'Show padrão'
/** A lista carregada (os três cartões). */
const lista = async (p: Page) => { await N.botao(p, `Apagar a setlist ${SHOW}`).waitFor({ state: 'visible', timeout: 60_000 }) }
/** *Show padrão* aberta: o clique no cartão até o cabeçalho dela aparecer. */
const abrir = async (p: Page) => { await lista(p); await clicarAte(N.cartao(p, SHOW), N.adicionarMusicas(p)) }
const formulario = (comNome: boolean) => async (p: Page) => {
  await abrir(p)
  await clicarAte(N.botao(p, 'Nova setlist'), N.dialogo(p))
  if (comNome) await p.getByTestId('campo-nome').fill('Ensaio de sexta')
}
const criar = async (p: Page) => { await formulario(true)(p); await N.botao(p, 'Criar').click() }
const editar = async (p: Page) => { await abrir(p); await clicarAte(N.botao(p, 'Editar'), N.dialogo(p)) }
const salvar = async (p: Page) => { await editar(p); await N.botao(p, 'Salvar').click() }
const pedirApagar = async (p: Page) => { await abrir(p); await clicarAte(N.botao(p, `Apagar a setlist ${SHOW}`), N.dialogo(p)) }
const apagar = async (p: Page) => { await pedirApagar(p); await N.dialogo(p).getByRole('button', { name: 'Apagar', exact: true }).click() }
const picker = async (p: Page) => { await abrir(p); await clicarAte(N.adicionarMusicas(p), N.dialogo(p)) }
const marcarTres = async (p: Page) => {
  await picker(p)
  for (const t of ['Asa branca', 'Batch dois', 'Batch três']) await N.dialogo(p).getByText(t, { exact: true }).click()
}
const adicionar = async (p: Page) => { await marcarTres(p); await N.botao(p, `Adicionar 3 músicas a ${SHOW}`).click() }
/** A renovação da sessão falha (o molde da I1-PR-9): o `POST` fabricado 500 e um `visibilitychange`. */
async function renovacaoFalha(p: Page) {
  await lista(p)
  await p.route(/\/api\/auth\/session$/, (rt) => (rt.request().method() === 'POST' ? responder(rt, { status: 500, corpo: { error: 'x' } }) : rt.fallback()))
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
}

/**
 * Os 20 estados da folha `8-setlists`, TUDO fabricado; mais o editar (contra `SET-criar*`) e a N10 (contra
 * `SET-adicionar-vazio`) — decisão 20 do aval — e a linha da sessão. Inalcançáveis com a sessão do perfil, declarados no
 * README da PR: o *carregando as setlists…* pelo `isLoading` do Firebase e pelo "sem usuário" — a tela é a MESMA do
 * `SET-carregando`, aqui alcançada pelo pedaço do `dynamic` segurado.
 */
export const ESTADOS_SETLISTS: Record<string, Estado> = {
  'SET-carregando': {
    secao: 'SET-carregando', espera: 'carregando as setlists…',
    // o pedaço do `dynamic` (next dev: `…components_setlist-manager_tsx…`) — segurado [hipótese sobre o nome]
    antes: async (p) => { await fabricar(p); await p.route(/\/_next\/static\/chunks\/[^/]*components_setlist-manager/, (rt) => segurar(p, rt)) },
  },
  'SET-carregando-dados': { secao: 'SET-carregando-dados', antes: (p) => fabricar(p, { setlists: ['segurar'] }), preparar: async (p) => { await p.locator('[aria-busy="true"]').waitFor({ state: 'visible', timeout: 60_000 }) } },
  'SET-vazio': { secao: 'SET-vazio', antes: (p) => fabricar(p, { setlists: [{ corpo: [] }] }), espera: 'nenhuma setlist ainda' },
  'SET-erro': { secao: 'SET-erro', antes: (p) => fabricar(p, { setlists: ['abortar'] }), espera: 'não foi possível carregar as setlists — sem conexão' },
  'SET-nenhuma': { secao: 'SET-nenhuma', antes: (p) => fabricar(p), preparar: lista, espera: 'escolha uma setlist para ver os detalhes' },
  SET: { secao: 'SET', antes: (p) => fabricar(p), preparar: abrir, espera: 'Garota de Ipanema' },
  'SET-sem-musicas': { secao: 'SET-sem-musicas', antes: (p) => fabricar(p, { setlists: [{ corpo: SHOW_SEM_MUSICAS }] }), preparar: abrir, espera: 'nenhuma música ainda' },
  'SET-criar': { secao: 'SET-criar', antes: (p) => fabricar(p), preparar: formulario(true), espera: 'Data do show' },
  'SET-criar-validacao': { secao: 'SET-criar-validacao', antes: (p) => fabricar(p), preparar: formulario(false), espera: 'a setlist precisa de um nome' },
  'SET-criar-salvando': { secao: 'SET-criar-salvando', antes: (p) => fabricar(p, { escrita: 'segurar' }), preparar: criar, espera: 'Criando…' },
  'SET-criar-erro': { secao: 'SET-criar-erro', antes: (p) => fabricar(p, { escrita: 'abortar' }), preparar: criar, espera: 'não foi possível criar a setlist — sem conexão' },
  'SET-apagar': { secao: 'SET-apagar', antes: (p) => fabricar(p), preparar: pedirApagar, espera: 'não dá para desfazer' },
  'SET-apagar-erro': { secao: 'SET-apagar-erro', antes: (p) => fabricar(p, { escrita: ERRO_500 }), preparar: apagar, espera: 'não foi possível apagar a setlist — falha no servidor' },
  'SET-ja-apagada': {
    secao: 'SET-ja-apagada', espera: 'esta setlist já foi apagada',
    antes: (p) => fabricar(p, { setlists: [{ corpo: SETLISTS }, { corpo: SEM_O_SHOW }], escrita: NAO_ENCONTRADA }), preparar: apagar,
  },
  'SET-adicionar': { secao: 'SET-adicionar', antes: (p) => fabricar(p), preparar: marcarTres, espera: 'Adicionar 3' },
  'SET-adicionar-vazio': { secao: 'SET-adicionar-vazio', antes: (p) => fabricar(p, { biblioteca: PAGINA([]) }), preparar: picker, espera: 'nenhuma música disponível' },
  'SET-adicionar-busca': {
    secao: 'SET-adicionar-busca', antes: (p) => fabricar(p), espera: 'nada encontrado',
    preparar: async (p) => { await picker(p); await p.getByRole('searchbox', { name: 'buscar por título, artista ou tipo' }).fill('xablau') },
  },
  'SET-adicionar-enviando': { secao: 'SET-adicionar-enviando', antes: (p) => fabricar(p, { escrita: 'segurar' }), preparar: adicionar, espera: 'Adicionando…' },
  'SET-adicionar-erro': { secao: 'SET-adicionar-erro', antes: (p) => fabricar(p, { escrita: ERRO_500 }), preparar: adicionar, espera: 'não foi possível adicionar as músicas — falha no servidor' },
  'SET-remover-erro': {
    secao: 'SET-remover-erro', antes: (p) => fabricar(p, { escrita: 'abortar' }), espera: 'não foi possível remover “Construção” — sem conexão',
    preparar: async (p) => { await abrir(p); await N.botao(p, 'Remover Construção da setlist').click() },
  },
  // decisão 20 do aval: o editar é o MESMO diálogo — medido contra as seções do criar (o título e o botão saem "sem par")
  'SET-editar': { secao: 'SET-criar', antes: (p) => fabricar(p), preparar: editar, espera: 'Editar setlist' },
  'SET-editar-salvando': { secao: 'SET-criar-salvando', antes: (p) => fabricar(p, { escrita: 'segurar' }), preparar: salvar, espera: 'Salvando…' },
  'SET-editar-erro': { secao: 'SET-criar-erro', antes: (p) => fabricar(p, { escrita: 'abortar' }), preparar: salvar, espera: 'não foi possível salvar a setlist — sem conexão' },
  // N10 (decisão 20): a biblioteca inteira já está na setlist — contra a seção do picker vazio
  'SET-adicionar-todas-ja': {
    secao: 'SET-adicionar-vazio', antes: (p) => fabricar(p, { biblioteca: PAGINA(DO_SHOW.map(linhaDaBiblioteca)) }), preparar: picker,
    espera: 'todas as músicas da biblioteca já estão nesta setlist',
  },
  // a linha da sessão na tela (folha 4, `SESSAO-nao-renovada`: "logo abaixo do título", em toda tela) — sem seção nesta folha
  'SESSAO-nao-renovada': { antes: (p) => fabricar(p), preparar: renovacaoFalha, espera: 'a sessão não foi renovada' },
}

/**
 * Os cinco estados do "antes" (sem seção da folha), para a `casca-efeito` (antes × depois): o MESMO ponto do fluxo que o
 * commit 1 mediu no web velho (`aa772df`), agora nas setlists novas.
 */
export const ESTADOS_SETLISTS_BASE: Record<string, Estado> = {
  'base-lista': { antes: (p) => fabricar(p), preparar: lista, espera: 'Show padrão' },
  'base-detalhe': { antes: (p) => fabricar(p), preparar: abrir, espera: 'Garota de Ipanema' },
  'base-formulario': { antes: (p) => fabricar(p), preparar: async (p) => { await lista(p); await clicarAte(N.botao(p, 'Nova setlist'), N.dialogo(p)) }, espera: 'Data do show' },
  'base-dialogo': { antes: (p) => fabricar(p), preparar: async (p) => { await lista(p); await clicarAte(N.botao(p, `Apagar a setlist ${SHOW}`), N.dialogo(p)) }, espera: 'Apagar setlist' },
  'base-picker': { antes: (p) => fabricar(p), preparar: picker, espera: 'Adicionar a Show padrão' },
}
