"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  updateProfile as updateFirebaseProfile
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { clearOfflineContent } from "@/lib/offline-cache"
import { clearOfflineSetlists } from "@/lib/offline-setlist-cache"
import { setSessionCookie, clearSessionCookie } from "@/lib/firebase-session-cookies"
import logger from "@/lib/logger"

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
  user: FirebaseUser | null
  profile: Profile | null
  idToken: string | null
  isLoading: boolean
  loading: boolean
  isConfigured: boolean
  isInitialized: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: any; data: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: (redirectToHome?: boolean) => Promise<void>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
  refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch profile from Supabase using Firebase UID
  const fetchProfile = useCallback(async (firebaseUid: string, token?: string): Promise<Profile | null> => {
    try {
      const authToken = token || idToken
      if (!authToken) {
        logger.warn("No auth token available for profile fetch")
        return null
      }

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          logger.warn("Unauthorized access to profile")
          return null
        }
        throw new Error('Failed to fetch profile')
      }
      
      const profileData = await response.json()
      return profileData
    } catch (error) {
      logger.warn("Error fetching profile:", error)
      return null
    }
  }, [idToken])

  // Get Firebase ID Token
  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!user || !auth) return null
    
    try {
      const token = await getIdToken(user, true)
      setIdToken(token)
      return token
    } catch (error) {
      logger.warn("Error getting ID token:", error)
      return null
    }
  }, [user])

  // Initialize Firebase Auth
  useEffect(() => {
    let mounted = true
    let unsubscribe: (() => void) | null = null

    const initializeAuth = async () => {
      try {
        if (!isFirebaseConfigured || !auth) {
          return
        }

        logger.log("Initializing Firebase auth context...")

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!mounted) return

          logger.log("Firebase auth state changed:", firebaseUser?.email || 'No user')

          try {
            if (firebaseUser) {
              setUser(firebaseUser)
              
              // Get ID token
              const token = await getIdToken(firebaseUser)
              setIdToken(token)
              
              // Set session cookie for better UX
              await setSessionCookie(firebaseUser)
              
              // Fetch profile from Supabase
              try {
                const response = await fetch('/api/profile', {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                })
                
                if (response.ok) {
                  const profileData = await response.json()
                  if (profileData && mounted) {
                    setProfile(profileData)
                  }
                } else if (response.status !== 401) {
                  logger.warn("Failed to fetch profile:", response.status)
                }
              } catch (profileError) {
                logger.warn("Error fetching profile:", profileError)
              }
            } else {
              setUser(null)
              setProfile(null)
              setIdToken(null)
              
              // Clear session cookie
              await clearSessionCookie()
            }
          } catch (stateError) {
            logger.warn("Auth state change error:", stateError)
          }

          if (mounted) {
            setIsLoading(false)
            setIsInitialized(true)
          }
        })

        // Handle visibility change to refresh token
        const handleVisibilityChange = async () => {
          if (!document.hidden && mounted && auth?.currentUser) {
            logger.log("Tab became visible, refreshing token...")
            try {
              const token = await getIdToken(auth.currentUser, true)
              setIdToken(token)
            } catch (error) {
              logger.warn("Error refreshing token on visibility change:", error)
            }
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }

      } catch (error) {
        logger.warn("Auth initialization failed:", error)
        if (mounted) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isFirebaseConfigured || !auth) {
        return { error: { message: "Authentication not configured" } }
      }

      try {
        logger.log("Attempting Firebase sign in for:", email)
        setIsLoading(true)

        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        logger.log("Firebase sign in successful for:", email)
        return { error: null }
      } catch (error: any) {
        logger.error("Firebase sign in error:", error.message)
        setIsLoading(false)
        return { error: { message: error.message || "Sign in failed" } }
      }
    },
    [isFirebaseConfigured],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured || !auth) {
      return { error: { message: "Authentication not configured" } }
    }

    try {
      logger.log("Attempting Google sign in")
      setIsLoading(true)

      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const firebaseUser = userCredential.user

      logger.log("Google sign in successful for:", firebaseUser.email)
      return { error: null }
    } catch (error: any) {
      logger.error("Google sign in error:", error.message)
      setIsLoading(false)
      return { error: { message: error.message || "Google sign in failed" } }
    }
  }, [isFirebaseConfigured])

  const signUp = useCallback(
    async (email: string, password: string, userData: Partial<Profile>) => {
      if (!isFirebaseConfigured || !auth) {
        return { error: { message: "Authentication not configured" }, data: null }
      }

      try {
        logger.log("Attempting Firebase sign up for:", email)
        setIsLoading(true)

        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const firebaseUser = userCredential.user

        // Update Firebase profile
        if (userData.full_name) {
          await updateFirebaseProfile(firebaseUser, {
            displayName: userData.full_name
          })
        }

        // Create profile in Supabase
        const token = await getIdToken(firebaseUser)
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...userData,
            id: firebaseUser.uid,
            email: firebaseUser.email,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create profile in database')
        }

        logger.log("Firebase sign up successful for:", email)
        setIsLoading(false)
        return { error: null, data: userCredential }
      } catch (error: any) {
        logger.error("Firebase sign up error:", error.message)
        setIsLoading(false)
        return { error: { message: error.message || "Sign up failed" }, data: null }
      }
    },
    [isFirebaseConfigured],
  )

  const signOut = useCallback(async (redirectToHome: boolean = true) => {
    if (!isFirebaseConfigured || !auth) {
      if (redirectToHome) {
        window.location.href = "/"
      }
      return
    }

    try {
      logger.log("Signing out Firebase user")
      setIsLoading(true)

      const uid = user?.uid
      await firebaseSignOut(auth)

      // Clear session cookie
      await clearSessionCookie()

      try {
        await Promise.all([
          clearOfflineContent(uid),
          clearOfflineSetlists(uid),
        ])
      } catch (err) {
        logger.warn("Failed to clear offline data:", err)
      }

      logger.log("Firebase sign out successful")
      if (redirectToHome) {
        window.location.href = "/"
      }
    } catch (error) {
      logger.warn("Firebase sign out error:", error)
      if (redirectToHome) {
        window.location.href = "/"
      }
    } finally {
      setIsLoading(false)
    }
  }, [isFirebaseConfigured, user])

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user || !idToken) {
        return { error: new Error("Not authenticated") }
      }

      try {
        logger.log("Updating profile for Firebase user:", user.uid)

        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to update profile')
        }

        const updatedProfile = await response.json()
        setProfile(updatedProfile)

        logger.log("Profile updated successfully")
        return { error: null }
      } catch (error: any) {
        logger.error("Profile update error:", error.message)
        return { error }
      }
    },
    [user, idToken],
  )

  const value = {
    user,
    profile,
    idToken,
    isLoading,
    loading: isLoading, // Alias for compatibility
    isConfigured: isFirebaseConfigured,
    isInitialized,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider")
  }
  return context
}

// Alias for backward compatibility
export const useAuth = useFirebaseAuth 