/**
 * Camada de rede única do nativo (PRD T1-R1, T1-R3, T1-R12; N0-PR3).
 * Lógica pura: zero dependência de react/react-native/firebase — o SDK entra por `getToken`;
 * zero dependência de `lib.dom` — a `Response` real entra pelo genérico `R` (só `status` é lido).
 *
 * - T1-R1: exatamente um header `Authorization: Bearer <token>` (prefixo literal, um espaço).
 * - T1-R12: `cache: 'no-store'` em toda request a /api/*.
 * - T1-R3: um 401 NUNCA é retentado com o mesmo token. Em 401: pede o token com
 *   `forceRefresh: true` UMA vez; se o token novo for DIFERENTE, refaz UMA vez; se for o mesmo
 *   (renovação não aconteceu) ou o segundo 401 vier, chama `onAuthFailure` e para —
 *   nunca uma terceira request (cada 401 conta na janela `authfail` por IP, 30/5 min).
 */
export interface AuthRequestInit {
  method?: string
  headers?: Record<string, string>
  body?: string
  cache?: 'no-store'
  /**
   * N2-D35 — o sinal que cancela o transporte quando o prazo de rede estoura.
   *
   * **`unknown` de propósito**: um `AbortSignal` é `lib.dom`, e a primeira
   * linha deste arquivo promete zero dependência dela. O core não olha para
   * dentro do campo — ele só o repassa, do mesmo jeito que já repassa
   * `headers` e `body`. Quem o cria e quem o dispara é a camada de rede do
   * app (`apps/native/src/api.ts`).
   *
   * As duas requests do T1-R3 (a original e a de depois da renovação)
   * compartilham o mesmo sinal: o prazo é da OPERAÇÃO, não de cada tentativa.
   */
  signal?: unknown
}

export interface AuthResponseLike {
  status: number
}

export type GetToken = (opts: { forceRefresh: boolean }) => Promise<string | null | undefined>

export interface AuthFetchDeps<R extends AuthResponseLike> {
  fetch: (path: string, init: AuthRequestInit) => Promise<R>
  getToken: GetToken
  onAuthFailure: () => void | Promise<void>
}

export interface AuthFetchResult<R> {
  response: R
  /** Número de requests HTTP feitas para esta chamada (1 ou 2). */
  requests: 1 | 2
}

export type AuthFetch<R> = (path: string, init?: Omit<AuthRequestInit, 'cache'>) => Promise<AuthFetchResult<R>>

export function createAuthFetch<R extends AuthResponseLike>({ fetch, getToken, onAuthFailure }: AuthFetchDeps<R>): AuthFetch<R> {
  const doFetch = (path: string, init: Omit<AuthRequestInit, 'cache'> | undefined, token: string) =>
    fetch(path, {
      ...init,
      headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

  return async (path, init) => {
    const first = await getToken({ forceRefresh: false })
    if (!first) {
      await onAuthFailure()
      throw new Error('auth-fetch: sem token')
    }
    const response = await doFetch(path, init, first)
    if (response.status !== 401) return { response, requests: 1 }

    const refreshed = await getToken({ forceRefresh: true })
    if (!refreshed || refreshed === first) {
      await onAuthFailure()
      return { response, requests: 1 }
    }
    const second = await doFetch(path, init, refreshed)
    if (second.status === 401) await onAuthFailure()
    return { response: second, requests: 2 }
  }
}
