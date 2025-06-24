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
import { useAuth } from "@/contexts/firebase-auth-context"
import { Music, User, Mail, Lock, UserPlus, ChevronLeft } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SignupPanel() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [primaryInstrument, setPrimaryInstrument] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error, data } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        primary_instrument: primaryInstrument,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user && !data?.session) {
        router.push("/signup/confirm-email")
      } else {
        router.push("/")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <div className="absolute inset-0 bg-amber-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-amber-100 rounded-full flex items-center justify-center">
              <Image
                src="/logos/octavia-icon.webp"
                alt="Octavia"
                width={80}
                height={80}
                priority
                sizes="80px"
                className="transform hover:scale-105 transition-transform duration-300 object-contain"
              />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
            Join Octavia
          </h1>
          <p className="mt-2 text-amber-800 font-medium">Create your account to get started</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg shadow-amber-100/50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center mb-2">
              <UserPlus className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-xl text-amber-900">Sign Up</CardTitle>
            </div>
            <CardDescription className="text-amber-700">Fill in your details to create your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-amber-800 font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-amber-800 font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-800 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryInstrument" className="text-amber-800 font-medium">
                  Primary Instrument
                </Label>
                <Select value={primaryInstrument} onValueChange={setPrimaryInstrument}>
                  <SelectTrigger className="bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500">
                    <SelectValue placeholder="Select your primary instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guitar">Guitar</SelectItem>
                    <SelectItem value="piano">Piano</SelectItem>
                    <SelectItem value="violin">Violin</SelectItem>
                    <SelectItem value="drums">Drums</SelectItem>
                    <SelectItem value="vocals">Vocals</SelectItem>
                    <SelectItem value="bass">Bass</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-800 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <p className="text-xs text-amber-600">Password must be at least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-amber-800 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 bg-white border-amber-200 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2 transition-all duration-300 shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-amber-600 hover:text-amber-800 font-medium text-sm transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="mt-6 text-center text-amber-700 text-sm">
          <p>© 2023 Octavia Music. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
