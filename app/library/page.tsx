"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Library } from "@/components/library"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

export default function LibraryPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("library")
  const [isPageLoading, setIsPageLoading] = useState(true)

  // Handle initial loading and authentication
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else {
        setIsPageLoading(false)
      }
    }
  }, [user, isLoading, router])

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`)
  }

  // Handle content selection
  const handleSelectContent = (content: any) => {
    router.push(`/content/${content.id}`)
  }

  // Don't render anything while loading to prevent blinking
  if (isLoading || isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading your library...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#fffcf7]">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
      <main className="flex-1 ml-64 overflow-auto">
        <Library onSelectContent={handleSelectContent} />
      </main>
    </div>
  )
}
