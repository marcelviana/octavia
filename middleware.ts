import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateFirebaseToken } from "@/lib/firebase-auth-middleware"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Check for Firebase authentication
  const validation = await validateFirebaseToken(request)
  const user = validation.isValid ? validation.user : null

  const protectedRoutes = ["/dashboard", "/library", "/setlists", "/settings", "/profile", "/add-content", "/content"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  // Check for Firebase session cookie
  const firebaseSessionCookie = request.cookies.get('firebase-session')?.value
  
  // If we have a session cookie but no user from header auth, try to validate the cookie
  let isAuthenticated = !!user
  if (!isAuthenticated && firebaseSessionCookie) {
    try {
      // Create a mock request with the cookie token in the header for validation
      const mockRequest = new Request(request.url, {
        headers: {
          'authorization': `Bearer ${firebaseSessionCookie}`
        }
      }) as NextRequest
      
      const cookieValidation = await validateFirebaseToken(mockRequest)
      isAuthenticated = cookieValidation.isValid
    } catch (error) {
      // Cookie validation failed, continue as unauthenticated
      isAuthenticated = false
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
