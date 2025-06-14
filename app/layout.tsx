import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Octavia - Digital Music Management",
  description: "Organize, visualize, and share your musical content",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SessionProvider>{children}</SessionProvider>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
