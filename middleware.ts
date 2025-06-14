import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import type { CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  const userCookie = request.cookies.get("sb-user")?.value
  let user

  if (userCookie) {
    try {
      user = JSON.parse(userCookie)
    } catch {
      user = null
    }
  }

  if (!user) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()
    user = fetchedUser
    if (user) {
      response.cookies.set("sb-user", JSON.stringify(user), { path: "/" })
    } else {
      response.cookies.set("sb-user", "", { path: "/", maxAge: 0 })
    }
  }

  const protectedRoutes = ["/dashboard", "/library", "/setlists", "/settings", "/profile", "/add-content", "/content"]
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.includes(request.nextUrl.pathname)

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next|.*..*).*)"],
}
