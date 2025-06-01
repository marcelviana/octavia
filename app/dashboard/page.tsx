"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("dashboard")

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    if (screen === "dashboard") {
      setActiveScreen(screen)
    } else {
      router.push(`/${screen}`)
    }
  }

  // Handle content selection
  const handleSelectContent = (content: any) => {
    router.push(`/content/${content.id}`)
  }

  // Handle performance mode
  const handleEnterPerformance = () => {
    router.push("/performance")
  }

  // Don't render anything while loading to prevent blinking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f0]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#fff9f0]">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
      <main className="flex-1 ml-64 overflow-auto">
        <Dashboard
          onNavigate={handleNavigate}
          onSelectContent={handleSelectContent}
          onEnterPerformance={handleEnterPerformance}
        />
      </main>
    </div>
  )
}
