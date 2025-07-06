"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Mail, RefreshCw, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/firebase-auth-context"

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const { resendVerificationEmail, user, signOut } = useAuth()
  const router = useRouter()

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const { error } = await resendVerificationEmail()
      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setResendError("An unexpected error occurred")
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)
    try {
      // Force a token refresh to get the latest email verification status
      await user?.reload()
      
      // Check if email is now verified
      if (user?.emailVerified) {
        router.push("/dashboard")
      } else {
        setResendError("Email not verified yet. Please check your inbox and click the verification link.")
      }
    } catch (err) {
      setResendError("Failed to check verification status")
    } finally {
      setIsChecking(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/login")
    } else if (user.emailVerified) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle className="text-xl text-amber-900">Verify Your Email</CardTitle>
          <CardDescription className="text-amber-700">
            Please verify your email address to access Octavia.
            {user?.email && (
              <span className="block mt-2 text-sm">
                Email: <span className="font-medium">{user.email}</span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                Verification email sent successfully! Please check your inbox.
              </div>
            )}
            
            {resendError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {resendError}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                disabled={isChecking}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I've Verified My Email
                  </>
                )}
              </Button>

              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="outline"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full text-amber-600 hover:bg-amber-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="text-center text-sm text-amber-600">
              <p>Having trouble? Check your spam folder or contact support.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 