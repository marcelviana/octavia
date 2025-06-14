"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const AddContent = dynamic(() => import("@/components/add-content"), {
  loading: () => <p>Loading add content...</p>,
})
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function AddContentPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("add-content")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

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
    console.log("handleContentCreated called with:", content)
    if (!content?.id) {
      console.error("No content ID found:", content)
      return
    }
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
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={sidebarMobileOpen}
        onMobileOpenChange={setSidebarMobileOpen}
      />
      <div className={cn("flex-1 flex flex-col transition-all duration-300 ease-in-out", sidebarCollapsed ? "md:ml-20" : "md:ml-72")}
      >
        <Header onMenuClick={() => setSidebarMobileOpen(true)} title="Add Content" />
        <main className="flex-1 overflow-auto">
          <AddContent
            onNavigate={handleNavigate}
            onContentCreated={handleContentCreated}
            onBack={() => router.back()}
          />
        </main>
      </div>
    </div>
  )
}
