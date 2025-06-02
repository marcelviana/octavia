"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ProfileForm from "@/components/ProfileForm"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [status])

  if (status === "unauthenticated") {
    redirect("/login")
  }

  if (isLoading) {
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

  return (
    <div className="flex h-screen bg-[#fffcf7]">
      <ProfileForm session={session} />
    </div>
  )
}
