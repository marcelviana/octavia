"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/firebase-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [primaryInstrument, setPrimaryInstrument] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({})
  const { signUp } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    const errors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {}
    
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address"
    }
    
    if (!password.trim()) {
      errors.password = "Password is required"
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"
    }
    
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }
    
    if (!firstName.trim()) {
      errors.firstName = "First name is required"
    }
    
    if (!lastName.trim()) {
      errors.lastName = "Last name is required"
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

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

      // Check if user needs to confirm their email
      if (data?.user && !data.user.emailVerified) {
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create Your Account</CardTitle>
        <CardDescription>Join Octavia and start organizing your music library</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (fieldErrors.firstName) {
                    setFieldErrors(prev => ({ ...prev, firstName: undefined }))
                  }
                }}
                placeholder="John"
                required
                aria-invalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
                className={fieldErrors.firstName ? "border-red-500" : ""}
              />
              {fieldErrors.firstName && (
                <p id="firstName-error" className="text-sm text-red-600" role="alert">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (fieldErrors.lastName) {
                    setFieldErrors(prev => ({ ...prev, lastName: undefined }))
                  }
                }}
                placeholder="Doe"
                required
                aria-invalid={!!fieldErrors.lastName}
                aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
                className={fieldErrors.lastName ? "border-red-500" : ""}
              />
              {fieldErrors.lastName && (
                <p id="lastName-error" className="text-sm text-red-600" role="alert">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: undefined }))
                }
              }}
              placeholder="your.email@example.com"
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: undefined }))
                }
              }}
              placeholder="Minimum 6 characters"
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p id="password-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) {
                  setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }))
                }
              }}
              placeholder="Re-enter your password"
              required
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
              className={fieldErrors.confirmPassword ? "border-red-500" : ""}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-600" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-instrument">Primary Instrument (Optional)</Label>
            <Select value={primaryInstrument} onValueChange={setPrimaryInstrument}>
              <SelectTrigger id="primary-instrument">
                <SelectValue placeholder="Select your primary instrument" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guitar">Guitar</SelectItem>
                <SelectItem value="piano">Piano</SelectItem>
                <SelectItem value="bass">Bass</SelectItem>
                <SelectItem value="drums">Drums</SelectItem>
                <SelectItem value="vocals">Vocals</SelectItem>
                <SelectItem value="violin">Violin</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link 
            href="/login" 
            className="text-blue-600 hover:underline"
            aria-label="Sign in to existing account"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
