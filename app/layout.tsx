import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { FirebaseAuthProvider } from "@/contexts/firebase-auth-context"
import { SessionProvider } from "@/components/providers/session-provider"
import { Toaster } from "@/components/ui/sonner"
import { EnhancedPwaInstallPrompt } from "@/components/pwa-install-prompt"
import { ErrorBoundary } from "@/lib/error-boundary"

// Update app/layout.tsx metadata
export const metadata: Metadata = {
  title: "Octavia - Digital Music Management",
  description: "Organize, visualize, and share your musical content",
  generator: "v0.dev",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png", // Updated path
    apple: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#f59e0b", // Moved from metadata to viewport
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <FirebaseAuthProvider>
            <SessionProvider>{children}</SessionProvider>
            <Toaster richColors position="top-right" />
            <EnhancedPwaInstallPrompt />
          </FirebaseAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
