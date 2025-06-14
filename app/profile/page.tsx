"use client"

import { useAuth } from "@/contexts/auth-context"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ProfileForm from "@/components/ProfileForm"
import { Header } from "@/components/header"

export default function ProfilePage() {
  const { user, isLoading, isInitialized } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    redirect("/login")
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fffcf7]">
      <Header />
      <main className="flex-1 overflow-auto">
        <ProfileForm />
      </main>
    </div>
  )
}
