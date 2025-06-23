"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient, isSupabaseConfigured, getSessionSafe } from "@/lib/supabase"
import { clearOfflineContent } from "@/lib/offline-cache"
import { clearOfflineSetlists } from "@/lib/offline-setlist-cache"

type Profile = {
  id: string
  email: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  primary_instrument: string | null
  bio?: string | null
  website?: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: any
  isLoading: boolean
  loading: boolean
  isConfigured: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: any; data: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch profile as a reusable function
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.warn("Error fetching profile:", error.message)
        return null
      }

      return profileData
    } catch (error) {
      console.warn("Profile fetch failed:", error)
      return null
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const initializeAuth = async () => {
      try {
        // If Supabase is not configured, set demo user and finish loading
        if (!isSupabaseConfigured) {
          console.log("Running in demo mode - Supabase not configured")
          if (mounted) {
            // Set a demo user for development
            const demoUser = {
              id: "demo-user",
              email: "demo@musicsheet.pro",
              user_metadata: { full_name: "Demo User" },
            } as unknown as User

            const demoProfile = {
              id: "demo-user",
              email: "demo@musicsheet.pro",
              full_name: "Demo User",
              first_name: "Demo",
              last_name: "User",
              avatar_url: null,
              primary_instrument: "Guitar",
              bio: "Demo user for MusicSheet Pro",
              website: "https://musicsheet.pro",
            }

            setUser(demoUser)
            setProfile(demoProfile)
            setSession({ user: demoUser })
            setIsLoading(false)
            setIsInitialized(true)
          }
          return
        }

        console.log("Initializing auth context...")
        const supabase = getSupabaseBrowserClient()

        // Get initial session
        try {
          const initialSession = await getSessionSafe()

          if (initialSession?.user && mounted) {
            console.log("Found existing session for user:", initialSession.user.email)
            setUser(initialSession.user)
            setSession(initialSession)
            
            const profileData = await fetchProfile(initialSession.user.id)
            if (profileData && mounted) {
              setProfile(profileData)
            }
          } else {
            console.log("No active session found")
          }
        } catch (sessionError) {
          console.warn("Session retrieval failed:", sessionError)
        }

        // Set up auth state listener with error handling
        try {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
            if (!mounted) return

            console.log("Auth state changed:", event, currentSession?.user?.email)

            try {
              if (currentSession?.user) {
                setUser(currentSession.user)
                setSession(currentSession)
                
                const profileData = await fetchProfile(currentSession.user.id)
                if (profileData && mounted) {
                  setProfile(profileData)
                }
              } else {
                setUser(null)
                setProfile(null)
                setSession(null)
              }
            } catch (stateError) {
              console.warn("Auth state change error:", stateError)
            }

            if (mounted) {
              setIsLoading(false)
              setIsInitialized(true)
            }
          })

          authSubscription = subscription
        } catch (listenerError) {
          console.warn("Auth listener setup failed:", listenerError)
          if (mounted) {
            setIsLoading(false)
            setIsInitialized(true)
          }
        }

        // Add visibility change listener to refresh session when returning to tab
        const handleVisibilityChange = async () => {
          if (!document.hidden && mounted && isSupabaseConfigured) {
            try {
              console.log("Tab became visible, refreshing session...")
              
              // First try to get the current session safely
              const currentSession = await getSessionSafe()
              if (!currentSession) {
                console.log("No valid session found, clearing auth state")
                if (mounted) {
                  setUser(null)
                  setSession(null)
                  setProfile(null)
                }
                return
              }
              
              // If we have a valid session, update the state
              if (currentSession?.user && mounted) {
                console.log("Session is valid on tab focus")
                setUser(currentSession.user)
                setSession(currentSession)
                
                // Refresh profile if needed
                const profileData = await fetchProfile(currentSession.user.id)
                if (profileData && mounted) {
                  setProfile(profileData)
                }
              }
              
            } catch (refreshError) {
              console.warn("Session refresh on visibility change failed:", refreshError)
            }
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        const handleStorage = async (e: StorageEvent) => {
          if (e.key && e.key.includes('sb-') && e.key.endsWith('-auth-token')) {
            const newSession = await getSessionSafe()
            if (!mounted) return
            if (newSession?.user) {
              setUser(newSession.user)
              setSession(newSession)
              const profileData = await fetchProfile(newSession.user.id)
              if (profileData && mounted) {
                setProfile(profileData)
              }
            } else {
              setUser(null)
              setSession(null)
              setProfile(null)
            }
          }
        }

        window.addEventListener('storage', handleStorage)

        // Store the cleanup function for the visibility listener
        const cleanupVisibilityListener = () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('storage', handleStorage)
        }

        // Return cleanup function that includes visibility listener cleanup
        return cleanupVisibilityListener
      } catch (initError) {
        console.error("Auth initialization failed:", initError)
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      } finally {
        // Ensure we always set loading to false and initialized to true
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    let cleanupVisibilityListener: (() => void) | undefined

    initializeAuth().then((cleanup) => {
      cleanupVisibilityListener = cleanup
    })

    return () => {
      mounted = false
      if (authSubscription) {
        try {
          authSubscription.unsubscribe()
        } catch (error) {
          console.warn("Error unsubscribing from auth:", error)
        }
      }
      if (cleanupVisibilityListener) {
        cleanupVisibilityListener()
      }
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        return { error: { message: "Demo mode - authentication disabled" } }
      }

      try {
        console.log("Attempting sign in for:", email)
        setIsLoading(true)

        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error("Sign in error:", error.message)
          setIsLoading(false)
          return { error }
        }

        console.log("Sign in successful for:", email)
        setIsLoading(false)
        return { error: null }
      } catch (error: any) {
        console.error("Sign in exception:", error?.message || "Unknown error")
        setIsLoading(false)
        return { error: { message: error?.message || "Sign in failed" } }
      }
    },
    [isSupabaseConfigured],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return { error: { message: "Demo mode - authentication disabled" } }
    }

    try {
      console.log("Attempting Google sign in")
      setIsLoading(true)

      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      })

      if (error) {
        console.error("Google sign in error:", error.message)
        setIsLoading(false)
        return { error }
      }

      // Redirect handled by Supabase
      return { error: null }
    } catch (error: any) {
      console.error("Google sign in exception:", error?.message || "Unknown error")
      setIsLoading(false)
      return { error: { message: error?.message || "Google sign in failed" } }
    }
  }, [isSupabaseConfigured])

  const signUp = useCallback(
    async (email: string, password: string, userData: Partial<Profile>) => {
      if (!isSupabaseConfigured) {
        return { error: { message: "Demo mode - authentication disabled" }, data: null }
      }

      try {
        console.log("Attempting sign up for:", email)
        setIsLoading(true)

        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData,
          },
        })

        if (error) {
          console.error("Sign up error:", error.message)
          setIsLoading(false)
          return { error, data: null }
        }

        if (!data.user) {
          console.error("Sign up failed: No user returned")
          setIsLoading(false)
          return { error: { message: "Sign up failed: No user returned" }, data: null }
        }

        console.log("Sign up successful for:", email)

        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          ...userData,
        })

        if (profileError) {
          console.error("Profile creation error:", profileError.message)
          setIsLoading(false)
          return { error: profileError, data: null }
        }

        setIsLoading(false)
        return { error: null, data }
      } catch (error: any) {
        console.error("Sign up exception:", error?.message || "Unknown error")
        setIsLoading(false)
        return { error: { message: error?.message || "Sign up failed" }, data: null }
      }
    },
    [isSupabaseConfigured],
  )

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      window.location.href = "/"
      return
    }

    try {
      console.log("Signing out user")
      setIsLoading(true)

      const supabase = getSupabaseBrowserClient()
      const uid = user?.id
      await supabase.auth.signOut()

      try {
        await Promise.all([
          clearOfflineContent(uid),
          clearOfflineSetlists(uid),
        ])
      } catch (err) {
        console.warn("Failed to clear offline data:", err)
      }

      console.log("Sign out successful")
      window.location.href = "/"
    } catch (error) {
      console.warn("Sign out error:", error)
      window.location.href = "/"
    }
  }, [isSupabaseConfigured, user])

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user || !isSupabaseConfigured) {
        return { error: new Error("Not authenticated or not configured") }
      }

      try {
        console.log("Updating profile for user:", user.id)

        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

        if (error) {
          console.error("Profile update error:", error.message)
          return { error }
        }

        console.log("Profile updated successfully")
        setProfile((prev) => (prev ? { ...prev, ...data } : null))
        return { error: null }
      } catch (error: any) {
        console.error("Profile update exception:", error?.message || "Unknown error")
        return { error }
      }
    },
    [user, isSupabaseConfigured],
  )

  const value = {
    user,
    profile,
    session,
    isLoading,
    loading: isLoading, // Alias for compatibility
    isConfigured: isSupabaseConfigured,
    isInitialized,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
