"use client"
import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getUserSetlists } from "@/lib/setlist-service"
import { getUserContentPage } from "@/lib/content-service"
import { replaceSetlists, getCachedSetlists } from "@/lib/offline-setlist-cache"
import { saveContent, getCachedContent } from "@/lib/offline-cache"
import type { Database } from "@/types/database.types"

export type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
export type Content = Database["public"]["Tables"]["content"]["Row"]
export type SetlistWithSongs = Setlist & {
  setlist_songs: Array<{
    id: string
    position: number
    notes: string | null
    content: Content
  }>
}

interface UseSetlistDataResult {
  setlists: SetlistWithSongs[]
  setSetlists: React.Dispatch<React.SetStateAction<SetlistWithSongs[]>>
  content: Content[]
  setContent: React.Dispatch<React.SetStateAction<Content[]>>
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useSetlistData(user: any | null, ready: boolean): UseSetlistDataResult {
  const [setlists, setSetlists] = useState<SetlistWithSongs[]>([])
  const [availableContent, setAvailableContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inProgressRef = useRef(false)
  const lastFocusTimeRef = useRef(Date.now())

  const load = useCallback(async (forceRefresh = false) => {
    if (!user || inProgressRef.current) {
      return
    }
    inProgressRef.current = true
    
    // Visível fora do try: decide o tratamento de falha de rede abaixo
    let hasCachedSets = false

    try {
      setLoading(true)
      setError(null)

      // 1. Cache-first: hidrata do IndexedDB antes de qualquer rede. Offline
      // (ou com rede caída), a tela lista o último estado conhecido —
      // staleness é aceitável e preferível ao estado vazio de primeiro uso.
      try {
        const [cachedSets, cachedContent] = await Promise.all([
          getCachedSetlists(),
          getCachedContent(),
        ])
        if (cachedSets.length > 0) {
          hasCachedSets = true
          setSetlists(cachedSets as SetlistWithSongs[])
          setLoading(false) // lista imediatamente; a rede revalida por trás
        }
        if (cachedContent.length > 0) {
          setAvailableContent(cachedContent)
        }
      } catch (cacheErr) {
        console.warn("useSetlistData: Failed to hydrate from cache:", cacheErr)
      }

      // 2. Sem rede declarada, fica no cache. Atalho, não porta: rede caída
      // com navigator.onLine === true segue para o fetch e cai no rejected
      // abaixo (o caso real de palco — wi-fi conectado sem internet)
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!hasCachedSets) {
          // Offline sem cache: mesmo estado de erro do rejected sem cache —
          // nunca o empty state de primeiro uso
          setError("Couldn't load setlists. Check your connection and try again.")
        }
        return
      }

      // Ensure we have a valid user with proper authentication
      const userForQuery = user && user.uid ? { id: user.uid, email: user.email } : null
      if (!userForQuery) {
        console.warn("useSetlistData: No valid user found for query")
        setError("Authentication required")
        return
      }

      // 3. Revalidação pela rede
      const [setsResult, contentResult] = await Promise.allSettled([
        getUserSetlists(userForQuery),
        getUserContentPage({
          page: 1,
          pageSize: 1000, // Get all content for setlist management
          search: "",
          sortBy: "recent",
          filters: {},
          useCache: !forceRefresh,
        }, undefined, userForQuery)
      ])

      if (setsResult.status === "fulfilled") {
        const setsData = setsResult.value as SetlistWithSongs[]
        setSetlists(setsData)
        // A resposta do servidor é a verdade: substitui o cache (sem merge,
        // senão setlists deletadas em outro dispositivo ressuscitariam)
        try {
          await replaceSetlists(setsData as any[])
        } catch (cacheErr) {
          console.warn("useSetlistData: Failed to cache setlists:", cacheErr)
        }
      } else {
        console.error("useSetlistData: Sets loading failed:", setsResult.reason)
        // Falha de rede nunca vira lista vazia: com cache na tela, mantém;
        // sem cache, estado de erro — nunca o empty state de primeiro uso
        if (!hasCachedSets) {
          setError("Couldn't load setlists. Check your connection and try again.")
        }
      }

      if (contentResult.status === "fulfilled") {
        const contentData = contentResult.value.data || []
        setAvailableContent(contentData)
        try {
          if (contentData.length > 0) {
            await saveContent(contentData)
          }
        } catch (cacheErr) {
          console.warn("useSetlistData: Failed to cache content:", cacheErr)
        }
      } else {
        // Estado já hidratado do cache no passo 1; só registra
        console.error("useSetlistData: Content loading failed:", contentResult.reason)
      }
    } catch (err: any) {
      console.error("useSetlistData: Error:", err)
      if (!hasCachedSets) {
        setError(err?.message ?? "Failed to load data")
      }
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user, ready])

  useEffect(() => {
    if (ready && user && user.uid) {
      // Use a small delay to ensure Firebase Auth is fully initialized
      const timeoutId = setTimeout(() => {
        load(true) // Force refresh to get latest data
      }, 100)
      
      return () => clearTimeout(timeoutId)
    } else if (ready && !user) {
      setLoading(false)
      setSetlists([])
      setAvailableContent([])
      setError(null)
    }
    // Explicit return for all code paths
    return undefined
  }, [ready, user?.uid, load])

  // Add window focus listener to refresh data when user returns to the tab
  useEffect(() => {
    const handleWindowFocus = () => {
      const now = Date.now()
      if (ready && user && user.uid && (now - lastFocusTimeRef.current) > 30000) {
        load(true) // Force refresh to bypass cache
      }
      lastFocusTimeRef.current = now
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleWindowFocus()
      }
    }

    // Only add listeners if we have a valid user
    if (user && user.uid) {
      window.addEventListener('focus', handleWindowFocus)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ready, user, load])

  return {
    setlists,
    setSetlists,
    content: availableContent,
    setContent: setAvailableContent,
    loading,
    error,
    reload: () => load(true), // Force refresh to bypass cache
  }
}
