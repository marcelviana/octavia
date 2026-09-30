"use client"
import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { getUserSetlists } from "@/lib/setlist-service"
import { getUserContentPage } from "@/lib/content-service"
import type { Content, SetlistComMusicas } from "@/components/setlists/tipos"

export type { Content } from "@/components/setlists/tipos"
export type SetlistWithSongs = SetlistComMusicas

type Definir<T> = React.Dispatch<React.SetStateAction<T>>

interface UseSetlistDataResult {
  setlists: SetlistWithSongs[]
  content: Content[]
  setSetlists: Definir<SetlistWithSongs[]>
  setContent: Definir<Content[]>
  loading: boolean
  /** I1-PR-13: a falha da carga das setlists COMO VEIO (com o `status`; `{ rede: true }` sem rede) — a tela escolhe o motivo */
  erro: unknown | null
  /** I1-PR-13 (decisão 5): a falha da leitura da biblioteca, que antes era só `console.error` (o picker dizia "sem músicas") */
  erroDaBiblioteca: unknown | null
  /** I1-PR-13 (decisão 4): a resposta da biblioteca trouxe TUDO (`total` ≤ o que veio) — a rota corta a página em 100 */
  bibliotecaInteira: boolean
  /** relê; devolve a lista relida (ou `null` se a leitura falhou) — o 404 de uma escrita confere por ela se a setlist sumiu */
  reload: () => Promise<SetlistWithSongs[] | null>
}

export function useSetlistData(user: any | null, ready: boolean): UseSetlistDataResult {
  const [setlists, setSetlists] = useState<SetlistWithSongs[]>([])
  const [availableContent, setAvailableContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<unknown | null>(null)
  const [erroDaBiblioteca, setErroDaBiblioteca] = useState<unknown | null>(null)
  const [bibliotecaInteira, setBibliotecaInteira] = useState(false)
  const inProgressRef = useRef(false)
  const lastFocusTimeRef = useRef(Date.now())

  const load = useCallback(async (forceRefresh = false): Promise<SetlistWithSongs[] | null> => {
    if (!user || inProgressRef.current) {
      return null
    }
    inProgressRef.current = true
    let relida: SetlistWithSongs[] | null = null

    try {
      setLoading(true)
      setErro(null)

      // 1. Sem rede declarada: estado de erro, nunca o empty state de
      // primeiro uso. (O cache offline que hidratava a lista antes da rede
      // morreu com o PWA na I1-PR3 — o web é só online.)
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setErro({ rede: true })
        return null
      }

      // Ensure we have a valid user with proper authentication
      const userForQuery = user && user.uid ? { id: user.uid, email: user.email } : null
      if (!userForQuery) {
        console.warn("useSetlistData: No valid user found for query")
        setErro({ status: 401 })
        return null
      }

      // 2. Rede
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
        relida = setsResult.value as SetlistWithSongs[]
        setSetlists(relida)
      } else {
        console.error("useSetlistData: Sets loading failed:", setsResult.reason)
        // Falha de rede nunca vira lista vazia: estado de erro — nunca o
        // empty state de primeiro uso
        setErro(setsResult.reason ?? {})
      }

      if (contentResult.status === "fulfilled") {
        const contentData: Content[] = contentResult.value.data || []
        setAvailableContent(contentData)
        setErroDaBiblioteca(null)
        const total = contentResult.value.total
        setBibliotecaInteira(typeof total === "number" ? total <= contentData.length : false)
      } else {
        console.error("useSetlistData: Content loading failed:", contentResult.reason)
        setErroDaBiblioteca(contentResult.reason ?? {})
      }
    } catch (err: unknown) {
      console.error("useSetlistData: Error:", err)
      setErro(err ?? {})
    } finally {
      inProgressRef.current = false
      setLoading(false)
    }
    return relida
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
      setErro(null)
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
    erro,
    erroDaBiblioteca,
    bibliotecaInteira,
    reload: () => load(true), // Force refresh to bypass cache
  }
}
