import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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
  
  // Simple authentication check based on session cookie presence
  // For detailed validation, we rely on API routes and page components
  let isAuthenticated = false
  
  // Check for Authorization header (for API requests)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    // Basic token presence check (actual validation happens in API routes)
    isAuthenticated = token.length > 10
  }
  
  // Check for session cookie (for page requests)
  // We do a simple presence check here, detailed validation happens in components/API routes
  if (!isAuthenticated && firebaseSessionCookie && firebaseSessionCookie.length > 10) {
    isAuthenticated = true
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
  matcher: ["/((?!_next|.*..*).*)"],
}
