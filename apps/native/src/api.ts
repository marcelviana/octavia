/**
 * Camada de rede única do app (PRD T1-R1, T1-R2, T1-R3, T1-R12, T1-R37).
 * A lógica é do core (`createAuthFetch`, `shouldRefresh`, `decodeExp`,
 * `errorFrom`); aqui entram o `fetch` do RN e o SDK do Firebase.
 *
 * Rotas consumidas: as duas leituras da tela 1 — `GET /api/setlists` e
 * `GET /api/content` (PRD §2) — e, desde a N2-PR2, as **seis escritas de
 * setlist** do `docs/api/SETLISTS.md`. Nunca `/api/auth/session`,
 * `/api/proxy` ou `/api/profile`.
 *
 * O transporte de escrita mora AQUI, e não no `escrita.ts`, porque a primeira
 * linha deste arquivo diz que ele é "a camada de rede única do app": partir o
 * transporte em dois faria dessa frase uma mentira, e a linha `api …` do
 * catálogo passaria a ser emitida de dois lugares.
 */
import {
  createAuthFetch,
  decodeExp,
  errorFrom,
  shouldRefresh,
  type AppError,
  type ContentDTO,
  type SetlistDTO,
} from '@octavia/core'
import { auth } from './firebase'
import { log } from './log'
import { signOutSession } from './session'

/**
 * A base da URL, lida **na hora da chamada** e não no carregamento do módulo.
 *
 * No aparelho é indiferente: o Metro substitui `process.env.EXPO_PUBLIC_*` por
 * literal no build, então a expressão é constante das duas formas.
 *
 * Em teste não é. `[medido: N2-PR3]` a forma anterior era uma constante de
 * topo de módulo, e qualquer teste que importasse `src/` **estaticamente**
 * congelava a base em `''` antes de o `beforeAll` definir a porta do mock —
 * e aí toda request ia para um path relativo, falhava por rede e o teste lia
 * `status=net` sem nenhuma pista do porquê. Não é hipótese: foi o que o CN do
 * gancho do prefetch (`apos-escrita.test.tsx`) mediu, e é armadilha que toda
 * PR de tela daqui para frente pisaria.
 */
function baseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? ''
}

/**
 * **Caminho de desenvolvimento do aceite A2** (catálogo de logs, E4): só
 * existe com `__DEV__` **e** `EXPO_PUBLIC_DEV_FORGE_401=1`; num build de
 * release as duas condições são falsas e o bloco todo some.
 *
 * Por que forjar em vez de esperar um 401 real: o A2 pede "token forjado
 * inválido → no máximo 2 requests à rota e tela de login", e não há como
 * produzir um token inválido pela UI sem esperar horas ou mexer no servidor.
 *
 * O token forjado muda a cada chamada (o contador no fim). É isso que exercita
 * o caminho INTEIRO do T1-R3: o 1º 401 pede renovação, o token novo é
 * DIFERENTE do primeiro, o `authFetch` refaz **uma** vez, o 2º 401 chega e
 * `onAuthFailure` para tudo — `n=2` e nunca uma terceira request. Com um
 * token forjado constante o caminho pararia em `n=1` e o aceite não veria o
 * limite que o T1-R3 promete.
 */
const FORJAR_401 = __DEV__ && process.env.EXPO_PUBLIC_DEV_FORGE_401 === '1'
let forjados = 0

function tokenForjado(): string {
  forjados += 1
  // **Sem** o prefixo base64 de um header JWT, de propósito: os greps de
  // segredo dos anexos procuram exatamente esse prefixo, e um JWT de mentira
  // no código-fonte envenenaria o instrumento. O 401 sai igual — a cadeia A do
  // `CONTRATO-DE-ERRO.md` devolve o MESMO corpo para "sem token", "token
  // inválido" e "IP em deny-fast", então o formato não muda o aceite.
  return `forjado-dev-a2.${forjados}.invalido`
}

/**
 * T1-R2: o SDK renova sozinho, mas o cliente força a renovação quando faltam
 * ≤ 5 min para o `exp` — decisão do core (`shouldRefresh`, limite inclusivo,
 * errata N1-D14). Um `getIdToken(false)` barato dá o token corrente; só se ele
 * estiver perto do fim é que se paga um `getIdToken(true)`.
 */
