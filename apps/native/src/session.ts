/**
 * Sessão do Firebase para as telas — camada fina sobre `firebase.ts` para que
 * nenhuma tela importe o SDK direto (PRD T1-R6; contrato de auth em
 * `docs/api/AUTH.md` §5). Sem `fetch`: a tela 1 desta PR não fala com
 * `/api/*` (isso é a N1-PR3b).
 *
 * O código de erro do SDK (`auth/…`) vira uma chave de mensagem pt-BR
 * (T1-R36: a mensagem deriva do código, nunca do texto em inglês do SDK).
 */
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from './firebase'

export type AuthErrorKey =
  | 'erro.credenciais_invalidas'
  | 'erro.sem_conexao'
  | 'erro.muitas_tentativas'
  | 'erro.desconhecido'

/**
 * Códigos do Firebase Auth mapeados. `invalid-credential` cobre email e senha
 * errados desde que o Identity Platform parou de distinguir os dois — o app
 * também não distingue (mesma regra "sem oráculo" do servidor).
 */
function keyFor(code: string): AuthErrorKey {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/user-disabled':
      return 'erro.credenciais_invalidas'
    case 'auth/network-request-failed':
      return 'erro.sem_conexao'
    case 'auth/too-many-requests':
      return 'erro.muitas_tentativas'
    default:
      return 'erro.desconhecido'
  }
}

export interface SignInFailure {
  ok: false
  /** Chave de mensagem; o texto pt-BR fica na tela. */
  messageKey: AuthErrorKey
  /** Código do SDK — só para o log, nunca para a tela. */
  code: string
}

export type SignInResult = { ok: true } | SignInFailure

/**
 * Este processo chegou à sessão por um login digitado (e não por restauração
 * do cache do SDK)? Marcado ANTES da chamada, porque o `onAuthStateChanged`
 * dispara durante ela — se a marca ficasse no próprio ouvinte, o primeiro
 * login da execução se anunciaria como `restored` (defeito medido na
 * N1-PR3a, emulador `octavia_tab32`, 2026-09-10).
 */
let entrouNestaExecucao = false

export function signedInThisRun(): boolean {
  return entrouNestaExecucao
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  entrouNestaExecucao = true
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password)
    return { ok: true }
  } catch (e: unknown) {
    entrouNestaExecucao = false
    const code =
      typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : 'desconhecido'
    return { ok: false, messageKey: keyFor(code), code }
  }
}

export function signOutSession(): Promise<void> {
  return signOut(auth)
}

/** Assina o estado do usuário; devolve o cancelador. */
export function onAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb)
}

export type { User }
