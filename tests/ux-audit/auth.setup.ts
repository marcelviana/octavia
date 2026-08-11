import { test as setup, expect, type BrowserContext } from '@playwright/test'
import { getSessionCookie, getFirebaseCredentials } from '../../scripts/ux-audit/auth'
import { UX_AUDIT_STORAGE_STATE } from '../../playwright.ux-audit.config'
import { interceptSessionEndpoint } from './session-intercept'

/**
 * Setup de autenticação do projeto ux-audit (padrão "setup project" do
 * Playwright — os projetos de harvest declaram dependencies: ['setup']).
 *
 * Sem UI, sem seletores. Duas camadas de autenticação, ambas necessárias:
 *
 * 1. Cookie de sessão (server-side): Firebase REST → POST /api/auth/session
 *    → cookie firebase-session via addCookies. É o que o middleware checa.
 *
 * 2. Usuário Firebase no IndexedDB (client-side): o SDK do Firebase lê
 *    firebaseLocalStorageDb no load. Sem o registro, onAuthStateChanged
 *    dispara null e o firebase-auth-context APAGA o cookie de sessão
 *    (DELETE /api/auth/session) — foi exatamente o que esvaziou o
 *    storageState na primeira tentativa cookie-only.
 *
 * O storageState é salvo com { indexedDB: true } para carregar as duas
 * camadas nos contexts do harvest.
 */
setup('autenticar conta de audit e salvar storageState', async ({ browser, baseURL }) => {
  const creds = await getFirebaseCredentials()
  const rawCookie = await getSessionCookie() // "firebase-session=<valor>"
  const separator = rawCookie.indexOf('=')
  const name = rawCookie.slice(0, separator)
  const value = rawCookie.slice(separator + 1)
  expect(name).toBe('firebase-session')
  expect(value.length).toBeGreaterThan(0)

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  const context: BrowserContext = await browser.newContext({
    baseURL,
    serviceWorkers: 'block',
  })
  // Evita que o app queime o rate limit AUTH (5/15min) ou apague o cookie
  await interceptSessionEndpoint(context)

  await context.addCookies([
    { name, value, url: baseURL!, httpOnly: true, secure: true, sameSite: 'Lax' },
  ])

  // Precisa de uma página no origin para escrever no IndexedDB
  const page = await context.newPage()
  // Preview protegido: a primeira navegação leva o bypass por QUERY e pede o
  // cookie (`x-vercel-set-bypass-cookie`). O cookie `_vercel_jwt` resultante
  // entra no storageState e autoriza todas as requisições seguintes — sem
  // header custom, que quebraria as chamadas cross-origin do SDK do Firebase.
  const primeiraUrl = bypass
    ? `/?x-vercel-protection-bypass=${bypass}&x-vercel-set-bypass-cookie=true`
    : '/'
  await page.goto(primeiraUrl, { waitUntil: 'domcontentloaded', timeout: 90_000 })

  const now = Date.now()
  const authUser = {
    uid: creds.uid,
    email: creds.email,
    emailVerified: true,
    isAnonymous: false,
    providerData: [
      {
        providerId: 'password',
        uid: creds.email,
        displayName: null,
        email: creds.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: creds.refreshToken,
      accessToken: creds.idToken,
      // ~55min: o SDK renova sozinho via refreshToken quando expirar
      expirationTime: now + 55 * 60 * 1000,
    },
    createdAt: String(now),
    lastLoginAt: String(now),
    apiKey: creds.apiKey,
    appName: '[DEFAULT]',
  }

  await page.evaluate(
    async ({ key, record }) => {
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('firebaseLocalStorageDb', 1)
        open.onupgradeneeded = () => {
          open.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' })
        }
        open.onsuccess = () => {
          const db = open.result
          const tx = db.transaction('firebaseLocalStorage', 'readwrite')
          tx.objectStore('firebaseLocalStorage').put({ fbase_key: key, value: record })
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
        open.onerror = () => reject(open.error)
      })
    },
    { key: `firebase:authUser:${creds.apiKey}:[DEFAULT]`, record: authUser }
  )

  // Valida a sessão antes de salvar: /dashboard não pode redirecionar p/ login
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {})
  expect(page.url()).not.toContain('/login')

  // O cookie precisa ter sobrevivido à navegação (o app o apagaria se o
  // client-side estivesse deslogado)
  const cookies = await context.cookies(baseURL!)
  expect(cookies.some((c) => c.name === 'firebase-session')).toBe(true)

  await context.storageState({ path: UX_AUDIT_STORAGE_STATE, indexedDB: true })
  await context.close()
})
