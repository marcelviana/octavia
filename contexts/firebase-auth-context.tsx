"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  updateProfile as updateFirebaseProfile,
  sendEmailVerification
} from "firebase/auth"
import { auth, isFirebaseConfigured } from "@/lib/firebase"
import { setSessionCookie, clearSessionCookie, type FalhaSessao } from "@/lib/firebase-session-cookies"
import { AvisoDeSessao } from "@/components/auth/aviso-de-sessao"
import logger from "@/lib/logger"
import { getErrorMessage } from "@/lib/firebase-errors"

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

/** I1-PR1 (H-I1-7): o resultado do POST /api/auth/session como estado do provider. */
export type OrigemSessao = 'abertura' | 'renovacao'
export type EstadoSessao =
  | { estado: 'ausente' }
  | { estado: 'abrindo' }
  | { estado: 'aberta' }
  | { estado: 'falhou'; falha: FalhaSessao; origem: OrigemSessao }

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
  resendVerificationEmail: () => Promise<{ error: any }>
  sessao: EstadoSessao
  tentarSessaoDeNovo: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [sessao, setSessao] = useState<EstadoSessao>({ estado: 'ausente' })

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
      // Always force refresh to get a fresh token
      const token = await getIdToken(user, true)
      setIdToken(token)
      logger.log("Token refreshed successfully")
      return token
    } catch (error) {
      logger.warn("Error getting ID token:", error)
      return null
    }
  }, [user])

  // I1-PR1 (H-I1-7): refs do ciclo da sessão. `montado` substitui o `mounted`
  // local do efeito (as funções abaixo vivem fora dele); `suspensa` é o (c):
  // depois de uma falha, NADA tenta de novo sozinho até o usuário agir.
  const montado = useRef(true)
  const suspensa = useRef(false)
  const emCurso = useRef(false)
  const ultimaOrigem = useRef<OrigemSessao>('abertura')

  // Fetch profile from Supabase (só depois do 2xx do cookie — I1-PR1 (a))
  const carregarPerfil = useCallback(async (firebaseUser: FirebaseUser, token: string) => {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const profileData = await response.json()
        if (profileData && montado.current) {
          setProfile(profileData)
        }
      } else if (response.status === 401) {
        // Token might be expired, try refreshing once.
        logger.warn("Profile fetch unauthorized, attempting token refresh...")
        try {
          const freshToken = await getIdToken(firebaseUser, true)
          const retryResponse = await fetch('/api/profile', {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
          })

          if (retryResponse.ok) {
            const profileData = await retryResponse.json()
            if (profileData && montado.current) {
              setProfile(profileData)
              setIdToken(freshToken) // Update the stored token
            }
          } else {
            logger.warn("Profile fetch failed after token refresh:", retryResponse.status)
          }
        } catch (refreshError) {
          logger.warn("Token refresh failed during profile fetch:", refreshError)
        }
      } else {
        logger.warn("Failed to fetch profile:", response.status)
      }
    } catch (profileError) {
      logger.warn("Error fetching profile:", profileError)
    }
  }, [])

  // I1-PR1: um POST /api/auth/session → um estado. Nunca repete sozinho.
  const abrirSessao = useCallback(async (firebaseUser: FirebaseUser, origem: OrigemSessao): Promise<boolean> => {
    emCurso.current = true
    ultimaOrigem.current = origem
    try {
      const resultado = await setSessionCookie(firebaseUser)
      if (!montado.current) return false
      if (resultado.ok) {
        suspensa.current = false
        setSessao({ estado: 'aberta' })
        return true
      }
      suspensa.current = true
      setSessao({ estado: 'falhou', falha: resultado, origem })
      return false
    } finally {
      emCurso.current = false
    }
  }, [])

  // Renovação (visibilitychange e intervalo de 50 min): suspensa depois de uma
  // falha — a linha de aviso mostra a razão e o "Tentar de novo" é do usuário.
  const renovar = useCallback(async () => {
    const atual = auth?.currentUser
    if (!montado.current || !atual || suspensa.current || emCurso.current) return
    logger.log("Renewing session cookie...")
    try {
      const token = await getIdToken(atual, true)
      setIdToken(token)
    } catch (error) {
      logger.warn("Error refreshing token for session renewal:", error)
    }
    await abrirSessao(atual, 'renovacao')
  }, [abrirSessao])

  // "Tentar de novo": uma tentativa, por ação do usuário.
  const tentarSessaoDeNovo = useCallback(async () => {
    const atual = auth?.currentUser
    if (!atual || emCurso.current) return
    const origem = ultimaOrigem.current
    setSessao({ estado: 'abrindo' })
    let token: string | null = null
    try {
      token = await getIdToken(atual, true)
      setIdToken(token)
    } catch (error) {
      logger.warn("Error refreshing token before session retry:", error)
    }
    const aberta = await abrirSessao(atual, origem)
    if (aberta && origem === 'abertura' && token) await carregarPerfil(atual, token)
  }, [abrirSessao, carregarPerfil])

  // Initialize Firebase Auth
  useEffect(() => {
    montado.current = true
    if (!isFirebaseConfigured || !auth) {
      return
    }

    logger.log("Initializing Firebase auth context...")

    let unsubscribe: (() => void) | null = null
    try {
      // Set up auth state listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!montado.current) return

        logger.log("Firebase auth state changed:", firebaseUser?.email || 'No user')

        try {
          if (firebaseUser) {
            // I1-PR1 (a): o cookie ANTES de qualquer estado que leve a navegação —
            // o `user` só entra no contexto com o resultado do POST já conhecido.
            setSessao({ estado: 'abrindo' })
            const aberta = await abrirSessao(firebaseUser, 'abertura')
            if (!montado.current) return

            const token = await getIdToken(firebaseUser)
            setIdToken(token)
            setUser(firebaseUser)

            // I1-PR1: nenhum GET /api/profile sem o cookie
            if (aberta) await carregarPerfil(firebaseUser, token)
          } else {
            suspensa.current = false
            setSessao({ estado: 'ausente' })
            setUser(null)
            setProfile(null)
            setIdToken(null)

            // Clear session cookie (div. 527: fica — sincroniza o cookie do servidor
            // quando o cliente perdeu o usuário)
            await clearSessionCookie()
          }
        } catch (stateError) {
          logger.warn("Auth state change error:", stateError)
        }

        if (montado.current) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      })
    } catch (error) {
      logger.warn("Auth initialization failed:", error)
      setIsLoading(false)
      setIsInitialized(true)
    }

    const onVisibilityChange = () => {
      if (!document.hidden) void renovar()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Periodic renewal (every 50 minutes to stay ahead of 1-hour expiration)
    const tokenRefreshInterval = setInterval(() => { void renovar() }, 50 * 60 * 1000)

    // Div. 526: a limpeza é o retorno do EFEITO (antes era o retorno de uma
    // função async, descartado — os dois listeners sobreviviam à desmontagem)
    return () => {
      montado.current = false
      if (unsubscribe) unsubscribe()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearInterval(tokenRefreshInterval)
    }
  }, [abrirSessao, carregarPerfil, renovar])

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
        return { error: { message: getErrorMessage(error) } }
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
      return { error: { message: getErrorMessage(error) } }
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

        // Send email verification
        await sendEmailVerification(firebaseUser)

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
          // Rollback: sem o perfil no Supabase o usuário Firebase ficaria órfão
          // e o email nunca mais poderia se cadastrar
          try {
            await firebaseUser.delete()
          } catch (deleteError) {
            logger.error("Failed to delete orphaned Firebase user after profile creation failure:", deleteError)
          }
          throw new Error('Failed to create profile in database')
        }

        logger.log("Firebase sign up successful for:", email)
        setIsLoading(false)
        return { error: null, data: { user: firebaseUser } }
      } catch (error: any) {
        logger.error("Firebase sign up error:", error.message)
        setIsLoading(false)
        return { error: { message: getErrorMessage(error) }, data: null }
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

      await firebaseSignOut(auth)

      // Clear session cookie
      await clearSessionCookie()

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

  const resendVerificationEmail = useCallback(async () => {
    if (!user || !isFirebaseConfigured || !auth) {
      return { error: { message: "Not authenticated or Firebase not configured" } }
    }

    try {
      logger.log("Resending verification email for:", user.email)
      await sendEmailVerification(user)
      logger.log("Verification email sent successfully")
      return { error: null }
    } catch (error: any) {
      logger.error("Failed to resend verification email:", error.message)
      return { error: { message: getErrorMessage(error) } }
    }
  }, [user, isFirebaseConfigured])

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
    resendVerificationEmail,
    sessao,
    tentarSessaoDeNovo,
  }

  return (
    <AuthContext.Provider value={value}>
      <AvisoDeSessao sessao={sessao} onTentarDeNovo={tentarSessaoDeNovo} />
      {children}
    </AuthContext.Provider>
  )
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