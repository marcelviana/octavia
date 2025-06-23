"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"

const ContentEditPageClient = dynamic(
  () => import("@/components/content-edit-page-client"),
  { loading: () => <p>Loading editor...</p> }
)
import { useAuth } from "@/contexts/firebase-auth-context"
import { getContentById } from "@/lib/content-service"
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
    let mounted = true

    const loadContent = async (contentId: string) => {
      try {
        if (mounted) setContentLoading(true)
        if (mounted) setContentError(null)
        const data = await getContentById(contentId)
        if (mounted) setContent(data)
      } catch (err) {
        console.error("Error loading content:", err)
        if (mounted) setContentError("Failed to load content for editing.")
      } finally {
        if (mounted) setContentLoading(false)
      }
    }

    if (params.id && user) {
      loadContent(params.id as string)
    }

    return () => {
      mounted = false
    }
  }, [params.id, user])


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

  return <ContentEditPageClient content={content} />
}
