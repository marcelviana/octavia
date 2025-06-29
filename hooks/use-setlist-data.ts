"use client"
import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getUserSetlists } from "@/lib/setlist-service"
import { getUserContent } from "@/lib/content-service"
import { saveSetlists, getCachedSetlists } from "@/lib/offline-setlist-cache"
import { getCachedContent } from "@/lib/offline-cache"
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

  const load = useCallback(async () => {
    if (inProgressRef.current) return
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

      const supabaseUser =
        user && typeof (user as any).uid === "string"
          ? { id: (user as any).uid, email: (user as any).email }
          : undefined

      console.log("🔍 useSetlistData: Supabase user:", supabaseUser?.email)

      // Use server-side API for setlists and client-side service for content
      const [setsResult, contentResult] = await Promise.allSettled([
        fetch('/api/setlists', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
          return res.json().then(data => data.setlists || [])
        }),
        getUserContent(undefined, supabaseUser),
      ])

      console.log("🔍 useSetlistData: Sets result status:", setsResult.status)
      console.log("🔍 useSetlistData: Content result status:", contentResult.status)

      if (setsResult.status === "rejected") {
        console.error("🔍 useSetlistData: Sets loading failed:", setsResult.reason)
      }
      if (contentResult.status === "rejected") {
        console.error("🔍 useSetlistData: Content loading failed:", contentResult.reason)
      }

      const setsData =
        setsResult.status === "fulfilled"
          ? setsResult.value
          : await getCachedSetlists()
      const contentData =
        contentResult.status === "fulfilled"
          ? contentResult.value
          : await getCachedContent()

      console.log("🔍 useSetlistData: Loaded", setsData.length, "setlists and", contentData.length, "content items")

      // Debug first setlist if available
      if (setsData.length > 0) {
        const firstSetlist = setsData[0] as SetlistWithSongs
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

      setSetlists(setsData as SetlistWithSongs[])
      setAvailableContent(contentData)

      if (setsData.length > 0) {
        try {
          await saveSetlists(setsData as any[])
        } catch {
          // ignore cache errors
        }
      }
    } catch (err: any) {
      console.error("🔍 useSetlistData: Error:", err)
      setError(err?.message ?? "Failed to load data")
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    console.log("🔍 useSetlistData: Effect triggered, ready:", ready, "user:", user?.email)
    if (ready && user) {
      load()
    } else if (ready && !user) {
      console.log("🔍 useSetlistData: No user, setting loading to false")
      setLoading(false)
    }
  }, [ready, user, load])

  return {
    setlists,
    setSetlists,
    content: availableContent,
    setContent: setAvailableContent,
    loading,
    error,
    reload: load,
  }
}
