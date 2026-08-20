import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import '@/lib/logger'
import { generateNonce } from '@/lib/csp-nonce'
import { applySecurityHeaders } from '@/lib/security-headers'
import { PROTECTED_ROUTE_PREFIXES } from '@/lib/protected-routes'

export const runtime = 'nodejs'

// B1.2b — middleware OTIMISTA (docs/ux/PLANO-TRANSICAO.md, seção B1):
// checa só PRESENÇA + FORMA do cookie de sessão (JWT: 3 segmentos
// base64url). A verificação criptográfica real — e os redirects que
// dependem dela — vive nas páginas via requirePageUser (B1.2a, gate
// G-rotas): user inválido → /login; email não verificado →
// /verify-email; auth-routes (login/signup) redirecionam usuário VÁLIDO
// ao dashboard nas próprias páginas. É isso que mata o loop
// /login↔/dashboard que um otimista ingênuo criaria: o middleware nunca
// redireciona COM base em cookie que não validou.
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export async function middleware(request: NextRequest) {

  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    return NextResponse.redirect(new URL(request.url.replace('http://', 'https://')));
  }

  // Generate a nonce for CSP
  const nonce = generateNonce()

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Pass the nonce to the page via a custom header
  response.headers.set('x-csp-nonce', nonce)

  // Apply comprehensive security headers (handles config and nonce internally)
  applySecurityHeaders(response, request, nonce)

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((route) => request.nextUrl.pathname.startsWith(route))

  const sessionCookie = request.cookies.get('firebase-session')?.value
  const hasWellFormedSession = !!sessionCookie && JWT_SHAPE.test(sessionCookie)

  if (isProtectedRoute && !hasWellFormedSession) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
