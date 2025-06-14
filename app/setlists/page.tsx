"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SetlistManager } from "@/components/setlist-manager"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function SetlistsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("setlists")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    if (screen === "setlists") {
      setActiveScreen(screen)
    } else {
      router.push(`/${screen}`)
    }
  }

  // Handle setlist selection
  const handleSelectSetlist = (setlist: any) => {
    router.push(`/setlist/${setlist.id}`)
  }

  const handleStartPerformance = (setlist: any) => {
    router.push(`/performance?setlistId=${setlist.id}`)
  }

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading your setlists...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#fffcf7]">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} onCollapsedChange={setSidebarCollapsed} />
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "md:ml-20" : "md:ml-72",
        )}
      >
        <SetlistManager onEnterPerformance={handleStartPerformance} />
      </main>
    </div>
  )
}
