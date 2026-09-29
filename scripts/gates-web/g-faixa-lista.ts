/**
 * G-faixa — os estados da superfície 4, content lista (I1-PR-9): `/dashboard` e
 * `/library`, com a SESSÃO REAL do perfil persistente (`G_FAIXA_PERFIL`) e as
 * respostas do app FABRICADAS no navegador (`page.route`, cabeçalho `x-g-faixa:
 * fabricado` — o molde, item 8). ZERO escrita: o `DELETE`/`PUT` de
 * `/api/content` e o `POST /api/auth/session` do estado da sessão respondem no
 * navegador e nada sai; a `GET /api/content` é leitura, fabricada para as linhas
 * da biblioteca serem as da folha (e parearem com ela).
 *
 * A biblioteca faz o SSR com a conta real e, 100 ms depois, a carga do cliente
 * (`use-library-data.ts`) — é essa que se fabrica, em SEQUÊNCIA (a 1ª, a 2ª…; a
 * última se repete). O painel é SSR puro (Supabase no servidor): `DASH-vazio` e
 * `DASH-erro` são inalcançáveis no navegador (div. 699; decisão 5 do aval — a
 * prova é o Vitest `components/painel/__tests__/painel-estados.test.tsx`).
 */
import type { Page } from '@playwright/test'
import { responder, segurar, type Resposta } from './g-faixa-auth'
import type { Estado } from './g-faixa-superficies'

/** As seis linhas da folha (`LIB`), obra do projeto; `total` 60 → três páginas, como a folha. */
const T = (dia: string) => `${dia}T15:00:00Z` // meio-dia em -03: a data curta não vira o dia
const LINHAS = [
  { id: 'g1', title: 'Garota de Ipanema', artist: 'Tom Jobim', album: 'Getz/Gilberto', content_type: 'Chords', is_favorite: true, created_at: T('2026-09-10') },
  { id: 'g2', title: 'Linha de 120 colunas', artist: 'Teste de régua', album: 'Compêndio sertanejo', content_type: 'Chords', is_favorite: false, created_at: T('2026-09-10') },
  { id: 'g3', title: 'Batch três', artist: null, album: null, content_type: 'Lyrics', is_favorite: false, created_at: T('2026-08-09') },
  { id: 'g4', title: 'Trenzinho do caipira', artist: 'Villa-Lobos', album: null, content_type: 'Tab', is_favorite: false, created_at: T('2026-08-08') },
  { id: 'g5', title: 'Partitura de 12 páginas', artist: 'Compositor anônimo', album: null, content_type: 'Sheet', is_favorite: false, created_at: T('2026-08-08') },
  { id: 'g6', title: 'Construção', artist: 'Chico Buarque', album: null, content_type: 'Lyrics', is_favorite: true, created_at: T('2026-08-02') },
].map((l) => ({ ...l, updated_at: l.created_at, user_id: 'g-faixa' }))

export const DADOS: Resposta = { corpo: { data: LINHAS, total: 60, page: 1, pageSize: 20, hasMore: true, totalPages: 3 } }
const VAZIO: Resposta = { corpo: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false, totalPages: 0 } }

/** A `GET /api/content` em sequência; o `DELETE`/`PUT` fabricados (200) para nenhum clique escrever. */
export async function conteudo(page: Page, sequencia: Resposta[]) {
  let n = 0
  await page.route(/\/api\/content(\?|$)/, (rt) => {
    const m = rt.request().method()
    if (m === 'GET') {
      const r = sequencia[Math.min(n++, sequencia.length - 1)] as Resposta
      return r === 'segurar' ? segurar(page, rt) : responder(rt, r)
    }
    return responder(rt, { corpo: { ok: true } })
  })
}

/** Espera a 1ª carga do cliente (a que troca a lista do SSR) chegar e a tela assentar nela. */
async function primeiraCarga(page: Page, texto: string) {
  await page.getByText(texto, { exact: false }).first().waitFor({ state: 'visible', timeout: 30_000 })
}

/** Um filtro (Cifra) e fecha o menu — dispara a 2ª carga da sequência. */
async function filtrar(page: Page) {
  await page.getByRole('button', { name: /^Filtros/ }).click()
  await page.getByRole('button', { name: 'Cifra', exact: true }).click()
  await page.keyboard.press('Escape')
}

