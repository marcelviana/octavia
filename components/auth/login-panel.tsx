"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Music, Lock, Mail } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import Image from "next/image"

export function LoginPanel({ initialError = "" }: { initialError?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(initialError)
  const [isLoading, setIsLoading] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)
  const router = useRouter()
  const { signIn, signInWithGoogle, isConfigured, user, profile, isInitialized } = useAuth()

  useEffect(() => {
    if (isInitialized && user && !hasRedirected) {
      setHasRedirected(true)
      const handleRedirect = async () => {
        if (isConfigured && !profile) {
          try {
            const supabase = getSupabaseBrowserClient()
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata.full_name || user.user_metadata.name || null,
              first_name: (user.user_metadata.full_name || "").split(" ")[0] || null,
              last_name: (user.user_metadata.full_name || "").split(" ").slice(1).join(" ") || null,
              avatar_url: user.user_metadata.avatar_url || null,
            })
            window.location.href = "/dashboard"
            return
          } catch (err) {
            console.error("Profile creation failed:", err)
          }
        }
        window.location.href = "/dashboard"
      }
      handleRedirect()
    }
  }, [user, profile, isInitialized, hasRedirected, isConfigured])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!isConfigured) {
        console.log("Demo mode - redirecting to dashboard")
        window.location.href = "/dashboard"
        return
      }

      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message || "Invalid credentials")
        setIsLoading(false)
        return
      }
      console.log("Login successful, waiting for auth state update...")
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setIsLoading(true)
    try {
      if (!isConfigured) {
        window.location.href = "/dashboard"
        return
      }

      const { error: googleError } = await signInWithGoogle()
      if (googleError) {
        setError(googleError.message || "Google sign in failed")
        setIsLoading(false)
      }
    } catch (err: any) {
      setError(err.message || "Google sign in failed")
      setIsLoading(false)
    }
  }

  if (isInitialized && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-amber-500 border-amber-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-amber-800">Redirecting to dashboard...</p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="mt-4 text-sm text-amber-600 hover:text-amber-800 underline"
          >
            Click here if not redirected automatically
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-40 h-40 mx-auto mb-4">
            <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-amber-100 rounded-full flex items-center justify-center">
              <Image src="/logos/octavia-icon.png" alt="Octavia Logo" width={64} height={64} className="object-contain" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
            Welcome to Octavia
          </h1>
          <p className="mt-2 text-amber-800 font-medium">Your digital music companion</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg shadow-amber-100/50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center mb-2">
              <Music className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-xl text-amber-900">Sign In</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              {!isConfigured ? "Demo mode - click Sign In to continue" : "Enter your credentials to access your music library"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-800 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                  <Input
                    id="email"
                    placeholder="your.email@example.com"
                    required={isConfigured}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    disabled={!isConfigured}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-amber-800 font-medium">
                    Password
                  </Label>
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={() => setError("Password reset not implemented in demo")}
                      className="text-sm text-amber-600 hover:text-amber-800 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    required={isConfigured}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    disabled={!isConfigured}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2 transition-all duration-300 shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white/80 px-2 text-sm text-amber-600">or</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full border border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  "Continue with Google"
                )}
              </Button>
              <div className="text-center">
                <p className="text-amber-800">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-amber-600 hover:text-amber-800 hover:underline transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="mt-8 text-center text-amber-700 text-sm">
          <p>© 2023 Octavia Music. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
