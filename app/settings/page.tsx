"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings } from "@/components/settings"
import { ResponsiveLayout } from "@/components/responsive-layout"
import { useAuth } from "@/contexts/firebase-auth-context"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("settings")

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    if (screen === "settings") {
      setActiveScreen(screen)
    } else {
      router.push(`/${screen}`)
    }
  }

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
      <Settings />
    </ResponsiveLayout>
  )
}
