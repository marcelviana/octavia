"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ConfirmEmailPage() {
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
