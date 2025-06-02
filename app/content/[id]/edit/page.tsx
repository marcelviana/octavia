"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ContentEditor } from "@/components/content-editor"
import { useAuth } from "@/contexts/auth-context"
import { getContentById, updateContent } from "@/lib/content-service"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [content, setContent] = useState<Content | null>(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [contentError, setContentError] = useState<string | null>(null)

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
      setContentError("Failed to load content for editing.")
    } finally {
      setContentLoading(false)
    }
  }

  const handleSave = async (updatedContent: any) => {
    if (!content) return

    try {
      await updateContent(content.id, updatedContent)
      // Navigate back to content view
      router.push(`/content/${content.id}`)
    } catch (err) {
      console.error("Error saving content:", err)
      // Handle error - could show toast notification
    }
  }

  const handleCancel = () => {
    router.push(`/content/${content?.id}`)
  }

  // Don't render anything while auth is loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f0]">
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
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f0]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading content for editing...</p>
        </div>
      </div>
    )
  }

  // Show error if content loading failed
  if (contentError || !content) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fff9f0]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1F36] mb-4">Content Not Found</h1>
          <p className="text-[#A69B8E] mb-6">{contentError || "The content you're trying to edit doesn't exist."}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
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
    )
  }

  return <ContentEditor content={content} onSave={handleSave} onCancel={handleCancel} />
}