async function obterToken({ forceRefresh }: { forceRefresh: boolean }): Promise<string | null> {
  if (FORJAR_401) {
    log(`auth refresh=${forceRefresh ? 'forced' : 'cached'}`)
    return tokenForjado()
  }
  const user = auth.currentUser
  if (user === null) return null
  if (forceRefresh) {
    log('auth refresh=forced')
    return user.getIdToken(true)
  }
  const atual = await user.getIdToken(false)
  const exp = decodeExp(atual)
  if (exp !== null && shouldRefresh(exp, Date.now())) {
    log('auth refresh=forced')
    return user.getIdToken(true)
  }
  log('auth refresh=cached')
  return atual
}

const authFetch = createAuthFetch<Response>({
  fetch: (path, init) => fetch(path, init as RequestInit),
  getToken: obterToken,
  onAuthFailure: async () => {
    log('auth-failure')
    await signOutSession()
  },
})

/**
 * **N2-D9 — a segunda instância, e a única diferença é o `onAuthFailure`.**
 *
 * Numa ESCRITA, o 401 é falha da operação e não fim da sessão: o músico perde
 * o que ia salvar, não a conta. A política do T1-R3 continua inteira — o
 * mesmo `createAuthFetch`, a mesma renovação única, o mesmo teto de duas
 * requests, que é o que protege a janela `authfail` por IP (30/5 min). O que
 * não roda é o `signOutSession()`.
 *
 * **O corpo é vazio de propósito, e isso é uma decisão e não um esquecimento.**
 * Uma linha de log aqui — `write auth-failure`, digamos — conteria a subcadeia
 * `auth-failure`, e o aceite A-N2-15 é exatamente `grep` por ela: o
 * instrumento que prova que a escrita não desloga passaria a acusar a si
 * mesmo. O 401 já aparece duas vezes no log, na linha `api status=401 … n=2` e
 * na `write op=… status=401 code=AUTH_REQUIRED`.
 *
 * **Por que duas instâncias e não um parâmetro**: `createAuthFetch` fecha
 * sobre o `onAuthFailure` na construção. Passar a decisão por chamada faria
 * cada ponto do app escolher se desloga — e a N2-D9 é uma decisão de produto,
 * não uma opção de quem chama.
 */
const authFetchEscrita = createAuthFetch<Response>({
  fetch: (path, init) => fetch(path, init as RequestInit),
  getToken: obterToken,
  onAuthFailure: () => undefined,
})

export interface ApiOk<T> {
  ok: true
  data: T
}
export interface ApiErro {
  ok: false
  error: AppError
  status: number | null
}
export type ApiResult<T> = ApiOk<T> | ApiErro

/**
 * **O prazo de rede (N2-D35), e é só isto que ele é**: um `AbortController`
 * que dispara depois de `prazoMs` e mata a request em voo. O número é do core
 * (`PRAZO_DE_REDE_MS`); a decisão de usá-lo é de quem chama; o mecanismo é
 * daqui, porque a primeira linha deste arquivo diz que ele é a camada de rede
 * única do app.
 *
 * `prazoMs` ausente = **sem prazo**, que é o comportamento de sempre. As
 * leituras do sync continuam assim de propósito: a fixture `atraso` do S1a
 * segura a resposta por 45 s para que o estado "sincronizando pela primeira
 * vez" fique parado o suficiente para ser medido, e um prazo ali apagaria um
 * estado do design em vez de proteger alguém.
 *
 * O `abort` faz o `fetch` rejeitar, e a rejeição cai no mesmo `catch` de
 * qualquer falha de transporte: vira `networkError`, e o core a classifica
 * como espécie `rede`. Nenhum ramo novo.
 */
function prazoDe(prazoMs: number | undefined): { signal?: unknown; fim: () => void } {
  if (prazoMs === undefined) return { fim: () => undefined }
  const controle = new AbortController()
  const t = setTimeout(() => controle.abort(), prazoMs)
  return { signal: controle.signal, fim: () => clearTimeout(t) }
}

/** Uma chamada GET instrumentada: mede o tempo e normaliza a falha (T1-R37). */
async function get<T>(path: string, familia: string, prazoMs?: number): Promise<ApiResult<T>> {
  const t0 = Date.now()
  const prazo = prazoDe(prazoMs)
  try {
    const { response, requests } = await authFetch(`${baseUrl()}${path}`, { signal: prazo.signal })
    const ms = Date.now() - t0
    log(`api status=${response.status} path=${path.split('?')[0]} n=${requests} ms=${ms}`)
    const corpo = await response.text()
    if (!response.ok) {
      const headers: Record<string, string> = {}
      response.headers.forEach((v, k) => {
        headers[k] = v
      })
      const error = errorFrom({ status: response.status, bodyText: corpo, headers })
      if (error.kind === 'rate-limited' && error.retryAfter !== null) {
        log(`ratelimit retry-after=${error.retryAfter} family=${familia}`)
      }
      return { ok: false, error, status: response.status }
    }
    return { ok: true, data: JSON.parse(corpo) as T }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: errorFrom({ networkError: msg }), status: null }
  } finally {
    prazo.fim()
  }
}

