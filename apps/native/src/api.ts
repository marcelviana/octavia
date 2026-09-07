/**
 * Camada de rede do app = createAuthFetch do core (T1-R1/R3/R12) + fetch global do RN.
 * Nunca a rota de sessão do web nem cookie (C-D1: só bearer). Forma do 200 de GET /api/setlists: ARRAY na raiz
 * (app/api/setlists/route.ts → NextResponse.json(setlistsWithSongs); anexo C B-P2 = 3 itens).
 */
import { createAuthFetch } from '@octavia/core'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { log } from './log'

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? ''

export const authFetch = createAuthFetch<Response>({
  fetch: (path, init) => fetch(path, init as RequestInit),
  getToken: async ({ forceRefresh }) => auth.currentUser?.getIdToken(forceRefresh),
  onAuthFailure: async () => {
    log('auth-failure')
    await signOut(auth)
  },
})

/** GET /api/setlists → número de setlists (só a contagem; a tela 1 é o N1). */
export async function getSetlists(): Promise<number> {
  const { response, requests } = await authFetch(`${BASE_URL}/api/setlists`)
  log(`api status=${response.status} path=/api/setlists n=${requests}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body: unknown = await response.json()
  if (!Array.isArray(body)) throw new Error('shape inesperado: esperado array na raiz')
  return body.length
}
