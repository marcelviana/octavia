"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

const AddContent = dynamic(() => import("@/components/add-content").then(mod => ({ default: mod.AddContent })), {
  loading: () => <p>Loading add content...</p>,
})
import { ResponsiveLayout } from "@/components/responsive-layout"
import { useAuth } from "@/contexts/firebase-auth-context"

export default function AddContentPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("add-content")
  const [resetKey, setResetKey] = useState(0)

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    if (screen === "add-content") {
      setActiveScreen(screen)
      setResetKey((k) => k + 1) // Use setState to force re-render
    } else {
      router.push(`/${screen}`)
    }
  }

  // Handle content creation completion
  const handleContentCreated = (content: Content) => {
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
    <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
      <AddContent
        key={resetKey} // This key forces component remount when incremented
        onNavigate={handleNavigate}
        onContentCreated={handleContentCreated}
        onBack={() => router.back()}
      />
    </ResponsiveLayout>
  )
}
