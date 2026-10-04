/**
 * O favoritar: o PEDIDO e a CLASSIFICAÇÃO (N4-PR5; `N4-REQUISITOS.md` N4-R7, N4-R8, N4-R9; N4-D22, N4-D23, N4-D35).
 *
 * Puro, como todo o core: **nenhuma request acontece aqui**. Quem envia é o `apps/native/src/favoritar.ts`, sobre o
 * `api.ts`. É o molde do `escrita.ts` (N2-PR2), com três diferenças que vêm das decisões do N4:
 *
 * 1. **Não há releitura** (N4-D35). A escrita de setlist do N2 relê `GET /api/setlists` depois de todo 2xx e só a
 *    releitura muda o cache. O `PUT /api/content` devolve **a linha inteira** — a B5 do `N4-PRECHECK.md` mediu em prod
 *    as 22 colunas, as mesmas do `GET`, e o `GET` seguinte igual à resposta em todas —, e é ESSA linha que vai ao
 *    cache, sem sync. Daí o `ok` carregar a `linha`, e um 200 cuja linha não é a pedida não ser `ok`.
 * 2. **A trava é por música**, não do app: o resto da linha e as outras estrelas seguem ativos (N4-R7); só a mesma
 *    música, de novo, é barrada (`busy`).
 * 3. **A família do limite é `content-mutate`** (`app/api/content/route.ts:233`), não a `setlist-mutate` das seis
 *    escritas do N2 — um 429 do favoritar não fecha o criar setlist, e vice-versa.
 *
 * **As seis espécies da N4-R8**, cada uma com a frase do TABLET (as do N2, `frases.ts`):
 *
 * | espécie | quando | frase |
 * | --- | --- | --- |
 * | `rede` | barrado sem rede: nenhuma request saiu | *sem conexão — nada foi salvo* |
 * | `sem-resposta` | a request saiu e não voltou (inclui o prazo de rede, N2-D35) | *sem resposta do servidor* |
 * | `auth` | 401 — a escrita **não desloga** (N2-D9) | *não foi possível salvar — confira sua conta no site* |
 * | `limite` | 429, ou a família fechada por um 429 anterior | *muitas alterações seguidas — tente de novo em {N} s* |
 * | `servidor` | 5xx | *falha no servidor — nada foi alterado aqui* |
 * | `generica` | o resto: 404 (a música saiu do servidor), 400, código novo, 200 sem a linha, `busy` | *não foi possível salvar* |
 *
 * O 404 e o 400 não têm espécie própria: a N4-R8 nomeia seis, e nenhuma frase do tablet diz mais do que a genérica
 * sem mentir (o 404 da escrita de setlist tem releitura que sabe de quem fala; aqui não há releitura).
 */
import { errorFrom } from './errors'
import { id8, type Resposta } from './escrita'
import { frase, type ChaveDeFrase } from './frases'
import { compor, nomeFavoritar, nomeTirar } from './frases-content'
import type { ContentDTO } from './types'

/** A família do limite de taxa do `PUT /api/content` (`lib/user-rate-limit.ts`, `content-mutate`). */
export const FAMILIA_DO_FAVORITAR = 'content-mutate'

/** O `op` da linha de log: `favorite` põe, `unfavorite` tira (N4-D89). */
export type OpDoFavoritar = 'favorite' | 'unfavorite'

export interface PedidoDeFavoritar {
  op: OpDoFavoritar
  method: 'PUT'
  path: '/api/content'
  /** `{"id","is_favorite"}`, valor ABSOLUTO — o corpo da fixture da N4-PR1, byte a byte. */
  body: string
  id: string
  valor: boolean
  /** `<id8>` do content para o log (regra 3 do `LOGS-OCTAVIA.md`). */
  content: string
}

/**
 * N4-D22 — `PUT /api/content` com `{"id","is_favorite"}`, sem `content_data`, sem a linha: o mesmo corpo que a lista
 * do web envia (`packages/core/fixtures/favoritar-put.json`). O valor é absoluto — quem calcula a negação é a tela, a
 * partir da linha que ela mostra; o servidor grava o que vem.
 */
export function pedidoFavoritar(id: string, valor: boolean): PedidoDeFavoritar {
  return {
    op: valor ? 'favorite' : 'unfavorite',
    method: 'PUT',
    path: '/api/content',
    body: JSON.stringify({ id, is_favorite: valor }),
    id,
    valor,
    content: id8(id),
  }
}

export type EspecieDoFavoritar = 'ok' | 'rede' | 'sem-resposta' | 'auth' | 'limite' | 'servidor' | 'generica'

export interface ResultadoDoFavoritar {
  especie: EspecieDoFavoritar
  /** `null` quando nada voltou (barrado ou rede). */
  status: number | null
  /** `code` do envelope, ou `null`. */
  code: string | null
  /** Segundos até a família liberar; só em `limite`, e `null` se não veio. */
  retryAfter: number | null
  /** A chave e a frase da espécie; `null` no `ok`. */
  chave: ChaveDeFrase | null
  frase: string | null
  /** No `ok`, a linha que o servidor devolveu — o que vai ao cache (N4-D35). `null` em todo o resto. */
  linha: ContentDTO | null
}

function falhou(
  especie: Exclude<EspecieDoFavoritar, 'ok'>,
  chave: ChaveDeFrase,
  extra: { status?: number | null; code?: string | null; retryAfter?: number | null } = {},
): ResultadoDoFavoritar {
  const retryAfter = extra.retryAfter ?? null
  return {
    especie,
    status: extra.status ?? null,
    code: extra.code ?? null,
    retryAfter,
    chave,
    frase: chave === 'limite-com-prazo' && retryAfter !== null ? frase(chave, retryAfter) : frase(chave),
    linha: null,
  }
}

