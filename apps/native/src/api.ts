/**
 * Camada de rede única do app (PRD T1-R1, T1-R2, T1-R3, T1-R12, T1-R37).
 * A lógica é do core (`createAuthFetch`, `shouldRefresh`, `decodeExp`,
 * `errorFrom`); aqui entram o `fetch` do RN e o SDK do Firebase.
 *
 * Rotas consumidas: **só** `GET /api/setlists` e `GET /api/content`
 * (PRD §2). Nunca `/api/auth/session`, `/api/proxy` ou `/api/profile`.
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

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

/**
 * T1-R2: o SDK renova sozinho, mas o cliente força a renovação quando faltam
 * ≤ 5 min para o `exp` — decisão do core (`shouldRefresh`, limite inclusivo,
 * errata N1-D14). Um `getIdToken(false)` barato dá o token corrente; só se ele
 * estiver perto do fim é que se paga um `getIdToken(true)`.
 */
async function obterToken({ forceRefresh }: { forceRefresh: boolean }): Promise<string | null> {
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

/** Uma chamada GET instrumentada: mede o tempo e normaliza a falha (T1-R37). */
async function get<T>(path: string, familia: string): Promise<ApiResult<T>> {
  const t0 = Date.now()
  try {
    const { response, requests } = await authFetch(`${BASE_URL}${path}`)
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
  }
}

/** `GET /api/setlists` — array na raiz, sem paginação (`docs/api/SETLISTS.md`). */
export function getSetlists(): Promise<ApiResult<SetlistDTO[]>> {
  return get<SetlistDTO[]>('/api/setlists', 'setlist-read')
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
