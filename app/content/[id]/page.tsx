"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ContentViewer } from "@/components/content-viewer"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"

export default function ContentPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [activeScreen, setActiveScreen] = useState("library")
  const [content, setContent] = useState(null)

  // Mock content data - in a real app, this would fetch from the database
  const mockContent = {
    1: {
      id: 1,
      title: "Hotel California",
      artist: "Eagles",
      type: "Guitar Tab",
      genre: "Rock",
      key: "Am",
      bpm: 75,
      difficulty: "Intermediate",
      tags: ["classic", "fingerpicking"],
      isFavorite: true,
    },
    2: {
      id: 2,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      type: "Sheet Music",
      genre: "Rock",
      key: "Bb",
      bpm: 72,
      difficulty: "Advanced",
      tags: ["epic", "piano"],
      isFavorite: false,
    },
    3: {
      id: 3,
      title: "Wonderwall",
      artist: "Oasis",
      type: "Chord Chart",
      genre: "Alternative",
      key: "Em",
      bpm: 87,
      difficulty: "Beginner",
      tags: ["acoustic", "strumming"],
      isFavorite: true,
    },
    4: {
      id: 4,
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
      type: "Guitar Tab",
      genre: "Rock",
      key: "Am",
      bpm: 82,
      difficulty: "Advanced",
      tags: ["epic", "solo"],
      isFavorite: false,
    },
  }

  useEffect(() => {
    if (params.id) {
      // In a real app, fetch content from database using the ID
      const foundContent = mockContent[params.id as string]
      setContent(foundContent)
    }
  }, [params.id])

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
    router.push("/performance")
  }

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading content...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  // Show error if content not found
  if (!content) {
    return (
      <div className="flex h-screen bg-[#fffcf7]">
        <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
        <main className="flex-1 ml-64 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#1A1F36] mb-4">Content Not Found</h1>
              <p className="text-[#A69B8E] mb-6">The content you're looking for doesn't exist.</p>
              <button onClick={handleBack} className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white px-6 py-2 rounded-lg">
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#fffcf7]">
      <Sidebar activeScreen={activeScreen} onNavigate={handleNavigate} />
      <main className="flex-1 ml-64 overflow-auto">
        <ContentViewer content={content} onBack={handleBack} onEnterPerformance={handleEnterPerformance} />
      </main>
    </div>
  )
}
