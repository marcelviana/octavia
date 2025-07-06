"use client"

import { useAuth } from "@/contexts/firebase-auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ProfileForm from "@/components/ProfileForm"
import { ResponsiveLayout } from "@/components/responsive-layout"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, isInitialized } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeScreen, setActiveScreen] = useState("profile")
  const [prevPath, setPrevPath] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Try to get the previous path from document.referrer (client-side only)
    if (typeof window !== "undefined") {
      // Only set if not coming from /profile itself
      const ref = document.referrer
      if (ref && !ref.endsWith("/profile")) {
        setPrevPath(ref)
      }
    }
  }, [])

  // Handle navigation from sidebar/bottom nav
  const handleNavigate = (screen: string) => {
    if (screen === "profile") {
      setActiveScreen(screen)
    } else {
      router.push(`/${screen}`)
    }
  }

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
        </div>
      </div>
    )
  }

  // Show loading while auth is initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffcf7]">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
          <Skeleton className="h-10 w-[350px]" />
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.replace("/login")
    return null
  }

  return (
    <ResponsiveLayout activeScreen={activeScreen} onNavigate={handleNavigate}>
      <ProfileForm prevPath={prevPath} />
    </ResponsiveLayout>
  )
}
