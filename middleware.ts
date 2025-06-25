import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'

export const runtime = 'edge' // Use Edge Runtime for better performance


export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const protectedRoutes = ["/dashboard", "/library", "/setlists", "/settings", "/profile", "/add-content", "/content"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Check for Firebase session cookie
  const firebaseSessionCookie = request.cookies.get('firebase-session')?.value
  
  // Track authentication status
  let isAuthenticated = false

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
      isAuthenticated = (await validateFirebaseTokenServer(token, request.url)).isValid;
      
      if (isAuthenticated) {
        console.log('Middleware: Token validation successful for', request.nextUrl.pathname)
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

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/library/:path*',
    '/setlists/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/add-content/:path*',
    '/content/:path*',
    '/login',
    '/signup',
  ],
}
