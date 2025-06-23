"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/firebase-auth-context"
import type { User } from "firebase/auth"

// Create a context that mimics NextAuth's SessionContext
type SessionContextValue = {
  data: { user: User } | null
  status: "loading" | "authenticated" | "unauthenticated"
  update: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  update: async () => {},
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  useEffect(() => {
    if (loading) {
      setStatus("loading")
    } else if (user) {
      setStatus("authenticated")
    } else {
      setStatus("unauthenticated")
    }
  }, [user, loading])

  const update = async () => {
    // This function would typically refresh the session
    // For Supabase, we rely on the auth context to handle this
  }

  return (
    <SessionContext.Provider
      value={{
        data: user ? { user } : null,
        status,
        update,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  return useContext(SessionContext)
}
