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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fffcf7]">
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Image src="/logos/octavia-logo-full.png" alt="Octavia" width={200} height={80} className="mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back to Octavia</h1>
            <p className="mt-2 text-[#A69B8E]">Your digital music companion</p>
          </div>

          <Card className="bg-[#fff9f0] border-[#F2EDE5]">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="m@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#F8F4ED] border-[#A69B8E]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#F8F4ED] border-[#A69B8E]"
                  />
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <div className="text-center text-sm text-[#A69B8E]">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden md:flex md:flex-1 bg-blue-600 relative">
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center text-white p-12">
          <h2 className="text-3xl font-bold mb-4">Organize your music, anywhere</h2>
          <p className="text-lg max-w-md text-center">
            Access your sheet music, tabs, and lyrics from any device. Perfect for rehearsals and performances.
          </p>
        </div>
        <Image src="/placeholder.svg?height=1080&width=1080" alt="Musician" fill className="object-cover" priority />
      </div>
    </div>
  )
}
