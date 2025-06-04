"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { PerformanceMode } from "@/components/performance-mode"
import { useAuth } from "@/contexts/auth-context"
import { getContentById } from "@/lib/content-service"
import { getSetlistById } from "@/lib/setlist-service"

export default function PerformancePage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, isLoading } = useAuth()
  const [content, setContent] = useState<any | null>(null)
  const [setlist, setSetlist] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const contentId = params.get("contentId")
    const setlistId = params.get("setlistId")

    const load = async () => {
      try {
        if (contentId) {
          const c = await getContentById(contentId)
          setContent(c)
        }

        if (setlistId) {
          const sl = await getSetlistById(setlistId)

          if (sl && sl.setlist_songs) {
            const songsWithContent = await Promise.all(
              sl.setlist_songs.map(async (song: any) => {
                const full = await getContentById(song.content_id)
                return { ...song, content: full }
              }),
            )

            sl.setlist_songs = songsWithContent
          }

          setSetlist(sl)
        }
      } catch (err) {
        console.error("Failed to load performance data", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [params])

  // Handle exit performance mode
  const handleExitPerformance = () => {
    router.back()
  }

  // Don't render anything while loading
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading performance mode...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    <PerformanceMode
      onExitPerformance={handleExitPerformance}
      selectedContent={content || undefined}
      selectedSetlist={setlist || undefined}
    />
  )
}
