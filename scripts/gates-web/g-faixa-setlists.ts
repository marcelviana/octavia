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
 * Commit 1: os estados `base-*` do web VELHO (o código do app é o da `main`) — o "antes" da `casca-efeito`, com os
 * seletores de hoje (inglês). O commit 2 acrescenta os 20 estados da folha e troca os seletores dos `base-*`.
 *
 * Os textos são obra do projeto (os exemplos da folha 8) — a regra "anexo não carrega texto de música" não os alcança;
 * e a medição com sessão grava só hash.
 */
import type { Page } from '@playwright/test'
import { responder, type Resposta } from './g-faixa-auth'
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
  c('g-s6', 'Verso curto', 'Teste de régua', 'Chords'),
  c('g-s7', 'Compasso de espera', 'Teste de régua', 'Tab'),
  c('g-s8', 'Régua de 80 colunas', 'Teste de régua', 'Lyrics'),
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

export interface Fabrica { setlists?: Resposta; biblioteca?: Resposta; escrita?: Resposta }

/** As leituras fabricadas e TODA escrita a `/api/setlists*` respondida no navegador (200 genérico, se o estado não disser). */
export async function fabricar(page: Page, f: Fabrica = {}) {
  await page.route(/\/api\/content(\?|$)/, (rt) => (rt.request().method() === 'GET' ? responder(rt, f.biblioteca ?? PAGINA(BIBLIOTECA)) : rt.fallback()))
  await page.route(/\/api\/setlists(\/|$|\?)/, (rt) =>
    rt.request().method() === 'GET' ? responder(rt, f.setlists ?? { corpo: SETLISTS }) : responder(rt, f.escrita ?? { corpo: { success: true } }))
}

// ---- os seletores do web VELHO (commit 1: o "antes") ----------------------------------------------------------------
const V = {
  cartao: (p: Page, nome: string) => p.getByText(nome, { exact: true }).first(), // o `CardTitle` é um `div`
  botao: (p: Page, nome: string) => p.getByRole('button', { name: nome, exact: true }),
  dialogo: (p: Page) => p.getByRole('dialog'),
}
const lista = async (p: Page) => { await V.cartao(p, 'Show padrão').waitFor({ state: 'visible', timeout: 60_000 }) }
const abrir = async (p: Page) => { await lista(p); await clicarAte(V.cartao(p, 'Show padrão'), p.getByText('Garota de Ipanema')) }

/**
 * Os cinco estados do "antes" (sem seção da folha): o que o web velho alcança sem escrever — a lista, a setlist aberta,
 * o formulário, o diálogo de apagar, o picker. No commit 2 os mesmos cinco pontos, com os seletores novos (o "depois").
 */
export const ESTADOS_SETLISTS_BASE: Record<string, Estado> = {
  'base-lista': { antes: (p) => fabricar(p), preparar: lista, espera: 'Show padrão' },
  'base-detalhe': { antes: (p) => fabricar(p), preparar: abrir, espera: 'Garota de Ipanema' },
  'base-formulario': {
    antes: (p) => fabricar(p), espera: 'Create New Setlist',
    preparar: async (p) => { await lista(p); await clicarAte(V.botao(p, 'Create Setlist'), V.dialogo(p)) },
  },
  'base-dialogo': {
    antes: (p) => fabricar(p), espera: 'Delete Setlist',
    // o *Delete setlist* do cartão de "Show padrão" (o 2º): só aparece no hover — o clique o alcança do mesmo jeito
    preparar: async (p) => { await lista(p); await clicarAte(p.getByRole('button', { name: 'Delete setlist' }).nth(1), V.dialogo(p)) },
  },
  'base-picker': {
    antes: (p) => fabricar(p), espera: 'Add Songs to Setlist',
    preparar: async (p) => { await abrir(p); await clicarAte(V.botao(p, 'Add Songs'), V.dialogo(p)) },
  },
}
