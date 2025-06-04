"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ContentViewer } from "@/components/content-viewer"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { getContentById } from "@/lib/content-service"
import type { Database } from "@/types/supabase"
import { ContentEditor } from "@/components/content-editor"
import { updateContent } from "@/lib/content-service"
import { cn } from "@/lib/utils"

type Content = Database["public"]["Tables"]["content"]["Row"]

export default function ContentPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("library")
  const [content, setContent] = useState<Content | null>(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (params.id && user) {
      loadContent(params.id as string)
    }
  }, [params.id, user])

  const loadContent = async (contentId: string) => {
    try {
      setContentLoading(true)
      setContentError(null)
      const data = await getContentById(contentId)
      setContent(data)
    } catch (err) {
      console.error("Error loading content:", err)
      setContentError("Failed to load content. It may not exist or you don't have permission to view it.")
    } finally {
      setContentLoading(false)
    }
  }

  // Handle navigation from sidebar
  const handleNavigate = (screen: string) => {
    router.push(`/${screen}`)
  }

  // Handle back navigation
  const handleBack = () => {
    router.back()
  }

  // Handle performance mode
  const handleEnterPerformance = () => {
    router.push(`/performance?contentId=${content.id}`)
  }

  // Handle edit mode toggle
  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = async (updatedContent: any) => {
    try {
      await updateContent(content.id, updatedContent)
      setContent({ ...content, ...updatedContent })
      setIsEditing(false)
    } catch (err) {
      console.error("Error saving content:", err)
      // Handle error
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Don't render anything while auth is loading
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

  // Show loading while content is being fetched
  if (contentLoading) {
    return (
      <div className="flex h-screen bg-[#fffcf7]">
        <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} onCollapsedChange={setSidebarCollapsed} />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-20" : "ml-72",
          )}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-[#1A1F36]">Loading content...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error if content loading failed
  if (contentError || !content) {
    return (
      <div className="flex h-screen bg-[#fffcf7]">
        <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} onCollapsedChange={setSidebarCollapsed} />
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-20" : "ml-72",
          )}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#1A1F36] mb-4">Content Not Found</h1>
              <p className="text-[#A69B8E] mb-6">{contentError || "The content you're looking for doesn't exist."}</p>
              <div className="space-x-4">
                <button
                  onClick={handleBack}
                  className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white px-6 py-2 rounded-lg"
                >
                  Go Back
                </button>
                <button
                  onClick={() => router.push("/library")}
                  className="bg-[#A69B8E] hover:bg-[#8B7D6F] text-white px-6 py-2 rounded-lg"
                >
                  Browse Library
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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
        {isEditing ? (
          <ContentEditor content={content} onSave={handleSaveEdit} onCancel={handleCancelEdit} />
        ) : (
          <ContentViewer
            content={content}
            onBack={handleBack}
            onEnterPerformance={handleEnterPerformance}
            onEdit={handleEdit}
          />
        )}
      </main>
    </div>
  )
}
