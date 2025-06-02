"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Music, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message || "Invalid credentials")
        return
      }

      // Successful login will redirect in the auth context
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative w-40 h-40 mx-auto mb-4">
              <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 bg-amber-100 rounded-full flex items-center justify-center">
                <Image
                  src="/logos/octavia-icon.png"
                  alt="Octavia"
                  width={100}
                  height={100}
                  className="transform hover:scale-105 transition-transform duration-300"
                />
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
                Enter your credentials to access your music library
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
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-amber-800 font-medium">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-amber-600 hover:text-amber-800 hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                    <Input
                      id="password"
                      placeholder="Enter your password"
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
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
                <div className="text-center">
                  <p className="text-amber-800">
                    Don't have an account?{" "}
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
      <div className="hidden md:flex md:flex-1 bg-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/90 to-orange-700/90 z-10"></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1080')] bg-cover bg-center"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 z-20">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Your music, organized and accessible</h2>
            <p className="text-lg mb-8">
              Access your sheet music, tabs, and lyrics from any device. Perfect for rehearsals and performances.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Sheet Music</h3>
                  <p className="text-xs text-white/80">Organize & annotate</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Chord Charts</h3>
                  <p className="text-xs text-white/80">Quick reference</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Lyrics</h3>
                  <p className="text-xs text-white/80">Never forget words</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg flex items-center space-x-3 w-48">
                <div className="bg-white/30 rounded-full p-2">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Setlists</h3>
                  <p className="text-xs text-white/80">Plan performances</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
