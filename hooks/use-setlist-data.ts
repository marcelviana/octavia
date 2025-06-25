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

      const supabaseUser =
        user && typeof (user as any).uid === "string"
          ? { id: (user as any).uid, email: (user as any).email }
          : undefined

      const [setsResult, contentResult] = await Promise.allSettled([
        getUserSetlists(supabaseUser),
        getUserContent(undefined, supabaseUser),
      ])

      const setsData =
        setsResult.status === "fulfilled"
          ? setsResult.value
          : await getCachedSetlists()
      const contentData =
        contentResult.status === "fulfilled"
          ? contentResult.value
          : await getCachedContent()

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
      setError(err?.message ?? "Failed to load data")
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (ready && user) {
      load()
    } else if (ready && !user) {
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
