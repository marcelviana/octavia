import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

export const metadata: Metadata = {
  title: "Octavia - Digital Music Management",
  description: "Organize, visualize, and share your musical content",
  generator: "v0.dev",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  icons: {
    icon: "/logos/octavia-icon.png",
    apple: "/logos/octavia-icon.png",
    shortcut: "/logos/octavia-icon.png",
  },
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
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
