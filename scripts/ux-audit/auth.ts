/**
 * Módulo compartilhado de autenticação dos scripts de UX audit.
 *
 * Fluxo: Firebase REST (signInWithPassword) → idToken → cookie de sessão da
 * app via POST {BASE_URL}/api/auth/session. Todo request via apiFetch()
 * injeta `Authorization: Bearer` + cookie, renova o idToken em 401 (tokens
 * Firebase expiram em 1h) e aplica backoff exponencial em 429.
 *
 * Credenciais: .env.uxaudit (USER_AUDIT / PASSWORD_AUDIT). Os valores nunca
 * devem aparecer em log, erro ou output — apenas códigos de status.
 */
import { config } from 'dotenv'

config({ path: '.env.uxaudit', quiet: true })
// .env.local fornece NEXT_PUBLIC_FIREBASE_API_KEY (a mesma API key pública do client)
config({ path: '.env.local', quiet: true })

export const BASE_URL = process.env.UX_AUDIT_BASE_URL || 'https://octavia.rocks'

const MAX_429_RETRIES = 5

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(
      `[ux-audit] Variável de ambiente ausente: ${name}. ` +
        `Verifique .env.uxaudit (USER_AUDIT/PASSWORD_AUDIT) e .env.local (NEXT_PUBLIC_FIREBASE_API_KEY).`
    )
    process.exit(1)
  }
  return value
}

export function auditEmail(): string {
  return requireEnv('USER_AUDIT')
}

let idToken: string | null = null
let sessionCookie: string | null = null

export interface FirebaseCredentials {
  apiKey: string
  uid: string
  email: string
  idToken: string
  refreshToken: string
}

let credentials: FirebaseCredentials | null = null

async function signIn(): Promise<void> {
  const apiKey = requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY')
  const email = requireEnv('USER_AUDIT')
  const password = requireEnv('PASSWORD_AUDIT')

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )

  if (!res.ok) {
    // O código de erro do Firebase (ex.: INVALID_PASSWORD) é seguro de logar
    let code = 'UNKNOWN'
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      code = body.error?.message ?? code
    } catch {
      // corpo não-JSON — mantém UNKNOWN
    }
    throw new Error(`Firebase signIn falhou: HTTP ${res.status} (${code})`)
  }

  const data = (await res.json()) as {
    idToken?: string
    refreshToken?: string
    localId?: string
    email?: string
  }
  if (!data.idToken || !data.refreshToken || !data.localId) {
    throw new Error('Firebase signIn não retornou idToken/refreshToken/localId')
  }
  idToken = data.idToken
  credentials = {
    apiKey,
    uid: data.localId,
    email: data.email ?? email,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
  }

  // POST /api/auth/session tem rate limit AUTH (5 req / 15 min por IP).
  // Janela fixa: retentar não a estende — espera 60s entre tentativas.
  let sessionRes: Response
  for (let attempt = 0; ; attempt++) {
    sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    if (sessionRes.status !== 429 || attempt >= 15) break
    console.log(`[ux-audit] 429 em POST /api/auth/session — aguardando 60s (tentativa ${attempt + 1}/15)`)
    await sleep(60_000)
  }
  if (!sessionRes.ok) {
    throw new Error(`POST /api/auth/session falhou: HTTP ${sessionRes.status}`)
  }

  const setCookies: string[] =
    typeof sessionRes.headers.getSetCookie === 'function'
      ? sessionRes.headers.getSetCookie()
      : []
  const raw =
    setCookies.find((c) => c.startsWith('firebase-session=')) ??
    sessionRes.headers.get('set-cookie') ??
    ''
  const match = raw.match(/firebase-session=[^;]+/)
  sessionCookie = match ? match[0] : null
  if (!sessionCookie) {
    throw new Error('Cookie de sessão (firebase-session) não veio no Set-Cookie de /api/auth/session')
  }
}

/**
 * Retorna o valor do cookie de sessão (`firebase-session=...`), autenticando
 * se necessário. Usado pelo auth.setup.ts do Playwright (ux-audit) para
 * injetar a sessão no contexto do browser sem passar pela UI de login.
 */
export async function getSessionCookie(): Promise<string> {
  if (!sessionCookie) await signIn()
  return sessionCookie!
}

/**
 * Credenciais Firebase da conta de audit (uid, idToken, refreshToken).
 * Usadas pelo auth.setup.ts para semear o usuário no IndexedDB do browser
 * (firebaseLocalStorageDb) — sem isso o SDK client-side não tem usuário,
 * o firebase-auth-context dispara onAuthStateChanged(null) e APAGA o
 * cookie de sessão via DELETE /api/auth/session.
 */
export async function getFirebaseCredentials(): Promise<FirebaseCredentials> {
  if (!credentials) await signIn()
  return credentials!
}

/**
 * fetch autenticado contra {BASE_URL}. Renova o token em 401 (uma vez) e
 * faz backoff exponencial em 429 (1s, 2s, 4s, 8s, 16s).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!idToken) await signIn()

  const doFetch = () => {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${idToken}`)
    if (sessionCookie) headers.set('Cookie', sessionCookie)
    return fetch(`${BASE_URL}${path}`, { ...init, headers })
  }

  let res = await doFetch()

  if (res.status === 401) {
    await signIn()
    res = await doFetch()
  }

  for (let attempt = 0; res.status === 429 && attempt < MAX_429_RETRIES; attempt++) {
    const waitMs = 1000 * 2 ** attempt
    console.log(`[ux-audit] 429 em ${path} — aguardando ${waitMs}ms`)
    await sleep(waitMs)
    res = await doFetch()
  }

  return res
}
