"use client"
import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getUserSetlists } from "@/lib/setlist-service"
import { getUserContentPage } from "@/lib/content-service"
import { saveSetlists, getCachedSetlists } from "@/lib/offline-setlist-cache"
import { saveContent, getCachedContent } from "@/lib/offline-cache"
import type { Database } from "@/types/supabase"

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
    
    try {
      setLoading(true)
      setError(null)

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const [cachedSets, cachedContent] = await Promise.all([
          getCachedSetlists(),
          getCachedContent(),
        ])
        setSetlists(cachedSets as SetlistWithSongs[])
        setAvailableContent(cachedContent)
        return
      }

      // Ensure we have a valid user with proper authentication
      const userForQuery = user && user.uid ? { id: user.uid, email: user.email } : null
      if (!userForQuery) {
        console.warn("useSetlistData: No valid user found for query")
        setError("Authentication required")
        return
      }

      // Load setlists and content using proper service functions
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

      let setsData: SetlistWithSongs[] = []
      let contentData: Content[] = []

      if (setsResult.status === "fulfilled") {
        setsData = setsResult.value as SetlistWithSongs[]
      } else {
        console.error("useSetlistData: Sets loading failed:", setsResult.reason)
        // Try to load from cache
        try {
          setsData = await getCachedSetlists() as SetlistWithSongs[]
        } catch (cacheErr) {
          console.error("useSetlistData: Failed to load cached setlists:", cacheErr)
        }
      }

      if (contentResult.status === "fulfilled") {
        contentData = contentResult.value.data || []
      } else {
        console.error("useSetlistData: Content loading failed:", contentResult.reason)
        // Try to load from cache
        try {
          contentData = await getCachedContent()
        } catch (cacheErr) {
          console.error("useSetlistData: Failed to load cached content:", cacheErr)
        }
      }

      setSetlists(setsData)
      setAvailableContent(contentData)

      // Cache the data
      try {
        if (setsData.length > 0) {
          await saveSetlists(setsData as any[])
        }
        if (contentData.length > 0) {
          await saveContent(contentData)
        }
      } catch (cacheErr) {
        console.warn("useSetlistData: Failed to cache data:", cacheErr)
      }

    } catch (err: any) {
      console.error("useSetlistData: Error:", err)
      setError(err?.message ?? "Failed to load data")
      
      // Try to load from cache as fallback
      try {
        const [cachedSets, cachedContent] = await Promise.all([
          getCachedSetlists(),
          getCachedContent(),
        ])
        setSetlists(cachedSets as SetlistWithSongs[])
        setAvailableContent(cachedContent)
      } catch (cacheErr) {
        console.error("useSetlistData: Failed to load cached data:", cacheErr)
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