const ESTADOS_LIB: Record<string, Estado> = {
  LIB: { secao: 'LIB', espera: 'Garota de Ipanema', antes: (p) => conteudo(p, [DADOS]) },
  'LIB-filtros': {
    secao: 'LIB-filtros', espera: 'Só as favoritas', antes: (p) => conteudo(p, [DADOS]),
    preparar: async (p) => { await primeiraCarga(p, 'Garota de Ipanema'); await p.getByRole('button', { name: /^Filtros/ }).click() },
  },
  'LIB-mais': {
    secao: 'LIB-mais', espera: 'Abrir', antes: (p) => conteudo(p, [DADOS]),
    preparar: async (p) => { await primeiraCarga(p, 'Garota de Ipanema'); await p.getByRole('button', { name: 'Mais ações para “Garota de Ipanema”' }).click() },
  },
  // I1-PR11: o `LIB-salvo` se mede na superfície `content-edit` (o fluxo inteiro, fabricado: salvar → a biblioteca)
  'LIB-salvo': { inalcancavel: 'medido na superfície content-edit (I1-PR11): o sinal é do editor (lib/sinal-salvo.ts, decisão 1 do aval)' },
  'LIB-carregando-chunk': {
    secao: 'LIB-carregando-chunk', espera: 'carregando a biblioteca…',
    // o pedaço do `dynamic` da biblioteca (next dev: o nome do chunk traz `components_library`) — segurado
    antes: async (p) => { await p.route(/\/_next\/static\/chunks\/.*components_library/, (rt) => segurar(p, rt)) },
  },
  'LIB-carregando': {
    secao: 'LIB-carregando', espera: 'carregando a biblioteca…', antes: (p) => conteudo(p, [VAZIO, 'segurar']),
    preparar: async (p) => { await primeiraCarga(p, 'nenhum conteúdo ainda'); await filtrar(p) },
  },
  'LIB-vazio': { secao: 'LIB-vazio', espera: 'nenhum conteúdo ainda', antes: (p) => conteudo(p, [VAZIO]) },
  'LIB-vazio-busca': {
    secao: 'LIB-vazio-busca', espera: 'nada encontrado', antes: (p) => conteudo(p, [VAZIO]),
    preparar: async (p) => { await primeiraCarga(p, 'nenhum conteúdo ainda'); await filtrar(p) },
  },
  'LIB-erro': {
    secao: 'LIB-erro', espera: 'não foi possível carregar a biblioteca', antes: (p) => conteudo(p, [VAZIO, 'abortar']),
    preparar: async (p) => { await primeiraCarga(p, 'nenhum conteúdo ainda'); await filtrar(p) },
  },
  'LIB-apagar': {
    secao: 'LIB-apagar', espera: 'Apagar conteúdo', antes: (p) => conteudo(p, [DADOS]),
    preparar: async (p) => {
      await primeiraCarga(p, 'Garota de Ipanema')
      await p.getByRole('button', { name: 'Mais ações para “Garota de Ipanema”' }).click()
      await p.getByRole('menuitem', { name: 'Apagar' }).click()
    },
  },
}

/** A renovação da sessão falha: a abertura (na carga) passa; depois o `POST` fabricado 500 e um `visibilitychange`. */
async function renovacaoFalha(p: Page) {
  await p.route(/\/api\/auth\/session$/, (rt) => rt.request().method() === 'POST' ? responder(rt, { status: 500, corpo: { error: 'x' } }) : rt.fallback())
  await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
}

const INALCANCAVEL_SSR = 'SSR: os dados do painel vêm do Supabase no servidor, nenhum request do navegador os carrega (div. 699); prova no Vitest components/painel/__tests__/painel-estados.test.tsx (decisão 5 do aval)'

const ESTADOS_DASH: Record<string, Estado> = {
  DASH: { secao: 'DASH', espera: 'Visão geral' },
  'DASH-vazio': { inalcancavel: INALCANCAVEL_SSR },
  // só se a conta do perfil não tiver favoritas (decisão 5): senão sai NÃO ALCANÇADO, e o registro diz qual
  'DASH-vazio-favoritas': { secao: 'DASH-vazio-favoritas', espera: 'nenhuma favorita' },
  'DASH-erro': { inalcancavel: INALCANCAVEL_SSR },
  'SESSAO-nao-renovada': { secao: 'SESSAO-nao-renovada', espera: 'a sessão não foi renovada', preparar: renovacaoFalha },
}

export { ESTADOS_DASH, ESTADOS_LIB }
