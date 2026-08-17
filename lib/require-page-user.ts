import { redirect } from "next/navigation"
import { getServerSideUser } from "@/lib/firebase-server-utils"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

export interface PageUser {
  uid: string
  email?: string
  emailVerified?: boolean
}

/**
 * Enforcement de auth das páginas protegidas (B1.2a) — a camada que torna
 * o middleware otimista da B1.2b seguro: toda página protegida verifica o
 * usuário POR CONTA PRÓPRIA e expulsa (nada de spinner/null com user nulo).
 *
 * - Sem usuário válido → redirect('/login')
 * - Usuário com email não verificado → redirect('/verify-email')
 *   (semântica que hoje vive no middleware; muda de camada na B1.2b)
 *
 * O gate G-rotas (tests/gates/g-rotas-protegidas.test.ts) congela o
 * invariante: toda página de lib/protected-routes.ts PROTECTED_PAGES
 * passa por aqui.
 */
export async function requirePageUser(
  cookieStore: ReadonlyRequestCookies,
  options: { requireVerifiedEmail?: boolean } = {}
): Promise<PageUser> {
  const { requireVerifiedEmail = true } = options

  const user = await getServerSideUser(cookieStore)

  if (!user) {
    redirect("/login")
  }

  if (requireVerifiedEmail && !user.emailVerified) {
    redirect("/verify-email")
  }

  return user
}
