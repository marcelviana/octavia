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

  // Validate token via API route if we have one
  if (token) {
    try {
      // Call our API route to verify the token
      const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (verifyResponse.ok) {
        const result = await verifyResponse.json();
        isAuthenticated = result.success;
      }
    } catch (error) {
      console.error('Token verification failed in middleware:', error);
      // If verification fails, treat as unauthenticated
      isAuthenticated = false;
    }
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
