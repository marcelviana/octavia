"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle, Mail, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/firebase-auth-context"

export default function ConfirmEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const { resendVerificationEmail, user } = useAuth()

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-amber-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl text-amber-900">Confirm Your Email</CardTitle>
          <CardDescription className="text-amber-700">
            We&apos;ve sent a confirmation link to your email. Click the link to activate your account.
            {user?.email && (
              <span className="block mt-2 text-sm">
                Email sent to: <span className="font-medium">{user.email}</span>
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

            <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Link href="/login">Go to Login</Link>
            </Button>

            <div className="text-center">
              <p className="text-sm text-amber-700 mb-3">
                Didn&apos;t receive the email?
              </p>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
