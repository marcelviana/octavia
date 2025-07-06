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
      console.log("🔍 useSetlistData: Skipping load", { 
        hasUser: !!user, 
        userUid: user?.uid,
        inProgress: inProgressRef.current 
      })
      return
    }
    inProgressRef.current = true
    
    try {
      console.log("🔍 useSetlistData: Starting load, user:", user?.email, "ready:", ready)
      setLoading(true)
      setError(null)

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.log("🔍 useSetlistData: Offline, loading from cache")
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
        console.warn("🔍 useSetlistData: No valid user found for query")
        setError("Authentication required")
        return
      }

      console.log("🔍 useSetlistData: Loading data for user:", userForQuery.email)

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

      console.log("🔍 useSetlistData: Sets result status:", setsResult.status)
      console.log("🔍 useSetlistData: Content result status:", contentResult.status)

      let setsData: SetlistWithSongs[] = []
      let contentData: Content[] = []

      if (setsResult.status === "fulfilled") {
        setsData = setsResult.value as SetlistWithSongs[]
        console.log("🔍 useSetlistData: Loaded", setsData.length, "setlists")
      } else {
        console.error("🔍 useSetlistData: Sets loading failed:", setsResult.reason)
        // Try to load from cache
        try {
          setsData = await getCachedSetlists() as SetlistWithSongs[]
          console.log("🔍 useSetlistData: Using cached setlists:", setsData.length)
        } catch (cacheErr) {
          console.error("🔍 useSetlistData: Failed to load cached setlists:", cacheErr)
        }
      }

      if (contentResult.status === "fulfilled") {
        contentData = contentResult.value.data || []
        console.log("🔍 useSetlistData: Loaded", contentData.length, "content items")
      } else {
        console.error("🔍 useSetlistData: Content loading failed:", contentResult.reason)
        // Try to load from cache
        try {
          contentData = await getCachedContent()
          console.log("🔍 useSetlistData: Using cached content:", contentData.length)
        } catch (cacheErr) {
          console.error("🔍 useSetlistData: Failed to load cached content:", cacheErr)
        }
      }

      // Debug first setlist if available
      if (setsData.length > 0) {
        const firstSetlist = setsData[0]
        console.log("🔍 useSetlistData: First setlist:", firstSetlist.name, "with", firstSetlist.setlist_songs?.length || 0, "songs")
        if (firstSetlist.setlist_songs && firstSetlist.setlist_songs.length > 0) {
          const firstSong = firstSetlist.setlist_songs[0]
          console.log("🔍 useSetlistData: First song:", {
            title: firstSong.content?.title,
            artist: firstSong.content?.artist,
            content_id: firstSong.content?.id
          })
        }
      }

      // Debug first content item if available
      if (contentData.length > 0) {
        const firstContent = contentData[0]
        console.log("🔍 useSetlistData: First content:", {
          id: firstContent.id,
          title: firstContent.title,
          artist: firstContent.artist
        })
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
        console.warn("🔍 useSetlistData: Failed to cache data:", cacheErr)
      }

    } catch (err: any) {
      console.error("🔍 useSetlistData: Error:", err)
      setError(err?.message ?? "Failed to load data")
      
      // Try to load from cache as fallback
      try {
        const [cachedSets, cachedContent] = await Promise.all([
          getCachedSetlists(),
          getCachedContent(),
        ])
        console.log("🔍 useSetlistData: Using cached data as fallback")
        setSetlists(cachedSets as SetlistWithSongs[])
        setAvailableContent(cachedContent)
      } catch (cacheErr) {
        console.error("🔍 useSetlistData: Failed to load cached data:", cacheErr)
      }
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user, ready])

  useEffect(() => {
    console.log("🔍 useSetlistData: Effect triggered, ready:", ready, "user:", user?.email)
    if (ready && user && user.uid) {
      // Use a small delay to ensure Firebase Auth is fully initialized
      const timeoutId = setTimeout(() => {
        load(true) // Force refresh to get latest data
      }, 100)
      
      return () => clearTimeout(timeoutId)
    } else if (ready && !user) {
      console.log("🔍 useSetlistData: No user, setting loading to false")
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
        console.log("🔍 useSetlistData: Window focused after 30+ seconds, refreshing...")
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
