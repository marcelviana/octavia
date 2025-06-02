"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AddContent } from "@/components/add-content"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function AddContentPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("add-content")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    if (screen === "add-content") {
      setActiveScreen(screen)
    } else {
      router.push(`/${screen}`)
    }
  }

  // Handle content creation completion
  const handleContentCreated = (content: any) => {
    router.push(`/content/${content.id}`)
  }

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading...</p>
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
          sidebarCollapsed ? "ml-20" : "ml-72",
        )}
      >
        <AddContent onNavigate={handleNavigate} onContentCreated={handleContentCreated} />
      </main>
    </div>
  )
}
