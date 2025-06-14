"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const AddContent = dynamic(() => import("@/components/add-content").then(mod => ({ default: mod.AddContent })), {
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
    <div className="flex flex-col h-screen bg-[#fffcf7]">
      <Header
        onMenuClick={() => setSidebarMobileOpen(true)}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        collapsed={sidebarCollapsed}
      />
      <div className="flex flex-1">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          mobileOpen={sidebarMobileOpen}
          onMobileOpenChange={setSidebarMobileOpen}
        />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "md:ml-20" : "md:ml-72",
          )}
        >
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