/**
 * `GET /api/setlists` — array na raiz, sem paginação (`docs/api/SETLISTS.md`).
 *
 * `prazoMs` só chega pela **releitura** da escrita (T2-R9, N2-D35): quem lê
 * pelo sync continua sem prazo (ver o `prazoDe` acima).
 */
export function getSetlists(opcoes?: { prazoMs?: number }): Promise<ApiResult<SetlistDTO[]>> {
  return get<SetlistDTO[]>('/api/setlists', 'setlist-read', opcoes?.prazoMs)
}

export interface ContentPageBody {
  data: ContentDTO[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  totalPages: number
}

/**
 * `GET /api/content` — `pageSize=100` é o teto real do handler (clampado a
 * [1,100], medido em prod) e `sortBy=recent` é a chave estável entre páginas
 * exigida pelo T1-R9b (A22).
 */
export function getContentPage(page: number): Promise<ApiResult<ContentPageBody>> {
  return get<ContentPageBody>(`/api/content?pageSize=100&page=${page}&sortBy=recent`, 'content-read')
}

// ------------------------------------------------------- escrita (N2-PR2)

/**
 * O `path` como ele entra no log: **cada uuid vira os seus 8 primeiros
 * caracteres** (T2-R16, regra 3 do catálogo).
 *
 * A linha `api` de hoje só conheceu paths sem id (`/api/setlists`,
 * `/api/content`), e por isso `path.split('?')[0]` bastava. As rotas de
 * escrita levam o id NO CAMINHO, e um uuid inteiro no log é a regra 2
 * quebrada — log deste projeto se cola em anexo commitado.
 *
 * Casa o segmento com a FORMA de uuid, não a posição: `/api/setlists/<id>`,
 * `/api/setlists/<id>/songs/order` e `/api/setlists/songs/<id>` têm o id em
 * três lugares diferentes, e uma regra por posição erraria um dos três.
 */
function pathDoLog(path: string): string {
  return (path.split('?')[0] ?? path).replace(
    /[0-9a-fA-F]{8}-[0-9a-fA-F-]{4,}/g,
    (uuid) => uuid.slice(0, 8),
  )
}

/** O que a camada de rede devolve a uma escrita — cru, sem interpretação. */
export interface RespostaDeEscrita {
  /** `null` quando a request não teve resposta. */
  status: number | null
  bodyText: string | null
  networkError: string | null
  headers: Record<string, string>
}

/**
 * Uma escrita: **um request, sem retry de nenhum tipo** (N2-D2, C10).
 *
 * A única repetição possível é a do T1-R3, dentro do `authFetchEscrita` —
 * renovar o token uma vez e refazer uma vez —, e ela não duplica escrita
 * porque nas seis rotas o 401 sai antes de qualquer comando no banco
 * (pre-check §7.1).
 *
 * **Qualquer exceção é `networkError`**, inclusive a que acontece ao LER o
 * corpo de uma resposta que já trouxe o status. É o caso da N2-D18: o
 * servidor gravou, a conexão morreu, e o cliente não pode afirmar que
 * gravou nem que não gravou. Chamar isso de sucesso pelo status seria mentir
 * para o lado que cria setlist duplicada.
 */
export async function mutate(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body: string | null,
  prazoMs?: number,
): Promise<RespostaDeEscrita> {
  const t0 = Date.now()
  const prazo = prazoDe(prazoMs)
  try {
    const { response, requests } = await authFetchEscrita(`${baseUrl()}${path}`, {
      method,
      signal: prazo.signal,
      ...(body === null ? {} : { headers: { 'Content-Type': 'application/json' }, body }),
    })
    const ms = Date.now() - t0
    log(`api status=${response.status} path=${pathDoLog(path)} n=${requests} ms=${ms}`)
    const corpo = await response.text()
    const headers: Record<string, string> = {}
    response.headers.forEach((v, k) => {
      headers[k] = v
    })
    if (response.status === 429) {
      const prazo = errorFrom({ status: 429, bodyText: corpo, headers }).retryAfter
      if (prazo !== null) log(`ratelimit retry-after=${prazo} family=setlist-mutate`)
    }
    return { status: response.status, bodyText: corpo, networkError: null, headers }
  } catch (e: unknown) {
    return {
      status: null,
      bodyText: null,
      networkError: e instanceof Error ? e.message : String(e),
      headers: {},
    }
  } finally {
    prazo.fim()
  }
}
