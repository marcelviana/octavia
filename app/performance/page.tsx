"use client"
import { useRouter } from "next/navigation"
import { PerformanceMode } from "@/components/performance-mode"
import { useAuth } from "@/contexts/auth-context"

export default function PerformancePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Handle exit performance mode
  const handleExitPerformance = () => {
    router.back()
  }

  // Don't render anything while loading
  if (isLoading) {
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

  return <PerformanceMode onExitPerformance={handleExitPerformance} />
}
