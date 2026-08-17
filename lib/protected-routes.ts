/**
 * Fonte única das rotas protegidas — consumida pelo middleware E pelo
 * gate G-rotas (tests/gates/g-rotas-protegidas.test.ts). A paridade
 * middleware↔gate é por construção: quem alterar esta lista altera os
 * dois ao mesmo tempo (B1.2a, docs/ux/PLANO-TRANSICAO.md).
 *
 * NOTA: /performance NÃO está nos prefixos do middleware (estado herdado,
 * preservado na B1.2a — middleware intocado até a B1.2b); a proteção dela
 * é da própria página, e o gate a cobre em PROTECTED_PAGES.
 */

/** Prefixos que o middleware trata como protegidos (redirect → /login). */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/library",
  "/setlists",
  "/settings",
  "/profile",
  "/add-content",
  "/content",
] as const

/**
 * Rotas de auth: usuário VÁLIDO é redirecionado ao /dashboard — pelas
 * PRÓPRIAS páginas (login/signup validam de verdade), nunca pelo
 * middleware otimista (B1.2b): redirecionar por forma de cookie criaria
 * o loop /login↔/dashboard com cookie inválido.
 */
export const AUTH_ROUTES = ["/login", "/signup"] as const

/**
 * Páginas protegidas com enforcement próprio (requirePageUser) — o
 * inventário que o G-rotas percorre. Toda página nova sob um prefixo
 * protegido DEVE entrar aqui (o gate falha se a paridade quebrar).
 */
export const PROTECTED_PAGES = [
  "/dashboard",
  "/library",
  "/setlists",
  "/settings",
  "/profile",
  "/add-content",
  "/content/[id]",
  "/performance",
] as const
