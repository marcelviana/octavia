import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
import '@/lib/logger'
import { generateNonce } from '@/lib/csp-nonce'

export const runtime = 'nodejs'


export async function middleware(request: NextRequest) {

  if (process.env.NODE_ENV === 'production' && !request.url.startsWith('https://')) {
    return NextResponse.redirect(new URL(request.url.replace('http://', 'https://')));
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  // Generate a nonce for CSP
  const nonce = generateNonce()
  
  // Set security headers including CSP with proper nonce
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // Set CSP with actual nonce - more permissive for development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const csp = [
    "default-src 'self'",
    isDevelopment 
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com`
      : `script-src 'self' 'nonce-${nonce}' https://www.gstatic.com https://apis.google.com`,
    isDevelopment
      ? `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
      : `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "img-src 'self' blob: data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' blob: data: https://*.supabase.co https://*.firebase.com https://*.googleapis.com wss://*.supabase.co",
    "media-src 'self' blob: data: https://*.supabase.co",
    "frame-src 'self' https://*.firebaseapp.com https://*.firebase.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  const protectedRoutes = ["/dashboard", "/library", "/setlists", "/settings", "/profile", "/add-content", "/content"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Check for Firebase session cookie
  const firebaseSessionCookie = request.cookies.get('firebase-session')?.value

  // Track authentication status and user info
  let isAuthenticated = false
  let userInfo: { uid: string; email?: string; emailVerified?: boolean } | null = null

  // Check for Authorization header (for API requests)
  const authHeader = request.headers.get('authorization')
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (firebaseSessionCookie) {
    token = firebaseSessionCookie
  }

  // Validate token using server-side verification with caching
  if (token) {
    try {
      const validation = await validateFirebaseTokenServer(token, request.url)
      isAuthenticated = validation.isValid
      userInfo = validation.user || null

      if (isAuthenticated) {
        console.log('Middleware: Token validation successful for', request.nextUrl.pathname, 'Email verified:', userInfo?.emailVerified)
      } else {
        console.log('Middleware: Token validation failed')
      }
    } catch (error) {
      console.error('Token validation failed in middleware:', error)
      isAuthenticated = false
    }
  } else {
    console.log('Middleware: No token found for', request.nextUrl.pathname)
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is authenticated but email is not verified, redirect to verify-email page
  // (except for the verify-email page itself and some public routes)
  if (isAuthenticated && userInfo && !userInfo.emailVerified && isProtectedRoute) {
    console.log('Middleware: User not verified, redirecting to verify-email')
    return NextResponse.redirect(new URL("/verify-email", request.url))
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