/** A linha devolvida, se ela é a da música pedida e traz o favorito — senão `null`. */
function linhaDe(id: string, bodyText: string | null): ContentDTO | null {
  if (bodyText === null || bodyText.length === 0) return null
  let lido: unknown
  try {
    lido = JSON.parse(bodyText)
  } catch {
    return null
  }
  if (typeof lido !== 'object' || lido === null) return null
  const c = lido as Partial<ContentDTO>
  if (c.id !== id || typeof c.is_favorite !== 'boolean') return null
  return lido as ContentDTO
}

/** O que a resposta de um `PUT` de favoritar significa. Uma função, um conjunto fechado. */
export function classificarFavoritar(id: string, resposta: Resposta): ResultadoDoFavoritar {
  const { status = null, bodyText = null, networkError = null, headers = {} } = resposta
  if (networkError === null && typeof status === 'number' && status >= 200 && status < 300) {
    const linha = linhaDe(id, bodyText)
    if (linha === null) return falhou('generica', 'generica', { status })
    return { especie: 'ok', status, code: null, retryAfter: null, chave: null, frase: null, linha }
  }
  const erro = errorFrom({ status: status ?? undefined, bodyText, networkError, headers })
  const base = { status: erro.kind === 'network' ? null : status, code: erro.code }
  switch (erro.kind) {
    case 'network':
      // N2-E19: aqui a request SAIU e não voltou. O "sem conexão — nada foi salvo" é do barrado.
      return falhou('sem-resposta', 'sem-resposta', base)
    case 'auth':
      return falhou('auth', 'auth', base)
    case 'rate-limited':
      return falhou('limite', erro.retryAfter === null ? 'limite-sem-prazo' : 'limite-com-prazo', {
        ...base,
        retryAfter: erro.retryAfter,
      })
    case 'server':
      return falhou('servidor', 'servidor', base)
    default:
      return falhou('generica', 'generica', base)
  }
}

/** Por que o favoritar NÃO saiu — o `write blocked … reason=` (N4-D89). */
export type MotivoBarradoDoFavoritar = 'offline' | 'ratelimit' | 'busy'

/**
 * O que a tela mostra quando o pedido nem sai. `restanteS` é o que falta para a família `content-mutate` reabrir
 * (o gate sabe; a resposta, não): com ele, a frase com {N}; sem ele, a do N2 sem número.
 */
export function classificarFavoritarBarrado(
  motivo: MotivoBarradoDoFavoritar,
  restanteS: number | null,
): ResultadoDoFavoritar {
  if (motivo === 'offline') return falhou('rede', 'rede')
  if (motivo === 'ratelimit') {
    return falhou('limite', restanteS === null ? 'limite-sem-prazo' : 'limite-com-prazo', { retryAfter: restanteS })
  }
  return falhou('generica', 'generica')
}

/**
 * A linha de aviso do tablet (N4-R8): o nome acessível da estrela que foi tocada · a frase da espécie, com o separador
 * do tablet (`compor`, N4-PR3). `null` no `ok` — não há aviso de sucesso.
 */
export function avisoDoFavoritar(titulo: string, valor: boolean, resultado: ResultadoDoFavoritar): string | null {
  if (resultado.frase === null) return null
  return compor([valor ? nomeFavoritar(titulo) : nomeTirar(titulo), resultado.frase])
}

/**
 * **N4-D91 — o cache não regride depois do favoritar** (div. 1065).
 *
 * A corrida: um sync cujo `GET /api/content` leu o servidor ANTES de um `PUT` do favoritar e grava DEPOIS da resposta
 * dele. O sync substitui o conjunto inteiro pelo que leu (T1-R9), e a linha que o `PUT` devolveu sumiria do cache.
 *
 * **O critério é o `updated_at` da linha**: o `PUT` sempre grava `updated_at` (`app/api/content/route.ts:282-284`), e
 * a linha que ele devolve traz o valor gravado. Para cada música que o favoritar confirmou nesta sessão, a linha
 * confirmada fica no lugar da que o sync trouxe **só se for estritamente mais nova** que ela. Por que não a ordem
 * das respostas: a ordem de chegada não é a de leitura no servidor (a div. 232 do N2), e o que importa é o que o
 * servidor gravou por último — que é o que o `updated_at` diz.
 *
 * **O caso normal fica igual**: se o site mudou a música depois do favoritar, o servidor tem um `updated_at` maior, e
 * a linha do sync vence; se o sync leu depois do `PUT`, os dois `updated_at` são iguais, e a do sync vence (é a
 * mesma). Música que o sync não trouxe (apagada no site) não volta. `updated_at` que não parseia: vence o sync.
 *
 * Não muda o conjunto por referência quando nada é mantido — o `reconcileByUpdatedAt` continua decidindo a
 * identidade — nem a contagem `invalidated` do sync, que é calculada antes, contra o que o app tinha.
 */
export function naoRegredir<T extends { id: string; updated_at: string }>(
  doSync: T[],
  confirmadas: ReadonlyMap<string, T>,
): T[] {
  if (confirmadas.size === 0) return doSync
  let trocou = false
  const out = doSync.map((item) => {
    const local = confirmadas.get(item.id)
    if (local === undefined) return item
    const tLocal = Date.parse(local.updated_at)
    const tSync = Date.parse(item.updated_at)
    if (Number.isNaN(tLocal) || Number.isNaN(tSync) || tLocal <= tSync) return item
    trocou = true
    return local
  })
  return trocou ? out : doSync
}

