"use client"

import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Casca } from "@/components/identidade/casca"
import { useAuth } from "@/contexts/firebase-auth-context"

// Bundle splitting: Lazy load setlist management features
const SetlistManager = dynamic(() => import("@/components/setlist-manager").then(mod => ({ default: mod.SetlistManager })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading setlists...</p>
      </div>
    </div>
  ),
  ssr: false // Client-side only for better performance
})

export default function SetlistsPageClient() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  // Handle setlist selection
  const handleSelectSetlist = (setlist: any) => {
    router.push(`/setlist/${setlist.id}`)
  }

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#1A1F36]">Loading your setlists...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  return (
    // I1-PR-9: a casca nova no lugar do ResponsiveLayout; o corpo velho fica como estava, com o fundo de antes
    <Casca>
      <div className="flex-1 bg-[#fffcf7]">
        <SetlistManager />
      </div>
    </Casca>
  )
}
